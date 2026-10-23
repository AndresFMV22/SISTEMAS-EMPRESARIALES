-- NóvaTravel: tablas y muestra reducida. Ejecutar en el SQL Editor de Supabase.
-- No elimina tablas ni registros existentes. La muestra solo se inserta si no existe.
create table if not exists public.clientes (
  id bigint generated always as identity primary key,
  codigo text unique not null, nombre text not null, documento text,
  correo text, telefono text, reservas int default 0,
  activo boolean default true, observaciones text, obs_desde date, obs_hasta date,
  created_at timestamptz default now());
create table if not exists public.paquetes (
  id bigint generated always as identity primary key,
  nombre text not null, loc text, precio text, cupo text, icono text default 'umbrella',
  salida date, regreso date);
create table if not exists public.reservas (
  id bigint generated always as identity primary key,
  codigo text unique not null, cliente text, paquete text, pax int,
  fecha_viaje date, asesor text, tono text default 'info', estado text default 'En proceso');
create table if not exists public.pagos (
  id bigint generated always as identity primary key,
  recibo text unique not null, reserva text, cliente text, metodo text,
  valor text, fecha date, tono text default 'ok', estado text default 'Pagado');
create table if not exists public.facturas (
  id bigint generated always as identity primary key,
  factura text unique not null, cliente text, nit text, reserva text,
  valor text, fecha date, tono text default 'info', estado text default 'Enviada');
create table if not exists public.proveedores (
  id bigint generated always as identity primary key,
  nombre text not null, tipo text, contacto text, convenio text,
  tono text default 'ok', estado text default 'Activo');
create table if not exists public.empleados (
  id bigint generated always as identity primary key,
  codigo text unique not null, nombre text not null, cargo text,
  correo text, telefono text, activo boolean default true,
  observaciones text, obs_desde date, obs_hasta date);

-- Compatibilidad con tablas creadas por versiones anteriores del proyecto.
alter table public.clientes
  add column if not exists activo boolean default true,
  add column if not exists observaciones text,
  add column if not exists obs_desde date,
  add column if not exists obs_hasta date;
alter table public.paquetes
  add column if not exists salida date,
  add column if not exists regreso date;

insert into public.clientes (codigo,nombre,documento,correo,telefono,reservas,activo) values
  ('CL-0033','Samuel Restrepo','98.444.204','samuel.restrepo@mail.com','306 199 6881',5,true),
  ('CL-0039','Miguel Cortés','75.508.470','miguel.cortes@mail.com','302 621 9085',1,true),
  ('CL-0048','Valentina Ramírez','53.578.984','valentina.ramirez@mail.com','320 789 2612',0,true),
  ('CL-0050','Miguel Ramírez','2.195.871','miguel.ramirez@mail.com','302 516 8956',7,false),
  ('CL-0051','Nicolás Marín','55.813.848','nicolas.marin@mail.com','327 258 4111',4,true),
  ('CL-0055','Camila Montoya','10.109.569','camila.montoya@mail.com','329 202 2200',8,true),
  ('CL-0060','Laura Salazar','6.466.315','laura.salazar@mail.com','323 782 2684',5,true)
on conflict (codigo) do nothing;

insert into public.paquetes (nombre,loc,precio,cupo,icono,salida,regreso)
select nombre,loc,precio,cupo,icono,salida::date,regreso::date from (values
  ('Cancún Paraíso','México · 7 días / 6 noches','$ 6.480.000','Cupos: 15 / 20 · Todo incluido','umbrella','2026-09-26','2026-10-03'),
  ('Madrid Imperial','España · 8 días / 7 noches','$ 9.120.000','Cupos: 14 / 40 · Con traslados','landmark','2026-07-03','2026-07-11'),
  ('Orlando Familiar','USA · 9 días / 8 noches','$ 14.300.000','Cupos: 11 / 20 · City tour','ferriswheel','2026-05-22','2026-05-31'),
  ('Roma Clásica','Italia · 8 días / 7 noches','$ 10.800.000','Cupos: 21 / 40 · Desayuno incluido','landmark','2026-09-27','2026-10-05'),
  ('Grecia Islas','Grecia · 9 días / 8 noches','$ 13.800.000','Cupos: 28 / 30 · City tour','waves','2026-08-06','2026-08-15'),
  ('Lisboa Atlántica','Portugal · 7 días / 6 noches','$ 8.900.000','Cupos: 32 / 50 · Desayuno incluido','building','2026-05-25','2026-06-01'),
  ('Panamá Ciudad','Panamá · 5 días / 4 noches','$ 4.300.000','Cupos: 26 / 40 · Desayuno incluido','building','2026-01-12','2026-01-17')
) as muestra(nombre,loc,precio,cupo,icono,salida,regreso)
where not exists (select 1 from public.paquetes p where p.nombre = muestra.nombre);

insert into public.reservas (codigo,cliente,paquete,pax,fecha_viaje,asesor,tono,estado) values
  ('#RS-20800','Miguel Ramírez','Grecia Islas',5,'2026-12-24','Andrés M.','bad','Pendiente'),
  ('#RS-20803','Miguel Cortés','Panamá Ciudad',4,'2026-10-19','Andrés M.','ok','Confirmada'),
  ('#RS-20808','Samuel Restrepo','Madrid Imperial',2,'2026-01-20','Samuel P.','warn','Pago parcial'),
  ('#RS-20812','Camila Montoya','Lisboa Atlántica',1,'2026-10-23','Andrés M.','warn','Pago parcial'),
  ('#RS-20819','Laura Salazar','Grecia Islas',1,'2026-08-28','Juan J.','info','En proceso'),
  ('#RS-20821','Valentina Ramírez','Cancún Paraíso',2,'2026-02-08','Andrés M.','ok','Confirmada'),
  ('#RS-20827','Nicolás Marín','Roma Clásica',6,'2026-03-07','Samuel P.','ok','Confirmada')
on conflict (codigo) do nothing;

insert into public.pagos (recibo,reserva,cliente,metodo,valor,fecha,tono,estado) values
  ('#PG-9802','#RS-20803','Miguel Cortés','Transferencia','$ 2.400.000','2026-05-22','warn','Abono'),
  ('#PG-9807','#RS-20812','Camila Montoya','Tarjeta crédito','$ 4.300.000','2026-04-21','warn','Abono'),
  ('#PG-9809','#RS-20819','Laura Salazar','Efectivo','$ 10.800.000','2026-08-23','warn','Abono')
on conflict (recibo) do nothing;

insert into public.facturas (factura,cliente,nit,reserva,valor,fecha,tono,estado) values
  ('FE-004825','Miguel Cortés','75.508.470','#RS-20803','$ 4.300.000','2026-06-14','info','Enviada'),
  ('FE-004831','Laura Salazar','6.466.315','#RS-20819','$ 13.800.000','2026-08-04','ok','Aceptada'),
  ('FE-004837','Samuel Restrepo','98.444.204','#RS-20808','$ 9.120.000','2026-06-24','warn','Por validar'),
  ('FE-004842','Miguel Ramírez','2.195.871','#RS-20800','$ 13.800.000','2026-02-15','info','Enviada')
on conflict (factura) do nothing;

insert into public.proveedores (nombre,tipo,contacto,convenio,tono,estado)
select nombre,tipo,contacto,convenio,tono,estado from (values
  ('Avianca','Aerolínea','contacto@avianca.com','Cupo garantizado','ok','Activo'),
  ('Decameron','Hotelería','contacto@decameron.com','Comisión 10%','ok','Activo'),
  ('LATAM Airlines','Aerolínea','contacto@latam.com','Comisión 8%','ok','Activo'),
  ('ExpediTours','Operador terrestre','contacto@expeditours.com','Por servicio','ok','Activo'),
  ('Hilton','Hotelería','contacto@hilton.com','Cupo garantizado','ok','Activo'),
  ('Iberia','Aerolínea','contacto@iberia.com','Comisión 10%','ok','Activo'),
  ('MarSol Cruceros','Naviera','contacto@marsol.com','Tarifa neta','info','Nuevo')
) as muestra(nombre,tipo,contacto,convenio,tono,estado)
where not exists (select 1 from public.proveedores p where p.nombre = muestra.nombre);

insert into public.empleados (codigo,nombre,cargo,correo,telefono,activo) values
  ('EM-0101','Samuel Parra','Asesor comercial','samuel.parra@novatravel.com','305 537 6120',true),
  ('EM-0102','Juan José García','Asesor comercial','juan.jose.garcia@novatravel.com','312 803 8770',true),
  ('EM-0104','Carolina Ospina','Gerente general','carolina.ospina@novatravel.com','312 669 1982',true)
on conflict (codigo) do nothing;

-- Compatibilidad de instalación demo inicial. Una instalación con perfiles o
-- evidencia de la migración de accesos NUNCA debe volver a políticas anónimas.
-- También limpia demo_all residual sin reemplazar las políticas autenticadas.
do $$
declare
  tabla text;
  accesos_protegidos boolean :=
    to_regclass('public.perfiles') is not null
    or to_regclass('privado.provisiones_acceso') is not null
    or to_regprocedure('public.obtener_perfil()') is not null;
  migracion_registrada boolean := false;
begin
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select exists (select 1 from supabase_migrations.schema_migrations where version = $1)'
      into migracion_registrada using '20261022233614';
  end if;
  accesos_protegidos := accesos_protegidos or migracion_registrada;
  foreach tabla in array array['clientes','paquetes','reservas','pagos','facturas','proveedores','empleados'] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('drop policy if exists "demo_all" on public.%I', tabla);
    if accesos_protegidos then
      execute format('revoke all on public.%I from public, anon', tabla);
    else
      execute format('create policy "demo_all" on public.%I for all to anon using (true) with check (true)', tabla);
    end if;
  end loop;
end $$;
