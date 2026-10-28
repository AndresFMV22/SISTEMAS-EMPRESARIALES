import { Button } from "@/components/ui/button";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";
import { SeccionAsesor, TablaAsesor, EstadoAsesor, perteneceReserva } from "@/components/compartidos/FormulariosReserva";

export default function PagosAsesor({ datos, alReserva }) {
  const { t } = useIdioma();
  return <SeccionAsesor titulo={t("nav.pagos")}><TablaAsesor columnas={[t("asesor.recibo"), t("col.reserva"), t("col.cliente"), t("asesor.metodo"), t("asesor.valor"), t("col.fecha"), t("fases.estadoPago"), t("col.accion")]}
    filas={datos.pagos.map((pago) => {
      const relacionada = datos.reservas.find((fila) => perteneceReserva(pago, fila));
      return [pago.recibo, pago.reserva, pago.cliente, pago.metodo, mostrarDinero(pago.valor), pago.fecha, <EstadoAsesor key="estado" estado={pago.estado} tipo="pago" />, relacionada
        ? <Button key="comprobante" size="sm" variant="outline" onClick={() => alReserva(relacionada)}>{t("asesor.comprobante")}</Button> : "—"];
    })} />
  </SeccionAsesor>;
}
