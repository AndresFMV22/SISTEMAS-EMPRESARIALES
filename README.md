# NóvaTravel · Sistema Empresarial para Agencia de Viajes

Sistema empresarial para la gestión integral de clientes, paquetes turísticos,
reservas, pagos, facturación y proveedores de una agencia de viajes.

Proyecto de la asignatura **Sistemas Empresariales** — Semestre 6.
Autores: Samuel Parra Cadavid · Juan José García Duque · Andrés Felipe Martínez.

## Tecnologías

- **React + Vite**
- **Tailwind CSS v4** + **shadcn/ui**
- **framer-motion** (animaciones y microinteracciones)
- Componentes de fondo/efectos estilo **React Bits** (Squares, SpotlightCard, ShinyText, GradientText, ClickSpark, CountUp)
- **Supabase** (PostgreSQL) como base de datos

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y completa la clave anon/publishable de Supabase
npm run dev
```

Abre **http://localhost:5173**

Acceso interno de demostración:

- Usuario: `admin`
- Contraseña: `agencia2026`

## Base de datos (Supabase)

1. En el panel de Supabase, abre **SQL Editor → New query**.
2. Pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo.
   Esto crea las tablas (`clientes`, `paquetes`, `reservas`, `pagos`, `facturas`,
   `proveedores`), carga datos de ejemplo y habilita las políticas de acceso.
3. Copia **Project URL** y **anon/publishable key** (Project Settings → API) a `.env.local`:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

Si no hay credenciales configuradas, la aplicación funciona con datos de
demostración incluidos. El indicador en la barra superior muestra si está
conectada a la **base de datos** o usando **datos demo**.

## Estructura

```
src/
  App.jsx                 UI principal (login + dashboard + módulos)
  components/ui/          componentes shadcn/ui
  components/reactbits/   efectos y animaciones
  lib/supabase.js         cliente de Supabase
  lib/db.js               consultas e inserciones
supabase/schema.sql       esquema + datos de ejemplo
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run preview` — previsualizar el build
