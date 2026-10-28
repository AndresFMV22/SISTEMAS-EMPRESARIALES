# Manual de uso de NóvaTravel

Guía corta por rol. Cubre el recorrido principal de la agencia. Las credenciales y el
destino de Supabase se solicitan por canal privado; sin configurar, la pantalla de
acceso ofrece **Explorar demostración** con datos en memoria.

## Acceso

1. Abre la aplicación (`npm run dev` o la URL publicada).
2. Ingresa con tu correo y contraseña, o usa **Explorar demostración** para ver el sistema sin datos reales.
3. Idioma y tema (claro/oscuro) se cambian en la barra superior; la preferencia se recuerda.

## Rol administrador

El administrador ve todos los módulos en la barra lateral.

1. **Proveedores** — Registra aerolíneas, hoteles y operadores (contacto y convenio internos). Puedes activarlos o desactivarlos sin borrarlos.
2. **Paquetes turísticos** — Crea el paquete con destino, fechas de salida/regreso, cupos, incluidos/no incluidos, condiciones y servicios asociados a proveedores.
3. **Promociones** (opcional) — Crea una oferta por porcentaje o monto, con su condición de pasajeros y vigencia. Es opcional por reserva.
4. **Reservas** — Crea la reserva (cliente, paquete, pasajeros, responsable). El precio y las fechas quedan **pactados** y se genera su **comprobante interno** automáticamente. Desde **Gestión** reasignas responsable, cambias estado y resuelves solicitudes.
5. **Pagos** — Registra abonos en pesos. El sistema controla el saldo y **no permite pagar más que lo pendiente**.
6. **Comprobantes (Facturación)** — Consulta el comprobante interno de cada reserva (cliente, documento, responsable, fechas, pasajeros, subtotal, descuento, total, abonos y saldo) y pulsa **Ver / Imprimir** para imprimirlo con el navegador. Es un documento interno: **no es factura DIAN ni calcula IVA**.
7. **Reportes** — Filtra por **año** y rango de fechas. Verás *dinero abonado* (por fecha de pago), *valor reservado neto* (por fecha de viaje), *saldo pendiente*, reservas/abonos por asesor y la distribución por tipo de destino (nacional / internacional / sin clasificar).
8. **Clientes y Empleados** — Alta, consulta y, en lugar de borrar, **activar/desactivar con observaciones y vigencia**, para conservar el histórico.

## Rol asesor

El asesor trabaja sobre sus propias reservas y consulta el historial compartido.

1. **Resumen** — Indicadores de su operación.
2. **Clientes** — Registro y consulta.
3. **Catálogo** — Paquetes disponibles con su contenido.
4. **Reservas** — Crea y abre el **detalle** de la reserva: comprobante interno, abonos, observaciones y **solicitudes** (cambio o cancelación) para que el administrador las resuelva.
5. **Pagos** — Registra abonos de sus reservas (mismo control de saldo).
6. **Cuenta** — Datos de su perfil.

## Recorrido completo sugerido

> Proveedor → Paquete → (Oferta opcional) → Reserva → Abonos → Solicitud / Resolución → Comprobante → Reporte.

## Notas importantes

- **Pendiente de confirmación** es un estado de la reserva, no una deuda; pagar no la confirma automáticamente.
- Editar el catálogo **no recalcula** ventas ya registradas.
- Cancelar una reserva **no genera devolución automática**; los reembolsos no están implementados.
- Los montos están en **pesos colombianos (COP)**.
