# Pendientes para terminar la app

Fecha de corte: **28 de octubre de 2026**. Leer [CONTEXTO_ACTUAL.md](CONTEXTO_ACTUAL.md).
Se contrastaron propuesta y código. Esta lista distingue faltantes comprobados,
pruebas aún no realizadas y ampliaciones que requieren acuerdo. El orden es una
propuesta de cierre para el compañero, no fases nuevas aprobadas previamente.

## Plan de cierre

| Orden | Trabajo | Terminado cuando |
| --- | --- | --- |
| 0 | Obtener esta entrega completa | El compañero recibe fases 1–4 y `docs/`, y compila el mismo estado. |
| 1 | Facturación/comprobante interno | Documento consultable e imprimible, con datos pactados y sin simular DIAN/IVA. |
| 2 | Reportes coherentes | Periodos/año, estados, cobros vs ventas, saldos y destinos comprobables. |
| 3 | Cierre UI e idiomas | Textos consistentes, traducciones, móvil y teclado revisados. |
| 4 | Negocio/permisos/concurrencia reales | Matriz inferior ejecutada en entorno autorizado y fallos corregidos. |
| 5 | Auth/correo/publicación | Invitación/recuperación reales y frontend publicado comprobados. |
| 6 | Entrega académica | Evidencias, manual, decisiones de alcance y repo sincronizado. |

## 0. Compartir el mismo código

**Situación:** `39d262c` es la base anterior a las fases siguientes. Esta entrega
las reúne bajo **«Completar reservas, catálogo y promociones y documentar el relevo»**.
La base compartida tiene las cinco migraciones aplicadas. El compañero necesita
la versión que incluya esta entrega, no únicamente aquel commit anterior.

1. Revisar `git status`, `git diff` y commits recientes en origen.
2. Acordar los archivos a publicar. Revisar aparte cambios previos del lockfile y
   Edge Function, sin borrarlos ni incluirlos automáticamente.
3. Con autorización, publicar commit/PR de código, migraciones y documentación;
   excluir credenciales, agentes locales, temporales, DOCX/HTML locales y builds.
4. El compañero instala dependencias, configura `.env.local` privado y corre
   `npm run build` y `npm run lint` antes de modificar.

**Cierre:** mismo código y destino Supabase identificados; confirmar en GitHub el
commit de esta entrega y que el compañero lo haya recibido.

## 1. Facturación interna: primer bloque funcional

> **Estado (28/10/2026): implementado.** La vista `FacturasAdministrador.jsx` ya no
> promete DIAN/IVA (subtítulo y columnas corregidos, aviso de documento interno) y
> abre un `ComprobanteInterno.jsx` de solo lectura por reserva real (cliente,
> documento, responsable, fechas, pasajeros, subtotal, descuento, total, abonos y
> saldo) con impresión del navegador (CSS `@media print`). El comprobante automático
> de reservas gestionadas se conserva; el manual sigue bloqueado para esas reservas.
> Evidencia: `npm run build` y `npm run lint` locales. No se simuló validación fiscal
> ni se recalcularon ventas previas. Falta: revisión en entorno remoto/impresión real.

### Evidencia actual

- `src/vistas/administrador/FacturasAdministrador.jsx`: «Valor + IVA» y «Estado DIAN».
- `src/components/administrador/formularios.js`, bloque `facturas`: genera `FE-...`
  y marca «Enviada» al insertar, sin envío externo.
- `src/lib/i18n.jsx`: subtítulo «Facturación electrónica DIAN».
- `src/components/compartidos/DetalleReserva.jsx`: ya muestra la constancia interna
  con el aviso correcto, sin acción dedicada de impresión/descarga.
- No hay integración fiscal ni cálculo tributario configurado.

### Implementar

1. Unificar el módulo como **facturación/comprobantes internos**. Retirar de la
   operación nueva promesas de IVA calculado, envío o aceptación DIAN. Preservar
   históricos; sus estados existentes deben identificarse como datos heredados.
2. Añadir consulta/detalle asociado a reserva mediante ID real, reutilizando
   componentes comunes. Históricos sin relación: consulta explícita, sin asociar
   por parecido de nombres.
3. Mostrar cliente/documento, reserva, responsable, fechas, pasajeros, precio
   pactado, subtotal, descuento/reglas guardadas, total, abonos y saldo.
4. Añadir vista de impresión legible o descarga equivalente de comprobante interno.
   La impresión del navegador puede cubrirlo; no imponer librería PDF innecesaria.
5. Conservar la factura automática de reservas gestionadas; no habilitar otra
   manual para esa misma reserva saltándose el flujo común.
6. Mantener permisos/privacidad. Un documento no amplía lo que ve el asesor ni
   expone contacto o convenio interno de proveedores.
7. Si requiere BD nueva, crear migración incremental y pedir autorización remota.

**Cierre:** documento coincide con contrato/pagos, usa promoción guardada aunque
la oferta cambie, se imprime y no simula validación fiscal. Errores sin falso éxito.
DIAN real solo si el equipo/profesor la exige expresamente; la propuesta distingue
documento interno de integración fiscal.

## 2. Reportes: segundo bloque funcional

> **Estado (28/10/2026): implementado.** `ReportesAdministrador.jsx` ahora tiene
> filtro de periodo (año + rango Desde/Hasta) con alcance visible: cobros por fecha
> de pago y reservas por fecha de viaje. Separa **dinero abonado** de **valor
> reservado neto**, reporta **saldo pendiente** (excluye canceladas y marca reservas
> sin total fiable), y muestra reservas/abonos por asesor. La distribución usa el
> tipo de destino real (nacional / internacional / **Sin clasificar**); se eliminó la
> categoría fija «Cruceros» y ya no se infiere internacional por defecto.
> Evidencia: `npm run build` y `npm run lint` locales con datos de demostración.
> Falta: fixture con dos años y cancelaciones en entorno autorizado (bloque 4).

### Faltantes comprobados

- `ResumenAdministrador.jsx` agrupa cobros por mes sin separar año. El rango de
  fechas filtra la tabla de reservas, no todos los indicadores.
- `ReportesAdministrador.jsx` tiene cobros, promedio y reservas por asesor, pero
  no filtros completos ni reporte consolidado de saldos/ventas por periodo.
- La distribución considera internacional todo lo no clasificado como nacional
  y mantiene «Cruceros» fijo en cero.
- El Top 5 por nombre de paquete no es necesariamente el reporte de destinos
  más solicitados de la propuesta.

### Implementar

1. Definir fecha de cada reporte: pago para cobros; viaje o creación para reservas
   según información disponible. No inventar creación ausente ni mezclar criterios
   sin indicarlo en pantalla.
2. Rango/año validados y filtros con alcance visible: tabla concreta o reporte
   completo. Probar el mismo mes en dos años distintos.
3. Separar valor reservado neto de descuentos de dinero realmente abonado. Explicar
   qué estados se incluyen; cancelado no implica dinero devuelto.
4. Reportar saldos pendientes con total/pagado/saldo y filtros por asesor/periodo
   cuando correspondan.
5. Destinos: preferir snapshot contratado; si se usa catálogo para históricos,
   indicarlo. Datos desconocidos como **Sin clasificar**; no inventar internacional.
   Quitar la categoría fija de cruceros o implementarla con datos reales.
6. Conservar COP y reporte por asesor; usar IDs disponibles para no mezclar
   personas o paquetes homónimos.

**Cierre:** fixture con dos años, descuentos, abonos parciales, cancelación y
destino desconocido produce cifras verificables. Ningún placeholder como dato real.
CSV/PDF adicional solo si lo pide la entrega; no es requisito explícito revisado.

## 3. Cierre de UI e idiomas

1. Completar etiquetas heredadas de facturas, reportes y resumen en
   `src/lib/i18n.jsx`; varias siguen fijas en español.
2. Revisar cinco idiomas, COP, duración/fechas, estados de reserva vs pago, carga,
   error, vacío y reintento.
3. Probar 390 px/escritorio, claro/oscuro, teclado, etiquetas de campos, foco de
   diálogos y tablas sin romper la página.
4. Conservar sidebar, cuadrícula y estados centrales. Resolver errores sin
   rediseñar toda la aplicación.

**Cierre:** flujos utilizables en móvil/teclado, sin etiquetas contradictorias ni
textos nuevos sin traducción prevista; build/lint correctos y avisos existentes anotados.

## 4. Matriz real de negocio, permisos y concurrencia

PGlite y navegador simulado pasaron; esta integración real **no está certificada**.
Usar proyecto de pruebas o cuentas/registros autorizados. La autorización para
migrar fase 4 no autoriza generar ventas o correos de prueba.

| Caso | Resultado esperado |
| --- | --- |
| Crear con ambos roles | Precio/snapshots, cupos y factura en una transacción. |
| Elegir responsable | Solo perfil activo válido; asesor no asigna a otro dueño. |
| Dos sesiones venden últimos cupos | Sin sobreventa ni factura/reserva parcial; revisar deadlocks si aparecen. |
| Dos sesiones abonan mismo saldo | Sin sobrepago ni estados inconsistentes. |
| Precio/oferta cambian tras cotizar | Rechazo hasta revisar cotización nueva. |
| Sin oferta, exacta/mínima/fija/porcentaje | Condición sobre todos los pasajeros, total positivo, redondeo COP. |
| Cambiar pasajeros con oferta editada/vencida | Usa reglas pactadas; pierde/recupera beneficio según cantidad. |
| Otro paquete | No hereda promoción y exige aceptar la cotización nueva. |
| Abono tras cotizar cambio | Aceptación anterior inválida, revisar saldo otra vez. |
| Total nuevo menor a abonado | Bloqueado; no reducir/borrar pagos para permitirlo. |
| Cancelación aprobada | Libera cupos una sola vez, conserva histórico y no promete devolución. |
| Proveedor inactivo | Rechaza venta nueva de paquete completo inválido; conserva contratos previos. |
| Asesor consulta ajenas | Lectura compartida, escritura ajena denegada incluso por REST/RPC manual. |
| Anon/sin perfil/suspendido/inactivo | Lecturas y escrituras CRM nuevas denegadas con contexto/JWT real. |
| Red cae después de enviar | Actualizar y revisar lo persistido antes de repetir. |
| Histórico sin IDs/snapshot | Total fiable conservado y límites visibles, sin backfill ficticio. |

Si se exige reintento automático seguro tras un corte, falta idempotencia por clave
de operación en creación/cobro. Diseñarla en RPC existentes con migración nueva,
sin capas genéricas. Hoy se exige revisar antes de repetir: bloqueo de doble clic
no equivale a idempotencia de transporte.

**Cierre:** informe nuevo con entorno, fecha, casos y resultados; corregir/repetir
los afectados. PGlite secuencial no prueba concurrencia real multi-sesión.

## 5. Auth, correo y publicación

Edge Function `gestionar-accesos` desplegada ACTIVE v3. Falta comprobar equivalencia
con código previsto y operación real. Ver [DESPLIEGUE_ACCESOS.md](DESPLIEGUE_ACCESOS.md)
sin repetir migraciones.

1. Site URL, redirects exactos, `AUTH_REDIRECT_URL`, CORS, SMTP y límites del destino.
2. Con permiso de cuentas/correo: invitación nueva/existente, reenvío, activación,
   recuperación y enlaces vencidos/reutilizados.
3. Sesión previa de otra identidad, suspensión con JWT anterior, empleado inactivo,
   recarga, logout y varias pestañas. Correo aceptado no prueba recepción/activación.
4. Revisar protección de contraseñas filtradas con el responsable; no cambiar
   ajustes sin acuerdo ni revocar masivamente RPC que necesita la aplicación.
5. Publicar frontend con variables públicas; comprobar HTTPS y callback en hosting
   final. Base al día no significa frontend actual publicado.
6. Si se adopta CLI de migraciones, conciliar línea base antes: no hay historial
   CLI y no se puede usar `db push`/`db reset` a ciegas.

**Cierre:** URL final registrada y acceso/recuperación de ambos roles comprobados
allí; datos reales conservados. Este relevo no certifica ese despliegue frontend.

## 6. Entrega final y decisiones abiertas

### Entrega mínima propuesta

- Bloques 0–5 completados y fallos corregidos.
- Manual corto por rol y recorrido: proveedor → paquete → oferta opcional →
  reserva → abonos → solicitud/resolución → comprobante → reporte.
- Datos de demostración futuros/válidos autorizados en un entorno identificado.
- Evidencias, diagramas y documentos académicos exigidos. El texto extraído de la
  propuesta local tiene objetivos específicos/cronograma sin desarrollar: el equipo
  debe revisar ese documento original fuera del repo.
- Repo y documentación sincronizados. No certificar como real lo probado solo con mocks.

### Ampliaciones que requieren decisión, no requisitos aprobados automáticamente

| Tema | Estado y acuerdo necesario |
| --- | --- |
| DIAN real | No implementada. Acordar si basta comprobante interno o se exige proveedor fiscal/habilitación. |
| Reembolsos | No implementados. Para cambios inferiores a abonado/devoluciones, definir autorización, trazabilidad y efectos contables. |
| Pasarela | Solo registro manual de pagos. Integrar cobro si se exige expresamente. |
| Portal cliente | No existe. Rol reservado sin acceso CRM; requiere vínculo cliente–Auth y RLS propios si se aprueba. |
| GDS/NDC/hoteles/aerolíneas | Proveedores internos sin reserva externa. La propuesta los trata como referencia/futuro, no integración obligatoria inicial. |
| Notificaciones/exportaciones extra | Añadir por requisito concreto. Correo de acceso existente no es envío comercial de documentos. |

## Instrucción para el compañero o su agente

> Lee `docs/CONTEXTO_ACTUAL.md` y `docs/PENDIENTES.md` y revisa `git status`.
> Obtén la entrega «Completar reservas, catálogo y promociones y documentar el relevo»,
> posterior a `39d262c`, que incluye las fases 1–4 y esta documentación.
> Las migraciones hasta fase 4 están aplicadas en `oxhmsntqqaknwhskzmjs`;
> no las repitas ni uses `schema.sql` como actualización. Empieza por el bloque 1:
> unifica facturación interna y añade consulta/impresión con datos contratados,
> sin simular DIAN ni recalcular ventas previas. Después completa reportes del
> bloque 2, textos/UI y la matriz real. Usa React, funciones directas Supabase,
> hooks/componentes compartidos y español; no añadas capas ni rediseñes la app.
> Cambios de BD requieren migración incremental y permiso para aplicar al remoto.
> No crees ventas, cuentas o correos reales de prueba sin autorización. Verifica
> cada bloque y actualiza esta lista con evidencia local, simulada o remota.
