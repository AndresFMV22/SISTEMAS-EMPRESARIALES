-- Migración pendiente, ajustada antes de su primer despliegue autorizado.
begin;

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
grant usage on schema privado to authenticated;

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  empleado_id bigint not null unique references public.empleados(id),
  correo text not null unique check (correo = lower(btrim(correo))),
  rol text not null check (rol in ('administrador', 'asesor', 'cliente')),
  activo boolean not null default false,
  estado_acceso text not null default 'invitado' check (estado_acceso in ('invitado','activo','suspendido')),
  creado_en timestamptz not null default now(),
  activado_en timestamptz,
  check (activo = (estado_acceso = 'activo'))
);
alter table public.perfiles enable row level security;
revoke all on public.perfiles from public, anon, authenticated;
grant select on public.perfiles to authenticated;
grant all on public.perfiles to service_role;

-- Reserva durable anterior a Auth: no otorga acceso, permite reconciliar fallos.
create table privado.provisiones_acceso (
  empleado_id bigint primary key references public.empleados(id),
  -- Puede ser NULL solo al suspender un empleado aún sin cuenta/correo.
  -- No se usa esa reserva para enviar correo ni vincular una identidad.
  correo text unique,
  token uuid,
  vence_en timestamptz,
  ultimo_envio timestamptz,
  suspendido boolean not null default false,
  check (correo is not null or (suspendido and token is null))
);
alter table privado.provisiones_acceso enable row level security;
revoke all on privado.provisiones_acceso from public, anon, authenticated;

create function privado.tiene_rol(roles text[], usuario uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfiles p
    join public.empleados e on e.id = p.empleado_id
    join auth.users u on u.id = p.id
    where p.id = usuario and p.rol = any(roles)
      and p.activo and p.estado_acceso = 'activo' and e.activo
      and not u.is_anonymous and u.deleted_at is null
      and (u.banned_until is null or u.banned_until < now())
      and u.email_confirmed_at is not null
      and lower(u.email) = p.correo and lower(btrim(e.correo)) = p.correo
  );
$$;
revoke all on function privado.tiene_rol(text[],uuid) from public, anon, authenticated;
grant execute on function privado.tiene_rol(text[],uuid) to authenticated;

create function privado.empleado_actual() returns bigint
language sql stable security definer set search_path = '' as $$
  select empleado_id from public.perfiles
  where id = auth.uid() and privado.tiene_rol(array['asesor']);
$$;
revoke all on function privado.empleado_actual() from public, anon;
grant execute on function privado.empleado_actual() to authenticated;

create policy perfil_propio on public.perfiles for select to authenticated
using (id = (select auth.uid()) or (select privado.tiene_rol(array['administrador'])));

create function public.obtener_perfil() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not privado.tiene_rol(array['administrador','asesor']) then
    raise exception 'Acceso no autorizado.' using errcode = '42501';
  end if;
  return (select jsonb_build_object('id',p.id,'nombre',e.nombre,'correo',p.correo,
    'rol',p.rol,'activo',p.activo,'empleado_id',p.empleado_id,'estado_acceso',p.estado_acceso)
    from public.perfiles p join public.empleados e on e.id=p.empleado_id where p.id=auth.uid());
end;
$$;
create function public.listar_accesos() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not privado.tiene_rol(array['administrador']) then
    raise exception 'Solo un administrador activo puede consultar los accesos.' using errcode='42501';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'empleado_id',a.empleado_id,
    'correo',coalesce(p.correo,a.correo),'rol',coalesce(p.rol,'asesor'),'activo',coalesce(p.activo,false),
    'estado_acceso',coalesce(p.estado_acceso,case when a.suspendido then 'suspendido' else 'pendiente' end))
    order by a.empleado_id),'[]'::jsonb)
    from (select empleado_id,correo,suspendido from privado.provisiones_acceso
      union all select empleado_id,correo,false from public.perfiles p
      where not exists(select 1 from privado.provisiones_acceso a where a.empleado_id=p.empleado_id)) a
    left join public.perfiles p on p.empleado_id=a.empleado_id);
end;
$$;
revoke all on function public.obtener_perfil(), public.listar_accesos() from public, anon;
grant execute on function public.obtener_perfil(), public.listar_accesos() to authenticated;

-- Solo la Edge Function usa estas RPC con service_role, tras getUser(token).
-- Se vuelve a comprobar al administrador dentro de cada transacción.
create function public.preparar_acceso(administrador uuid, empleado bigint, correo_solicitado text, accion text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  trabajador public.empleados;
  perfil public.perfiles;
  provision privado.provisiones_acceso;
  correo_normalizado text;
  usuario uuid;
  nuevo_token uuid;
begin
  if not privado.tiene_rol(array['administrador'],administrador) then
    raise exception 'Se requiere un administrador activo.' using errcode='42501';
  end if;
  if accion not in ('invitar','reenviar','suspender','reactivar','recuperar') then
    raise exception 'Acción no válida.';
  end if;
  select * into trabajador from public.empleados where id=empleado for update;
  if not found then raise exception 'El empleado no existe.'; end if;
  select * into perfil from public.perfiles where empleado_id=empleado for update;
  if perfil.id is not null and perfil.rol <> 'asesor' then
    raise exception 'Este proceso solo administra accesos de asesores.';
  end if;
  -- Denegar acceso no depende de correo, empleado activo, enlaces ni SMTP.
  -- Conserva el correo previamente reservado; no adopta uno cambiado por la UI.
  if accion='suspender' then
    insert into privado.provisiones_acceso(empleado_id,correo,suspendido)
      values(empleado,null,true)
      on conflict (empleado_id) do update set suspendido=true,token=null,vence_en=null;
    update public.perfiles set activo=false,estado_acceso='suspendido' where empleado_id=empleado;
    return jsonb_build_object('estado_acceso','suspendido','empleado_id',empleado);
  end if;
  correo_normalizado := lower(btrim(trabajador.correo));
  if correo_normalizado is null or correo_normalizado !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'El empleado necesita un correo válido.';
  end if;
  if correo_solicitado is not null and lower(btrim(correo_solicitado)) <> correo_normalizado then
    raise exception 'El correo debe coincidir con el del empleado.';
  end if;
  insert into privado.provisiones_acceso(empleado_id,correo) values(empleado,correo_normalizado)
    on conflict (empleado_id) do nothing;
  select * into provision from privado.provisiones_acceso where empleado_id=empleado for update;
  if provision.correo is null then
    update privado.provisiones_acceso set correo=correo_normalizado where empleado_id=empleado;
    provision.correo := correo_normalizado;
  end if;
  if provision.correo <> correo_normalizado or (perfil.id is not null and perfil.correo <> correo_normalizado) then
    raise exception 'El correo cambió. Se requiere reconciliación manual segura.';
  end if;
  if not coalesce(trabajador.activo,false) then raise exception 'El empleado debe estar activo.'; end if;
  if accion='reactivar' then
    update privado.provisiones_acceso set suspendido=false,token=null,vence_en=null where empleado_id=empleado;
    if perfil.id is null then
      return jsonb_build_object('estado_acceso','pendiente','empleado_id',empleado);
    end if;
    -- Una invitación nunca aceptada no se convierte en cuenta activa.
    update public.perfiles set activo=(activado_en is not null),
      estado_acceso=case when activado_en is null then 'invitado' else 'activo' end where empleado_id=empleado;
    return jsonb_build_object('estado_acceso',case when perfil.activado_en is null then 'invitado' else 'activo' end,'empleado_id',empleado);
  end if;
  if provision.suspendido or perfil.estado_acceso='suspendido' then raise exception 'Reactiva el acceso antes de enviar correo.'; end if;
  if provision.vence_en > now() then raise exception 'Ya hay un envío en curso. Reintenta en dos minutos.'; end if;
  if provision.ultimo_envio > now()-interval '60 seconds' then raise exception 'Espera un minuto antes de reenviar.'; end if;
  if accion='recuperar' and perfil.id is null then raise exception 'La cuenta todavía no está vinculada.'; end if;
  select id into usuario from auth.users where lower(email)=correo_normalizado and deleted_at is null and not is_anonymous;
  if exists(select 1 from public.perfiles where id=usuario and empleado_id<>empleado) then
    raise exception 'La cuenta ya está ligada a otro empleado.';
  end if;
  if perfil.id is not null and perfil.id is distinct from usuario then raise exception 'La identidad Auth cambió. Se requiere revisión manual.'; end if;
  nuevo_token := gen_random_uuid();
  update privado.provisiones_acceso set token=nuevo_token,vence_en=now()+interval '2 minutes',ultimo_envio=now() where empleado_id=empleado;
  return jsonb_build_object('token',nuevo_token,'correo',correo_normalizado,'usuario_id',usuario,'empleado_id',empleado);
end;
$$;

create function public.confirmar_acceso(administrador uuid, empleado bigint, token_operacion uuid, usuario uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare provision privado.provisiones_acceso;
begin
  if not privado.tiene_rol(array['administrador'],administrador) then raise exception 'Se requiere un administrador activo.' using errcode='42501'; end if;
  perform 1 from public.empleados where id=empleado and activo for update;
  if not found then raise exception 'El empleado no está activo.'; end if;
  select * into provision from privado.provisiones_acceso where empleado_id=empleado for update;
  if token_operacion is null or provision.token is null or provision.vence_en is null
    or provision.token is distinct from token_operacion or provision.vence_en < now() or provision.suspendido then
    raise exception 'La operación venció o fue suspendida. Reintenta.';
  end if;
  if not exists(select 1 from auth.users u join public.empleados e on e.id=empleado
    where u.id=usuario and lower(u.email)=provision.correo and lower(btrim(e.correo))=provision.correo
      and not u.is_anonymous and u.deleted_at is null) then raise exception 'La identidad no coincide con el empleado.'; end if;
  insert into public.perfiles(id,empleado_id,correo,rol) values(usuario,empleado,provision.correo,'asesor')
    on conflict (empleado_id) do nothing;
  if not exists(select 1 from public.perfiles where id=usuario and empleado_id=empleado and rol='asesor' and estado_acceso<>'suspendido') then
    raise exception 'La vinculación no coincide o está suspendida.';
  end if;
  update privado.provisiones_acceso set token=null,vence_en=null where empleado_id=empleado;
  return jsonb_build_object('empleado_id',empleado,'estado_acceso',(select estado_acceso from public.perfiles where id=usuario));
end;
$$;

create function public.activar_acceso(usuario uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  -- Solo tras cambio Auth exitoso o same_password reautenticado por el servicio.
  perform 1 from public.perfiles p join public.empleados e on e.id=p.empleado_id
    join auth.users u on u.id=p.id where p.id=usuario and e.activo
    and p.estado_acceso<>'suspendido' and p.correo=lower(u.email) and p.correo=lower(btrim(e.correo))
    and u.email_confirmed_at is not null and coalesce(u.encrypted_password,'')<>''
    and not u.is_anonymous and u.deleted_at is null and (u.banned_until is null or u.banned_until<now())
    for update of p;
  if not found then raise exception 'No se puede activar: revisa la invitación, el perfil y el empleado.'; end if;
  update public.perfiles set activo=true,estado_acceso='activo',activado_en=coalesce(activado_en,now()) where id=usuario;
  return jsonb_build_object('estado_acceso','activo');
end;
$$;
revoke all on function public.preparar_acceso(uuid,bigint,text,text), public.confirmar_acceso(uuid,bigint,uuid,uuid), public.activar_acceso(uuid) from public, anon, authenticated;
grant execute on function public.preparar_acceso(uuid,bigint,text,text), public.confirmar_acceso(uuid,bigint,uuid,uuid), public.activar_acceso(uuid) to service_role;

alter table public.reservas add column empleado_id bigint references public.empleados(id);
alter table public.pagos add column reserva_id bigint references public.reservas(id);
create index reservas_empleado_id_idx on public.reservas(empleado_id);
create index pagos_reserva_id_idx on public.pagos(reserva_id);
-- No se asigna propiedad por textos históricos (asesor, reserva, cliente).

-- Quita TODAS las políticas previas de estas tablas: una política permisiva
-- adicional se combinaría con OR y anularía las restricciones nuevas.
do $$
declare politica record; tabla text;
begin
  for politica in select tablename,policyname from pg_policies where schemaname='public'
    and tablename=any(array['clientes','paquetes','reservas','pagos','facturas','proveedores','empleados']) loop
    execute format('drop policy %I on public.%I',politica.policyname,politica.tablename);
  end loop;
  foreach tabla in array array['clientes','paquetes','reservas','pagos','facturas','proveedores','empleados'] loop
    execute format('alter table public.%I enable row level security',tabla);
    execute format('revoke all on public.%I from public, anon, authenticated',tabla);
    execute format('grant select,insert,update,delete on public.%I to authenticated',tabla);
    execute format('create policy administrador on public.%I for all to authenticated using ((select privado.tiene_rol(array[''administrador'']))) with check ((select privado.tiene_rol(array[''administrador''])))',tabla);
  end loop;
  foreach tabla in array array['clientes','paquetes','reservas','pagos'] loop
    execute format('create policy asesor_lectura on public.%I for select to authenticated using ((select privado.tiene_rol(array[''asesor''])))',tabla);
  end loop;
end $$;

create policy asesor_reservas_insertar on public.reservas for insert to authenticated
with check (empleado_id=(select privado.empleado_actual()));
create policy asesor_reservas_actualizar on public.reservas for update to authenticated
using (empleado_id=(select privado.empleado_actual()))
with check (empleado_id=(select privado.empleado_actual()));
create policy asesor_pagos_insertar on public.pagos for insert to authenticated
with check (exists(select 1 from public.reservas r where r.id=reserva_id and r.empleado_id=(select privado.empleado_actual())));
create policy asesor_pagos_actualizar on public.pagos for update to authenticated
using (exists(select 1 from public.reservas r where r.id=reserva_id and r.empleado_id=(select privado.empleado_actual())))
with check (exists(select 1 from public.reservas r where r.id=reserva_id and r.empleado_id=(select privado.empleado_actual())));

-- Impide cambiar los identificadores usados por pagos heredados o mover un pago
-- entre reservas. El ID es inmutable para todos, incluido SET id=DEFAULT.
-- Los administradores conservan el resto del contrato existente.
create function privado.proteger_propiedad() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id then
    raise exception 'No se puede cambiar el identificador del registro.';
  end if;
  if privado.tiene_rol(array['asesor']) then
    if tg_table_name='reservas' then
      if new.codigo is distinct from old.codigo or new.empleado_id is distinct from old.empleado_id then
        raise exception 'No puedes reasignar la reserva ni cambiar su código.';
      end if;
      if new.asesor is distinct from old.asesor then
        raise exception 'No puedes cambiar la atribución de la reserva.';
      end if;
    else
      if new.reserva_id is distinct from old.reserva_id or new.reserva is distinct from old.reserva or new.recibo is distinct from old.recibo then
        raise exception 'No puedes reasignar el pago ni cambiar su recibo.';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function privado.proteger_propiedad() from public,anon,authenticated;
create trigger proteger_reserva before update on public.reservas for each row execute function privado.proteger_propiedad();
create trigger proteger_pago before update on public.pagos for each row execute function privado.proteger_propiedad();

-- Consulta mínima protegida: el asesor no necesita SELECT de empleados.
-- El resultado solo puede corresponder al empleado del usuario activo actual.
create function privado.nombre_asesor_actual() returns text
language sql stable security definer set search_path = '' as $$
  select e.nombre from public.empleados e join public.perfiles p on p.empleado_id=e.id
  where p.id=auth.uid() and privado.tiene_rol(array['asesor']);
$$;
revoke all on function privado.nombre_asesor_actual() from public,anon;
grant execute on function privado.nombre_asesor_actual() to authenticated;

create function privado.atribuir_reserva_asesor() returns trigger
language plpgsql set search_path = '' as $$
begin
  if privado.tiene_rol(array['asesor']) then
    new.asesor := privado.nombre_asesor_actual();
  end if;
  return new;
end;
$$;
revoke all on function privado.atribuir_reserva_asesor() from public,anon,authenticated;
create trigger atribuir_reserva_asesor before insert on public.reservas
for each row execute function privado.atribuir_reserva_asesor();

create function privado.normalizar_pago_asesor() returns trigger
language plpgsql set search_path = '' as $$
declare reserva_propia public.reservas;
begin
  if privado.tiene_rol(array['asesor']) then
    select * into reserva_propia from public.reservas
      where id=new.reserva_id and empleado_id=privado.empleado_actual();
    if not found then raise exception 'El pago requiere una reserva propia.'; end if;
    -- La UI heredada relaciona por texto: nunca permite apuntar a otro código.
    new.reserva := reserva_propia.codigo;
    new.cliente := reserva_propia.cliente;
  end if;
  return new;
end;
$$;
revoke all on function privado.normalizar_pago_asesor() from public,anon,authenticated;
create trigger normalizar_pago_asesor before insert or update on public.pagos
for each row execute function privado.normalizar_pago_asesor();

commit;
