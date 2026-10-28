import { Database, CircleAlert } from "lucide-react";
import { useIdioma } from "@/lib/i18n.jsx";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";

export default function EstadoConexion({ origen }) {
  const { t } = useIdioma();
  return <div role={origen === "supabase" ? undefined : "status"} className="hidden lg:flex"><IndicadorEstado estado={origen === "supabase" ? "activo" : origen === "demo" || origen === "loading" ? origen : "error"}
    etiqueta={<>{origen === "supabase" ? <Database aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" /> : <CircleAlert aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />}{t(origen === "supabase" ? "tb.db" : origen === "demo" ? "tb.demo" : origen === "loading" ? "acceso.validando" : "acceso.bloqueado")}</>} /></div>;
}
