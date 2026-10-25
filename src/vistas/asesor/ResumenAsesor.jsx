import { Button } from "@/components/ui/button";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { SeccionAsesor, TablaAsesor, mismoId, perteneceReserva, saldoReserva, dineroOpcional } from "@/components/compartidos/FormulariosReserva";

export default function ResumenAsesor({ datos, perfil, alReserva }) {
  const { t } = useIdioma();
  const fecha = useFechaColombia();
  const propias = datos.reservas.filter((fila) => mismoId(fila.empleado_id, perfil.empleado_id));
  const pagosPropios = datos.pagos.filter((fila) => propias.some((reserva) => perteneceReserva(fila, reserva)));
  const activas = propias.filter((fila) => !["Cancelada", "Finalizada"].includes(fila.estado));
  const proximos = activas.filter((fila) => fila.fecha_viaje && fila.fecha_viaje >= fecha)
    .sort((primera, segunda) => primera.fecha_viaje.localeCompare(segunda.fecha_viaje));
  const pendientes = activas.map((fila) => ({ reserva: fila, ...saldoReserva(fila, datos) })).filter((fila) => fila.saldo != null && fila.saldo > 0)
    .sort((primera, segunda) => segunda.saldo - primera.saldo);
  const indicadores = [
    ["asesor.activas", propias.filter((fila) => !["Cancelada", "Finalizada"].includes(fila.estado)).length],
    ["pay.paid", mostrarDinero(pagosPropios.reduce((suma, fila) => suma + fila.valor, 0))],
    ["asesor.pendientes", datos.solicitudes.filter((fila) => fila.estado === "pendiente" && propias.some((reserva) => mismoId(reserva.id, fila.reserva_id))).length],
    ["nav.clientes", datos.clientes.length],
  ];
  return <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{indicadores.map(([clave, valor]) => <SeccionAsesor key={clave}>
      <p className="text-sm text-muted-foreground">{t(clave)}</p><p className="break-words text-2xl font-bold tabular-nums">{valor}</p>
    </SeccionAsesor>)}</div>
    <SeccionAsesor titulo={t("dash.recientes")}><TablaAsesor columnas={[t("col.reserva"), t("col.cliente"), t("col.fecha"), t("pay.saldo"), t("col.accion")]}
      filas={propias.slice(0, 12).map((fila) => [fila.codigo, fila.cliente, fila.fecha_viaje, dineroOpcional(saldoReserva(fila, datos).saldo),
        <Button key="detalle" size="sm" variant="outline" onClick={() => alReserva(fila)}>{t("asesor.verDetalle")}</Button>])} />
    </SeccionAsesor>
    <SeccionAsesor titulo={t("asesor.viajesProximos")}>
      <p className="text-sm text-muted-foreground">{t("asesor.viajesProximosAyuda")}</p>
      <TablaAsesor columnas={[t("col.reserva"), t("col.cliente"), t("col.paquete"), t("pkg.salida"), t("col.accion")]}
        filas={proximos.map((fila) => [fila.codigo, fila.cliente, fila.paquete, fila.fecha_viaje,
          <Button key="detalle" size="sm" variant="outline" onClick={() => alReserva(fila)}>{t("asesor.verDetalle")}</Button>])} />
    </SeccionAsesor>
    <SeccionAsesor titulo={t("asesor.saldosPendientes")}>
      <p className="text-sm text-muted-foreground">{t("asesor.saldosPendientesAyuda")}</p>
      <TablaAsesor columnas={[t("col.reserva"), t("col.cliente"), t("pay.total"), t("pay.paid"), t("pay.saldo"), t("col.accion")]}
        filas={pendientes.map((fila) => [fila.reserva.codigo, fila.reserva.cliente, mostrarDinero(fila.total), mostrarDinero(fila.pagado), mostrarDinero(fila.saldo),
          <Button key="detalle" size="sm" variant="outline" onClick={() => alReserva(fila.reserva)}>{t("asesor.verDetalle")}</Button>])} />
    </SeccionAsesor>
  </>;
}
