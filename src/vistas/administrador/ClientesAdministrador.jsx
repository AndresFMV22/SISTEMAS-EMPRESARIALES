import VistaPersonas from "@/components/administrador/VistaPersonas";
import { useIdioma } from "@/lib/i18n.jsx";

export default function ClientesAdministrador({ filas, accion, alCambiarActivo, alObservar }) {
  const { t } = useIdioma();
  return <VistaPersonas titulo={t("nav.clientes")} accion={accion} filas={filas}
    columnas={[{ label: "ID", idx: 0 }, { label: t("col.nombre"), idx: 1 }, { label: t("col.doc"), idx: 2 }, { label: t("col.correo"), idx: 3 }, { label: t("col.tel"), idx: 4 }]}
    indiceActivo={6} indiceObservacion={7} indiceDesde={8} indiceHasta={9} alCambiarActivo={alCambiarActivo} alObservar={alObservar} />;
}
