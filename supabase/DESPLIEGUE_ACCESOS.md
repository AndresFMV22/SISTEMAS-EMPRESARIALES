# Entregas 1 y 2: autenticación y accesos

## Estado y alcance

Implementación local: no se aplicó SQL remoto, no se crearon usuarios remotos,
no se enviaron correos y no se modificaron secretos. No se modificaron vistas,
`App.jsx`, `main.jsx`, `db.js` ni `demoData.js` desde el ámbito servidor.
La revisión posterior de integración sí endureció el bloque de políticas de
`schema.sql`; no editó UI. Hallazgos: `AUDITORIA_INTEGRACION_ACCESOS.md`.
El responsable confirmó que la migración no se ha desplegado y autorizó ajustar
su SQL pendiente directamente: ahora incluye suspensión independiente de correo,
IDs inmutables y atribución de asesor protegida. Desplegar la versión actual
completa una sola vez; si alguna instalación ya la aplicó, necesita una migración
incremental de actualización y no debe volver a ejecutar este archivo.

La migración requiere las siete tablas de `schema.sql` ya creadas. Es incremental,
no borra datos y no deduce propietarios a partir de nombres o códigos. El esquema
base ahora detecta perfiles, provisiones, la RPC de perfil o el registro de la
migración `20261022233614`. Si detecta cualquiera de esas evidencias, elimina
`demo_all` residual y revoca privilegios de PUBLIC/anon sobre las siete tablas,
sin sustituir políticas autenticadas. Su reejecución **no reabre acceso anónimo**.
Conservar esa protección en futuras modificaciones. No se recomienda reejecutar
el instalador en producción: además de DDL contiene inserciones de muestra.
Para instalaciones nuevas, crear la base y aplicar esta migración en un entorno
no accesible a usuarios antes de publicar. El esquema base no es un instalador de
producción seguro por sí solo.

## Plan de despliegue (requiere aprobación del responsable del entorno)

1. Respaldar la BD y revisar diferencias reales respecto al esquema del repositorio.
   Consultar primero los catálogos de PostgreSQL con consultas de solo lectura. Revisar políticas,
   vistas, funciones y concesiones adicionales; una vista con privilegios de dueño
   o una RPC antigua puede eludir la RLS nueva. No continuar sin revisar esos objetos.
2. Coordinar el despliegue de UI: tras migrar, el CRM anónimo dejará de funcionar.
   Desactivar registro público y usuarios anónimos en Auth. No usar `signUp` para
   asignar roles. Desactivar también proveedores de identidad que no se utilicen.
3. Revisar y ejecutar íntegramente en SQL Editor, como propietario, el archivo
   `migrations/20261022233614_accesos_protegidos.sql`. Tiene `BEGIN/COMMIT`.
   Elimina políticas anteriores **solo de las siete tablas CRM**, sustituyéndolas
   por el modelo de permisos descrito abajo. No ejecutar dos veces la migración.
   Este repositorio no tiene historial inicial/configuración CLI: no ejecutar
   `db push` a ciegas ni marcar migraciones como aplicadas sin verificar el esquema.
4. Provisionar al primer administrador mediante el procedimiento siguiente.
5. Configurar SMTP propio, límites de correo, contraseña mínima 12, confirmación
   de email, protección de contraseñas filtradas si está disponible y expiración
   de enlaces. Revisar límites/CAPTCHA de recuperación pública. El SMTP de prueba
   de Supabase no sustituye un servicio de correo de producción.
6. Configurar Auth > URL Configuration: Site URL de producción y Redirect URLs
   **exactas** `https://DOMINIO/?flujo=contrasena` y, solo en desarrollo,
   `http://localhost:5173/?flujo=contrasena`. Si se usa otra ruta o puerto, ajustar
   ambas configuraciones. No permitir comodines amplios en producción.
   Usar plantillas estándar Invite/Recovery con `{{ .ConfirmationURL }}`; no enlaces
   personalizados `token_hash` ni PKCE sin implementar su intercambio por separado.
7. Configurar en Edge Functions (Dashboard/gestor de secretos, nunca chat ni Git):
   `AUTH_REDIRECT_URL=https://DOMINIO/` y
   `AUTH_ALLOWED_ORIGINS=https://DOMINIO` (lista separada por comas si procede).
   En desarrollo: `http://localhost:5173/` y `http://localhost:5173` respectivamente.
   Supabase proporciona `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` a la función. **Nunca** poner la última en Vite.
8. Desplegar desde una sesión CLI autenticada y autorizada para ese proyecto:

   ```sh
   npx supabase functions deploy gestionar-accesos --project-ref REFERENCIA --no-verify-jwt
   ```

   Revisar `npx supabase functions deploy --help` con la versión instalada antes.
   `--no-verify-jwt` evita depender del verificador JWT heredado del gateway:
   **la función hace su propia validación obligatoria con `auth.getUser(token)`**,
   rechaza usuarios anónimos y consulta el perfil administrador en BD. La clave
   privilegiada nunca se acepta como sustituto de identidad de un administrador.
9. Vite: conservar URL/clave pública existentes y configurar opcionalmente
   `VITE_AUTH_REDIRECT_URL=https://DOMINIO/`. La función añade automáticamente
   `?flujo=contrasena`. Reconstruir frontend con el agente de interfaz.
10. Ejecutar pruebas reales de la matriz inferior con cuentas de prueba autorizadas,
    ejecutar auditoría nuevamente y revisar Security Advisors. No borrar datos
    reales para probar. La vuelta atrás segura es denegar acceso/mantenimiento,
    **no restaurar `demo_all`**.

## Alta inicial del administrador (fuera de la aplicación)

Crear/invitar una cuenta real en Auth desde Dashboard y completar su correo y
contraseña. Elegir explícitamente el empleado activo correspondiente; no elegir
por un código demo ni asignar por coincidencias de nombre. Leer primero:

```sql
select id, nombre, correo, activo from public.empleados order by id;
select id, email, email_confirmed_at, is_anonymous from auth.users order by created_at desc;
```

Con los dos IDs revisados, ejecutar este bloque **solo con autorización de alta**.
Los valores de ejemplo deben sustituirse; no insertar directamente en `auth.users`.

```sql
begin;
do $$
declare
  usuario_elegido uuid := 'SUSTITUIR_UUID_AUTH';
  empleado_elegido bigint := 0; -- SUSTITUIR_ID_EMPLEADO
begin
  if not exists (
    select 1 from auth.users u join public.empleados e on e.id=empleado_elegido
    where u.id=usuario_elegido and e.activo and not u.is_anonymous
      and u.deleted_at is null and u.email_confirmed_at is not null
      and coalesce(u.encrypted_password,'')<>''
      and (u.banned_until is null or u.banned_until<now())
      and lower(u.email)=lower(btrim(e.correo))
  ) then raise exception 'Identidad o empleado no válidos para el alta.'; end if;
  insert into public.perfiles(id,empleado_id,correo,rol,activo,estado_acceso,activado_en)
    select u.id,e.id,lower(u.email),'administrador',true,'activo',now()
    from auth.users u join public.empleados e on e.id=empleado_elegido
    where u.id=usuario_elegido;
end $$;
commit;
```

Un conflicto es motivo de revisión, no de `upsert` que cambie roles. La gestión UI
solo concede `asesor`, nunca administrador. El rol `cliente` queda reservado y sin
acceso CRM en esta fase. Todos los perfiles actuales requieren empleado vinculado;
un futuro portal de clientes requerirá su propio diseño y migración.

## Contrato efectivo para el agente de interfaz

Importar desde `src/lib/autenticacion.js`. Todas las operaciones asíncronas lanzan
`Error` con `message` español; no mostrar `cause` al usuario.

| Exportación | Resultado y permisos |
| --- | --- |
| `obtenerSesion()` | Sesión Auth o `null`; identidad local, **no autorización**. Sin configuración devuelve `null`. |
| `escucharSesion(callback)` | Devuelve cancelador. Callback `(sesion, evento)` diferido fuera del bloqueo de Auth; no requiere que UI sea asíncrona. |
| `iniciarSesion(correo, contrasena)` | Sesión; todavía debe consultarse `obtenerPerfil()`. |
| `cerrarSesion()` | Cierra sesión Auth, no altera perfil ni empleado. |
| `obtenerPerfil()` | `{id,nombre,correo,rol,activo,empleado_id,estado_acceso}` validado en BD; lanza si invitado/suspendido/inactivo/sin perfil. No autorizar con JWT o metadata. |
| `solicitarRecuperacion(correo)` | Sin confirmación de existencia de cuenta. Mostrar mensaje genérico. No reactiva perfiles suspendidos. |
| `establecerContrasena(contrasena)` | `{estado_acceso:'activo'}` tras Auth y activación segura en servidor. Si ya se guardó la contraseña, `same_password` solo permite reintentar activación tras reautenticación con esa contraseña y la misma identidad; nunca elude los bloqueos de BD. |
| `listarAccesos()` | Solo admin: `[{id,empleado_id,correo,rol,activo,estado_acceso}]`. `id:null`/`estado_acceso:'pendiente'` identifica provisión aún sin perfil. |
| `gestionarAcceso({accion,empleado_id,correo})` | Solo admin activo; acciones `invitar`, `reenviar`, `suspender`, `reactivar`, `recuperar`. Devuelve `{empleado_id,estado_acceso,correo_enviado?:true}`. |

`empleado_id` es el ID de BD (número entero seguro o cadena decimal), **no el
código EM-...**. `correo` es opcional pero, si se proporciona, debe coincidir con
el correo del empleado, **excepto al suspender, donde se ignora**. Una marca de
suspensión sin perfil/provisión previa puede tener `correo:null` en el listado;
no representa una cuenta. El botón suspender no debe depender de correo válido.
`db.js` mantiene sus estructuras heredadas y no devuelve
IDs de empleados en sus arreglos: para el selector de accesos, la UI admin puede
leer `supabase.from('empleados').select('id,nombre,correo,activo')` bajo RLS. No se
ha modificado ese contrato compartido ni implementado pantallas de asesor.

No hay login demo que suplante al administrador real. Sin Supabase, escuchar sesión
produce `(null,'INITIAL_SESSION')`; las acciones reales fallan explícitamente.
Los datos demo existentes se conservan, pero no prueban autorización real.

### Callback de correo

El cliente actual de `supabase.js` usa flujo **implícito**, persistencia y detección
URL por defecto de supabase-js. Consume `#access_token=...&type=invite|recovery`
automáticamente. La UI debe suscribirse pronto y usar `PASSWORD_RECOVERY` **o** el
parámetro persistente `flujo=contrasena` que añaden los dos emisores. Este último
cubre invitación, recarga y la llegada del evento antes de montar la UI.

Mostrar el formulario de contraseña con sesión aunque `obtenerPerfil()` todavía
rechace por invitado; no enviarlo a la pantalla admin. Tras establecer contraseña,
consultar perfil y retirar `flujo` de URL mediante `history.replaceState`.
Un marcador URL no concede permisos. Enlace vencido/reutilizado sin sesión: pedir
uno nuevo. No registrar fragmentos/token ni enviarlos a analítica. El hosting SPA
debe servir la ruta de callback, con HTTPS en producción. No se admite un callback
PKCE `?code=` en este contrato; no cambiar `flowType` sin coordinar la integración.

## Permisos y propiedad

* Anónimo: sin privilegios ni políticas CRM.
* Auth sin perfil, cliente, perfil suspendido o empleado inactivo: ninguna fila CRM.
* Administrador activo: CRUD CRM y listado/gestión de asesores. No puede editar
  directamente perfiles, ni el suyo propio; el alta de administradores es externa.
* Asesor activo: lectura clientes/paquetes/reservas/pagos (historial de cobros).
  Insertar/actualizar solo reservas con `empleado_id` propio y pagos con
  `reserva_id` de reserva propia. No borrar. No leer/modificar empleados,
  proveedores ni facturas. No puede cambiar dueño/código de reserva, ni mover
  un pago; los textos `pago.reserva/cliente` se derivan de la reserva propia.
  En altas de asesor, el nombre atribuido a la reserva se deriva de su empleado;
  el asesor no puede modificarlo posteriormente. Los IDs de reservas/pagos son
  inmutables para todos, incluso `SET id=DEFAULT`. No se cambian las firmas API.
* Reservas heredadas tienen `empleado_id:null` y pagos `reserva_id:null`: solo
  administrador los modifica hasta una asignación explícita y revisada. Los campos
  textuales antiguos siguen funcionando para la UI admin. No hay backfill ambiguo.
* Toda política evalúa perfil y empleado en BD, no claims de rol. Un JWT emitido
  antes de suspender deja de dar acceso en la siguiente consulta. Una operación
  ya iniciada conserva su snapshot PostgreSQL; no se promete cancelar consultas
  en curso. Suspensión de perfil no borra la cuenta Auth ni impide cambiar su
  contraseña desde la API Auth; eso **no** restaura acceso al CRM.

## Provisión, fallos y reintentos

`preparar_acceso` bloquea el empleado y reserva su correo de forma única antes de
llamar a Auth. Almacena token temporal de dos minutos y pausa de envío de un
minuto. `confirmar_acceso` vuelve a validar admin, empleado, identidad exacta,
token/expiración y suspensión; inserta perfil **invitado**, nunca activo. Una
cuenta Auth ya existente se reconcilia por correo y no se duplica ni se elimina.
Una identidad ya vinculada a otro empleado no se puede apropiar.

Si Auth crea la cuenta pero falla respuesta/correo/BD, usar `reenviar` pasados dos
minutos: se vuelve a consultar Auth y se vincula la misma cuenta. Para cuentas ya
existentes se envía recuperación, no una segunda invitación incompatible. Un
correo aceptado por Auth no garantiza entrega SMTP; `correo_enviado:true` significa
solicitud de envío aceptada. Si falló solo correo tras vincular: reenviar pasado un
minuto. No hay transacción distribuida ni se simula atomicidad con borrados.

Suspender invalida tokens en curso incluso sin perfil. Reactivar una provisión
incompleta devuelve `pendiente`: luego reenviar. Reactivar una invitación no
aceptada mantiene `invitado`; una cuenta activada previamente vuelve a `activo`
(si Auth también está bloqueado externamente, seguirá sin permisos). Reenviar
nunca desactiva una cuenta activa. Un cambio de correo del empleado/Auth deniega
acceso y requiere reconciliación manual; no se traslada identidad silenciosamente.
Suspender no requiere correo válido/coincidente ni empleado activo y persiste
el bloqueo aun si después se restaura el correo. Las demás acciones mantienen la
validación de correo. El reintento de contraseña usa credenciales reales de Auth
si recibe `same_password`; crea y revoca una sesión temporal de comprobación sin
afectar sesiones existentes. Los límites/CAPTCHA de login y la disponibilidad de
Auth también pueden impedir ese reintento: no se omiten para forzar activación.

## Comprobaciones del proyecto

Los archivos de pruebas temporales de `supabase/tests/` se retiraron a petición
del responsable. La auditoría conserva el registro histórico de las pruebas
locales realizadas; esas pruebas no certifican la integración remota.

```powershell
npx deno check --no-config --no-lock supabase/functions/gestionar-accesos/index.ts
npm run build
npm run lint
```

Pendiente antes de producción: probar en Supabase staging correo nuevo y cuenta
existente, reintento tras corte de red, enlace abierto antes de terminar vinculación,
link vencido/reutilizado, callback localhost/producción, `PASSWORD_RECOVERY`, cierre
y recarga de sesión, suspensión con JWT anterior usando REST directo y cambio de
empleado a inactivo. Coordinar navegación/pruebas de permisos con agente UI.

## Auditoría de seguridad final local

* Sin `service_role` en frontend, sin `signup`, metadata de usuario ni rol enviado
  por cliente en decisiones de autorización.
* Perfiles con FK Auth/empleado y cuenta única por empleado; sin escritura del
  cliente; sin trigger de alta automática que transforme cualquier signup en rol.
* RPC privilegiadas revocadas a PUBLIC/anon/authenticated; solo service_role.
  RPC públicas de lectura validan autorización, `search_path` vacío. Helpers
  `SECURITY DEFINER` privados con acceso limitado para RLS sin recursión.
* Estado se reevalúa en BD; suspensión no depende de refrescar JWT.
* CORS con allowlist, redirección fijada en servidor, errores sin tokens ni logs
  de contraseña, respuestas no almacenables. Recuperación pública mantiene
  comportamiento no enumerador de Supabase.
* El riesgo de reinstalar `demo_all` con el esquema actualizado quedó corregido y
  probado localmente. Una copia antigua del instalador sigue siendo insegura.
* H1/H2/H3 backend cerrados localmente con regresiones: ID/atribución, suspensión
  independiente de correo y reintento de activación verificado. Véase
  `AUDITORIA_INTEGRACION_ACCESOS.md`. Sigue pendiente que UI no condicione el botón
  suspender al correo, además de H4/H5 de revisión UI/callbacks. La separación de
  filas/roles no equivale a la futura operación financiera completa de asesor.
* Riesgos/bloqueos externos: objetos remotos adicionales sin auditar, SMTP y
  configuración Auth, cuotas/CAPTCHA y matriz real de callbacks/navegador. No hay
  despliegue remoto ni certificación de seguridad de producción en estas pruebas.
