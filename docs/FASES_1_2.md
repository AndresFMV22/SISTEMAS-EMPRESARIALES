# Fases 1 y 2: fechas claras y operación común de reservas

> Estado vigente y continuación: [CONTEXTO_ACTUAL.md](CONTEXTO_ACTUAL.md) y
> [PENDIENTES.md](PENDIENTES.md). La fase 4 amplía la creación descrita aquí:
> el formulario ahora llama a `crear_reserva_promocion` con cotización validada.

## Estado

Implementación y pruebas locales terminadas. Con autorización expresa del responsable,
la nueva migración **ya se aplicó** al proyecto utilizado por `.env.local`.
La migración anterior de operación del asesor también estaba aplicada; no se repitió.

Se verificaron remotamente las dos RPC, los tres triggers, los propietarios y los
permisos EXECUTE (authenticated sí; anon no). Las consultas anteriores y posteriores
mantuvieron 10 reservas, 11 pagos, 7 facturas y 11 paquetes. No se crearon reservas,
abonos, cuentas ni correos de prueba remotos. La prueba funcional en navegador
usó API simulada; el recorrido de negocio real posterior a esta actualización
queda para cuentas y registros autorizados del equipo.

## Cambios de interfaz

- El regreso no puede preceder a la salida. El calendario usa la salida como mínimo
  y, si se mueve después del regreso elegido, limpia ese regreso para corregirlo.
- La duración se calcula desde las fechas: 1 a 3 de noviembre = 3 días / 2 noches.
  Un viaje del mismo día tiene 1 día / 0 noches. Se calcula con fechas de calendario,
  sin depender de la zona horaria del navegador.
- El destino deja de incluir duración escrita manualmente. El catálogo conserva los
  datos antiguos, pero muestra la duración calculada sin duplicar el sufijo antiguo.
- Se muestra «Pasajeros»; las columnas/contratos internos `pax` no se renombran.
- Reserva y pago tienen etiquetas distintas. «Pendiente de confirmación» no significa
  que falte dinero. Pagar no confirma ni finaliza automáticamente una reserva.
- El cambio se describe como cambio de paquete o pasajeros.

## Una misma creación para los dos roles

`components/compartidos/FormularioReserva.jsx` se utiliza por el asesor y por el
administrador. `crearReserva` (alias compatible de `crearReservaAsesor`) llama a
`crear_reserva_unificada` con IDs de cliente/paquete, pasajeros y responsable opcional.

La función reutiliza `operar_asesor('crear',...)`: precio por persona × pasajeros,
snapshots, cupos y factura interna se guardan juntos. El administrador puede elegir
un asesor activo o asignarse la reserva. La asignación ocurre dentro de la misma
transacción; un asesor no puede enviar un responsable distinto.

La demostración administrativa permanece explícitamente en memoria: no llama a RPC,
no crea cuentas reales y no se utiliza como sustituto ante un error conectado.

## Un mismo registro de abono

`registrarAbono` y su nombre compatible `registrarAbonoAsesor` llaman a
`registrar_abono_reserva`. El administrador lo usa desde la tabla, el formulario
de Pagos y el detalle; el asesor lo usa en su detalle. Todos esperan persistencia
y recarga antes de mostrar éxito.

Métodos comunes: efectivo, transferencia, tarjeta crédito/débito, PSE y Nequi.
Se bloquea la reserva al verificar el saldo. No se permiten cero, negativos,
fracciones, sobrepago, reservas cerradas ni pagos de reservas ajenas de un asesor.
La operación actualiza `estado_pago`; no cambia `estado` ni marca la factura como
aceptada por DIAN.

Para históricos, solo el administrador puede cobrar. Se usa el total histórico
fiable (snapshot, primera factura o precio único del paquete, según corresponda),
sin multiplicarlo retroactivamente por pasajeros ni asignar relaciones antiguas.
No se descuentan cupos retroactivamente. Un total desconocido requiere revisión.
El nuevo pago queda vinculado al ID que el administrador seleccionó explícitamente.

Las inserciones directas de reservas y las escrituras directas de pagos desde el
cliente se rechazan: ya no son caminos alternativos que puedan eludir estas reglas.
Las funciones existentes de resolución/reasignación mantienen sus permisos.

## Aplicación en Supabase

**En el proyecto actual ya está aplicada: no repetir.** Para otra instalación:

1. En el mismo proyecto utilizado por `.env.local`, revisar y ejecutar completo
   **solo** `supabase/migrations/20261027231413_unificar_reservas_fases_1_2.sql`
   en SQL Editor, incluyendo `begin` y `commit`, como propietario de las funciones
   existentes. Ejecutarlo una sola vez. Tener un respaldo antes de modificar esquema.
2. No ejecutar de nuevo `schema.sql` ni las migraciones anteriores. Esta migración
   no borra ni convierte reservas/pagos antiguos; agrega reglas y dos RPC nuevas.
3. Recargar la aplicación para usar la versión de interfaz correspondiente. No
   requiere desplegar otra vez `gestionar-accesos`, cambiar SMTP ni nuevas claves.
4. Probar con registros de prueba autorizados: crear con ambos roles, asignar
   responsable, revisar total/cupos, completar abonos y confirmar administrativamente.

Si falta la migración, las operaciones nuevas muestran error; no se intenta guardar
mediante el flujo antiguo. Ante un error de red, revisar el resultado antes de
reenviar: no se promete idempotencia automática de transporte.

## Verificación local

Pruebas temporales fuera del repositorio:

- `verificar-fases12.mjs`: SQL/RLS en PGlite con roles y usuarios simulados. Fechas,
  creación común, asignación, cupos/snapshots, abonos, total histórico, suspensión,
  acceso anónimo y rechazo de escrituras directas. No equivale a concurrencia real.
- `verificar_fases12_ui.py`: navegador con API simulada; fechas/duración, creación y
  pagos de ambos roles, responsable, estados separados, pagos manuales y migración ausente.
- `ejecutar_regresion_fases12.py`: lectura única, ajenas/históricas/cerradas, errores,
  doble envío, clientes, observaciones, solicitudes, contraseña, idiomas, móvil,
  suspensión y resolución administrativa.
- `npm run build`, `npm run lint` y revisión del diff del código modificado.

La única escritura remota fue la migración de esquema autorizada. No se insertaron
ni editaron datos comerciales, no se enviaron correos y no se modificó Auth.
