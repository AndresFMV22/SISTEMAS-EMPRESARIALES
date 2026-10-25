# UI de autenticación y accesos — entregas 1 y 2

## Alcance implementado

- `src/components/autenticacion/PuertaAcceso.jsx`: correo y contraseña mediante el contrato de
  `autenticacion.js`, restauración por `INITIAL_SESSION`, validación de perfil,
  cierre de sesión y recuperación con respuesta no enumeradora.
- El panel existente solo se monta para un perfil administrador autorizado. Un
  asesor ve exclusivamente su bienvenida/cuenta y el cierre de sesión; no se
  ejecuta `obtenerEntidades()` ni la consulta de empleados para este rol.
- La autorización procede de `obtenerPerfil()`, no de metadata ni de un rol del
  almacenamiento local. Se comprueba además identidad, estado activo y rol
  permitido. El servidor valida el empleado activo y el resto de restricciones.
- Se vuelve a consultar sesión/perfil al recuperar el foco y antes de operaciones
  del panel. Las revalidaciones simultáneas se agrupan y las respuestas de perfil
  anteriores a un cambio de sesión se descartan, incluyendo los errores de lectura
  de sesión. Un fallo vigente retira el panel; uno obsoleto no sobrescribe una
  autorización posterior. No hay reintentos automáticos en bucle ni fallback
  conectado a demostración.
- `?flujo=contrasena` y `PASSWORD_RECOVERY` abren el formulario de contraseña con
  sesión, aunque el perfil todavía sea invitado. El evento conserva el marcador
  en la URL para soportar recarga. Sin sesión se ofrece solicitar otro enlace.
  El marcador por sí solo no prueba la validez de un enlace: se consulta la
  identidad mediante `supabase.auth.getUser()` (API pública, no privilegiada), se
  muestra su correo y se exige confirmar que esa es la cuenta que se quiere
  modificar. Justo antes del envío se vuelve a comprobar la identidad. Un cambio
  de UUID o correo cancela el envío. Un error explícito del callback en query o
  fragmento bloquea el cambio incluso con sesión anterior y ofrece recuperación;
  nunca se muestra el texto libre del error recibido en la URL.
  Se exigen 12–1024 caracteres y confirmación. La activación pasa exclusivamente
  por `establecerContrasena()`. Tras éxito se retira el marcador y se consulta el
  perfil. Un error de activación no se presenta como éxito y permite reintentar.
- Sin configuración de Supabase se ofrece una entrada explícita a demostración,
  sin credenciales fijas ni llamadas de autenticación/accesos. Las modificaciones
  demo viven en memoria y desaparecen al salir o recargar.

## Empleados y accesos

`src/components/administrador/GestionAccesosEmpleados.jsx` complementa la tabla existente con
estado del empleado y acceso al sistema separados. Consulta, solo dentro del
panel admin, `empleados.select('id,codigo,nombre,correo,activo')` y `listarAccesos()`.
El código permite ubicar la fila heredada, pero **nunca** se usa como
`empleado_id`: se envía el ID real de la consulta. Un ID numérico fuera del rango
entero seguro bloquea la acción en lugar de enviar una identidad truncada.

Estados: sin acceso, pendiente de vinculación, invitado pendiente de aceptación,
activo y suspendido. Registrar un empleado no crea una cuenta.

- Sin acceso: habilitar por correo, con confirmación explícita, o suspender para
  registrar una marca preventiva sin crear cuenta.
- Pendiente/invitado/activo: reenviar y suspender; recuperar cuando hay perfil
  vinculado. Suspendido: reactivar. El resultado de reactivar puede seguir siendo
  pendiente o invitado; no se fuerza a activo en la UI.
- Empleado inactivo: no se invita, envía correo ni reactiva. La suspensión no
  depende del estado laboral ni de un correo existente o válido: envía siempre
  `correo: null`, incluso para un empleado todavía sin cuenta. La validación
  definitiva corresponde al servidor.
- Un perfil administrador se identifica como gestión externa, sin controles para
  crearlo, cambiar su rol o administrarlo como si fuera asesor.
- Todas las acciones pasan por `gestionarAcceso()`, requieren confirmación y se
  bloquean durante la solicitud. No se solicita, genera ni muestra una contraseña
  de asesor desde el administrador.
- Se actualiza la consulta después del éxito **y del fallo**, porque puede existir
  provisión parcial. Un error mantiene el mensaje y permite actualizar/reintentar.
  Una solicitud de correo aceptada no se describe como entrega SMTP garantizada.

## Conservación del panel

Se mantienen módulos, navegación, formularios y diseño existentes. La carga
conectada empieza con entidades vacías, nunca con datos demo. Si falla, muestra
un error y requiere recargar para reintentar.

Las altas y cambios existentes ahora esperan la API antes de reflejarse en
memoria; los fallos se muestran en el formulario correspondiente. Reservas con
factura y pagos con actualización de estados siguen siendo operaciones separadas
del contrato heredado: se advierte un resultado parcial y se pide recargar antes
de reintentar para evitar duplicados. Esto no añade una transacción de servidor.
`actualizarFilas()` conserva su contrato sin devolver filas afectadas; no se ha
modificado `db.js` ni se promete una confirmación transaccional nueva.

Se corrigieron en `App.jsx` los triggers/cierres de diálogo que usaban `asChild`
(API incompatible con Base UI); ahora usan `render`, sin botones anidados. Se
conservan los cinco idiomas y las preferencias de idioma/tema. Los textos nuevos
de UI tienen traducción; los errores del contrato se muestran con su mensaje en
español, sin exponer `cause`, contraseñas o tokens.

## Verificación local (22 de octubre de 2026)

Chromium headless mediante Playwright instalado fuera del repositorio. Servidores
Vite aislados con variables de entorno de prueba; API simulada en localhost,
interceptación de red y bloqueo de cualquier destino externo. **No se enviaron
correos ni se modificó la BD remota.**

Comprobado en navegador:

- Login por correo, recuperación con mensaje genérico, restauración al recargar
  y cierre de sesión.
- Admin: lista de empleados con IDs distintos de los códigos; invitación, reenvío,
  suspensión, reactivación y recuperación. Botones deshabilitados con una petición
  retenida; fallo de función sin falso éxito, actualización posterior y reintento.
- Empleado inactivo sin invitación habilitada y administrador sin controles de
  gestión de asesor.
- Revalidación por foco sin bucle; denegación de perfil retira el panel.
- Asesor a 390 px sin navegación/consultas administrativas, sin desbordamiento
  horizontal de la página.
- Contraseña con perfil inicialmente no autorizado, validación de confirmación,
  activación y limpieza de URL; evento real del cliente `PASSWORD_RECOVERY` con
  fragmento simulado, sin marcador inicial; enlace sin sesión.
- Error de carga conectado sin datos demo.
- Demo explícita a 390 px, navegación y alta de empleado en memoria sin crear
  acceso y sin solicitudes API.
- Capturas desktop/móvil inspeccionadas. Sin excepciones JavaScript ni errores
  React de consola al terminar; los HTTP fallidos deliberados son esperados.

Comprobaciones de terminal: `npm run build`, `npm run lint` y `git diff --check`.
Build/lint pasan; permanecen advertencias del proyecto sobre tamaño de bundle,
configuración Vite, exportaciones de Fast Refresh y efectos heredados.

## Preparación y pruebas pendientes del entorno real

El despliegue se rige por `supabase/DESPLIEGUE_ACCESOS.md`. Este trabajo de UI no
modifica ni despliega migraciones, funciones, `autenticacion.js`, `db.js` o secretos.
Si faltan RPC, perfil inicial, función, CORS, SMTP o configuración Auth, la UI
informa el fallo y pide revisar la preparación; no lo sustituye por éxito demo.

Antes de producción, el responsable debe autorizar/aplicar el despliegue y el
provisionamiento del primer administrador, configurar URLs exactas y SMTP, y
facilitar cuentas de prueba autorizadas. Ejecutar entonces la matriz real de
invitación nueva/existente, correo, enlace vencido/reutilizado, recuperación,
suspensión con JWT previo y empleado inactivo, recarga y cierre en varios
contextos. Las pruebas simuladas de UI no certifican RLS, entrega de correo ni
revocación real. También queda pendiente el comportamiento entre pestañas y los
fallos parciales de operaciones CRM contra el servidor desplegado.

No se implementó la operación del asesor (entrega 3), selector de administradores,
alta pública ni intercambio PKCE `?code=`.

## Cierre de hallazgos UI de la auditoría de integración

Referencia revisada: `supabase/AUDITORIA_INTEGRACION_ACCESOS.md`, junto con la
Edge Function y la migración actualizadas. **No se editó ningún archivo de
servidor ni la migración.** Este apartado actualiza el estado de sus pendientes
de UI; no altera el informe del agente de servidor.

| Hallazgo | Estado de UI | Evidencia local en Chromium |
| --- | --- | --- |
| H2 — suspensión independiente del correo | **Cerrado localmente** | 8 casos: correo NULL, vacío, inválido o cambiado, cada uno con empleado activo e inactivo. Noveno caso: empleado inactivo, sin correo, perfil ni provisión. Botón disponible, confirmación, POST exacto `{accion:'suspender',empleado_id:17,correo:null}` y refresco a suspendido en los 9 casos. Cero llamadas Auth/correo durante esta matriz. |
| H4 — revalidación antigua sobrescribe sesión posterior | **Cerrado localmente** | Carrera A: se retuvo la RPC del perfil A; `auth.setSession(B)` emitió `SIGNED_IN` y validó B; después se devolvió 403 a A. Carrera B: se retuvo `auth.getSession()` de A mediante instrumentación local; se validó B por evento; después se rechazó la lectura antigua. En ambas, Resumen y correo B siguieron visibles, sin alerta obsoleta. |
| H5 — marcador no prueba enlace válido ni identifica destino | **Cerrado localmente** | `otp_expired` en fragmento y query, conservando sesión A: muestra correo A como sesión abierta y recuperación, también tras recargar; no ofrece contraseña ni envía cambios. Marcador solo: correo obtenido de `getUser`, aviso y consentimiento obligatorio. Cambio de identidad antes de enviar: cero cambios. `getUser` 401: formulario de contraseña bloqueado. Callbacks implícitos `invite` y `recovery` con sesión previa A: cliente real supabase-js consume los tokens simulados de B, muestra correo B, exige confirmación, ejecuta un único cambio y limpia la URL. |

La UI no interpreta el marcador o el consentimiento como autorización. El
servidor sigue verificando el JWT, perfil, empleado y activación. Se permite el
flujo de contraseña con una sesión autenticada existente cuando el usuario
confirma explícitamente la cuenta, conforme al contrato; no se presenta esa
sesión como prueba de que un enlace de correo haya funcionado.

### Ejecución y artefactos exactos de esta revisión

Harness temporales, fuera del repositorio, en
`C:\Users\USER\AppData\Local\Temp\opencode\`:

- `auditoria_ui_novatravel.py`: matriz H2/H4/H5. Servidor Vite en puerto **5190**,
  URL Supabase simulada `http://127.0.0.1:54321`; todas sus peticiones interceptadas
  y destinos externos bloqueados. Resultado: **H2 PASS, H4-A PASS, H4-B PASS,
  H5-A PASS, H5-B PASS, H5-C PASS, H5-D PASS**.
- `pruebas_accesos_novatravel.py`: regresión anterior con confirmación de cuenta
  añadida al flujo de contraseña. Puerto **5191**, modo conectado simulado:
  login, restauración, recuperación, cinco acciones de acceso, callbacks y
  errores sin demo, todos correctos. Puerto **5192**, `--demo`: navegación móvil
  y alta en memoria correctas, sin solicitudes API.
- Playwright Python se cargó mediante `PYTHONPATH` desde
  `C:\Users\USER\AppData\Local\Temp\opencode\novatravel-pruebas-ui`.
  Los servidores se gestionaron con
  `.agents/skills/webapp-testing/scripts/with_server.py`, ejecutando
  `node node_modules/vite/bin/vite.js --port PUERTO --strictPort --logLevel silent`.
- Capturas inspeccionadas: `auditoria-h2-suspension.png`,
  `auditoria-h4-carrera.png`, `auditoria-h5-enlace-vencido-movil.png`, en la misma
  carpeta temporal. La captura de enlace vencido se verificó a **390 px**, sin
  desbordamiento horizontal.
- Sin excepciones JavaScript ni errores React de consola. Las respuestas HTTP
  401/403 provocadas para probar denegaciones son esperadas.
- `npm run build`: correcto; `npm run lint`: correcto con **7 advertencias
  heredadas**, ninguna en los componentes corregidos. Se conservan los avisos de
  Vite sobre `__dirname` y tamaño de bundle. `git diff --check`: correcto.

**Cerrado localmente no significa validado en Supabase desplegado.** Sigue
pendiente la misma matriz con Auth/SMTP reales y cuentas autorizadas, incluyendo
enlaces realmente vencidos/reutilizados y sesión previa de otra identidad.
Esta revisión no realizó llamadas remotas, envíos de correo, escrituras en BD,
despliegues ni commits.
