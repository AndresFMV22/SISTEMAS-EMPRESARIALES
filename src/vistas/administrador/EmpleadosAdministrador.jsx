import VistaPersonas from "@/components/administrador/VistaPersonas";
import GestionAccesosEmpleados from "@/components/administrador/GestionAccesosEmpleados";
import { useIdioma } from "@/lib/i18n.jsx";

export default function EmpleadosAdministrador({ filas, accion, alCambiarActivo, alObservar, validarAcceso }) {
  const { t } = useIdioma();
  return <GestionAccesosEmpleados empleados={filas} validarAcceso={validarAcceso}>{(mostrarAcceso) => <VistaPersonas titulo={t("nav.empleados")} accion={accion}
    mostrarAcceso={mostrarAcceso} filas={filas || []}
    columnas={[{ label: "ID", idx: 0 }, { label: t("col.nombre"), idx: 1 }, { label: t("col.cargo"), idx: 2 }, { label: t("col.correo"), idx: 3 }, { label: t("col.tel"), idx: 4 }]}
    indiceActivo={5} indiceObservacion={6} indiceDesde={7} indiceHasta={8} alCambiarActivo={alCambiarActivo} alObservar={alObservar} />}</GestionAccesosEmpleados>;
}
