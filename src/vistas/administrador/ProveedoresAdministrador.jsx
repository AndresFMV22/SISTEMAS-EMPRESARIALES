import TablaRegistros from "@/components/administrador/TablaRegistros";
import { useIdioma } from "@/lib/i18n.jsx";

export default function ProveedoresAdministrador({ filas, accion }) {
  const { t } = useIdioma();
  return <TablaRegistros titulo={t("nav.proveedores")} accion={accion}
    columnas={["Proveedor", "Tipo", "Contacto", "Convenio", "Estado"]}
    filas={filas.map((fila) => [fila[0], fila[1], fila[2], fila[3], { tono: fila[4], texto: fila[5] }])} />;
}
