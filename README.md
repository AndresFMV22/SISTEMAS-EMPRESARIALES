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

## Tabla de contenido

- [Descripción](#descripción)
- [Documentación y continuación](#documentación-y-continuación)
- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Puesta en marcha](#puesta-en-marcha)
- [Configurar la base de datos (Supabase)](#configurar-la-base-de-datos-supabase)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Scripts disponibles](#scripts-disponibles)
- [Despliegue](#despliegue)
- [Autores](#autores)

---

## Descripción

NóvaTravel centraliza en una sola plataforma la operación de una agencia de viajes,
reemplazando el manejo disperso en hojas de cálculo, cuadernos y chats. Reduce errores,
agiliza la consulta de disponibilidad y mejora la atención al cliente con procesos
organizados: registro de clientes, catálogo de paquetes, reservas, pagos, documentos
internos y control de proveedores y personal.

La aplicación es un **SPA (Single Page Application)** que funciona de dos maneras:

- **Con Supabase** — datos reales persistentes en PostgreSQL.
- **Sin configurar** — arranca con una muestra reducida de datos de demostración,
  ideal para probar o presentar sin instalar nada. Un indicador en la barra superior
  muestra en qué modo está (**Base de datos** / **Datos demo**).

> **Acceso:** con Supabase, usa una cuenta real habilitada por rol. Sin configuración,
> el botón **Explorar demostración** abre el panel administrativo con datos en memoria.

---

## Funcionalidades

| Módulo | Qué hace |
|--------|----------|
| **Login** | Supabase Auth, recuperación de contraseña y entrada según rol administrador o asesor. |
| **Resumen** | Indicadores de registros actuales, gráfico de pagos por mes, paquetes más reservados y **filtro de reservas por rango de fechas**. |
| **Clientes** | Alta de clientes y, en lugar de borrar, **activar/desactivar** con **observaciones y vigencia (rango de fechas)** para no perder información valiosa. |
| **Empleados** | Gestión del personal con la misma lógica de **activo/inactivo + observaciones** (útil ante retiros o despidos sin perder el histórico). |
| **Paquetes turísticos** | Creación y edición de información, destino, incluidos y condiciones con al menos un proveedor. Catálogo compartido con fechas, duración, cupos, estados y viajes finalizados ocultos conservando el historial. |
| **Reservas** | Creación compartida con factura automática y cupos transaccionales. Estado de reserva (**Pendiente, Confirmada, Finalizada, Cancelada**) separado del estado de pago. |
| **Promociones** | Ofertas opcionales por paquete, porcentaje o monto por reserva, condiciones de pasajeros y recotización con aceptación del cliente. Migración aplicada; reglas en [`docs/FASE_4.md`](docs/FASE_4.md). |
| **Pagos** | Flujo de pago con **total, abonado y saldo**; permite **abonos parciales** y **valida que no se pague más que el saldo pendiente**. |
| **Facturación interna** | Documentos ligados a reservas; sin integración DIAN. Falta unificar etiquetas heredadas y cerrar consulta/impresión según [`docs/PENDIENTES.md`](docs/PENDIENTES.md). |
| **Proveedores** | Búsqueda, alta/edición, activación e inactivación, contacto y convenio internos y paquetes/servicios relacionados. |
| **Reportes** | Pagos registrados, reservas por asesor y distribución por tipo de viaje calculados desde los registros. |

### Experiencia de usuario

- **Modo claro / oscuro** con un clic (recuerda la preferencia).
- **Multi-idioma**: Español, English, Français, Русский, Português.
- **Banner de cookies** y **políticas de privacidad y de cookies**.
- **Menús desplegables** que se autocompletan con los clientes, paquetes y reservas existentes para agilizar el registro.
- **Efectos visuales** estilo [React Bits](https://reactbits.dev): *Cuadricula*, *TarjetaIluminada*, *TextoBrillante*, *TextoDegradado*, *ChispasAlClic*, *ContadorAnimado* y *BordeBrillante*.
- **Responsive** (escritorio, tablet y móvil).

---

## Tecnologías

| Capa | Herramientas |
|------|--------------|
| **Frontend** | React 19 · Vite · JavaScript (JSX) |
| **Estilos** | Tailwind CSS v4 · shadcn/ui (Radix UI) |
| **Animación** | Framer Motion · componentes estilo React Bits |
| **Íconos** | lucide-react |
| **Backend / BD** | Supabase (PostgreSQL + Row Level Security) |
| **i18n** | Diccionario propio con React Context (sin dependencias) |

---

## Puesta en marcha

Requisitos: **Node.js 22+** compatible con las dependencias y **npm**.

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local      # luego completa la clave de Supabase

# 3. Arrancar en desarrollo
npm run dev
```

Abre **http://localhost:5173** e ingresa con el correo y la contraseña de tu cuenta
habilitada. La preparación del primer administrador se describe en
[`docs/DESPLIEGUE_ACCESOS.md`](docs/DESPLIEGUE_ACCESOS.md).

> Si no configuras Supabase, la app igual arranca con **datos de demostración**.

### Panel del asesor

Incluye resumen, clientes e historial, catálogo de consulta, reservas propias y
compartidas, abonos, comprobantes internos, observaciones, solicitudes y cuenta.
Solo el responsable opera su reserva; el administrador atiende solicitudes y
reasigna desde **Reservas → Gestión de reservas**. Las reservas nuevas del asesor
guardan precio por persona, total y cupos en operaciones transaccionales.

Las migraciones hasta fase 4 ya están aplicadas en el proyecto actual; no repetirlas
ni ejecutar el esquema base como actualización. Para otra instalación, consultar
[`docs/CONTEXTO_ACTUAL.md`](docs/CONTEXTO_ACTUAL.md) y las guías de fase.
El panel administrativo conserva las operaciones históricas.

---

## Configurar la base de datos (Supabase)

**Proyecto actual:** las migraciones hasta fase 4 ya están aplicadas. No ejecutar
estos pasos de instalación sobre ese entorno. Para su estado y continuación,
consultar [`docs/CONTEXTO_ACTUAL.md`](docs/CONTEXTO_ACTUAL.md).

Los pasos siguientes son para una instalación nueva; el esquema base por sí solo
no prepara autenticación y permisos de producción. Aplicar después las migraciones
en el orden documentado y configurar accesos antes de publicar.

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor → New query**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea las tablas, carga una **muestra pequeña de registros** y habilita
   las políticas de acceso (RLS).
3. En **Project Settings → API** copia la **Project URL** y la **anon/publishable key**
   a tu archivo `.env.local` (ver abajo).
4. Reinicia `npm run dev`. La barra superior debe mostrar **"Base de datos"** (verde).

**Tablas:** `clientes` · `paquetes` · `reservas` · `pagos` · `facturas` · `proveedores` · `empleados`

> El esquema contiene registros de muestra. No utilizarlo como mecanismo de
> actualización de un entorno activo; las actualizaciones se realizan mediante
> migraciones incrementales revisadas.

---

## Variables de entorno

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

## Estructura del proyecto

```
agencia-viajes-app/
├─ docs/                       # fases, UI, contexto vigente y guía de pendientes
├─ public/
│  └─ logo-mark.png            # logo de la marca
├─ src/
│  ├─ App.jsx                  # composición general, fondo, tema y acceso por rol
│  ├─ index.css                # tema (tokens claro/oscuro) y estilos de efectos
│  ├─ vistas/
│  │  ├─ administrador/        # panel, resumen, clientes, empleados, reservas y finanzas
│  │  └─ asesor/               # panel, resumen, clientes, reservas, pagos y cuenta
│  ├─ components/
│  │  ├─ administrador/        # formularios, tablas y gestión exclusivos del administrador
│  │  ├─ compartidos/          # panel, catálogo, creación/detalle de reserva, dinero y controles
│  │  ├─ autenticacion/        # entrada, recuperación y validación de sesión
│  │  ├─ ui/                   # componentes shadcn/ui (button, card, table, dialog, select...)
│  │  └─ reactbits/            # efectos: Cuadricula, TarjetaIluminada, TextoBrillante,
│  │                           #          TextoDegradado, ChispasAlClic, ContadorAnimado, BordeBrillante
│  ├─ hooks/                   # useAsesor, useTema y useFechaColombia
│  └─ lib/
│     ├─ supabase.js           # cliente de Supabase
│     ├─ db.js                 # consultas, inserciones y actualizaciones
│     ├─ asesor.js             # operaciones directas del asesor en Supabase
│     ├─ demoData.js           # datos del modo demostración explícito
│     └─ i18n.jsx              # traducciones y contexto de idioma
├─ supabase/
│  └─ schema.sql               # esquema + datos de ejemplo + políticas RLS
└─ .env.example                # plantilla de variables de entorno
```

Las vistas reciben datos y acciones del panel de su rol. Los componentes privados
se guardan bajo ese rol y las piezas utilizadas por ambos viven en `compartidos`.
Esta organización no añade capas de repositorios ni cambia las operaciones de BD.

Los estados se presentan con `components/compartidos/IndicadorEstado.jsx`, usando
la paleta común de `lib/estados.js` y conservando siempre su texto. Los componentes
nuevos deben reutilizarla para evitar colores contradictorios o estados en texto plano.

La creación de reservas y los abonos ya utilizan un flujo protegido común para
administrador y asesor. La actualización incremental, fechas/duración y estados
se detallan en [`docs/FASES_1_2.md`](docs/FASES_1_2.md). Se debe aplicar su migración nueva
antes de utilizar esas operaciones en una instalación nueva. En el proyecto actual
ya quedó aplicada y verificada; no debe ejecutarse dos veces.

La fase 3 completa paquetes y proveedores y guarda la información comercial de las
reservas nuevas para conservar lo contratado. Su migración también está aplicada
en el proyecto actual. El alcance, la compatibilidad con históricos y las pruebas
se describen en [`docs/FASE_3.md`](docs/FASE_3.md).

La fase 4 incorpora promociones opcionales y recotización con confirmación de
aceptación del cliente. Su migración **ya está aplicada y verificada** en el
proyecto actual. Véase [`docs/FASE_4.md`](docs/FASE_4.md) para reglas, pruebas y
alcance de la verificación remota.

## Documentación y continuación

Todo el contexto técnico está en [`docs/`](docs/README.md). Para otro integrante:

1. Leer [`docs/CONTEXTO_ACTUAL.md`](docs/CONTEXTO_ACTUAL.md): estado real, reglas,
   estructura, migraciones aplicadas y evidencia.
2. Seguir [`docs/PENDIENTES.md`](docs/PENDIENTES.md): facturación interna, reportes,
   cierre de interfaz, pruebas reales y publicación, con criterios de terminación.

La entrega **«Completar reservas, catálogo y promociones y documentar el relevo»**,
posterior a `39d262c`, reúne las fases 1–4 y esta documentación. El compañero debe
obtener esa versión antes de continuar. El proyecto remoto no tiene historial CLI
de migraciones; no usar `db push` a ciegas ni repetir SQL aplicado.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila la versión de producción en `dist/` |
| `npm run preview` | Previsualiza localmente el build de producción |
| `npm run lint` | Ejecuta el linter |

---

## Despliegue

El proyecto es un sitio estático; se puede desplegar en **Vercel**, **Netlify** o **GitHub Pages**:

1. Build: `npm run build` (genera `dist/`).
2. En el proveedor, configura las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Publica la carpeta `dist/`.

En Vercel/Netlify basta con conectar el repositorio; detectan Vite automáticamente
(*build command*: `npm run build`, *output*: `dist`).

---

## Autores

- **Samuel Parra Cadavid**
- **Juan José García Duque**
- **Andrés Felipe Martínez Velásquez**

<div align="center">

Hecho para la asignatura **Sistemas Empresariales** · Semestre 6 · UPB Medellín · 2026

</div>
