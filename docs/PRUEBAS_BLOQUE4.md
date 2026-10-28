# Guion de pruebas — Bloque 4 (negocio, permisos y concurrencia)

Esta matriz **debe ejecutarse en un entorno Supabase autorizado** (proyecto de pruebas
o cuentas/registros permitidos). No puede certificarse desde el repositorio ni con
simulaciones. No generes ventas, cuentas o correos reales sin autorización.

**Cómo registrar resultados:** copia la tabla final y anota, por cada caso, el entorno,
la fecha, qué hiciste y el resultado (OK / falla + detalle). Corrige y repite los que fallen.

## Preparación

1. Usar un proyecto de pruebas o datos autorizados; nunca producción con datos reales.
2. Tener al menos: un **administrador**, dos **asesores** activos y un **paquete futuro** con cupos.
3. Abrir dos navegadores/sesiones distintas para los casos de concurrencia.

## Casos (del relevo)

| # | Caso | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| 1 | Crear reserva con rol admin y con rol asesor | Precio/snapshots, cupos y comprobante en una sola transacción | |
| 2 | Elegir responsable | Solo perfil activo válido; el asesor no asigna a otro dueño | |
| 3 | Dos sesiones venden el último cupo | Sin sobreventa ni reserva/comprobante parcial | |
| 4 | Dos sesiones abonan el mismo saldo | Sin sobrepago ni estados inconsistentes | |
| 5 | Cambia precio/oferta tras cotizar | Rechazo hasta revisar la nueva cotización | |
| 6 | Sin oferta: condición exacta/mínima/fija/porcentaje | Se aplica a todos los pasajeros; total positivo; redondeo COP | |
| 7 | Cambiar pasajeros con oferta editada/vencida | Usa reglas pactadas; pierde/recupera beneficio según cantidad | |
| 8 | Elegir otro paquete | No hereda promoción; exige aceptar la nueva cotización | |
| 9 | Abonar tras cotizar un cambio | La aceptación anterior queda inválida; revisar saldo otra vez | |
| 10 | Total nuevo menor a lo abonado | Bloqueado; no se reducen/borran pagos | |
| 11 | Cancelación aprobada | Libera cupos una sola vez; conserva histórico; sin devolución automática | |
| 12 | Proveedor inactivo | Rechaza venta nueva del paquete inválido; conserva contratos previos | |
| 13 | Asesor consulta reservas ajenas | Lectura compartida; escritura ajena denegada incluso por REST/RPC manual | |
| 14 | Anónimo / sin perfil / suspendido / inactivo | Lecturas y escrituras nuevas denegadas con contexto/JWT real | |
| 15 | Red cae tras enviar | Actualizar y revisar lo persistido antes de repetir | |
| 16 | Histórico sin IDs/snapshot | Total fiable conservado; límites visibles; sin backfill ficticio | |

## Verificación por SQL (opcional, solo lectura)

Ejecutar en el **SQL Editor** del proyecto de pruebas para contrastar:

```sql
-- No debe haber sobreventa: reservas activas por paquete vs capacidad
-- (ajustar a las columnas reales de cupos del proyecto)
select paquete, count(*) as reservas_activas
from reservas
where estado not in ('Cancelada','Finalizada')
group by paquete
order by reservas_activas desc;

-- Pagos no deben superar el total de su reserva
select r.codigo, r.total, coalesce(sum(p.valor),0) as pagado
from reservas r
left join pagos p on p.reserva_id = r.id
group by r.codigo, r.total
having coalesce(sum(p.valor),0) > r.total;
```

> Si algún caso exige reintento automático seguro tras un corte, falta idempotencia por
> clave de operación en creación/cobro (diseñarla en las RPC existentes con migración
> nueva). Hoy la regla es **revisar antes de repetir**; el bloqueo de doble clic no
> equivale a idempotencia de transporte.
