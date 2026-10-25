import TablaRegistros from "@/components/administrador/TablaRegistros";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";

export default function PagosAdministrador({ filas, accion }) {
  const { t } = useIdioma();
  return <TablaRegistros titulo={t("nav.pagos")} accion={accion}
    columnas={["Recibo", "Reserva", "Cliente", "Método", "Valor", "Fecha", "Estado"]}
    filas={filas.map((fila) => [fila[0], fila[1], fila[2], fila[3], mostrarDinero(fila[4]), fila[5], { tono: fila[6], texto: fila[7] }])} />;
}
