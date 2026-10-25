import TablaRegistros from "@/components/administrador/TablaRegistros";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";

export default function FacturasAdministrador({ filas, accion }) {
  const { t } = useIdioma();
  return <TablaRegistros titulo={t("nav.facturas")} accion={accion}
    columnas={["Factura", "Cliente", "NIT / CC", "Reserva", "Valor + IVA", "Fecha", "Estado DIAN"]}
    filas={filas.map((fila) => [fila[0], fila[1], fila[2], fila[3], mostrarDinero(fila[4]), fila[5], { tono: fila[6], texto: fila[7] }])} />;
}
