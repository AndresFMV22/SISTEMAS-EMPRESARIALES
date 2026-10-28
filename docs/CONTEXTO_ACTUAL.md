# Contexto actual y relevo de NóvaTravel

Fecha de corte: **28 de octubre de 2026**. Este documento permite continuar sin
depender del chat. Siguiente trabajo: [PENDIENTES.md](PENDIENTES.md).

## 1. Objetivo y alcance

CRM de una agencia de viajes: clientes, paquetes, proveedores, reservas,
promociones, pagos, documentos internos y reportes. Roles operativos actuales:
**administrador y asesor**. Se contrastó el código con la propuesta local
`2026-20 - SE-Formulación de Propuesta.docx`. Los clientes son beneficiarios de
la atención; el documento no impone por sí solo un portal de clientes.

Facturación interna no equivale a integración DIAN, registrar pagos no equivale
a cobrarlos por pasarela y registrar proveedores no reserva servicios externos.
Las decisiones de ampliación están separadas de los faltantes en la guía de pendientes.

## 2. Entrega del código al compañero

- Repo: `https://github.com/AndresFMV22/VIAJES-CRM.git`; rama `main`.
- Commit base anterior a esta entrega: `39d262c` — `vista asesor y estructuracion de carpetas`.
- Esta entrega reúne fases 1–4, colores y documentación bajo el mensaje
  **«Completar reservas, catálogo y promociones y documentar el relevo»**.
  El compañero debe obtener la versión que incluya ese commit, no solo la base
  anterior. Consultar `git log` y revisar `git status` antes de continuar.
- Hay cambios locales previos en `package-lock.json`
  y `supabase/functions/gestionar-accesos/index.ts`: revisar antes de incluirlos
  o reemplazarlos. La función tenía dos líneas con espacios finales.
- El DOCX y el HTML de presentación locales no se incorporaron a Git; aquí se
  resume el alcance relevante.

## 3. Tecnología y arranque

React 19, Vite 8, JavaScript/JSX, Tailwind 4, Base UI/shadcn, Framer Motion,
Supabase Auth/PostgreSQL y una Edge Function de accesos. Sin servidor adicional.
Usar Node.js 22 o posterior compatible con las dependencias.

```sh
npm install
npm run dev
npm run build
npm run lint
```

Crear `.env.local` a partir de `.env.example`; solicitar al responsable la URL y
clave pública por un canal privado: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Nunca poner `service_role` en Vite. Sin configuración existe **Explorar
demostración**, con datos en memoria y sin credenciales fijas. Un error conectado
no debe convertirse en datos demo ni éxito simulado.

## 4. Implementado

| Área | Estado |
| --- | --- |
| Acceso | Login, restauración, logout, recuperación, activación y revalidación de perfil por rol. |
| Empleados | Estado laboral separado del acceso; invitar, reenviar, suspender, reactivar y recuperar asesores. Administradores se provisionan externamente. |
| Clientes | Registro, consulta/historial compartido, contacto y gestión administrativa de activo/inactivo/observaciones. |
| Catálogo | Descripción, destino, fechas/duración, cupos, incluidos/no incluidos, condiciones y servicios/proveedores. |
| Proveedores | Alta/edición, estado, contacto/convenio internos y relaciones publicables al asesor. |
| Reservas | Creación común de ambos roles, responsable, precio/fechas pactados, cupos y factura interna transaccionales. |
| Asesor | Resumen, clientes, catálogo, reservas propias/compartidas, abonos, constancia visible, observaciones, solicitudes y cuenta. |
| Admin | Bandeja de solicitudes, resolución, reasignación y estados de reserva. |
| Pagos | Abonos COP, saldo, sobrepago bloqueado, propiedad/rol en BD y estado de pago independiente. |
| Promociones | Gestión, selección opcional, porcentaje/monto por reserva, condición de pasajeros y reglas guardadas. |
| Cambios | Recotización, aceptación registrada, conservar/sustituir promoción y bloqueo si requiere reembolso. |
| Reportes | Indicadores, pagos por mes, paquetes más reservados y reservas por asesor; falta el cierre de filtros/precisión. |
| UI | Claro/oscuro, cinco idiomas, responsive, cuadrícula, sidebar y colores comunes. Quedan textos heredados. |

La pantalla de facturas todavía usa «DIAN», «Valor + IVA» y «Enviada» sin
integración fiscal. El detalle de reserva sí identifica su constancia como interna.
Unificar ese módulo es el primer bloque funcional pendiente.

## 5. Reglas acordadas que se deben conservar

### Código y presentación

- Código propio, componentes, funciones, parámetros y explicaciones en español;
  respetar APIs externas y prefijo `use`.
- React → funciones directas Supabase + hooks/componentes compartidos. Sin
  repositorios, fábricas, capas genéricas o clases nuevas para estos flujos.
- Conservar fondo cuadrícula: se rechazó el mapa. Sidebar fijo y perfil/logout
  abajo, con adaptación móvil.
- COP `$ 9.000.000`; cálculos con números, no strings formateados.
- Texto y color por estado, centralizados en `src/lib/estados.js` e
  `IndicadorEstado.jsx`. No depender solo del color.
- Esperar persistencia, refrescar y bloquear doble clic; mostrar errores. Corte
  de red: revisar lo registrado antes de repetir; no hay idempotencia de transporte.

### Operación e históricos

- Asesor lee historial compartido, opera solo propias. Admin elige responsable
  activo o se asigna. BD valida permisos, cupos, fechas y saldo.
- «Pendiente de confirmación» es estado de reserva, no deuda. Pagar no confirma
  ni finaliza automáticamente; estado de pago independiente.
- Editar catálogo no recalcula ventas previas. Solo pasajeros conserva precio
  por persona y contenido pactados. Otro paquete sustituye contenido contratado.
- No deducir IDs por nombres ni inventar snapshots de ventas antiguas. Conservar
  total histórico fiable y mostrar desconocidos para revisión.
- Finalizados ocultos del catálogo sin borrar. Duración calendario: 1–3 de
  noviembre = 3 días/2 noches. Cancelar no genera devolución automática.

### Promociones

- Opcional: «Sin promoción» o una sola. Porcentaje entero 1–99 o monto COP por
  toda la reserva; total positivo, redondeo al peso en servidor.
- Condición cualquiera/exactamente N/mínimo N sobre todos los pasajeros; sin
  parejas parciales ni 2×1 implícito. Vigencia inclusiva por día Colombia al reservar.
- Mismo paquete conserva reglas contratadas incluso vencidas/editadas; recalcula
  para la cantidad nueva, pierde beneficio si incumple y puede recuperarlo si
  otro cambio vuelve a cumplir. Elegir sin oferta u otra sustituye esas reglas.
- Otro paquete no hereda oferta: elegir vigente del destino o ninguna.
- Admin registra que el cliente aceptó; no es firma/aceptación directa del cliente.
- Cotización obsoleta, incluso por abono posterior, exige revisar otra vez.
  Total menor a abonado queda bloqueado: reembolsos no implementados.

## 6. Supabase: estado real

Proyecto `oxhmsntqqaknwhskzmjs`. Migraciones en `supabase/migrations/`, **ya aplicadas**:

1. `20261022233614_accesos_protegidos.sql`
2. `20261024011048_operacion_asesor_simple.sql`
3. `20261027231413_unificar_reservas_fases_1_2.sql`
4. `20261028001132_catalogo_paquetes_proveedores_fase_3.sql`
5. `20261028034043_promociones_cotizaciones_fase_4.sql`

No repetir ni editar una aplicada para modificar el remoto. Correcciones nuevas:
migración incremental y autorización para aplicarla. No usar `schema.sql` como
actualización: contiene DDL e inserciones de muestra.

**No existe `supabase_migrations.schema_migrations` en este entorno.** Las
migraciones se ejecutaron por SQL directo. No usar `db push` a ciegas ni interpretar
la falta de historial CLI como falta de esquema. Antes de adoptar ese flujo,
conciliar archivos/objetos reales y acordar una línea base; este relevo no la creó.

Fase 4 aplicada con autorización el 28/10/2026. Verificados seis RPC, grants,
helpers privados, dos tablas con RLS y cuatro triggers. Lecturas con contexto SQL
de admin y asesor activas, acceso administrativo denegado al asesor. Huellas
idénticas antes/después en las once tablas anteriores:

| Tabla | Cantidad al corte |
| --- | ---: |
| clientes | 8 |
| empleados | 4 |
| perfiles | 2 |
| paquetes | 11 |
| proveedores | 7 |
| paquete_servicios | 0 |
| reservas | 11 |
| pagos | 11 |
| facturas | 8 |
| observaciones_reserva | 3 |
| solicitudes_reserva | 1 |

No imponer esas cantidades mediante borrados/fixtures: son evidencia del corte.
`promociones` y `promocion_paquetes` están vacías. No se inventaron servicios,
contratos, aceptaciones ni ventas de prueba. Una demostración de venta nueva
requiere un paquete futuro válido y datos autorizados en un entorno de pruebas.

CLI confirmó `gestionar-accesos` **ACTIVE v3**, actualizada 23/10/2026 01:28:23 UTC.
Prueba su existencia, no coincidencia exacta con la copia local ni SMTP/CORS/callbacks.
Security Advisors: sin errores, 15 avisos por RPC `SECURITY DEFINER` accesibles a
autenticados y uno por protección de contraseñas filtradas deshabilitada. Las RPC
tienen guards internos; no revocarlas indiscriminadamente. No se cambió Auth.

## 7. Mapa de código y contratos

| Ruta desde raíz | Responsabilidad |
| --- | --- |
| `src/App.jsx` | Composición, fondo, controles y acceso por rol. |
| `src/vistas/administrador/`, `src/vistas/asesor/` | Pantallas por rol. |
| `src/components/administrador/` | Editores y gestión exclusivos admin. |
| `src/components/compartidos/` | Catálogo, formulario/detalle de reserva, precio, dinero y estados. |
| `src/components/autenticacion/PuertaAcceso.jsx` | Sesión/perfil, recuperación y demo. |
| `src/lib/autenticacion.js` | Auth/acceso; no autorizar por metadata del usuario. |
| `src/lib/asesor.js` | Lectura, clientes, reserva, pagos, observaciones y solicitudes. |
| `src/lib/catalogo.js`, `src/lib/promociones.js` | RPC de catálogo/promociones. |
| `src/lib/db.js` | Arreglos legacy admin; metadata de reserva en índice 8. Conservar posiciones anteriores. |
| `src/hooks/useAsesor.js`, `useCatalogoAdministrativo.js` | Lectura/recarga/sincronización. |
| `src/hooks/useCotizacion.js` | Cotización asíncrona e invalidación de respuestas anteriores. |
| `src/lib/dinero.js`, `paquetes.js`, `estados.js`, `i18n.jsx` | Importes, fechas/cupos, colores e idiomas. |
| `supabase/functions/gestionar-accesos/` | Acciones privilegiadas de cuentas y validación propia de identidad. |

RPC clave: `obtener_perfil`, `listar_accesos`, `datos_asesor`, `operar_asesor`,
`registrar_abono_reserva`, `catalogo_administrativo`, `guardar_paquete`,
`guardar_proveedor`, `datos_promociones`, `guardar_promocion`, `cotizar_reserva`,
`crear_reserva_promocion`, `cotizar_cambio`, `resolver_solicitud_precio`.
UI nueva usa cotizaciones de fase 4; creación anterior permanece compatible sin ofertas.

## 8. Evidencia y límites

- Build/lint correctos; avisos existentes de bundle, `__dirname`, Fast Refresh y efectos.
- PGlite local: permisos/RLS, transacciones, fechas/cupos, abonos, históricos,
  snapshots, ofertas, aceptación, cotización obsoleta y rollback.
- Playwright/MS Edge con API simulada: ambos roles, formularios, errores, acceso,
  móvil, demo y promociones. No es evidencia de SMTP/PostgREST real.
- Remoto: esquema, permisos, huellas y lecturas SQL por rol. No se certificaron
  ventas reales, concurrencia multi-sesión ni despliegue del frontend actual.

Los harness son temporales **fuera de Git**, en la máquina de origen:
`C:\Users\USER\AppData\Local\Temp\opencode\`. Nombres relevantes:
`verificar-fase4.mjs`, `verificar_fase4_ui.py`, `verificar-fase3.mjs`,
`verificar_fase3_ui.py`, `verificar-fases12.mjs`, `verificar_fases12_ui.py`,
`verificar_ui_asesor.py`, `huellas-fase4.sql`, `verificar-remoto-fase4.sql`.
No asumir que existen en el equipo del compañero. Solicitar artefactos aparte o
recrear la matriz de pendientes. No añadir tests permanentes sin acuerdo del equipo.

## 9. Archivos locales y secretos

No publicar `.env*` con valores reales, tokens, contraseñas, claves privilegiadas,
`.opencode/`, `.agents/`, `skills-lock.json`, temporales, `node_modules/`, `dist/`
ni documentos personales/locales. Conservar `.env.example` pública sin credenciales.
Los agentes/herramientas locales no son dependencias de la aplicación.

**Continuar:** sincronizar el código con el compañero, cerrar facturación interna,
después reportes y verificaciones de entorno. No rehacer fases 1–4 desde cero.
