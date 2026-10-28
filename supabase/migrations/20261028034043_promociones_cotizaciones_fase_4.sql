-- Fase 4. Promocion opcional y una sola por reserva; sin recotizacion retroactiva.
begin;
create table public.promociones (
  id bigint generated always as identity primary key,
  nombre text not null check(length(btrim(nombre)) between 2 and 200),
  descripcion text not null default '' check(length(descripcion)<=4000),
  tipo text not null check(tipo in ('porcentaje','fijo')),
  valor numeric(16,0) not null check(valor>0 and valor<=9007199254740991 and (tipo<>'porcentaje' or valor<=99)),
  desde date not null, hasta date not null,
  condicion_pasajeros text not null check(condicion_pasajeros in ('cualquiera','exacta','minima')),
  cantidad_pasajeros integer,
  activa boolean not null default true,
  check(isfinite(desde) and isfinite(hasta) and desde>=date '0001-01-01' and hasta<=date '9999-12-31' and hasta>=desde),
  check((condicion_pasajeros='cualquiera' and cantidad_pasajeros is null) or
    (condicion_pasajeros in ('exacta','minima') and cantidad_pasajeros is not null and cantidad_pasajeros between 1 and 999999999))
);
create table public.promocion_paquetes (
  promocion_id bigint not null references public.promociones(id),
  paquete_id bigint not null references public.paquetes(id),
  primary key(promocion_id,paquete_id)
);
create index promocion_paquetes_paquete_idx on public.promocion_paquetes(paquete_id);
alter table public.promociones enable row level security;
alter table public.promocion_paquetes enable row level security;
revoke all on public.promociones,public.promocion_paquetes from public,anon,authenticated;
grant select on public.promociones,public.promocion_paquetes to authenticated;
create policy administrador_lectura on public.promociones for select to authenticated using ((select privado.tiene_rol(array['administrador'])));
create policy administrador_lectura on public.promocion_paquetes for select to authenticated using ((select privado.tiene_rol(array['administrador'])));

alter table public.reservas add column descuento numeric(16,0) not null default 0,
  add column promocion_id bigint references public.promociones(id), add column promocion_contratada jsonb;
create index reservas_promocion_idx on public.reservas(promocion_id);
alter table public.reservas drop constraint reserva_gestionada_completa;
alter table public.reservas add constraint reserva_gestionada_completa check (not gestiona_cupos or
 (cliente_id is not null and paquete_id is not null and empleado_id is not null and pax is not null
  and precio_persona is not null and total is not null and estado is not null and estado_pago is not null
  and pax>0 and precio_persona>0 and precio_persona*pax<=9007199254740991
  and descuento>=0 and total=precio_persona*pax-descuento and total>0
  and total<=9007199254740991 and fecha_viaje is not null and fecha_regreso is not null
  and isfinite(fecha_viaje) and isfinite(fecha_regreso) and fecha_regreso>=fecha_viaje
  and estado in ('Pendiente','Confirmada','Finalizada','Cancelada') and estado_pago in ('Pendiente','Pago parcial','Pagado')
  and ((promocion_id is null and promocion_contratada is null and descuento=0) or (promocion_id is not null and promocion_contratada is not null))));
alter table public.solicitudes_reserva add column cotizacion_aceptada jsonb, add column aceptacion_cliente boolean not null default false;

create function privado.estado_promocion(activa boolean,desde date,hasta date) returns text
language sql stable set search_path='' as $$ select case when not activa then 'deshabilitada'
 when (now() at time zone 'America/Bogota')::date<desde then 'programada'
 when (now() at time zone 'America/Bogota')::date>hasta then 'vencida' else 'vigente' end; $$;
create function privado.promociones_vigentes(paquete bigint) returns jsonb
language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('estado','vigente') order by p.id),'[]'::jsonb)
 from public.promociones p join public.promocion_paquetes r on r.promocion_id=p.id where r.paquete_id=paquete
 and privado.estado_promocion(p.activa,p.desde,p.hasta)='vigente';
$$;
create function public.datos_promociones() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not privado.tiene_rol(array['administrador']) then raise exception 'Solo un administrador activo puede gestionar promociones.' using errcode='42501'; end if;
 return jsonb_build_object('promociones',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('estado',privado.estado_promocion(p.activa,p.desde,p.hasta),
   'paquetes',(select coalesce(jsonb_agg(r.paquete_id order by r.paquete_id),'[]') from public.promocion_paquetes r where r.promocion_id=p.id)) order by p.id),'[]') from public.promociones p),
   'paquetes',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre) order by p.id),'[]') from public.paquetes p));
end;
$$;
create function public.guardar_promocion(datos jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare identificador bigint:=(datos->>'id')::bigint; importe numeric:=(datos->>'valor')::numeric;
 cantidad integer:=(datos->>'cantidad_pasajeros')::integer; inicio date:=(datos->>'desde')::date; fin date:=(datos->>'hasta')::date;
 ids jsonb:=datos->'paquetes'; fila public.promociones;
begin
 if auth.uid() is null or not privado.tiene_rol(array['administrador']) then raise exception 'Solo un administrador activo puede guardar promociones.' using errcode='42501'; end if;
 if length(btrim(coalesce(datos->>'nombre',''))) not between 2 and 200 or length(coalesce(datos->>'descripcion',''))>4000
   or coalesce(datos->>'tipo','') not in ('porcentaje','fijo') or jsonb_typeof(datos->'activa') is distinct from 'boolean'
   or coalesce(datos->>'condicion_pasajeros','') not in ('cualquiera','exacta','minima') then raise exception 'Completa nombre, beneficio, condicion y habilitacion.'; end if;
 if jsonb_typeof(datos->'valor') is distinct from 'number' or importe is null or importe<=0 or importe<>trunc(importe) or importe>9007199254740991
   or (datos->>'tipo'='porcentaje' and importe>99) then raise exception 'Usa porcentaje entero entre 1 y 99, o un monto COP entero positivo.'; end if;
 if inicio is null or fin is null or not isfinite(inicio) or not isfinite(fin) or inicio<date '0001-01-01' or fin>date '9999-12-31' or fin<inicio then raise exception 'La fecha final no puede ser anterior al inicio.'; end if;
 if datos->>'condicion_pasajeros'='cualquiera' then cantidad:=null;
 elsif cantidad is null or cantidad<1 or cantidad>999999999 then raise exception 'Indica la cantidad exacta o minima de pasajeros.'; end if;
 if ids is null or jsonb_typeof(ids)<>'array' then raise exception 'Selecciona los paquetes aplicables.'; end if;
 if jsonb_array_length(ids) not between 1 and 1000 then raise exception 'Selecciona entre uno y 1000 paquetes.'; end if;
 -- Paquetes antes que promocion, igual que las cotizaciones de escritura.
 perform p.id from public.paquetes p where p.id in (select value::bigint from jsonb_array_elements_text(ids)) order by p.id for share;
 if (select count(*) from public.paquetes p where p.id in (select value::bigint from jsonb_array_elements_text(ids)))<>jsonb_array_length(ids) then raise exception 'Revisa paquetes inexistentes o repetidos.'; end if;
 if identificador is null then
   insert into public.promociones(nombre,descripcion,tipo,valor,desde,hasta,condicion_pasajeros,cantidad_pasajeros,activa)
   values(btrim(datos->>'nombre'),coalesce(datos->>'descripcion',''),datos->>'tipo',importe,inicio,fin,datos->>'condicion_pasajeros',cantidad,(datos->>'activa')::boolean) returning * into fila;
 else
   perform 1 from public.promociones where id=identificador for update;
   if not found then raise exception 'La promocion no existe.'; end if;
   update public.promociones set nombre=btrim(datos->>'nombre'),descripcion=coalesce(datos->>'descripcion',''),tipo=datos->>'tipo',valor=importe,
     desde=inicio,hasta=fin,condicion_pasajeros=datos->>'condicion_pasajeros',cantidad_pasajeros=cantidad,activa=(datos->>'activa')::boolean where id=identificador returning * into fila;
   delete from public.promocion_paquetes where promocion_id=identificador;
 end if;
 insert into public.promocion_paquetes(promocion_id,paquete_id) select fila.id,value::bigint from jsonb_array_elements_text(ids);
 return to_jsonb(fila);
end;
$$;
create trigger promocion_protegida before insert or update or delete on public.promociones for each row execute function privado.exigir_edicion_catalogo();
create trigger promocion_paquetes_protegida before insert or update or delete on public.promocion_paquetes for each row execute function privado.exigir_edicion_catalogo();

create function privado.snapshot_promocion(identificador bigint,paquete bigint) returns jsonb
language plpgsql stable set search_path='' as $$
declare fila public.promociones;
begin
 if identificador is null then return null; end if;
 select p.* into fila from public.promociones p join public.promocion_paquetes r on r.promocion_id=p.id
  where p.id=identificador and r.paquete_id=paquete and privado.estado_promocion(p.activa,p.desde,p.hasta)='vigente';
 if not found then raise exception 'La promocion no esta vigente o no aplica a este paquete. Actualiza y elige otra o Sin promocion.'; end if;
 return to_jsonb(fila)-'activa';
end;
$$;
create function privado.precio_con_descuento(precio numeric,pasajeros integer,promocion jsonb,estricto boolean default true) returns jsonb
language plpgsql immutable set search_path='' as $$
declare subtotal numeric:=precio*pasajeros; descuento numeric:=0; aplica boolean:=false; condicion text; cantidad integer;
begin
 if precio is null or precio<=0 or precio<>trunc(precio) or pasajeros is null or pasajeros<=0 or subtotal>9007199254740991 then raise exception 'Precio o pasajeros no validos.'; end if;
 if promocion is not null and promocion<>'null'::jsonb then
  condicion:=promocion->>'condicion_pasajeros';cantidad:=(promocion->>'cantidad_pasajeros')::integer;
  aplica:=condicion='cualquiera' or (condicion='exacta' and pasajeros=cantidad) or (condicion='minima' and pasajeros>=cantidad);
  if not coalesce(aplica,false) and estricto then raise exception 'La promocion requiere % % pasajeros en toda la reserva. Elige otra o Sin promocion.',case when condicion='exacta' then 'exactamente' else 'al menos' end,cantidad; end if;
  if aplica then descuento:=case when promocion->>'tipo'='porcentaje' then round(subtotal*(promocion->>'valor')::numeric/100) else (promocion->>'valor')::numeric end; end if;
 end if;
 if descuento<0 or descuento>=subtotal then raise exception 'El descuento no puede dejar el total en cero o negativo. Elige otra o Sin promocion.'; end if;
 return jsonb_build_object('precio_persona',precio,'subtotal',subtotal,'descuento',descuento,'total',subtotal-descuento,'promocion',promocion,'aplica',coalesce(aplica,false));
end;
$$;
create function privado.cotizacion_reserva(paquete_id bigint,pasajeros integer,promocion_id bigint) returns jsonb
language plpgsql stable set search_path='' as $$
declare paquete public.paquetes; resultado jsonb; partes text[];
begin
 select * into paquete from public.paquetes where id=paquete_id;
 if not found or paquete.salida is null or paquete.salida<=(now() at time zone 'America/Bogota')::date or paquete.regreso is null or paquete.regreso<paquete.salida then raise exception 'Paquete no disponible para nuevas reservas.'; end if;
 partes:=regexp_match(paquete.cupo,'^Cupos:\s*([0-9]+)\s*/\s*([0-9]+)');
 if partes is null or pasajeros>(partes[1])::integer then raise exception 'No hay cupos suficientes.'; end if;
 resultado:=privado.precio_con_descuento(privado.pesos_seguros(paquete.precio),pasajeros,privado.snapshot_promocion(promocion_id,paquete_id),true)
  ||jsonb_build_object('paquete_id',paquete.id,'paquete_nombre',paquete.nombre,'pasajeros',pasajeros,'salida',paquete.salida,'regreso',paquete.regreso);
 return resultado||jsonb_build_object('clave',md5((resultado||jsonb_build_object('contenido',privado.contenido_paquete(paquete.id)))::text));
end;
$$;
create function public.cotizar_reserva(paquete_id bigint,pasajeros integer,promocion_id bigint default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then raise exception 'Se requiere una cuenta activa.' using errcode='42501'; end if;
 return privado.cotizacion_reserva(paquete_id,pasajeros,promocion_id);
end;
$$;
create function public.crear_reserva_promocion(cliente_id bigint,paquete_id bigint,pasajeros integer,empleado_id bigint,promocion_id bigint,cotizacion text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare precio jsonb; creada jsonb; reserva public.reservas;
begin
 if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then raise exception 'Se requiere una cuenta activa.' using errcode='42501'; end if;
 perform 1 from public.paquetes p where p.id=paquete_id for update;
 if promocion_id is not null then perform 1 from public.promociones p where p.id=promocion_id for share; end if;
 precio:=privado.cotizacion_reserva(paquete_id,pasajeros,promocion_id);
 if cotizacion is null or cotizacion is distinct from precio->>'clave' then raise exception 'La cotizacion cambio. Actualiza y revisa precio y promocion antes de reservar.'; end if;
 creada:=public.crear_reserva_unificada(cliente_id,paquete_id,pasajeros,empleado_id);
 update public.reservas set descuento=(precio->>'descuento')::numeric,total=(precio->>'total')::numeric,
   promocion_id=crear_reserva_promocion.promocion_id,promocion_contratada=nullif(precio->'promocion','null'::jsonb)
   where id=(creada->>'id')::bigint returning * into reserva;
 update public.facturas set valor=reserva.total::text where reserva_id=reserva.id;
 return to_jsonb(reserva);
end;
$$;

create function privado.cotizacion_cambio(solicitud_id bigint,promocion_id bigint,sustituir_promocion boolean) returns jsonb
language plpgsql stable set search_path='' as $$
declare solicitud public.solicitudes_reserva; reserva public.reservas; paquete public.paquetes; destino bigint;
 pasajeros integer; precio numeric; contrato jsonb; resultado jsonb; abonado numeric;
begin
 select * into solicitud from public.solicitudes_reserva where id=solicitud_id;
 select * into reserva from public.reservas where id=solicitud.reserva_id;
 if solicitud.id is null or solicitud.estado<>'pendiente' or solicitud.tipo<>'cambio' or not reserva.gestiona_cupos then raise exception 'La solicitud no admite una cotizacion de cambio.'; end if;
 if reserva.estado in ('Cancelada','Finalizada') or solicitud.empleado_id<>reserva.empleado_id then raise exception 'Reserva cerrada o reasignada; rechaza esta solicitud y revisa con el responsable.'; end if;
 destino:=coalesce(solicitud.paquete_id,reserva.paquete_id);pasajeros:=coalesce(solicitud.pax,reserva.pax);
 select * into paquete from public.paquetes where id=destino;
 if paquete.salida is null or paquete.salida<=(now() at time zone 'America/Bogota')::date or paquete.regreso is null or paquete.regreso<paquete.salida then raise exception 'La nueva salida debe ser futura y tener regreso valido.'; end if;
 precio:=case when destino=reserva.paquete_id then reserva.precio_persona else privado.pesos_seguros(paquete.precio) end;
 if destino=reserva.paquete_id and not coalesce(sustituir_promocion,false) then contrato:=reserva.promocion_contratada;
 else contrato:=privado.snapshot_promocion(promocion_id,destino); end if;
 resultado:=privado.precio_con_descuento(precio,pasajeros,contrato,not(destino=reserva.paquete_id and not coalesce(sustituir_promocion,false)));
 abonado:=privado.pagado_reserva(reserva.id,reserva.codigo);
 resultado:=resultado||jsonb_build_object('solicitud_id',solicitud.id,'paquete_id',destino,'paquete_nombre',paquete.nombre,
  'pasajeros',pasajeros,'salida',paquete.salida,'regreso',paquete.regreso,'total_anterior',reserva.total,'pagado',abonado,
  'saldo',(resultado->>'total')::numeric-abonado);
 return resultado||jsonb_build_object('clave',md5((resultado||jsonb_build_object('responsable',reserva.empleado_id,'contenido',
   case when destino=reserva.paquete_id then reserva.contenido_contratado else privado.contenido_paquete(destino) end))::text));
end;
$$;
create function public.cotizar_cambio(solicitud_id bigint,promocion_id bigint default null,sustituir_promocion boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not privado.tiene_rol(array['administrador']) then raise exception 'Solo un administrador puede cotizar cambios.' using errcode='42501'; end if;
 return privado.cotizacion_cambio(solicitud_id,promocion_id,sustituir_promocion);
end;
$$;
create function public.resolver_solicitud_precio(solicitud_id bigint,aprobar boolean,respuesta text,promocion_id bigint default null,
 sustituir_promocion boolean default false,cotizacion text default null,aceptacion_cliente boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare solicitud public.solicitudes_reserva; reserva public.reservas; paquete public.paquetes; precio jsonb; destino bigint; pasajeros integer;
begin
 if auth.uid() is null or not privado.tiene_rol(array['administrador']) then raise exception 'Solo un administrador activo puede resolver solicitudes.' using errcode='42501'; end if;
 select s.reserva_id into destino from public.solicitudes_reserva s where s.id=solicitud_id;
 select * into reserva from public.reservas where id=destino for update;
 select * into solicitud from public.solicitudes_reserva where id=solicitud_id for update;
 if solicitud.id is null or solicitud.estado<>'pendiente' then raise exception 'La solicitud no existe o ya fue resuelta.'; end if;
 if aprobar is null then raise exception 'Indica si apruebas o rechazas.'; end if;
 if not aprobar or solicitud.tipo='cancelacion' then return public.operar_asesor('resolver',jsonb_build_object('solicitud_id',solicitud_id,'aprobar',aprobar,'respuesta',respuesta)); end if;
 if not coalesce(aceptacion_cliente,false) or length(btrim(coalesce(respuesta,''))) not between 1 and 4000 then raise exception 'El cliente debe aceptar la nueva cotizacion y debes registrar una respuesta.'; end if;
 destino:=coalesce(solicitud.paquete_id,reserva.paquete_id);pasajeros:=coalesce(solicitud.pax,reserva.pax);
 perform p.id from public.paquetes p where p.id in (reserva.paquete_id,destino) order by p.id for update;
 if promocion_id is not null then perform p.id from public.promociones p where p.id=promocion_id for share; end if;
 precio:=privado.cotizacion_cambio(solicitud_id,promocion_id,sustituir_promocion);
 if cotizacion is null or cotizacion is distinct from precio->>'clave' then raise exception 'La cotizacion cambio. Actualiza y solicita de nuevo la aceptacion del cliente.'; end if;
 if (precio->>'total')::numeric<(precio->>'pagado')::numeric then raise exception 'El nuevo total es inferior a lo pagado; requiere resolver el reembolso antes del cambio.'; end if;
 if destino=reserva.paquete_id then perform privado.mover_cupos(destino,reserva.pax-pasajeros);
 else perform privado.mover_cupos(reserva.paquete_id,reserva.pax);perform privado.mover_cupos(destino,-pasajeros);end if;
 select * into paquete from public.paquetes where id=destino;
 update public.reservas set paquete_id=destino,paquete=paquete.nombre,pax=pasajeros,fecha_viaje=paquete.salida,fecha_regreso=paquete.regreso,
  precio_persona=(precio->>'precio_persona')::numeric,total=(precio->>'total')::numeric,descuento=(precio->>'descuento')::numeric,
  promocion_id=(precio->'promocion'->>'id')::bigint,promocion_contratada=nullif(precio->'promocion','null'::jsonb),
  estado_pago=case when (precio->>'pagado')::numeric=(precio->>'total')::numeric then 'Pagado' when (precio->>'pagado')::numeric>0 then 'Pago parcial' else 'Pendiente' end where id=reserva.id;
 update public.facturas set valor=precio->>'total',estado='Por validar' where reserva_id=reserva.id;
 update public.solicitudes_reserva set estado='aprobada',respuesta=btrim(resolver_solicitud_precio.respuesta),resuelto_en=now(),resuelto_por=auth.uid(),
   aceptacion_cliente=true,cotizacion_aceptada=precio where id=solicitud.id returning * into solicitud;
 return to_jsonb(solicitud);
end;
$$;

-- Los clientes no pueden cambiar descuentos ni aprobar por el camino antiguo sin cotizacion aceptada.
create function privado.proteger_precio_promocion() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.descuento is distinct from old.descuento or new.promocion_id is distinct from old.promocion_id or new.promocion_contratada is distinct from old.promocion_contratada)
  and current_user<>pg_get_userbyid((select proowner from pg_proc where oid='public.operar_asesor(text,jsonb)'::regprocedure)) then raise exception 'El descuento solo se modifica mediante cotizacion protegida.' using errcode='42501';end if;
 return new;
end;
$$;
create trigger precio_promocion before update on public.reservas for each row execute function privado.proteger_precio_promocion();
create function privado.exigir_aceptacion_cambio() returns trigger language plpgsql set search_path='' as $$
begin
 if old.estado='pendiente' and new.estado='aprobada' and new.tipo='cambio' and (not new.aceptacion_cliente or new.cotizacion_aceptada is null) then
  raise exception 'Aprueba cambios desde la nueva cotizacion con aceptacion del cliente.';end if;
 return new;
end;
$$;
create trigger aceptacion_cambio before update on public.solicitudes_reserva for each row execute function privado.exigir_aceptacion_cambio();

create or replace function privado.paquete_catalogo(identificador bigint) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'nombre',p.nombre,'ubicacion',p.loc,'precio',privado.pesos_seguros(p.precio),'cupo',p.cupo,'salida',p.salida,'regreso',p.regreso,'icono',p.icono,
 'descripcion',p.descripcion,'tipo_destino',p.tipo_destino,'incluye',p.incluye,'no_incluye',p.no_incluye,'condiciones',p.condiciones,'catalogo_completo',p.catalogo_completo,
 'servicios',privado.servicios_paquete(p.id),'promociones',privado.promociones_vigentes(p.id)) from public.paquetes p where p.id=identificador;
$$;
revoke all on function privado.estado_promocion(boolean,date,date),privado.promociones_vigentes(bigint),privado.snapshot_promocion(bigint,bigint),
 privado.precio_con_descuento(numeric,integer,jsonb,boolean),privado.cotizacion_reserva(bigint,integer,bigint),privado.cotizacion_cambio(bigint,bigint,boolean),
 privado.proteger_precio_promocion(),privado.exigir_aceptacion_cambio(),public.datos_promociones(),public.guardar_promocion(jsonb),public.cotizar_reserva(bigint,integer,bigint),
 public.crear_reserva_promocion(bigint,bigint,integer,bigint,bigint,text),public.cotizar_cambio(bigint,bigint,boolean),
 public.resolver_solicitud_precio(bigint,boolean,text,bigint,boolean,text,boolean) from public,anon,authenticated;
grant execute on function public.datos_promociones(),public.guardar_promocion(jsonb),public.cotizar_reserva(bigint,integer,bigint),
 public.crear_reserva_promocion(bigint,bigint,integer,bigint,bigint,text),public.cotizar_cambio(bigint,bigint,boolean),
 public.resolver_solicitud_precio(bigint,boolean,text,bigint,boolean,text,boolean) to authenticated;
notify pgrst, 'reload schema';
commit;
