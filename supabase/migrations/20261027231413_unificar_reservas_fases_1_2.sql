-- Fases 1 y 2. Incremental sobre operacion_asesor_simple; sin conversion de historicos.
begin;

create function privado.validar_fechas_paquete() returns trigger
language plpgsql set search_path='' as $$
begin
  -- Descontar/liberar cupos de un paquete antiguo no reescribe sus fechas.
  if tg_op='UPDATE' and new.salida is not distinct from old.salida
    and new.regreso is not distinct from old.regreso then return new; end if;
  if new.salida is null or new.regreso is null or not isfinite(new.salida) or not isfinite(new.regreso)
    or new.salida < date '0001-01-01' or new.regreso > date '9999-12-31'
    or new.regreso < new.salida then
    raise exception 'Indica fechas validas: el regreso no puede ser anterior a la salida.';
  end if;
  return new;
end;
$$;
revoke all on function privado.validar_fechas_paquete() from public,anon,authenticated;
create trigger fechas_paquete before insert or update of salida,regreso on public.paquetes
for each row execute function privado.validar_fechas_paquete();

-- Ambos roles reutilizan la operacion ya probada (precio, cupos, factura y snapshots).
-- La asignacion administrativa se hace en la misma transaccion que la creacion.
create function public.crear_reserva_unificada(cliente_id bigint, paquete_id bigint, pasajeros integer, empleado_id bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare resultado jsonb;
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then
    raise exception 'Se requiere una cuenta activa.' using errcode='42501'; end if;
  if empleado_id is not null then
    if not privado.tiene_rol(array['administrador']) then
      raise exception 'Solo el administrador puede elegir al asesor responsable.' using errcode='42501'; end if;
    perform 1 from public.perfiles p join public.empleados e on e.id=p.empleado_id
      where p.empleado_id=crear_reserva_unificada.empleado_id
      and privado.tiene_rol(array['asesor'],p.id) for share of p,e;
    if not found then raise exception 'El responsable debe ser un asesor activo con acceso habilitado.'; end if;
  end if;
  resultado:=public.operar_asesor('crear',jsonb_build_object('cliente_id',cliente_id,'paquete_id',paquete_id,'pax',pasajeros));
  if empleado_id is not null then
    resultado:=public.operar_asesor('reasignar',jsonb_build_object('reserva_id',(resultado->>'id')::bigint,'empleado_id',empleado_id));
  end if;
  return resultado;
end;
$$;

-- Una sola operacion de abono para ambos roles. No altera el estado de la reserva,
-- no marca una factura como aceptada fiscalmente y no adopta relaciones historicas.
create function public.registrar_abono_reserva(reserva_id bigint, valor numeric, metodo text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare reserva public.reservas; es_admin boolean; total_reserva numeric; abonado numeric;
  metodo_elegido text := btrim(metodo); pago_id bigint; estado_nuevo text;
begin
  if auth.uid() is null or not privado.tiene_rol(array['administrador','asesor']) then
    raise exception 'Se requiere una cuenta activa.' using errcode='42501'; end if;
  es_admin:=privado.tiene_rol(array['administrador']);
  select * into reserva from public.reservas r where r.id=registrar_abono_reserva.reserva_id for update;
  if not found then raise exception 'La reserva no existe.'; end if;
  if not es_admin and (not reserva.gestiona_cupos or reserva.empleado_id is distinct from privado.empleado_actual()) then
    raise exception 'Solo puedes registrar abonos de tus reservas gestionadas.' using errcode='42501'; end if;
  if reserva.estado in ('Cancelada','Finalizada') then raise exception 'La reserva esta cancelada o finalizada.'; end if;
  if valor is null or valor<=0 or valor<>trunc(valor) or valor>9007199254740991 then
    raise exception 'El monto debe ser un entero positivo.'; end if;
  if metodo_elegido is null or metodo_elegido not in ('Efectivo','Transferencia','Tarjeta crédito','Tarjeta débito','PSE','Nequi') then
    raise exception 'Selecciona un metodo de pago valido.'; end if;
  total_reserva:=reserva.total;
  if total_reserva is null then
    select privado.pesos_seguros(f.valor) into total_reserva from public.facturas f
      where f.reserva_id=reserva.id or (f.reserva_id is null and f.reserva=reserva.codigo) order by f.id limit 1;
    if total_reserva is null and not exists(select 1 from public.facturas f
      where f.reserva_id=reserva.id or (f.reserva_id is null and f.reserva=reserva.codigo)) then
      select privado.pesos_seguros(p.precio) into total_reserva from public.paquetes p
        where p.nombre=reserva.paquete and (select count(*) from public.paquetes p2 where p2.nombre=reserva.paquete)=1;
    end if;
  end if;
  if total_reserva is null or total_reserva<=0 or total_reserva<>trunc(total_reserva) or total_reserva>9007199254740991 then
    raise exception 'El total historico requiere revision administrativa antes de recibir pagos.'; end if;
  abonado:=privado.pagado_reserva(reserva.id,reserva.codigo);
  if abonado+valor>total_reserva then raise exception 'El abono supera el saldo de la reserva.'; end if;
  estado_nuevo:=case when abonado+valor=total_reserva then 'Pagado' else 'Pago parcial' end;
  insert into public.pagos(recibo,reserva_id,reserva,cliente,metodo,valor,fecha,estado)
    values('#PG-'||gen_random_uuid()::text,reserva.id,reserva.codigo,reserva.cliente,metodo_elegido,registrar_abono_reserva.valor::text,
      (now() at time zone 'America/Bogota')::date,case when estado_nuevo='Pagado' then 'Pagado' else 'Abono' end)
    returning id into pago_id;
  update public.reservas set estado_pago=estado_nuevo where id=reserva.id;
  return jsonb_build_object('id',pago_id,'estado_pago',estado_nuevo,'pagado',abonado+valor,'saldo',total_reserva-abonado-valor);
end;
$$;

-- Una API autenticada no debe seguir insertando nuevas reservas/pagos por el flujo antiguo.
-- Las RPC corren con su propietario SQL; la misma guarda deja funcionar operar_asesor.
create function privado.exigir_operacion_reserva() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user <> pg_get_userbyid((select proowner from pg_proc where oid='public.operar_asesor(text,jsonb)'::regprocedure)) then
    raise exception 'Utiliza las operaciones protegidas de reservas y pagos.' using errcode='42501';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function privado.exigir_operacion_reserva() from public,anon,authenticated;
create trigger operacion_reserva_requerida before insert on public.reservas for each row execute function privado.exigir_operacion_reserva();
create trigger operacion_pago_requerida before insert or update or delete on public.pagos for each row execute function privado.exigir_operacion_reserva();

revoke all on function public.crear_reserva_unificada(bigint,bigint,integer,bigint),public.registrar_abono_reserva(bigint,numeric,text) from public,anon,authenticated;
grant execute on function public.crear_reserva_unificada(bigint,bigint,integer,bigint),public.registrar_abono_reserva(bigint,numeric,text) to authenticated;
notify pgrst, 'reload schema';
commit;
