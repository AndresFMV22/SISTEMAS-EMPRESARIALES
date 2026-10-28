# Fase 4: promociones y recotización de cambios

## Estado

Implementación comprobada localmente con React y funciones directas de Supabase.
La migración `20261028034043_promociones_cotizaciones_fase_4.sql` **ya se aplicó
al proyecto remoto el 28 de octubre de 2026**, con autorización expresa.
No volver a ejecutarla allí. Véanse también [CONTEXTO_ACTUAL.md](CONTEXTO_ACTUAL.md)
y [PENDIENTES.md](PENDIENTES.md).

Las migraciones de accesos, operación del asesor, fases 1/2 y fase 3 ya están
aplicadas en el proyecto actual; no se repiten. Esta fase no requiere desplegar
una Edge Function ni instalar dependencias nuevas de la aplicación.

## Promociones

El administrador dispone del menú **Promociones** para crear, editar, buscar y
filtrar ofertas. Cada una tiene nombre, descripción, beneficio, fechas, paquetes
aplicables, condición de pasajeros y habilitación.

- La selección es opcional y explícita: **Sin promoción** o una sola oferta.
- El porcentaje es entero entre 1 y 99. El monto fijo es COP entero y se descuenta
  una vez de toda la reserva, no por pasajero.
- La condición puede ser cualquier cantidad, exactamente N o mínimo N pasajeros.
  Se evalúa sobre toda la reserva; no se forman parejas parciales.
- El servidor redondea los descuentos porcentuales al peso y exige total positivo.
- Las fechas inicial y final son inclusivas según el día de Colombia al reservar,
  independientemente de la fecha del viaje.
- Los estados llevan texto y color: programada azul, vigente verde, vencida y
  deshabilitada gris. Solo las ofertas vigentes del paquete pueden seleccionarse
  para una venta nueva.
- Editar, deshabilitar o vencer una oferta no modifica ventas anteriores.

Las reservas creadas antes de esta fase conservan sus importes y reciben descuento
cero, sin promoción ni reglas reconstruidas retrospectivamente.

## Reserva nueva

1. Administrador o asesor elige cliente, paquete y pasajeros.
2. Puede conservar **Sin promoción** o elegir una oferta vigente.
3. El servidor devuelve precio por persona, subtotal, descuento y total.
4. El envío exige una cotización disponible. Cambiar paquete, pasajeros u oferta
   invalida la vista anterior; se descartan respuestas de consultas anteriores.
5. Al guardar se vuelven a comprobar cotización, disponibilidad y permisos bajo
   bloqueo. Reserva, descuento, cupos y factura quedan en una transacción.

La cotización no aparta cupos. Si cambia el precio, la oferta o el contenido
comercial, hay que actualizar y revisar antes de reservar. Una oferta seleccionada
que deja de estar disponible se señala como inválida; no se convierte
silenciosamente en una venta sin descuento.

## Cambios de una reserva

El asesor solicita un cambio y el administrador revisa la recotización antes de
aprobarlo. Se muestra el total anterior, los nuevos importes, lo abonado y el saldo.
La aprobación exige respuesta y confirmación administrativa de que el cliente
aceptó la cotización; no constituye una aceptación digital realizada por el cliente.

### Mismo paquete

La opción inicial conserva el precio por persona y las reglas de la promoción
contratada, aunque la oferta actual esté vencida, deshabilitada o editada.
El descuento se recalcula para la nueva cantidad:

- Si sigue cumpliendo la condición, se conserva el beneficio proporcional o fijo.
- Si deja de cumplirla, el descuento pasa a cero y se informa antes de aprobar.
- Se conserva la copia de las reglas incluso con descuento cero. Si un cambio
  posterior recupera la cantidad válida, puede volver a aplicar el beneficio.
- El administrador también puede elegir **Sin promoción** o sustituirla por una
  oferta vigente. Esa elección reemplaza las reglas contratadas.

Ejemplo: dos pasajeros a `$ 1.000.000` con 30 % para exactamente dos pagan
`$ 1.400.000`. Un cambio a tres pasajeros queda en `$ 3.000.000`, sin descuento;
volver a dos conservando las reglas contratadas permite recuperar `$ 1.400.000`.

### Otro paquete

Se usa el precio del paquete destino y no se traslada automáticamente la promoción
anterior. La selección inicial es **Sin promoción**; se puede elegir una vigente
del nuevo paquete. El contenido comercial contratado pasa a ser el del destino.

### Aceptación, pagos y cupos

- La cotización aceptada y la confirmación del cliente se guardan en la solicitud.
- Si cambia la cotización, incluido un abono posterior que modifica el saldo,
  se rechaza la aceptación anterior y debe revisarse de nuevo.
- Un total inferior a lo ya abonado bloquea la aprobación. No hay flujo de
  reembolsos implementado en esta fase.
- Los cupos se validan al ejecutar el cambio. Un fallo revierte también precio,
  factura y resolución de la solicitud.
- El estado de pago se calcula sobre el total neto; pagar no confirma la reserva.
- Rechazos y cancelaciones conservan su flujo existente.

## Código y permisos

- `src/lib/promociones.js`: consultas, guardado y helpers de presentación.
- `src/hooks/useCotizacion.js`: espera breve entre cambios, invalidación y recarga.
- `FormularioReserva` y `ResumenPrecio`: selección y desglose compartidos.
- `PromocionesAdministrador` y `EditorPromocion`: gestión administrativa.
- `ResolverSolicitudPrecio`: revisión y aceptación de cambios.
- Tablas nuevas: `promociones` y `promocion_paquetes`, con RLS y lectura directa
  restringida al administrador activo. Las escrituras se realizan por RPC.
- Reservas: `descuento`, `promocion_id` y `promocion_contratada` guardan el beneficio
  y la copia de las reglas; solicitudes: `cotizacion_aceptada` y `aceptacion_cliente`.
- RPC: `datos_promociones`, `guardar_promocion`, `cotizar_reserva`,
  `crear_reserva_promocion`, `cotizar_cambio` y `resolver_solicitud_precio`.

Solo administrador gestiona ofertas y resuelve cambios. Administrador y asesor
activos pueden cotizar ventas; la creación conserva las restricciones existentes
de responsable. No se concede ejecución anónima de estas RPC ni acceso del cliente
a sus helpers privados. Las funciones privilegiadas validan el rol y fijan
`search_path` vacío.

El formulario usa las nuevas RPC. Los puntos de creación previos se conservan para
compatibilidad y permiten ventas a precio completo, sin aplicar promociones.
La aprobación antigua de cambios queda bloqueada si no tiene cotización aceptada.
La gestión de promociones requiere conexión real; el modo demostración informa
esta condición y no simula un guardado.

## Comprobaciones realizadas

Pruebas temporales fuera del repositorio, sin operaciones comerciales remotas:

- PGlite: migración sobre fases anteriores, importes previos intactos, selección
  opcional, condiciones exacta/mínima/cualquiera, porcentaje y monto por reserva,
  redondeo, total positivo, ofertas por paquete, permisos y RLS.
- PGlite: cotización obsoleta, copia no retroactiva, pérdida y recuperación del
  beneficio, vencimiento, sustitución de paquete, aceptación obligatoria, pagos
  netos, abono posterior, reembolso bloqueado y rollback por falta de cupos.
- Playwright/MS Edge con API simulada: selección, creación y edición de promociones,
  estados con texto/color, reglas guardadas, pérdida del descuento, aceptación,
  cotización obsoleta, doble envío y vista móvil.
- `npm run build` y `npm run lint`: correctos, con advertencias existentes.

Estas pruebas no certifican tráfico real de PostgREST ni concurrencia multi-sesión.
Las escrituras bloquean las filas necesarias y vuelven a comprobar la cotización.
No se ofrece idempotencia de transporte: ante un fallo de red, actualizar y revisar
las operaciones registradas antes de repetir una creación.

## Despliegue y verificación remota

La migración se ejecutó completa y una sola vez, después de fase 3, en el proyecto
`oxhmsntqqaknwhskzmjs`. El historial `supabase_migrations.schema_migrations` no existe
en este entorno: las actualizaciones anteriores se aplicaron por SQL directo.
La ausencia de historial CLI no significa que falten las migraciones. Se comprobó
su presencia por funciones, tablas y columnas antes de continuar. No se ejecutó
`db push` ni se reconstruyó un historial artificial.

Comprobaciones remotas de esta entrega:

- Seis RPC con `search_path` vacío, ejecución para `authenticated` y denegada a `anon`.
- Helpers nuevos privados sin ejecución para `anon` ni `authenticated`.
- RLS en las dos tablas nuevas y cuatro triggers habilitados.
- Lecturas con contexto SQL de perfiles activos de administrador y asesor, en una
  transacción de solo lectura: ambos reciben 11 paquetes con `promociones` como
  arreglo. El asesor no puede consultar gestión ni cotizar cambios administrativos.
- Cero promociones/asociaciones creadas; descuentos previos en cero, sin copias de
  reglas ni aceptaciones ficticias.
- Huellas de las once tablas existentes idénticas antes y después, excluyendo las
  columnas nuevas al comparar reservas y solicitudes. Recuentos: 8 clientes,
  4 empleados, 2 perfiles, 11 paquetes, 7 proveedores, 0 servicios, 11 reservas,
  11 pagos, 8 facturas, 3 observaciones y 1 solicitud.
- Security Advisors: sin hallazgos de nivel error; 15 advertencias de RPC
  `SECURITY DEFINER` ejecutables por usuarios autenticados, correspondientes al
  diseño de funciones con validación interna de rol, y una advertencia de protección
  de contraseñas filtradas deshabilitada. Esta configuración de Auth no se modificó.

No se insertaron ventas, abonos, usuarios ni correos de prueba. Estas lecturas no
equivalen a login real ni a un recorrido comercial por PostgREST. Esas pruebas y
la publicación de la interfaz se detallan en [PENDIENTES.md](PENDIENTES.md).
No ejecutar `schema.sql` como actualización del proyecto activo.
