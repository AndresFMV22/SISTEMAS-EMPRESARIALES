-- ============================================================
--  NóvaTravel · Esquema de base de datos (Supabase / PostgreSQL)
--  Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Limpieza (para reejecutar sin errores)
drop table if exists clientes, paquetes, reservas, pagos, facturas, proveedores cascade;

-- --------------------------- Tablas ---------------------------
create table clientes (
  id         bigint generated always as identity primary key,
  codigo     text unique not null,
  nombre     text not null,
  documento  text,
  correo     text,
  telefono   text,
  reservas   int  default 0,
  tono       text default 'warn',   -- ok | warn | bad | info
  estado     text default 'Nuevo',
  created_at timestamptz default now()
);

create table paquetes (
  id      bigint generated always as identity primary key,
  nombre  text not null,
  loc     text,
  precio  text,
  cupo    text,
  icono   text default 'umbrella'   -- umbrella|landmark|waves|ferriswheel|mountain|building
);

create table reservas (
  id          bigint generated always as identity primary key,
  codigo      text unique not null,
  cliente     text,
  paquete     text,
  pax         int,
  fecha_viaje date,
  asesor      text,
  tono        text default 'info',
  estado      text default 'En proceso'
);

create table pagos (
  id      bigint generated always as identity primary key,
  recibo  text unique not null,
  reserva text,
  cliente text,
  metodo  text,
  valor   text,
  fecha   date,
  tono    text default 'ok',
  estado  text default 'Pagado'
);

create table facturas (
  id      bigint generated always as identity primary key,
  factura text unique not null,
  cliente text,
  nit     text,
  reserva text,
  valor   text,
  fecha   date,
  tono    text default 'info',
  estado  text default 'Enviada'
);

create table proveedores (
  id       bigint generated always as identity primary key,
  nombre   text not null,
  tipo     text,
  contacto text,
  convenio text,
  tono     text default 'ok',
  estado   text default 'Activo'
);

-- --------------------- Datos de ejemplo ----------------------
insert into clientes (codigo, nombre, documento, correo, telefono, reservas, tono, estado) values
 ('CL-0031','María Restrepo','43.118.902','maria.r@mail.com','310 555 8841',7,'ok','Frecuente'),
 ('CL-0032','Carlos Gómez','71.204.663','c.gomez@mail.com','301 442 1290',3,'info','Activo'),
 ('CL-0033','Laura Muñoz','1.017.554.210','laura.m@mail.com','312 908 7756',2,'info','Activo'),
 ('CL-0034','Andrés Vélez','98.552.117','a.velez@mail.com','314 220 3341',5,'ok','Frecuente'),
 ('CL-0035','Sofía Álvarez','1.037.889.004','sofia.a@mail.com','300 771 4420',1,'warn','Nuevo');

insert into paquetes (nombre, loc, precio, cupo, icono) values
 ('Cancún Paraíso','México · 7 días / 6 noches','$ 6.480.000','Cupos: 12 / 40 · Todo incluido','umbrella'),
 ('Madrid Imperial','España · 8 días / 7 noches','$ 9.120.000','Cupos: 5 / 25 · Vuelo + hotel','landmark'),
 ('San Andrés Mar','Colombia · 4 días / 3 noches','$ 2.750.000','Cupos: 20 / 50 · Con snorkel','waves'),
 ('Orlando Familiar','USA · 9 días / 8 noches','$ 14.300.000','Cupos: 3 / 30 · Parques incluidos','ferriswheel'),
 ('Cusco Ancestral','Perú · 6 días / 5 noches','$ 5.900.000','Cupos: 8 / 20 · Machu Picchu','mountain'),
 ('París Romántico','Francia · 7 días / 6 noches','$ 11.450.000','Cupos: 6 / 24 · City tour','building');

insert into reservas (codigo, cliente, paquete, pax, fecha_viaje, asesor, tono, estado) values
 ('#RS-20841','María Restrepo','Cancún Paraíso',2,'2026-10-12','Samuel P.','ok','Confirmada'),
 ('#RS-20840','Carlos Gómez','Madrid Imperial',1,'2026-11-03','Juan J.','warn','Pago parcial'),
 ('#RS-20839','Laura Muñoz','San Andrés Mar',3,'2026-10-01','Andrés M.','ok','Confirmada'),
 ('#RS-20838','Andrés Vélez','Orlando Familiar',4,'2026-12-20','Samuel P.','info','En proceso'),
 ('#RS-20837','Sofía Álvarez','Cusco Ancestral',2,'2026-10-28','Juan J.','bad','Pendiente');

insert into pagos (recibo, reserva, cliente, metodo, valor, fecha, tono, estado) values
 ('#PG-9912','#RS-20841','María Restrepo','Tarjeta crédito','$ 6.480.000','2026-09-23','ok','Pagado'),
 ('#PG-9911','#RS-20840','Carlos Gómez','Transferencia','$ 4.500.000','2026-09-23','warn','Abono 50%'),
 ('#PG-9910','#RS-20839','Laura Muñoz','PSE','$ 2.750.000','2026-09-22','ok','Pagado'),
 ('#PG-9909','#RS-20837','Sofía Álvarez','Efectivo','$ 1.000.000','2026-09-22','warn','Abono');

insert into facturas (factura, cliente, nit, reserva, valor, fecha, tono, estado) values
 ('FE-004821','María Restrepo','43.118.902','#RS-20841','$ 6.480.000','2026-09-23','ok','Aceptada'),
 ('FE-004820','Laura Muñoz','1.017.554.210','#RS-20839','$ 2.750.000','2026-09-22','ok','Aceptada'),
 ('FE-004819','Carlos Gómez','71.204.663','#RS-20840','$ 4.500.000','2026-09-23','info','Enviada'),
 ('FE-004818','Viajes Corp S.A.S','900.552.118-4','#RS-20835','$ 22.900.000','2026-09-21','warn','Por validar');

insert into proveedores (nombre, tipo, contacto, convenio, tono, estado) values
 ('Avianca','Aerolínea','ventas@avianca.com','Comisión 8%','ok','Activo'),
 ('Decameron','Hotelería','corporativo@decameron.com','Tarifa neta','ok','Activo'),
 ('LATAM Airlines','Aerolínea','b2b@latam.com','Comisión 6%','ok','Activo'),
 ('Meliá Hotels','Hotelería','reservas@melia.com','Cupo garantizado','warn','En revisión'),
 ('ExpediTours','Operador terrestre','ops@expeditours.com','Por servicio','info','Nuevo');

-- ------------------------- Seguridad (RLS) -------------------------
-- Demo académica: se permite lectura/escritura con la clave anón pública.
-- (En producción se restringiría por usuario autenticado.)
do $$
declare t text;
begin
  foreach t in array array['clientes','paquetes','reservas','pagos','facturas','proveedores']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "demo_all" on %I;', t);
    execute format('create policy "demo_all" on %I for all to anon using (true) with check (true);', t);
  end loop;
end $$;
