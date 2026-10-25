# Operación del asesor: React + Supabase directo

## Estado de esta entrega

**SQL escrito y comprobado localmente; NO aplicado ni consultado en la BD remota.** No requiere otro servidor, otra autenticación ni desplegar una Edge Function. No añade repositorios, fábricas, adaptadores ni dependencias de aplicación. La interfaz utiliza un hook de carga y funciones directas de Supabase.

### Interfaz e integración final

- `src/components/compartidos/` contiene el panel visual, catálogo, detalle de reserva y elementos de formulario compartidos entre ambos roles.
- `src/vistas/administrador/` y `src/vistas/asesor/` contienen las pantallas de cada rol. Sus componentes exclusivos están en `src/components/administrador/` y `src/components/asesor/`.
- `src/hooks/useAsesor.js` carga y refresca datos tras las operaciones, sin simular éxito ni cambiar a demo ante errores conectados.
- `GestionReservas.jsx` añade la bandeja y las acciones administrativas desde Reservas; actualiza también los datos del panel original.
- `db.js` conserva sus arreglos y añade al final de cada reserva `{id,gestiona_cupos}`. Las posiciones anteriores permanecen iguales. Las reservas gestionadas se abren por la gestión nueva; pagos y facturas manuales excluyen esas reservas.
- El asesor ingresa mediante `src/components/autenticacion/PuertaAcceso.jsx`. El modo demo administrativo y los enlaces de recuperación mantienen su recorrido.
- La creación antigua del administrador sigue siendo legacy: no se convierte silenciosamente a la operación del asesor ni se cambian sus cálculos históricos. La nueva operación utiliza IDs, precio por persona y cupos transaccionales.
- Verificación final de integración: pasaron los harness temporales `verificar_paquetes_sidebar.py`, `verificar_dinero.py` y `verificar_ui_asesor.py` en Playwright/MS Edge con API simulada y sin tráfico remoto. Incluyen roles, formularios, móvil, errores, sincronización del administrador y ausencia de migración. No certifican la BD remota.

Las secciones siguientes detallan el contrato y las verificaciones de servidor. Las referencias a archivos no modificados se refieren al ámbito del agente de datos, no al conjunto de la entrega.

Archivos de esta entrega:

- `src/lib/asesor.js`: funciones directas sobre el cliente Supabase existente.
- `supabase/migrations/20261024011048_operacion_asesor_simple.sql`: única migración nueva, incremental y transaccional.
- Este documento.

No modifica `schema.sql`, la migración de accesos anterior, vistas, `db.js`, credenciales ni función de accesos. Los cambios previos de otros agentes siguen fuera de este ámbito.

## Contrato de integración (mismas firmas; snapshot de regreso adicional)

Importar las funciones desde `@/lib/asesor`. Las lecturas devuelven objetos, **no** las matrices legacy de `db.js`.

```js
const datos = await obtenerDatosAsesor();
// { clientes, paquetes, reservas, pagos, facturas, observaciones, solicitudes }

const gestion = await obtenerGestionReservas();
// mismo dataset + asesores:[{ empleado_id, nombre, correo }], solo administrador
```

Todos los arrays están presentes, incluso vacíos. IDs numéricos reales; no se deducen relaciones por nombre. Campos principales:

| Colección | Campos |
| --- | --- |
| clientes | `id,codigo,nombre,documento,correo,telefono,reservas,activo` y columnas DB existentes |
| paquetes | `id,nombre,ubicacion,precio:number,cupo,salida,regreso,icono` |
| reservas | `id,codigo,cliente_id,paquete_id,empleado_id,cliente,paquete,pax,fecha_viaje,fecha_regreso,asesor,estado,estado_pago,total:number|null,precio_persona:number|null,gestiona_cupos:boolean` |
| pagos | `id,recibo,reserva_id,reserva,cliente,metodo,valor:number,fecha,estado` |
| facturas | `id,factura,reserva,cliente,valor:number,fecha,estado` |
| observaciones | `id,reserva_id,texto,autor_nombre,creado_en` |
| solicitudes | `id,reserva_id,tipo,motivo,estado,respuesta,creado_en,paquete_id,pax,autor_nombre` |

La BD puede devolver columnas adicionales (por ejemplo `tono`, `reserva_id` en facturas, `documento_unico` técnico en clientes y datos de resolución); no son necesarias para montar el panel ni deben enviarse como entrada. Fechas de viaje ISO `YYYY-MM-DD`; auditoría con zona horaria ISO. Pesos COP enteros, máximo `Number.MAX_SAFE_INTEGER`. `cupo` conserva el texto del catálogo. No redondear ni enviar importes formateados como strings.

Adición de auditoría: `fecha_regreso: string|null` en reservas. `fecha_viaje` ya era snapshot de salida; ahora el regreso también queda congelado en creación/cambio aprobado y no se deduce del catálogo al finalizar. Históricos/demo conservan regreso null. No cambian firmas, entradas ni permisos; la UI actual puede ignorar el campo nuevo, aunque conviene mostrarlo en el comprobante en una tarea de interfaz separada.

| Función exportada | Entrada | Salida |
| --- | --- | --- |
| `registrarCliente` | `{nombre,documento,correo,telefono}` | fila cliente |
| `actualizarContactoCliente` | `(id,{correo,telefono})` | fila cliente |
| `crearReservaAsesor` | `{cliente_id,paquete_id,pax}` | fila reserva |
| `registrarAbonoAsesor` | `{reserva_id,valor,metodo}` | `{id}` del pago |
| `agregarObservacion` | `{reserva_id,texto}` | `{id}` |
| `solicitarCambioReserva` | `{reserva_id,tipo,motivo,paquete_id:null\|id,pax:null\|int}` | `{id}` |
| `resolverSolicitud` | `{solicitud_id,aprobar:boolean,respuesta}` | fila solicitud resuelta |
| `reasignarReserva` | `{reserva_id,empleado_id}` | fila reserva |
| `cambiarEstadoReserva` | `{reserva_id,estado}` | fila reserva |

Valores admitidos:

- `tipo`: `cambio` o `cancelacion`. Las propuestas son opcionales en cambios; cancelación exige ambas propuestas nulas.
- Estado de solicitud: `pendiente`, `aprobada`, `rechazada`.
- `estado` para cambio administrativo: `Pendiente`, `Confirmada`, `Finalizada`. Cancelación solo aprobando una solicitud.
- Estado de reserva gestionada: los anteriores o `Cancelada`. No confundir con `estado_pago`: `Pendiente`, `Pago parcial`, `Pagado`.
- `metodo`: `Efectivo`, `Transferencia`, `Tarjeta crédito`, `Tarjeta débito`; siempre explícito.
- Motivo, observación y respuesta: 1–4000 caracteres no vacíos.
- Nombre cliente: 2–200 caracteres. Documento: 3–30 letras/números después de quitar puntos, espacios y guiones y convertir a mayúsculas. Correo y teléfono válidos obligatorios; contacto actualiza ambos, no permite cambiar documento/nombre.

**Errores:** todas las funciones rechazan la promesa con `Error` en español. No devuelven éxito inventado ni silencian fallos. La UI debe mostrar `error.message`, esperar la operación, y volver a consultar el dataset. Un error de red no demuestra rollback: antes de repetir una creación o abono, consultar y comprobar el resultado. No hay clave de idempotencia para reintentos de transporte.

```js
await registrarAbonoAsesor({ reserva_id: reserva.id, valor: 100000, metodo: "Transferencia" });
const actualizado = await obtenerDatosAsesor();
// actualizar estado de React con actualizado; no incrementar saldo/cupos optimistamente
```

Integración UI revisada solo en lectura: `useAsesor`, `ReservasAsesor`, `DetalleReserva`, `FormulariosAsesor`, `GestionReservas`, `App.jsx`, `db.js` y clasificador de paquetes. Las firmas y los métodos de pago coinciden; el hook espera la escritura y refresca, y App identifica managed mediante metadatos de reserva en índice 8. No se editaron esos archivos. **Nunca** usar `insertarFila`/`actualizarFilas` para reservas gestionadas, sus pagos o sus facturas. El admin legacy conserva su lectura y sus operaciones sobre registros no gestionados; una escritura vieja dirigida a una reserva gestionada se rechaza deliberadamente. No convertir estados de pago en estados de reserva. Falta validar la integración en navegador/entorno autorizado.

## Autorización e invariantes

- Se reutilizan `perfiles`, `auth.uid()` y `privado.tiene_rol` de accesos. Roles y estado se leen de BD, nunca de metadata enviada por React. Cuenta, empleado y acceso deben estar activos; se mantienen los controles de identidad/correo, anónimos y bloqueos de Auth existentes.
- Asesor activo lee clientes, paquetes, **todas** las reservas/pagos/facturas y el historial de observaciones/solicitudes. No necesita consultar empleados ni proveedores. Modifica solo reservas propias por RPC. Registrar clientes y actualizar contacto es una operación compartida del equipo.
- Se eliminan las cuatro políticas asesor de escritura directa sobre reservas/pagos. El asesor tampoco recibe escrituras directas sobre clientes, paquetes, facturas, observaciones o solicitudes.
- Solo admin puede administrar paquetes, listar asesores activos, resolver solicitudes, reasignar y cambiar el estado de reservas gestionadas. Asesor/admin pueden crear una reserva: propietario es siempre el empleado del perfil actual, no un ID o texto recibido del navegador. El admin puede operar cualquier reserva gestionada.
- Las dos RPC públicas son `datos_asesor(gestion boolean)` y `operar_asesor(accion text,datos jsonb)`. Cada una verifica cuenta/rol; las mutaciones verifican propiedad. `SECURITY DEFINER` se necesita para transacciones sin conceder escritura directa al asesor. `search_path=''`, objetos cualificados, EXECUTE revocado a PUBLIC/anon y concedido explícitamente a authenticated. Los auxiliares operativos son privados y no ejecutables por el navegador.
- Triggers **invoker** impiden INSERT/UPDATE/DELETE directos de filas gestionadas o de pagos/facturas relacionados por ID **o** código. También impiden quitar el indicador de gestión, vaciar snapshots, desvincular pagos o apuntar texto legacy a una gestionada. Solo el propietario SQL de la RPC puede efectuar sus escrituras internas; no se usa un flag de sesión falsificable. Esto protege el acceso por API, no pretende limitar a un propietario/superusuario SQL de confianza.
- Documento único: trigger con bloqueo asesor transaccional, índice de búsqueda y clave técnica `documento_unico` con índice UNIQUE. La migración reserva una clave por cada documento histórico (menor ID del grupo) sin cambiar los documentos originales ni borrar duplicados; los demás miembros históricos conservan la clave null. El trigger recalcula la clave al insertar/cambiar documento y no permite falsificarla mediante UPDATE de contacto o de la propia clave. La comprobación por SELECT conserva el control sobre duplicados históricos; la unicidad física evita nuevas colisiones incluso con snapshots antiguos en REPEATABLE READ.

### Reserva y cupos

Crear exige cliente activo, `pax>0`, salida estrictamente posterior al día actual de `America/Bogota`, regreso obligatorio finito no anterior a salida, precio interpretable positivo y disponibilidad. Se rechazan fechas infinitas/fuera del rango ISO de cuatro dígitos admitido por UI. Se bloquea la fila del paquete, se guardan precio por persona, total y ambas fechas como snapshots, se descuenta disponibilidad textual y se inserta una factura interna `Por validar` en **la misma transacción**. Conserva textos de cliente, paquete y asesor para App admin. Los códigos nuevos llevan UUID para evitar colisiones; no presuponer longitud o numeración consecutiva en UI.

No se cambia todo el catálogo a numeric. El lector seguro admite enteros sin formato o miles con punto y `$` opcional (`1000`, `$ 1.000`). No adivina decimales, comas ni valores negativos. Cupos admitidos: `Cupos: N / M` con sufijo opcional; `N` es disponibilidad, `M` capacidad positiva. Las variaciones conservan prefijo, separadores y sufijo; nunca permiten `N<0` o `N>M`. Una edición posterior del precio o de las fechas del catálogo no altera los snapshots contratados.

### Pagos, solicitudes y estado

- Abono: bloqueo de reserva, importe entero positivo, método explícito, reserva no cancelada/finalizada y sin sobrepago. Saldo suma pagos por `reserva_id` **o**, solo si ID nulo, por código. Una fila con ambos se cuenta una sola vez; valores históricos no interpretables bloquean el cobro para revisión. Abonar solo actualiza `estado_pago`, no estado de reserva ni validación de factura.
- Observaciones: append, nombre del autor y fecha de BD; no hay edición/borrado para los usuarios de aplicación.
- Una solicitud pendiente por reserva (índice único parcial más comprobación bajo bloqueo). Proponer otro paquete exige fechas completas/válidas; resolver vuelve a validarlas bajo bloqueo (también en cambios solo de pax). Resolver bloquea reserva, solicitud y paquetes por ID ascendente. Rechazar no cambia cupos/total. Aprobar cambio ajusta diferencias de cupos; si cambia de paquete toma su precio actual, si mantiene paquete conserva precio contratado. Solo un cambio aprobado actualiza los snapshots de ambas fechas a las del paquete seleccionado. Actualiza reserva/factura y no admite total inferior a lo pagado. Cualquier fallo revierte todos los cambios.
- Cancelación aprobada conserva snapshots, factura y pagos, marca `Cancelada` y libera una sola vez los cupos gestionados. No crea reembolso ni anula automáticamente una factura fiscal. Resolver dos veces se rechaza.
- Tras reasignar, la solicitud del responsable anterior no se puede aprobar; admin debe rechazarla con respuesta y el responsable actual presentar otra. Destino debe tener perfil asesor e identidad activa válidos, no basta una fila de empleado. Se permite reasignar reservas cerradas para custodia del historial, sin reabrirlas.
- Confirmar o dejar pendiente exige salida futura; los cupos ya están retenidos desde la creación. Finalizar exige reserva confirmada, pagada y snapshot de regreso válido no posterior a hoy Colombia. No consulta las fechas del catálogo ni sustituye un regreso ausente por la salida. Finalizada/cancelada no puede reabrirse ni recibir abonos/cambios. Una solicitud pendiente de una cerrada sí puede rechazarse para cerrar el trámite.

## Históricos y demostración

- No se rellena ningún ID antiguo por coincidencia de nombre, asesor o código. `gestiona_cupos=false`; `cliente_id`, `paquete_id`, `total`, `precio_persona`, `fecha_regreso` nuevos quedan nulos en almacenamiento. La lectura calcula total sin escribir: snapshot si existe → primera factura relacionada por ID ascendente (ID/código) → precio de paquete único por nombre **sin multiplicar por pax** → null. Esto reproduce la semántica histórica del admin baseline `6cab759` (`obtenerSaldo`/`agregarReserva`): factura o precio del paquete, no precio-persona*pax. La multiplicación solo corresponde a las nuevas gestionadas con snapshot. El fallback por nombre **solo calcula visualización**, no asigna relación ni propiedad; si hay paquetes homónimos, no inventa total. `precio_persona` histórico permanece null; estado legacy se conserva.
- Los pagos históricos tampoco reciben IDs por inferencia. No se descuentan cupos de reservas antiguas ni se liberan al editarlas desde el flujo legacy.
- Las RPC de pagos/cambios/estado/reasignación no convierten históricos a gestionados. Si se necesita adoptarlos, hace falta reconciliación manual autorizada de identidad, total, propiedad, pagos y cupos; esta entrega no incluye un proceso automático inseguro.
- Sin credenciales, `obtenerDatosAsesor()` mapea `DATOS_DEMO` al mismo formato, con IDs null, total visual y precios numéricos. No inventa un empleado ni una identidad. Demo es **solo lectura**: mutaciones y gestión administrativa fallan explícitamente. No usa localStorage como si fuera autorización real.
- Si un importe/precio real es inválido, la RPC conserva todas las filas y entrega null; el módulo rechaza el dataset con un error explícito que identifica tabla, ID y campo de hasta ocho incidencias (y número de adicionales). No oculta filas ni las convierte silenciosamente a cero. Una reserva sin fallback fiable sí puede mostrar total null por contrato. No se corrigen datos en una lectura.

### Limitación de lectura por importes inválidos: requiere decisión de contrato/UI

**No se resolvió la carga parcial sin romper el contrato vigente.** `precio` de paquete y `valor` de pagos/facturas están fijados como `number`; la UI actual usa `mostrarDinero(null)` (lo convertiría a cero) y suma directa en `saldoReserva` (null se trataría como cero). Devolver null/NaN, filtrar los pagos inválidos o inventar cero produciría importes y saldos falsos. Por ello sigue fallando explícitamente la carga del panel asesor/gestión cuando esas columnas son inválidas, ahora con ubicación y motivo concretos. Esto no cambia la consulta independiente del admin legacy.

Para una corrección completa debe acordarse con el agente UI ampliar esos campos a `number|null`, añadir avisos de calidad de datos al dataset, mostrar el importe desconocido como tal y propagar saldo desconocido si existe un pago inválido, bloqueando solo esa operación/reserva. Esa ampliación **no está implementada ni aprobada tácitamente aquí**. No basta añadir un array de avisos si UI lo ignora.

## Aplicación exacta (pendiente de autorización explícita)

### Con SQL Editor, como la entrega anterior

En el mismo proyecto del `.env.local`, abrir una consulta nueva y ejecutar completo
**únicamente** `supabase/migrations/20261024011048_operacion_asesor_simple.sql`,
incluyendo `begin` y `commit`. Hacerlo una sola vez y después de revisar el archivo
y respaldar la BD. No volver a ejecutar la migración de accesos anterior ni
`schema.sql`. Si hay error, conservar su texto y revisar antes de reintentar.
El SQL no envía invitaciones ni modifica cuentas de Auth. Conserva los registros
históricos; agrega estructuras y reglas para la nueva operación.

Ejecutarlo en SQL Editor no registra automáticamente el historial de Supabase CLI.
Si se adopta CLI posteriormente, se debe reconciliar ese historial antes de `db push`.

### Alternativa mediante CLI con historial ya reconciliado

1. Respaldar y verificar el proyecto destino. La migración de accesos `20261022233614` debe estar aplicada y registrada. No volver a ejecutar `schema.sql` ni editar una migración ya aplicada. No ejecutar nada contra remoto durante la revisión de esta entrega.
2. Revisar el archivo SQL nuevo completo. El CLI global no estaba instalado; se utilizó `npx --yes supabase migration new --help` y luego `npx --yes supabase migration new operacion_asesor_simple` para generar el nombre. `db push --help` también fue consultado. Para despliegue, usar una versión CLI aprobada y credenciales solo del operador, nunca claves privilegiadas VITE.
3. **Solo con autorización de consulta al destino**, desde la raíz del proyecto y con el proyecto correcto ya vinculado:

   ```powershell
   npx supabase db push --linked --dry-run --skip-vault
   ```

   Verificar que la única migración pendiente que anuncia es `20261024011048_operacion_asesor_simple.sql`. Si anuncia accesos u otra migración, detenerse y reconciliar el historial; no usar `--include-all`, seeds ni reparación automática.
4. **Solo con autorización expresa de escritura/esquema para ese destino**, ejecutar:

   ```powershell
   npx supabase db push --linked --skip-vault
   ```

   Revisar el resultado y conservar el registro de aplicación. La migración ya contiene `begin/commit` y `notify pgrst, 'reload schema'`. No reejecutarla si quedó registrada; ante un error, investigar antes de reintentar. No desplegar/reemplazar `gestionar-accesos` para esta funcionalidad.
5. Desde sesiones reales de prueba autorizadas, leer `supabase.rpc('datos_asesor',{gestion:false})` como asesor y `{gestion:true}` como administrador. El asesor no debe recibir `asesores` ni poder pedir gestión. Sin migración/caché, el módulo informa explícitamente que falta la migración; no usa demo para ocultar el fallo.
6. Coordinar con UI la prueba en navegador y las escrituras de prueba **antes** de realizarlas. Usar IDs creados expresamente y documentados, nunca decidir que una fila es descartable por su código. Verificar propiedad, otra cuenta asesor, suspendido, anon, cupos, abonos, solicitudes, cancelación/reasignación y protección de managed desde admin legacy. No ejecutar limpieza remota automática.

## Verificaciones ejecutadas y límites

Pruebas locales en `C:/Users/USER/AppData/Local/Temp/opencode`, sin carpeta de tests nueva en el repositorio:

```powershell
node --stack-trace-limit=0 "C:/Users/USER/AppData/Local/Temp/opencode/verificar-asesor.mjs"
node --stack-trace-limit=0 "C:/Users/USER/AppData/Local/Temp/opencode/verificar-asesor-js.mjs"
node --stack-trace-limit=0 "C:/Users/USER/AppData/Local/Temp/opencode/auditar-concurrencia-documento.mjs" --exigir-unicidad
npm run build
npm run lint
```

- PGlite aplica esquema base, migración previa y migración nueva sobre instancia efímera. Auth/users/roles se simulan localmente. Verifica RLS y RPC con administrador, dos asesores, suspendido, empleado inactivo y Auth anónimo; lectura compartida, documento normalizado duplicado, cupos/sufijo, snapshots, factura atómica, montos, saldo, propiedad, observaciones, solicitudes, resolución duplicada, cambios/cancelación, reasignación, rollback, protección directa managed y conservación de legacy.
- Competencia **modelada en PGlite**: dos operaciones sucesivas compiten por disponibilidad/saldo y la segunda debe ser rechazada. PGlite de una conexión no demuestra contención real multi-sesión; esta auditoría la complementó con PostgreSQL local, descrito a continuación. No equivale a una prueba en Supabase desplegado.
- Auditoría adicional **con concurrencia real local**: Docker Desktop no tenía motor activo; se instaló PostgreSQL embebido y `pg` solo bajo el directorio temporal. PostgreSQL 18.4, listener 127.0.0.1, tres conexiones. Se fijó snapshot de B antes del INSERT de A, se verificó espera efectiva por bloqueo en `pg_stat_activity`, se confirmó A y se intentó confirmar B. Antes del refuerzo: READ COMMITTED rechazaba B (`23505`, una fila), REPEATABLE READ aceptaba B (**dos filas**, defecto reproducido). Después del índice UNIQUE: ambos aislamientos rechazan B con `23505` y conservan una fila. El servidor de la pasada final se detuvo con `pg_ctl`; no se conectó a Supabase remoto. El trigger VOLATILE renueva consultas en READ COMMITTED, pero el advisory lock no renueva un snapshot REPEATABLE READ: el índice UNIQUE es la garantía final. Referencias: documentación PostgreSQL, *Transaction Isolation* y *Function Volatility Categories*.
- El mismo PostgreSQL local verificó competencia real por cupos y saldo con las RPC completas como `authenticated`/asesor: A crea reserva de dos pasajeros, B espera y falla por cupos agotados; A abona 1500, B espera y falla al intentar otros 1000 sobre total 2000. Quedan cupos cero, pagos 1500 y estado de reserva `Pendiente`. No se automatiza reintento de pagos. Intercambio concurrente entre paquetes, resolución concurrente y comportamiento del gateway Auth/PostgREST desplegado siguen sin probarse con conexiones reales.
- PGlite ampliado: regreso nulo/anterior/infinito al crear; catálogo invalidado entre solicitud y resolución; rollback de cupos/total/solicitud; snapshots independientes del catálogo al finalizar; fallback histórico sin multiplicación y primera factura; clave documento no falsificable, INSERT de varias filas duplicadas con rollback; matriz de INSERT/UPDATE/DELETE directo en pagos/facturas por ID/código/vínculos contradictorios; RLS asesor devuelve cero filas en UPDATE/DELETE y mantiene el registro; admin conserva legacy y bloquea managed; ACL sin EXECUTE PUBLIC/anon en las RPC y sin acceso authenticated a auxiliares operativos.
- JS con cliente RPC simulado: exports, payloads, errores, migración ausente, lectura sin escrituras, datos demo y rechazo de identidades/importes inválidos. No es una lectura real de Supabase.
- Build y lint completados con advertencias en configuración Vite, tamaño de bundle y componentes/vistas preexistentes; ninguna advertencia del módulo nuevo. La UI estaba en transición por otro agente. No se hicieron pruebas de navegador ni despliegue; pendientes de coordinación.
- No hay garantía de idempotencia de transporte ni paginación del dataset completo. Facturas son internas, no integración DIAN. No hay refund automático. No se promete reconciliación de históricos ambiguos ni una cuenta de cliente nueva.

No se hicieron commits, lecturas remotas, escrituras remotas ni cambios de esquema remoto.
