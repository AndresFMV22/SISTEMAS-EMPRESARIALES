-- Fase 3. Incremental; requiere las migraciones de accesos, asesor y fases 1/2.
begin;

alter table public.paquetes
  add column descripcion text not null default '',
  add column tipo_destino text check (tipo_destino in ('nacional','internacional')),
  add column incluye text not null default '',
  add column no_incluye text not null default '',
  add column condiciones text not null default '',
  add column catalogo_completo boolean not null default false;
alter table public.reservas add column contenido_contratado jsonb;

create table public.paquete_servicios (
  id bigint generated always as identity primary key,
  paquete_id bigint not null references public.paquetes(id),
  proveedor_id bigint not null references public.proveedores(id),
  servicio text not null check (servicio in ('Alojamiento','Vuelo','Transporte','Actividad','Alimentación','Seguro','Otro')),
  detalle text not null check (length(btrim(detalle)) between 1 and 2000),
  unique(paquete_id,proveedor_id,servicio)
);
create index paquete_servicios_proveedor_idx on public.paquete_servicios(proveedor_id);
alter table public.paquete_servicios enable row level security;
revoke all on public.paquete_servicios from public,anon,authenticated;
grant select on public.paquete_servicios to authenticated;
create policy administrador_lectura on public.paquete_servicios for select to authenticated
using ((select privado.tiene_rol(array['administrador'])));

-- Datos publicables del servicio; nunca contacto ni convenio del proveedor.
create function privado.servicios_paquete(identificador bigint) returns jsonb
language sql stable set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('proveedor_id',v.id,'nombre',v.nombre,'tipo',v.tipo,
    'servicio',s.servicio,'detalle',s.detalle,'activo',v.estado='Activo') order by s.id),'[]'::jsonb)
  from public.paquete_servicios s join public.proveedores v on v.id=s.proveedor_id where s.paquete_id=identificador;
$$;
create function privado.paquete_catalogo(identificador bigint) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object('id',p.id,'nombre',p.nombre,'ubicacion',p.loc,'precio',privado.pesos_seguros(p.precio),
    'cupo',p.cupo,'salida',p.salida,'regreso',p.regreso,'icono',p.icono,'descripcion',p.descripcion,
    'tipo_destino',p.tipo_destino,'incluye',p.incluye,'no_incluye',p.no_incluye,'condiciones',p.condiciones,
    'catalogo_completo',p.catalogo_completo,'servicios',privado.servicios_paquete(p.id))
  from public.paquetes p where p.id=identificador;
$$;

create function public.catalogo_administrativo() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador']) then
    raise exception 'Solo un administrador activo puede gestionar el catalogo.' using errcode='42501'; end if;
  return jsonb_build_object(
    'paquetes',(select coalesce(jsonb_agg(privado.paquete_catalogo(p.id) order by p.id),'[]'::jsonb) from public.paquetes p),
    'proveedores',(select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'nombre',v.nombre,'tipo',v.tipo,
      'contacto',v.contacto,'convenio',v.convenio,'estado',v.estado,'activo',v.estado='Activo') order by v.id),'[]'::jsonb) from public.proveedores v));
end;
$$;

create function public.guardar_proveedor(datos jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare identificador bigint := (datos->>'id')::bigint; fila public.proveedores;
  nombre_nuevo text:=btrim(coalesce(datos->>'nombre','')); tipo_nuevo text:=btrim(coalesce(datos->>'tipo',''));
  contacto_nuevo text:=btrim(coalesce(datos->>'contacto','')); convenio_nuevo text:=btrim(coalesce(datos->>'convenio',''));
  estado_nuevo text;
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador']) then
    raise exception 'Solo un administrador activo puede guardar proveedores.' using errcode='42501'; end if;
  if length(nombre_nuevo) not between 2 and 200 or length(tipo_nuevo) not between 2 and 100
    or length(contacto_nuevo) not between 2 and 254 or length(convenio_nuevo)>4000
    or jsonb_typeof(datos->'activo') is distinct from 'boolean' then raise exception 'Revisa nombre, tipo, contacto, convenio y estado del proveedor.'; end if;
  estado_nuevo:=case when (datos->>'activo')::boolean then 'Activo' else 'Inactivo' end;
  if identificador is null then
    insert into public.proveedores(nombre,tipo,contacto,convenio,estado,tono)
      values(nombre_nuevo,tipo_nuevo,contacto_nuevo,convenio_nuevo,estado_nuevo,case when estado_nuevo='Activo' then 'ok' else 'bad' end) returning * into fila;
  else
    perform 1 from public.proveedores where id=identificador for update;
    if not found then raise exception 'El proveedor no existe.'; end if;
    update public.proveedores set nombre=nombre_nuevo,tipo=tipo_nuevo,contacto=contacto_nuevo,convenio=convenio_nuevo,
      estado=estado_nuevo,tono=case when estado_nuevo='Activo' then 'ok' else 'bad' end where id=identificador returning * into fila;
  end if;
  return to_jsonb(fila);
end;
$$;

create function public.guardar_paquete(datos jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare identificador bigint := (datos->>'id')::bigint; anterior public.paquetes; fila public.paquetes;
  nombre_nuevo text:=btrim(coalesce(datos->>'nombre','')); ubicacion text:=btrim(coalesce(datos->>'ubicacion',''));
  descripcion_nueva text:=btrim(coalesce(datos->>'descripcion','')); incluidos text:=btrim(coalesce(datos->>'incluye',''));
  excluidos text:=btrim(coalesce(datos->>'no_incluye','')); condiciones_nuevas text:=btrim(coalesce(datos->>'condiciones',''));
  tipo text:=datos->>'tipo_destino'; icono_nuevo text:=coalesce(datos->>'icono','umbrella');
  salida_nueva date:=(datos->>'salida')::date; regreso_nuevo date:=(datos->>'regreso')::date;
  precio_nuevo numeric:=(datos->>'precio')::numeric; capacidad integer:=(datos->>'capacidad')::integer;
  partes text[]; ocupados integer:=0; servicio_actual jsonb; servicios jsonb:=datos->'servicios';
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador']) then
    raise exception 'Solo un administrador activo puede guardar paquetes.' using errcode='42501'; end if;
  if length(nombre_nuevo) not between 2 and 200 or length(ubicacion) not between 2 and 300
    or length(descripcion_nueva) not between 1 and 10000 or length(incluidos) not between 1 and 10000
    or length(excluidos)>10000 or length(condiciones_nuevas) not between 1 and 10000
    or tipo is null or tipo not in ('nacional','internacional') then raise exception 'Completa la informacion, incluidos y condiciones del paquete.'; end if;
  if jsonb_typeof(datos->'precio') is distinct from 'number' or precio_nuevo is null or precio_nuevo<=0
    or precio_nuevo<>trunc(precio_nuevo) or precio_nuevo>9007199254740991
    or capacidad is null or capacidad<=0 or capacidad>999999999 then raise exception 'Precio o capacidad no validos.'; end if;
  if salida_nueva is null or regreso_nuevo is null or not isfinite(salida_nueva) or not isfinite(regreso_nuevo)
    or salida_nueva<date '0001-01-01' or regreso_nuevo>date '9999-12-31' or regreso_nuevo<salida_nueva then raise exception 'Fechas no validas: revisa salida y regreso.'; end if;
  if icono_nuevo not in ('umbrella','landmark','waves','ferriswheel','mountain','building') then raise exception 'Icono no valido.'; end if;
  if servicios is null or jsonb_typeof(servicios)<>'array' then raise exception 'Agrega al menos un proveedor con su servicio.'; end if;
  if jsonb_array_length(servicios) not between 1 and 50 then raise exception 'Agrega entre uno y 50 servicios.'; end if;
  if identificador is not null then
    select * into anterior from public.paquetes where id=identificador for update;
    if not found then raise exception 'El paquete no existe.'; end if;
    partes:=regexp_match(anterior.cupo,'^Cupos:\s*([0-9]+)\s*/\s*([0-9]+)','i');
    if partes is null or length(partes[1])>9 or length(partes[2])>9 or partes[1]::integer>partes[2]::integer then
      raise exception 'Los cupos anteriores requieren revision; no se sobrescriben espacios comprometidos.'; end if;
    ocupados:=partes[2]::integer-partes[1]::integer;
    if capacidad<ocupados then raise exception 'La capacidad no puede ser menor que los cupos comprometidos.'; end if;
    if nombre_nuevo<>anterior.nombre and exists(select 1 from public.reservas r where r.paquete_id is null and r.paquete=anterior.nombre
      and not exists(select 1 from public.facturas f where f.reserva=r.codigo)) then
      raise exception 'Hay reservas historicas sin factura vinculadas por nombre. Revisa sus totales antes de renombrar el paquete.'; end if;
  end if;
  -- Orden estable de bloqueo; una desactivacion concurrente no puede colarse en la asociacion.
  perform v.id from public.proveedores v where v.id in (select (s->>'proveedor_id')::bigint from jsonb_array_elements(servicios) s) order by v.id for share;
  for servicio_actual in select * from jsonb_array_elements(servicios) loop
    if coalesce(servicio_actual->>'servicio','') not in ('Alojamiento','Vuelo','Transporte','Actividad','Alimentación','Seguro','Otro')
      or length(btrim(coalesce(servicio_actual->>'detalle',''))) not between 1 and 2000 then raise exception 'Indica tipo y detalle de cada servicio.'; end if;
    if not exists(select 1 from public.proveedores v where v.id=(servicio_actual->>'proveedor_id')::bigint
      and (v.estado='Activo' or exists(select 1 from public.paquete_servicios s where s.paquete_id=identificador
        and s.proveedor_id=v.id and s.servicio=servicio_actual->>'servicio'))) then
      raise exception 'Cada servicio necesita un proveedor activo. No se pueden agregar proveedores inactivos.'; end if;
  end loop;
  if identificador is null then
    insert into public.paquetes(nombre,loc,precio,cupo,icono,salida,regreso,descripcion,tipo_destino,incluye,no_incluye,condiciones,catalogo_completo)
      values(nombre_nuevo,ubicacion,precio_nuevo::text,'Cupos: '||capacidad||' / '||capacidad,icono_nuevo,salida_nueva,regreso_nuevo,
        descripcion_nueva,tipo,incluidos,excluidos,condiciones_nuevas,true) returning * into fila;
  else
    update public.paquetes set nombre=nombre_nuevo,loc=ubicacion,precio=precio_nuevo::text,
      cupo='Cupos: '||(capacidad-ocupados)||' / '||capacidad,icono=icono_nuevo,salida=salida_nueva,regreso=regreso_nuevo,
      descripcion=descripcion_nueva,tipo_destino=tipo,incluye=incluidos,no_incluye=excluidos,condiciones=condiciones_nuevas,catalogo_completo=true
      where id=identificador returning * into fila;
    delete from public.paquete_servicios where paquete_id=identificador;
  end if;
  insert into public.paquete_servicios(paquete_id,proveedor_id,servicio,detalle)
    select fila.id,(s->>'proveedor_id')::bigint,s->>'servicio',btrim(s->>'detalle') from jsonb_array_elements(servicios) s;
  return privado.paquete_catalogo(fila.id);
exception when invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow then
  raise exception 'Revisa identificadores, precio, capacidad y fechas.';
end;
$$;

create function privado.contenido_paquete(identificador bigint) returns jsonb
language sql stable set search_path='' as $$
  select case when p.catalogo_completo then jsonb_build_object('nombre',p.nombre,'destino',p.loc,'tipo_destino',p.tipo_destino,
    'descripcion',p.descripcion,'incluye',p.incluye,'no_incluye',p.no_incluye,'condiciones',p.condiciones,
    'servicios',(select coalesce(jsonb_agg(s-'activo'),'[]'::jsonb) from jsonb_array_elements(privado.servicios_paquete(p.id)) s)) end
  from public.paquetes p where p.id=identificador;
$$;
create function privado.capturar_contenido_reserva() returns trigger
language plpgsql set search_path='' as $$
declare paquete public.paquetes;
begin
  if tg_op='UPDATE' and new.paquete_id is not distinct from old.paquete_id then
    new.contenido_contratado:=old.contenido_contratado; return new;
  end if;
  if not new.gestiona_cupos or new.paquete_id is null then
    if tg_op='UPDATE' then new.contenido_contratado:=old.contenido_contratado; else new.contenido_contratado:=null; end if;
    return new;
  end if;
  select * into paquete from public.paquetes where id=new.paquete_id;
  perform v.id from public.proveedores v join public.paquete_servicios s on s.proveedor_id=v.id
    where s.paquete_id=paquete.id order by v.id for share of v;
  if paquete.catalogo_completo and (not exists(select 1 from public.paquete_servicios where paquete_id=paquete.id)
    or exists(select 1 from public.paquete_servicios s join public.proveedores v on v.id=s.proveedor_id where s.paquete_id=paquete.id and v.estado is distinct from 'Activo')) then
    raise exception 'El paquete tiene servicios sin proveedor activo. Solicita al administrador revisar el catalogo.';
  end if;
  new.contenido_contratado:=privado.contenido_paquete(new.paquete_id);
  return new;
end;
$$;
create trigger snapshot_comercial before insert or update on public.reservas for each row execute function privado.capturar_contenido_reserva();

-- Solo las RPC de catalogo (y las operaciones internas de cupos) pueden editar estas tablas.
create function privado.exigir_edicion_catalogo() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user<>pg_get_userbyid((select proowner from pg_proc where oid='public.guardar_paquete(jsonb)'::regprocedure)) then
    raise exception 'Utiliza la gestion de catalogo para editar paquetes, proveedores y servicios.' using errcode='42501'; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
create trigger catalogo_paquete before insert or update or delete on public.paquetes for each row execute function privado.exigir_edicion_catalogo();
create trigger catalogo_proveedor before insert or update or delete on public.proveedores for each row execute function privado.exigir_edicion_catalogo();
create trigger catalogo_servicio before insert or update or delete on public.paquete_servicios for each row execute function privado.exigir_edicion_catalogo();

-- Mismo contrato anterior; solo se enriquece el catalogo con campos y servicios publicables.
create or replace function public.datos_asesor(gestion boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare resultado jsonb;
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then raise exception 'Se requiere una cuenta activa.' using errcode='42501'; end if;
  if gestion is null or (gestion and not privado.tiene_rol(array['administrador'])) then raise exception 'Solo un administrador puede consultar la gestion.' using errcode='42501'; end if;
  select jsonb_build_object(
    'clientes',(select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]') from public.clientes c),
    'paquetes',(select coalesce(jsonb_agg(privado.paquete_catalogo(p.id) order by p.id),'[]') from public.paquetes p),
    'reservas',(select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('total',historico.total,
      'estado_pago',coalesce(r.estado_pago,case when abonos.valor>0 then
        case when historico.total is not null and abonos.valor>=historico.total then 'Pagado' else 'Pago parcial' end else 'Pendiente' end)) order by r.id),'[]')
      from public.reservas r cross join lateral (select coalesce(r.total,
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
revoke all on function privado.servicios_paquete(bigint),privado.paquete_catalogo(bigint),privado.contenido_paquete(bigint),
  privado.capturar_contenido_reserva(),privado.exigir_edicion_catalogo(),public.catalogo_administrativo(),
  public.guardar_paquete(jsonb),public.guardar_proveedor(jsonb) from public,anon,authenticated;
grant execute on function public.catalogo_administrativo(),public.guardar_paquete(jsonb),public.guardar_proveedor(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
