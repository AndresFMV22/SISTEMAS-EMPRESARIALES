# Fase 3: paquetes completos y proveedores

> Rutas de código relativas a la raíz del repositorio. Estado y siguiente trabajo:
> [CONTEXTO_ACTUAL.md](CONTEXTO_ACTUAL.md) y [PENDIENTES.md](PENDIENTES.md).

## Estado

Implementado con React y llamadas directas a Supabase, sin repositorios, fábricas,
otro servidor ni dependencias nuevas de la aplicación.

La migración `20261028001132_catalogo_paquetes_proveedores_fase_3.sql` **ya se aplicó**
al proyecto actual, con autorización expresa. No hay que ejecutarla otra vez allí.
En otra instalación se aplica una sola vez, después de accesos, operación del asesor
y fases 1/2. No volver a ejecutar `schema.sql` como actualización de un entorno activo.

## Flujo del administrador

1. **Proveedores:** buscar por nombre/tipo, crear o editar contacto y convenio,
   elegir Activo/Inactivo y consultar sus paquetes relacionados.
2. **Paquetes turísticos:** crear o editar descripción, destino nacional/internacional,
   fechas, precio único por persona, capacidad, incluidos, no incluidos y condiciones.
3. Asociar al menos un proveedor y definir el tipo y detalle de cada servicio.
   Se admite un proveedor en varios servicios; no se repite la misma pareja
   proveedor/tipo de servicio dentro del paquete.
4. La información y sus servicios se guardan en una transacción. La capacidad
   disponible se recalcula en servidor manteniendo los espacios comprometidos.

El campo de destino no requiere duración escrita: esta se calcula con salida y
regreso. Los cupos iniciales de un paquete nuevo son su capacidad total. Al editar
se conserva `capacidad_anterior - disponibles_anteriores` como compromiso existente,
incluyendo la disponibilidad anterior de paquetes históricos. No se reasignan reservas
antiguas ni se reconstruyen relaciones por nombre.

Si una reserva histórica sin ID de paquete ni factura depende del nombre para su
total, se impide renombrar ese paquete hasta revisar esos importes. Los demás
campos se pueden completar normalmente. Un formato de cupos antiguo no interpretable
también requiere revisión, en lugar de sobrescribir ocupaciones sin certeza.

## Proveedores inactivos y paquetes antiguos

- Solo los proveedores con estado exacto `Activo` pueden incorporarse a servicios nuevos.
  Los estados antiguos `Nuevo` o `En revisión` se conservan; el administrador elige
  explícitamente Activo/Inactivo al editarlos.
- Desactivar no borra proveedores, relaciones ni reservas. Una asociación previa
  puede conservarse al editar, pero un paquete completo con un proveedor no activo
  aparece Por completar y no admite nuevas reservas hasta revisar el servicio.
- Los paquetes antiguos quedan con `catalogo_completo=false`: continúan visibles
  conforme a sus fechas y cupos. No se les inventa descripción, clasificación ni proveedores.
  Guardarlos desde el editor nuevo exige completar la información y asociar un proveedor.
- Los viajes finalizados siguen ocultos en el catálogo, conservando sus registros.

## Asesor e información contratada

El catálogo compartido muestra descripción, incluidos/no incluidos, condiciones y
proveedores/servicios. El asesor no recibe contacto ni convenio interno de proveedores,
ni puede guardar catálogo, proveedores o asociaciones.

Al crear una reserva gestionada de un paquete completo, `contenido_contratado` guarda
una copia comercial con nombres y servicios publicables, sin datos internos del proveedor.
El detalle de la reserva muestra esa copia, no la oferta actual.

- Editar precio, descripción, condiciones o proveedor no modifica lo ya contratado.
- Cambiar únicamente pasajeros conserva el contenido y precio por persona anteriores.
- Un cambio de paquete aprobado sustituye el contenido por el del destino aprobado.
- Las reservas anteriores a la fase 3 mantienen null; el detalle informa que no se
  registró información comercial en su fecha. No se rellena retrospectivamente.
- Abonar, confirmar, finalizar o añadir observaciones no reemplaza ese contenido.

## Código y datos

- `src/lib/catalogo.js`: llamadas directas y validación de formulario.
- `useCatalogoAdministrativo`: lectura, errores y sincronización; no cambia a demo ante fallos.
- `PaquetesAdministrador`, `ProveedoresAdministrador`, `EditorPaquete` y `EditorProveedor`.
- `ContenidoComercial`: presentación compartida del catálogo y la oferta contratada.
- Una tabla `paquete_servicios`, campos comerciales en paquetes y snapshot en reservas.
- RPC admin: `catalogo_administrativo()`, `guardar_paquete(datos)`, `guardar_proveedor(datos)`.
  Las escrituras directas del cliente sobre catálogo se rechazan. La lectura existente
  `datos_asesor` conserva su contrato y añade campos/servicios publicables.

La demostración administrativa sigue en memoria y permite configurar proveedores y
paquetes sin usar credenciales ni ejecutar RPC. Sus IDs con prefijo `demo-` solo
identifican elementos locales y nunca se envían a Supabase.

## Verificaciones

Pruebas temporales, fuera del repositorio:

- PGlite: roles/RLS, proveedor obligatorio, guardado atómico y rollback, capacidad
  comprometida, precios pactados, snapshots, inactivos, cambios aprobados y privacidad.
- Playwright/MS Edge con API simulada: alta/edición, datos internos ocultos al asesor,
  errores sin falso éxito, doble envío, paquetes relacionados, snapshots, móvil/tema,
  migración ausente y demostración aislada.
- Regresión de reservas, pagos, clientes, observaciones, solicitudes, autenticación,
  recuperación de errores, idiomas y formato de dinero.
- Build y lint correctos, con advertencias preexistentes.

En Supabase remoto se comprobaron funciones, RLS, permisos y cuatro triggers. Los
datos anteriores de paquetes, proveedores y reservas conservaron sus huellas; los
recuentos se mantuvieron en 11 reservas, 11 pagos, 8 facturas, 11 paquetes y 7 proveedores.
No se crearon servicios ni snapshots ficticios. Se ejecutaron lecturas protegidas
en una transacción de solo lectura con contexto SQL de perfiles activos de admin
y asesor; ambas funcionaron. No equivalen a un login real de navegador.

La única escritura remota fue la migración autorizada: no se generaron operaciones
comerciales, cuentas ni correos de prueba. La concurrencia real multi-sesión de esta
fase no se certificó; las operaciones bloquean paquete y proveedores en orden estable.
No se promete idempotencia automática de transporte: ante un error de red se revisan
los datos actualizados antes de repetir una creación.
