<div align="center">

<img src="public/logo-mark.png" alt="NóvaTravel" width="120" />

# NóvaTravel · CRM para Agencia de Viajes

**Sistema empresarial para la gestión integral de clientes, paquetes turísticos, reservas, pagos, facturación, proveedores y personal de una agencia de viajes.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
![Licencia](https://img.shields.io/badge/uso-acad%C3%A9mico-blue)

Proyecto de la asignatura **Sistemas Empresariales** · Semestre 6
Universidad Pontificia Bolivariana — Medellín, Colombia

</div>

---

## 📑 Tabla de contenido

- [Descripción](#-descripción)
- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#-tecnologías)
- [Puesta en marcha](#-puesta-en-marcha)
- [Configurar la base de datos (Supabase)](#-configurar-la-base-de-datos-supabase)
- [Variables de entorno](#-variables-de-entorno)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Scripts disponibles](#-scripts-disponibles)
- [Despliegue](#-despliegue)
- [Autores](#-autores)

---

## 📌 Descripción

NóvaTravel centraliza en una sola plataforma la operación de una agencia de viajes,
reemplazando el manejo disperso en hojas de cálculo, cuadernos y chats. Reduce errores,
agiliza la consulta de disponibilidad y mejora la atención al cliente con procesos
organizados: registro de clientes, catálogo de paquetes, reservas, pagos, facturación
electrónica y control de proveedores y personal.

La aplicación es un **SPA (Single Page Application)** que funciona de dos maneras:

- **Con Supabase** → datos reales persistentes en PostgreSQL.
- **Sin configurar** → arranca con datos de demostración (35+ registros por módulo),
  ideal para probar o presentar sin instalar nada. Un indicador en la barra superior
  muestra en qué modo está (**Base de datos** / **Datos demo**).

> **Acceso de demostración** — Usuario: `admin` · Contraseña: `agencia2026`

---

## ✨ Funcionalidades

| Módulo | Qué hace |
|--------|----------|
| 🔐 **Login** | Acceso interno con validación de credenciales. |
| 📊 **Dashboard** | KPIs animados, gráfico de ventas por mes, destinos más solicitados y **filtro de reservas por rango de fechas**. |
| 👤 **Clientes** | Alta de clientes y, en lugar de borrar, **activar/desactivar** con **observaciones y vigencia (rango de fechas)** para no perder información valiosa. |
| 👔 **Empleados** | Gestión del personal con la misma lógica de **activo/inactivo + observaciones** (útil ante retiros o despidos sin perder el histórico). |
| 🌴 **Paquetes turísticos** | Catálogo con precio, cupos, **fechas de salida y regreso** y **filtro por fecha de salida**. |
| 📅 **Reservas** | Al crear una reserva se **genera su factura automáticamente**; maneja estados **Pendiente → En proceso → Pagada**. |
| 💳 **Pagos** | Flujo de pago con **total, abonado y saldo**; permite **abonos parciales** y **valida que no se pague más que el saldo pendiente**. |
| 🧾 **Facturación** | Facturación electrónica ligada a cada reserva, con estados (*Por validar, Enviada, Aceptada*). |
| 🏢 **Proveedores** | Aerolíneas, hoteles y operadores con tipo, contacto y convenio. |
| 📈 **Reportes** | Indicadores de ventas por asesor y distribución por tipo de viaje. |

### Experiencia de usuario

- 🌓 **Modo claro / oscuro** con un clic (recuerda la preferencia).
- 🌍 **Multi-idioma**: Español, English, Français, Русский, Português.
- 🍪 **Banner de cookies** + **políticas de privacidad y de cookies**.
- 🎛️ **Menús desplegables** que se autocompletan con los clientes, paquetes y reservas existentes para agilizar el registro.
- 🎨 **Efectos visuales** estilo [React Bits](https://reactbits.dev): fondo *Squares*, *SpotlightCard*, *ShinyText*, *GradientText*, *ClickSpark*, *CountUp* y *StarBorder*.
- 📱 **Responsive** (escritorio, tablet y móvil).

---

## 🛠️ Tecnologías

| Capa | Herramientas |
|------|--------------|
| **Frontend** | React 19 · Vite · JavaScript (JSX) |
| **Estilos** | Tailwind CSS v4 · shadcn/ui (Radix UI) |
| **Animación** | Framer Motion · componentes estilo React Bits |
| **Íconos** | lucide-react |
| **Backend / BD** | Supabase (PostgreSQL + Row Level Security) |
| **i18n** | Diccionario propio con React Context (sin dependencias) |

---

## 🚀 Puesta en marcha

Requisitos: **Node.js 18+** y **npm**.

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local      # luego completa la clave de Supabase

# 3. Arrancar en desarrollo
npm run dev
```

Abre **http://localhost:5173** e ingresa con `admin` / `agencia2026`.

> Si no configuras Supabase, la app igual arranca con **datos de demostración**.

---

## 🗄️ Configurar la base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor → New query**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea las tablas, carga **35+ registros de ejemplo** por módulo y habilita
   las políticas de acceso (RLS).
3. En **Project Settings → API** copia la **Project URL** y la **anon/publishable key**
   a tu archivo `.env.local` (ver abajo).
4. Reinicia `npm run dev`. La barra superior debe mostrar **“Base de datos”** (verde).

**Tablas:** `clientes` · `paquetes` · `reservas` · `pagos` · `facturas` · `proveedores` · `empleados`

> El script hace `drop table ... cascade` antes de crear, así que puedes re-ejecutarlo
> las veces que quieras sin duplicar datos.

---

## 🔑 Variables de entorno

Crea `.env.local` (nunca se sube a Git) a partir de `.env.example`:

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto, p. ej. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clave pública *anon/publishable* del proyecto |

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

---

## 📂 Estructura del proyecto

```
agencia-viajes-app/
├─ public/
│  └─ logo-mark.png            # logo de la marca
├─ src/
│  ├─ App.jsx                  # UI principal: login, dashboard y todos los módulos
│  ├─ index.css                # tema (tokens claro/oscuro) y estilos de efectos
│  ├─ components/
│  │  ├─ ui/                   # componentes shadcn/ui (button, card, table, dialog, select…)
│  │  └─ reactbits/            # efectos: Squares, SpotlightCard, ShinyText,
│  │                           #          GradientText, ClickSpark, CountUp, StarBorder
│  └─ lib/
│     ├─ supabase.js           # cliente de Supabase
│     ├─ db.js                 # consultas, inserciones y actualizaciones
│     ├─ demoData.js           # datos de demostración (fallback)
│     └─ i18n.jsx              # traducciones y contexto de idioma
├─ supabase/
│  └─ schema.sql               # esquema + datos de ejemplo + políticas RLS
└─ .env.example                # plantilla de variables de entorno
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Previsualiza localmente el build de producción |
| `npm run lint` | Ejecuta el linter |

---

## ☁️ Despliegue

El proyecto es un sitio estático; se puede desplegar en **Vercel**, **Netlify** o **GitHub Pages**:

1. Build: `npm run build` (genera `dist/`).
2. En el proveedor, configura las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Publica la carpeta `dist/`.

En Vercel/Netlify basta con conectar el repositorio; detectan Vite automáticamente
(*build command*: `npm run build`, *output*: `dist`).

---

## 👥 Autores

- **Samuel Parra Cadavid**
- **Juan José García Duque**
- **Andrés Felipe Martínez Velásquez**

<div align="center">

Hecho para la asignatura **Sistemas Empresariales** · Semestre 6 · UPB Medellín · 2026

</div>
