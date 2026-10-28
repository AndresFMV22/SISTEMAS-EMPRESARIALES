# Auditoría de integración de accesos

> Auditoría histórica; conserva hallazgos y evidencias de aquella versión.
> El panel del asesor y las transacciones comunes ya se implementaron después.
> Las migraciones hasta fase 4 están aplicadas. Consultar [CONTEXTO_ACTUAL.md](CONTEXTO_ACTUAL.md)
> y [PENDIENTES.md](PENDIENTES.md) antes de convertir un hallazgo antiguo en tarea.

## Cierre de revisión de interfaz

La revisión posterior de `@interfaz` cerró localmente la parte UI de H2 y los
hallazgos H4/H5. Probó suspensión sin correo, respuestas de sesión/perfil fuera
de orden, enlaces vencidos con sesión previa e identificación y confirmación
del correo destino. Los escenarios se ejecutaron en Chromium con API simulada
y tráfico externo bloqueado; sus evidencias están en `UI_ACCESOS.md`.
Las secciones inferiores describen el hallazgo original y la revisión backend;
sus referencias de línea pueden corresponder a la versión anterior a la corrección.
Sigue pendiente validar el despliegue con Supabase Auth y SMTP reales.

Revisión local de `PuertaAcceso.jsx`, `GestionAccesosEmpleados.jsx`, sus llamadas
en `App.jsx`, contrato de autenticación, SQL y Edge Function. No se editó UI,
no se ejecutaron operaciones remotas ni se reprodujo navegación en esta revisión.
El informe `UI_ACCESOS.md` del agente UI describe sus pruebas con API simulada;
no se consideran prueba de Supabase desplegado.

## Corregido: esquema base podía reinstalar acceso demo (crítico)

`supabase/schema.sql`, bloque final: antes recreaba siempre `demo_all`. Ahora
detecta `public.perfiles`, `privado.provisiones_acceso`, `obtener_perfil()` o la
migración registrada en `supabase_migrations.schema_migrations`. Con cualquiera
de esas evidencias elimina el residuo demo y revoca privilegios PUBLIC/anon en
las siete tablas CRM, conservando políticas autenticadas. Sin ellas conserva la
instalación demo inicial. No reemplaza una migración ni modifica datos reales.

Prueba PostgreSQL local: instalación inicial, reejecución dos veces después de
migrar, política/grant demo residual introducido deliberadamente, perfiles
parciales e historial de migración sin perfiles. Se comprueban las políticas
autenticadas, datos conservados y denegación efectiva a anon. No usar copias
antiguas del instalador ni reejecutarlo como rutina de producción: incluye muestras.

## Hallazgos backend cerrados localmente

Por confirmación expresa del responsable, la migración **todavía no se desplegó**.
Se ajustó directamente `20261022233614_accesos_protegidos.sql` antes de su primera
aplicación. No se debe editar así una migración que ya esté aplicada; en tal caso
haría falta otra incremental. El contrato de frontend permanece igual y no se
editó UI. Cerrado localmente no significa aplicado o probado en Supabase remoto.

### H1 — ID y atribución protegidos (cerrado)

`privado.proteger_propiedad` ahora rechaza cambios de `id` en reservas y pagos
para todos los roles, incluyendo el caso `SET id=DEFAULT`. No depende de que
existan referencias FK. RLS sigue restringiendo filas propias.

Al insertar como asesor, `atribuir_reserva_asesor` deriva `asesor` del nombre del
empleado ligado al perfil activo, ignorando cualquier atribución enviada. El
helper mínimo privado solo devuelve el nombre del propio asesor autenticado;
no le concede SELECT sobre empleados. Al actualizar, no puede cambiar atribución,
empleado ni código. El administrador conserva su facultad de asignar reservas y
corregir textos históricos, pero tampoco puede regenerar los IDs.

En pagos, reserva y cliente se derivan de la reserva propia; no se puede cambiar
reserva_id/recibo ni el ID. Un cliente textual enviado arbitrariamente no persiste.
Las pruebas regresivas comprueban rechazo de `DEFAULT` en ambas tablas para admin
y asesor, atribución derivada, intento de suplantación y relación de pago ajena.

La lógica financiera completa de la entrega 3 sigue fuera de alcance: importes,
estados y fechas conservan el contrato de negocio actual. No se sustituye la
protección por un REVOKE de columna que dejaría vigente el GRANT de tabla.

### H2 — Suspensión independiente del correo (backend cerrado; integración UI pendiente)

`preparar_acceso` suspende después de validar al administrador y localizar/bloquear
al empleado y su perfil asesor, **antes** de validar correo o exigir empleado
activo. Conserva la reserva anterior e invalida su token. Si no hay cuenta ni
reserva, crea una marca durable de suspensión sin correo ni identidad inventada;
solo admite NULL sin token y en estado suspendido. No crea perfil ni cuenta Auth.

La Edge Function ignora `correo` para suspender y no necesita una URL de correo
válida ni llama a SMTP. Las otras acciones conservan sus validaciones. Una marca
sin correo solo se completa con un correo válido durante la reactivación explícita.

Regresión SQL: correos cambiado, vacío, inválido o NULL; empleado inactivo;
restauración posterior de correo/empleado sin recuperación de acceso; suspensión
antes de tener cuenta y ciclo reactivar/invitar. Regresión Edge: `correo` ausente,
vacío, inválido o de otro tipo se ignora y nunca se usa para enviar correo.

**Pendiente exclusivo del agente UI:** retirar la dependencia de correo para
habilitar el botón suspender en `GestionAccesosEmpleados.jsx:83` si aún permanece.
El backend no impone esa restricción. No se editó ese componente.

### H3 — Reintento same_password con prueba de credenciales (cerrado)

La función primero valida el JWT real con `getUser` y el perfil no suspendido.
Tras un PUT rechazado **solo** reconoce `422` con código `same_password`;
cualquier otro error sigue denegado. No acepta ese código como autorización.
Los fetch directos a Auth fijan `X-Supabase-Api-Version: 2024-01-01`, igual que
auth-js, para utilizar códigos de error estructurados y no interpretar mensajes.

Verifica la contraseña mediante Auth `/token?grant_type=password`, con clave
pública y correo obtenido de la identidad validada, nunca del cuerpo del cliente.
Exige respuesta exitosa, token y usuario no anónimo con el mismo UUID y correo.
Revoca exclusivamente la sesión temporal con `logout?scope=local` antes de activar;
no persiste ni expone sus tokens ni cierra las otras sesiones del usuario. Si la
verificación o su cierre falla, no activa.

Solo entonces vuelve a llamar `activar_acceso`, que conserva las comprobaciones
actuales en BD de perfil, empleado, correo confirmado, identidad y suspensión.
Por tanto una contraseña correcta no elude una suspensión o inactivación
concurrente. La llamada mantiene `{estado_acceso:'activo'}` como respuesta de éxito.

Pruebas HTTP simuladas: fallo posterior al cambio y reintento válido; contraseña
incorrecta; otra identidad; usuario anónimo; falta de token; Auth caído; error de
cierre temporal; códigos de error diferentes y `same_password` con HTTP inesperado.
Se comprueba que en los casos rechazados no se llama a la RPC de activación.
La aceptación efectiva de credenciales/SMTP en Supabase real sigue pendiente.

Referencia oficial consultada:
https://supabase.com/docs/guides/auth/debugging/error-codes.md (`same_password`).

## Hallazgos de lectura estática, sin reproducción en navegador

### H4 — Error de revalidación anterior puede sobrescribir estado posterior (bajo)

`PuertaAcceso.jsx:43,47` descarta respuestas viejas mediante revisión, pero el
`catch` exterior de `revalidar` en líneas 54–56 vuelve a escribir estado sin
comprobar esa revisión. Si una revalidación falla después de que un evento Auth
nuevo haya validado otra sesión, puede retirar el perfil nuevo y mostrar un error
obsoleto. Es denegación visual, no autorización adicional. Recomendación al agente
UI: proteger también ese catch o evitar que duplique la escritura ya protegida
de `validarSesion`. Pendiente test de carrera en navegador.

### H5 — Marcador de contraseña más sesión no prueba que el enlace haya funcionado (bajo)

`PuertaAcceso.jsx:9–10,36–38,109` muestra contraseña con `flujo=contrasena` y
cualquier sesión actual; no muestra qué identidad recibirá el cambio ni examina
errores de callback explícitos. Si un enlace vencido conserva una sesión anterior,
puede ofrecer cambiar la contraseña de esa cuenta, no la esperada por el usuario.
El servidor siempre opera sobre el usuario real del JWT: no cambia otra cuenta
por correo ni concede rol por URL. Comprobar ese caso con Auth real y mostrar la
identidad antes del cambio; no considerar el marcador URL prueba de autorización.

## Integraciones correctas verificadas por lectura y pruebas backend

* `PuertaAcceso.jsx:41–48,98–115`: autoriza con perfil de BD, comprueba identidad y
  estado, monta panel solo a administrador. El asesor recibe bienvenida sin
  montar `PanelPrincipal` ni ejecutar su carga administrativa.
* `GestionAccesosEmpleados.jsx:27–30,59,75–83`: usa ID real de empleados, nunca el
  código de presentación como identidad; no ofrece gestionar administradores.
  Una llamada manual de asesor sigue denegada en servidor.
* Callback: soporta evento `PASSWORD_RECOVERY` y marcador persistente; permite
  contraseña con perfil invitado y solo retira marcador tras éxito de la función.
  El cliente existente es implícito. No hay intercambio PKCE implementado.
* Invitado: no obtiene CRM antes de activación. Solo el servicio puede activar,
  tras cambio de contraseña o reintento reautenticado usando JWT real. BD exige correo confirmado,
  contraseña existente, perfil no suspendido, coincidencia de correos y empleado
  activo. Una cuenta existente invitada puede aceptar autenticándose con sus
  credenciales; no se exige que su sesión proceda necesariamente del enlace.
* Recuperación pública no anuncia existencia ni reactiva perfiles suspendidos.
  Cambiar contraseña directamente mediante Auth tampoco cambia el estado CRM.
* Provisión: reserva previa a Auth, cuenta única por empleado, token temporal,
  comprobación repetida de admin/empleado y reconciliación de identidad existente.
  Reintentos, token viejo y suspensión durante provisión pasan pruebas SQL.
* La UI refresca accesos incluso si falla la operación (`Gestion...:64–67`),
  coherente con provisiones parciales. Correo aceptado no se presenta como entrega.

## Límites no atómicos y verificación pendiente, no nuevos bypass demostrados

* Auth puede crear/enviar invitación antes de completar la vinculación. Si el
  enlace se abre demasiado pronto no habrá perfil todavía; se debe completar o
  reenviar desde admin y reintentar. No se borra la cuenta para compensar el fallo.
* Un correo ya iniciado puede salir aunque otra petición suspenda la provisión;
  la vinculación/activación no debe recuperar acceso. SQL invalida el token y
  vuelve a comprobar estado. Pendiente concurrencia con Auth/SMTP real.
* Los formularios CRM admin aún insertan reserva/factura y pago/estados en pasos
  separados (`App.jsx:959–961,992–996`). Un fallo parcial puede dejar datos en BD
  sin reflejarse en memoria. Ya se muestran avisos; una recarga antes de reintentar
  es necesaria, no sustituye transacciones o claves de idempotencia futuras.
* La UI revalida por foco/evento/acción, no borra a distancia inmediatamente datos
  ya descargados cuando se suspende el perfil. RLS bloquea nuevas operaciones;
  no revoca contenido previamente mostrado ni cancela snapshots en curso.
* Faltan pruebas contra entorno autorizado: SMTP, URLs exactas, CORS, enlaces
  nuevos/existentes/vencidos/reutilizados, sesión previa de otra identidad,
  múltiples pestañas y revocación con JWT anterior mediante REST.

Las correcciones no cambian el contrato frontend. Se ajustó la migración pendiente
con autorización expresa, sin aplicarla. La protección del instalador solo existe
en esta versión del archivo; no se afirma haber reparado políticas de una BD remota.
