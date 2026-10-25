-- Incremental: requiere 20261022233614_accesos_protegidos.sql. No vincula históricos por nombres.
begin;

alter table public.reservas
  add column cliente_id bigint references public.clientes(id),
  add column paquete_id bigint references public.paquetes(id),
  add column precio_persona numeric(16,0),
  add column total numeric(16,0),
  add column fecha_regreso date,
  add column estado_pago text,
  add column gestiona_cupos boolean not null default false,
  add constraint reserva_gestionada_completa check (not gestiona_cupos or
    (cliente_id is not null and paquete_id is not null and empleado_id is not null
     and pax is not null and precio_persona is not null and total is not null
     and estado is not null and estado_pago is not null
     and pax > 0 and precio_persona > 0 and total = precio_persona * pax
     and total <= 9007199254740991 and fecha_viaje is not null and fecha_regreso is not null
     and isfinite(fecha_viaje) and isfinite(fecha_regreso) and fecha_regreso>=fecha_viaje
     and estado in ('Pendiente','Confirmada','Finalizada','Cancelada')
     and estado_pago in ('Pendiente','Pago parcial','Pagado')));
alter table public.facturas add column reserva_id bigint references public.reservas(id);
create index reservas_cliente_idx on public.reservas(cliente_id);
create index reservas_paquete_idx on public.reservas(paquete_id);
create index facturas_reserva_idx on public.facturas(reserva_id);
create index pagos_codigo_idx on public.pagos(reserva) where reserva_id is null;
create index facturas_codigo_idx on public.facturas(reserva);

create table public.observaciones_reserva (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas(id),
  empleado_id bigint not null references public.empleados(id),
  texto text not null check (length(btrim(texto)) between 1 and 4000),
  autor_nombre text not null,
  creado_en timestamptz not null default now()
);
create table public.solicitudes_reserva (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas(id),
  empleado_id bigint not null references public.empleados(id),
  tipo text not null check (tipo in ('cambio','cancelacion')),
  motivo text not null check (length(btrim(motivo)) between 1 and 4000),
  paquete_id bigint references public.paquetes(id), pax integer check (pax > 0),
  autor_nombre text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  respuesta text, creado_en timestamptz not null default now(),
  resuelto_en timestamptz, resuelto_por uuid references public.perfiles(id)
);
create unique index solicitud_pendiente_unica on public.solicitudes_reserva(reserva_id) where estado='pendiente';
create index observaciones_reserva_idx on public.observaciones_reserva(reserva_id);
create index observaciones_empleado_idx on public.observaciones_reserva(empleado_id);
create index solicitudes_empleado_idx on public.solicitudes_reserva(empleado_id);
create index solicitudes_paquete_idx on public.solicitudes_reserva(paquete_id);
create index solicitudes_resuelto_por_idx on public.solicitudes_reserva(resuelto_por);
create index solicitudes_reserva_idx on public.solicitudes_reserva(reserva_id);
alter table public.observaciones_reserva enable row level security;
alter table public.solicitudes_reserva enable row level security;
revoke all on public.observaciones_reserva, public.solicitudes_reserva from public, anon, authenticated;
grant select on public.observaciones_reserva, public.solicitudes_reserva to authenticated;
create policy equipo_lectura on public.observaciones_reserva for select to authenticated
  using ((select privado.tiene_rol(array['administrador','asesor'])));
create policy equipo_lectura on public.solicitudes_reserva for select to authenticated
  using ((select privado.tiene_rol(array['administrador','asesor'])));
create policy asesor_lectura on public.facturas for select to authenticated
  using ((select privado.tiene_rol(array['asesor'])));
drop policy asesor_reservas_insertar on public.reservas;
drop policy asesor_reservas_actualizar on public.reservas;
drop policy asesor_pagos_insertar on public.pagos;
drop policy asesor_pagos_actualizar on public.pagos;

-- NULL significa dato histórico no interpretable; las escrituras lo rechazan.
create function privado.pesos_seguros(texto text) returns numeric
language sql immutable set search_path='' as $$
  select case when btrim(texto) ~ '^\$?\s*([0-9]+|[0-9]{1,3}(\.[0-9]{3})+)$'
    and length(regexp_replace(texto,'[^0-9]','','g')) <= 16
    then case when regexp_replace(texto,'[^0-9]','','g')::numeric <= 9007199254740991
      then regexp_replace(texto,'[^0-9]','','g')::numeric end end;
$$;
create function privado.documento_normalizado(texto text) returns text
language sql immutable set search_path='' as $$
  select nullif(upper(regexp_replace(btrim(texto),'[.[:space:]-]','','g')),'');
$$;
create index clientes_documento_busqueda_idx on public.clientes(privado.documento_normalizado(documento));
-- Unicidad física también bajo REPEATABLE READ: advisory+SELECT por sí solos no bastan.
-- Reserva una clave por grupo previo sin reescribir documentos ni borrar duplicados históricos.
alter table public.clientes add column documento_unico text;
update public.clientes c set documento_unico=grupo.documento
from (select distinct on (privado.documento_normalizado(documento))
    id,privado.documento_normalizado(documento) as documento
  from public.clientes where privado.documento_normalizado(documento) is not null
  order by privado.documento_normalizado(documento),id) grupo where c.id=grupo.id;
create unique index clientes_documento_unico_idx on public.clientes(documento_unico);
-- No rompe documentos duplicados antiguos; impide nuevas colisiones, incluso en INSERT admin.
create function privado.validar_documento_cliente() returns trigger
language plpgsql security definer set search_path='' as $$
declare documento_limpio text;
begin
  if tg_op='UPDATE' and new.documento is not distinct from old.documento then
    new.documento_unico:=old.documento_unico; -- no permite vaciar/falsificar la clave por UPDATE directo
    return new;
  end if;
  documento_limpio := privado.documento_normalizado(new.documento);
  new.documento_unico:=documento_limpio;
  if documento_limpio is null then return new; end if;
  if documento_limpio !~ '^[A-Z0-9]{3,30}$' then raise exception 'Documento no válido (3 a 30 letras o números).'; end if;
  perform pg_advisory_xact_lock(hashtextextended(documento_limpio,719));
  if exists(select 1 from public.clientes where privado.documento_normalizado(documento)=documento_limpio and id<>new.id) then
    raise exception 'Ya existe un cliente con ese documento.' using errcode='23505';
  end if;
  new.documento := documento_limpio;
  return new;
end;
$$;
create trigger validar_documento_cliente before insert or update on public.clientes
  for each row execute function privado.validar_documento_cliente();

-- Trigger INVOKER: solo el propietario de la RPC puede escribir filas gestionadas.
-- No se usa un flag GUC falsificable por el llamador. Las filas legacy conservan su flujo.
create function privado.proteger_gestion_asesor() returns trigger
language plpgsql set search_path='' as $$
declare anterior jsonb; nuevo jsonb; identificador bigint; codigo_reserva text; gestionada boolean := false;
begin
  if current_user = pg_get_userbyid((select proowner from pg_proc where oid='public.operar_asesor(text,jsonb)'::regprocedure)) then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  if tg_op<>'INSERT' then anterior:=to_jsonb(old); end if;
  if tg_op<>'DELETE' then nuevo:=to_jsonb(new); end if;
  if tg_table_name='reservas' then
    gestionada := coalesce((anterior->>'gestiona_cupos')::boolean,false)
      or coalesce((nuevo->>'gestiona_cupos')::boolean,false)
      or (nuevo->>'cliente_id') is not null or (nuevo->>'paquete_id') is not null
      or (nuevo->>'total') is not null or (nuevo->>'precio_persona') is not null
      or (nuevo->>'fecha_regreso') is not null;
  else
    -- Revisa ambos destinos: no permite desvincular un pago/factura para editarlo después.
    for identificador,codigo_reserva in
      select (j->>'reserva_id')::bigint,j->>'reserva' from (values(anterior),(nuevo)) v(j)
    loop
      perform 1 from public.reservas where gestiona_cupos
        and (id=identificador or codigo=codigo_reserva) for update;
      if found then gestionada:=true; end if;
    end loop;
  end if;
  if gestionada then raise exception 'Reserva gestionada: utiliza las funciones de gestión, no escrituras directas.' using errcode='42501'; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

create function privado.mover_cupos(paquete bigint, variacion integer) returns void
language plpgsql set search_path='' as $$
declare texto text; partes text[]; disponibles integer; capacidad integer;
begin
  select cupo into texto from public.paquetes where id=paquete for update;
  partes := regexp_match(texto,'^(Cupos:\s*)([0-9]+)(\s*/\s*)([0-9]+)(.*)$');
  if partes is null or length(partes[2])>9 or length(partes[4])>9 then raise exception 'Formato de cupos no válido.'; end if;
  disponibles:=partes[2]::integer; capacidad:=partes[4]::integer;
  if capacidad<=0 or disponibles>capacidad or disponibles+variacion<0 or disponibles+variacion>capacidad then
    raise exception 'No hay cupos suficientes o la capacidad es inconsistente.';
  end if;
  update public.paquetes set cupo=partes[1]||(disponibles+variacion)::text||partes[3]||partes[4]||partes[5] where id=paquete;
end;
$$;
create function privado.pagado_reserva(identificador_reserva bigint, codigo_reserva text) returns numeric
language plpgsql stable set search_path='' as $$
declare suma numeric;
begin
  if exists(select 1 from public.pagos where (reserva_id=identificador_reserva or (reserva_id is null and public.pagos.reserva=codigo_reserva))
    and privado.pesos_seguros(valor) is null) then raise exception 'Existe un pago histórico de valor no interpretable; requiere revisión.'; end if;
  select coalesce(sum(privado.pesos_seguros(valor)),0) into suma from public.pagos
    where reserva_id=identificador_reserva or (reserva_id is null and public.pagos.reserva=codigo_reserva);
  return suma;
end;
$$;

-- Una sola RPC transaccional, sin repositorios ni servidor adicional.
create function public.operar_asesor(accion text, datos jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  es_admin boolean; empleado bigint; nombre_autor text; reserva public.reservas;
  paquete public.paquetes; cliente public.clientes; solicitud public.solicitudes_reserva;
  identificador bigint; destino bigint; pasajeros integer; precio numeric; total_nuevo numeric;
  abonado numeric; monto numeric; codigo_nuevo text; hoy date := (now() at time zone 'America/Bogota')::date;
  texto text; correo_limpio text; telefono_limpio text; aprobar boolean;
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then
    raise exception 'Se requiere una cuenta activa de administrador o asesor.' using errcode='42501'; end if;
  es_admin:=privado.tiene_rol(array['administrador']);
  select p.empleado_id,e.nombre into empleado,nombre_autor from public.perfiles p
    join public.empleados e on e.id=p.empleado_id where p.id=auth.uid();
  if accion in ('resolver','reasignar','estado') and not es_admin then
    raise exception 'Solo un administrador activo puede realizar esta operación.' using errcode='42501'; end if;
  if accion in ('cliente','contacto') then
    correo_limpio:=lower(btrim(coalesce(datos->>'correo','')));
    telefono_limpio:=btrim(coalesce(datos->>'telefono',''));
    if correo_limpio !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(correo_limpio)>254 then raise exception 'Correo no válido.'; end if;
    if telefono_limpio !~ '^\+?[0-9 ()-]{7,25}$' then raise exception 'Teléfono no válido.'; end if;
    if accion='cliente' then
      if length(btrim(coalesce(datos->>'nombre',''))) not between 2 and 200 then raise exception 'Nombre no válido.'; end if;
      if coalesce(privado.documento_normalizado(datos->>'documento'),'') !~ '^[A-Z0-9]{3,30}$' then raise exception 'Documento no válido.'; end if;
      insert into public.clientes(codigo,nombre,documento,correo,telefono) values
        ('CL-'||gen_random_uuid()::text,btrim(datos->>'nombre'),datos->>'documento',correo_limpio,telefono_limpio) returning * into cliente;
    else
      update public.clientes set correo=correo_limpio,telefono=telefono_limpio where id=(datos->>'id')::bigint returning * into cliente;
      if not found then raise exception 'El cliente no existe.'; end if;
    end if;
    return to_jsonb(cliente);
  end if;
  if accion='crear' then
    pasajeros:=(datos->>'pax')::integer;
    if pasajeros is null or pasajeros<=0 then raise exception 'La cantidad de pasajeros debe ser un entero positivo.'; end if;
    select * into cliente from public.clientes where id=(datos->>'cliente_id')::bigint and activo for share;
    if not found then raise exception 'El cliente no existe o está inactivo.'; end if;
    select * into paquete from public.paquetes where id=(datos->>'paquete_id')::bigint for update;
    if not found then raise exception 'El paquete no existe.'; end if;
    if paquete.salida is null or paquete.salida<=hoy then raise exception 'La salida debe ser futura en Colombia.'; end if;
    if not isfinite(paquete.salida) or paquete.regreso is null or not isfinite(paquete.regreso)
      or paquete.regreso<paquete.salida or paquete.regreso>'9999-12-31'::date then
      raise exception 'Paquete incompleto: indica un regreso válido igual o posterior a la salida.'; end if;
    precio:=privado.pesos_seguros(paquete.precio); total_nuevo:=precio*pasajeros;
    if precio is null or precio<=0 or total_nuevo>9007199254740991 then raise exception 'Precio del paquete no válido.'; end if;
    perform privado.mover_cupos(paquete.id,-pasajeros);
    codigo_nuevo:='#RS-'||gen_random_uuid()::text;
    insert into public.reservas(codigo,cliente_id,paquete_id,empleado_id,cliente,paquete,pax,fecha_viaje,fecha_regreso,asesor,estado,estado_pago,precio_persona,total,gestiona_cupos)
      values(codigo_nuevo,cliente.id,paquete.id,empleado,cliente.nombre,paquete.nombre,pasajeros,paquete.salida,paquete.regreso,nombre_autor,'Pendiente','Pendiente',precio,total_nuevo,true)
      returning * into reserva;
    insert into public.facturas(factura,reserva_id,reserva,cliente,nit,valor,fecha,estado)
      values('FE-'||gen_random_uuid()::text,reserva.id,reserva.codigo,cliente.nombre,cliente.documento,total_nuevo::text,hoy,'Por validar');
    return to_jsonb(reserva);
  end if;
  -- Siempre reserva antes que solicitud/paquetes; pagos y resoluciones comparten este bloqueo.
  if accion='resolver' then
    select reserva_id into identificador from public.solicitudes_reserva where id=(datos->>'solicitud_id')::bigint;
  else identificador:=(datos->>'reserva_id')::bigint; end if;
  select * into reserva from public.reservas where id=identificador for update;
  if not found then raise exception 'La reserva no existe.'; end if;
  if not es_admin and reserva.empleado_id is distinct from empleado then
    raise exception 'Solo puedes modificar reservas propias.' using errcode='42501'; end if;
  if accion='observacion' then
    texto:=btrim(coalesce(datos->>'texto',''));
    if length(texto) not between 1 and 4000 then raise exception 'Escribe una observación de 1 a 4000 caracteres.'; end if;
    insert into public.observaciones_reserva(reserva_id,empleado_id,texto,autor_nombre)
      values(reserva.id,empleado,texto,nombre_autor) returning id into identificador;
    return jsonb_build_object('id',identificador);
  end if;
  if not reserva.gestiona_cupos then raise exception 'Reserva histórica: requiere validación manual antes de gestionarla; no se asignan relaciones por nombres.'; end if;
  if accion='reasignar' then
    destino:=(datos->>'empleado_id')::bigint;
    select e.nombre into texto from public.perfiles p join public.empleados e on e.id=p.empleado_id
      where p.empleado_id=destino and privado.tiene_rol(array['asesor'],p.id) for share of p,e;
    if not found then raise exception 'El destino debe ser un asesor activo con perfil vinculado.'; end if;
    update public.reservas set empleado_id=destino,asesor=texto where id=reserva.id returning * into reserva;
    return to_jsonb(reserva);
  end if;
  if reserva.estado in ('Cancelada','Finalizada') and accion<>'resolver' then raise exception 'La reserva está cancelada o finalizada.'; end if;
  if accion in ('abono','estado') then abonado:=privado.pagado_reserva(reserva.id,reserva.codigo); end if;
  if accion='abono' then
    if jsonb_typeof(datos->'valor') is distinct from 'number' then raise exception 'El monto debe ser un número entero positivo.'; end if;
    monto:=(datos->>'valor')::numeric;
    if monto is null or monto<=0 or monto<>trunc(monto) or monto>9007199254740991 then raise exception 'El monto debe ser un entero positivo.'; end if;
    texto:=btrim(coalesce(datos->>'metodo',''));
    if texto not in ('Efectivo','Transferencia','Tarjeta crédito','Tarjeta débito') then raise exception 'Selecciona un método de pago válido.'; end if;
    if abonado+monto>reserva.total then raise exception 'El abono supera el saldo de la reserva.'; end if;
    insert into public.pagos(recibo,reserva_id,reserva,cliente,metodo,valor,fecha,estado)
      values('#PG-'||gen_random_uuid()::text,reserva.id,reserva.codigo,reserva.cliente,texto,monto::text,hoy,
        case when abonado+monto=reserva.total then 'Pagado' else 'Abono' end) returning id into identificador;
    update public.reservas set estado_pago=case when abonado+monto=total then 'Pagado' else 'Pago parcial' end where id=reserva.id;
    return jsonb_build_object('id',identificador);
  elsif accion='solicitud' then
    texto:=btrim(coalesce(datos->>'motivo',''));
    if length(texto) not between 1 and 4000 or coalesce(datos->>'tipo','') not in ('cambio','cancelacion') then raise exception 'Tipo o motivo de solicitud no válido.'; end if;
    destino:=(datos->>'paquete_id')::bigint; pasajeros:=(datos->>'pax')::integer;
    if pasajeros is not null and pasajeros<=0 then raise exception 'La cantidad de pasajeros debe ser positiva.'; end if;
    if datos->>'tipo'='cancelacion' and (destino is not null or pasajeros is not null) then raise exception 'La cancelación no acepta un paquete o pasajeros propuestos.'; end if;
    if destino is not null then
      select * into paquete from public.paquetes where id=destino;
      if not found then raise exception 'El paquete propuesto no existe.'; end if;
      if paquete.salida is null or paquete.salida<=hoy then raise exception 'La nueva salida debe ser futura en Colombia.'; end if;
      if not isfinite(paquete.salida) or paquete.regreso is null or not isfinite(paquete.regreso)
        or paquete.regreso<paquete.salida or paquete.regreso>'9999-12-31'::date then
        raise exception 'Paquete incompleto: indica un regreso válido igual o posterior a la salida.'; end if;
    end if;
    if exists(select 1 from public.solicitudes_reserva where reserva_id=reserva.id and estado='pendiente') then raise exception 'Ya existe una solicitud pendiente para esta reserva.'; end if;
    insert into public.solicitudes_reserva(reserva_id,empleado_id,tipo,motivo,paquete_id,pax,autor_nombre)
      values(reserva.id,empleado,datos->>'tipo',texto,destino,pasajeros,nombre_autor) returning id into identificador;
    return jsonb_build_object('id',identificador);
  elsif accion='estado' then
    texto:=datos->>'estado';
    if texto is null or texto not in ('Pendiente','Confirmada','Finalizada') then raise exception 'Estado no válido.'; end if;
    if texto='Finalizada' then
      if reserva.estado<>'Confirmada' or reserva.fecha_regreso is null
        or reserva.fecha_regreso<reserva.fecha_viaje or reserva.fecha_viaje>hoy
        or reserva.fecha_regreso>hoy or abonado<>reserva.total then
        raise exception 'Solo puedes finalizar una reserva confirmada, pagada y cuyo viaje haya terminado.'; end if;
    elsif reserva.fecha_viaje<=hoy then raise exception 'Solo puedes confirmar o dejar pendiente una salida futura.';
    end if;
    update public.reservas set estado=texto where id=reserva.id returning * into reserva;
    return to_jsonb(reserva);
  elsif accion='resolver' then
    select * into solicitud from public.solicitudes_reserva where id=(datos->>'solicitud_id')::bigint for update;
    if solicitud.estado<>'pendiente' then raise exception 'La solicitud ya fue resuelta.'; end if;
    if jsonb_typeof(datos->'aprobar') is distinct from 'boolean' then raise exception 'Indica si apruebas o rechazas la solicitud.'; end if;
    aprobar:=(datos->>'aprobar')::boolean; texto:=btrim(coalesce(datos->>'respuesta',''));
    if length(texto) not between 1 and 4000 then raise exception 'La respuesta debe tener de 1 a 4000 caracteres.'; end if;
    if aprobar and reserva.estado in ('Cancelada','Finalizada') then raise exception 'No puedes aprobar cambios de una reserva cancelada o finalizada.'; end if;
    -- Tras una reasignación se puede rechazar la solicitud vieja, nunca aprobarla.
    if aprobar and solicitud.empleado_id<>reserva.empleado_id then raise exception 'La reserva fue reasignada; rechaza la solicitud y solicita una nueva al responsable actual.'; end if;
    if aprobar then
      destino:=coalesce(solicitud.paquete_id,reserva.paquete_id); pasajeros:=coalesce(solicitud.pax,reserva.pax);
      -- Orden estable también al intercambiar paquetes entre dos reservas.
      perform id from public.paquetes where id in (reserva.paquete_id,destino) order by id for update;
      if solicitud.tipo='cancelacion' then
        perform privado.mover_cupos(reserva.paquete_id,reserva.pax);
        update public.reservas set estado='Cancelada' where id=reserva.id;
      else
        abonado:=privado.pagado_reserva(reserva.id,reserva.codigo);
        select * into paquete from public.paquetes where id=destino;
        if paquete.salida is null or paquete.salida<=hoy then raise exception 'La nueva salida debe ser futura en Colombia.'; end if;
        if not isfinite(paquete.salida) or paquete.regreso is null or not isfinite(paquete.regreso)
          or paquete.regreso<paquete.salida or paquete.regreso>'9999-12-31'::date then
          raise exception 'Paquete incompleto: indica un regreso válido igual o posterior a la salida.'; end if;
        -- Mismo paquete: conserva precio contratado, no repricia por editar catálogo.
        precio:=case when destino=reserva.paquete_id then reserva.precio_persona else privado.pesos_seguros(paquete.precio) end;
        total_nuevo:=precio*pasajeros;
        if precio is null or precio<=0 or total_nuevo>9007199254740991 or total_nuevo<abonado then raise exception 'El nuevo total no es válido o es inferior a lo pagado.'; end if;
        if destino=reserva.paquete_id then perform privado.mover_cupos(destino,reserva.pax-pasajeros);
        else
          perform privado.mover_cupos(reserva.paquete_id,reserva.pax);
          perform privado.mover_cupos(destino,-pasajeros);
        end if;
        update public.reservas set paquete_id=destino,paquete=paquete.nombre,pax=pasajeros,fecha_viaje=paquete.salida,fecha_regreso=paquete.regreso,
          precio_persona=precio,total=total_nuevo,estado_pago=case when abonado=total_nuevo then 'Pagado' when abonado>0 then 'Pago parcial' else 'Pendiente' end where id=reserva.id;
        update public.facturas set valor=total_nuevo::text,estado='Por validar' where reserva_id=reserva.id;
      end if;
    end if;
    update public.solicitudes_reserva set estado=case when aprobar then 'aprobada' else 'rechazada' end,
      respuesta=texto,resuelto_en=now(),resuelto_por=auth.uid() where id=solicitud.id returning * into solicitud;
    return to_jsonb(solicitud);
  end if;
  raise exception 'Operación no válida.';
exception
  when invalid_text_representation or numeric_value_out_of_range then raise exception 'Identificadores, pasajeros o importes no válidos.';
end;
$$;

create trigger gestion_reserva before insert or update or delete on public.reservas for each row execute function privado.proteger_gestion_asesor();
create trigger gestion_pago before insert or update or delete on public.pagos for each row execute function privado.proteger_gestion_asesor();
create trigger gestion_factura before insert or update or delete on public.facturas for each row execute function privado.proteger_gestion_asesor();

-- Lectura pura y consistente en una única instantánea; no necesita leer empleados desde React.
create function public.datos_asesor(gestion boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare resultado jsonb;
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then raise exception 'Se requiere una cuenta activa.' using errcode='42501'; end if;
  if gestion is null or (gestion and not privado.tiene_rol(array['administrador'])) then raise exception 'Solo un administrador puede consultar la gestión.' using errcode='42501'; end if;
  select jsonb_build_object(
    'clientes',(select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]') from public.clientes c),
    'paquetes',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre,'ubicacion',p.loc,'precio',privado.pesos_seguros(p.precio),
      'cupo',p.cupo,'salida',p.salida,'regreso',p.regreso,'icono',p.icono) order by p.id),'[]') from public.paquetes p),
    'reservas',(select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('total',historico.total,
      'estado_pago',coalesce(r.estado_pago,case when abonos.valor>0 then
        case when historico.total is not null and abonos.valor>=historico.total then 'Pagado' else 'Pago parcial' end else 'Pendiente' end)) order by r.id),'[]')
      from public.reservas r
      cross join lateral (select coalesce(r.total,
        (select privado.pesos_seguros(f.valor) from public.facturas f where f.reserva_id=r.id or (f.reserva_id is null and f.reserva=r.codigo) order by f.id limit 1),
        (select privado.pesos_seguros(p.precio) from public.paquetes p where p.id=r.paquete_id or
          (r.paquete_id is null and p.nombre=r.paquete and (select count(*) from public.paquetes p2 where p2.nombre=r.paquete)=1) limit 1)) as total) historico
      cross join lateral (select coalesce(sum(privado.pesos_seguros(p.valor)),0) as valor from public.pagos p
        where p.reserva_id=r.id or (p.reserva_id is null and p.reserva=r.codigo)) abonos),
    'pagos',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('valor',privado.pesos_seguros(p.valor)) order by p.id),'[]') from public.pagos p),
    'facturas',(select coalesce(jsonb_agg(to_jsonb(f)||jsonb_build_object('valor',privado.pesos_seguros(f.valor)) order by f.id),'[]') from public.facturas f),
    'observaciones',(select coalesce(jsonb_agg(to_jsonb(o) order by o.id),'[]') from public.observaciones_reserva o),
    'solicitudes',(select coalesce(jsonb_agg(to_jsonb(s) order by s.id),'[]') from public.solicitudes_reserva s)
  ) into resultado;
  if gestion then resultado:=resultado||jsonb_build_object('asesores',
    (select coalesce(jsonb_agg(jsonb_build_object('empleado_id',p.empleado_id,'nombre',e.nombre,'correo',p.correo) order by e.nombre),'[]')
     from public.perfiles p join public.empleados e on e.id=p.empleado_id where privado.tiene_rol(array['asesor'],p.id))); end if;
  return resultado;
end;
$$;

revoke all on function privado.pesos_seguros(text), privado.documento_normalizado(text), privado.validar_documento_cliente(),
  privado.proteger_gestion_asesor(), privado.mover_cupos(bigint,integer), privado.pagado_reserva(bigint,text),
  public.operar_asesor(text,jsonb), public.datos_asesor(boolean) from public, anon, authenticated;
grant execute on function public.operar_asesor(text,jsonb), public.datos_asesor(boolean) to authenticated;
-- La expresión del índice se evalúa también para INSERT admin legacy.
grant execute on function privado.documento_normalizado(text) to authenticated;
notify pgrst, 'reload schema';
commit;
