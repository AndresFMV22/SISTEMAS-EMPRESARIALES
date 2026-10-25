import { Database, CircleAlert } from "lucide-react";
import { useIdioma } from "@/lib/i18n.jsx";

export default function EstadoConexion({ origen }) {
  const { t } = useIdioma();
  if (origen === "supabase") return <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 lg:flex"><Database className="h-3.5 w-3.5" />{t("tb.db")}</div>;
  return <div role="status" className="hidden items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 lg:flex"><CircleAlert className="h-3.5 w-3.5" />{t(origen === "demo" ? "tb.demo" : origen === "loading" ? "acceso.validando" : "acceso.bloqueado")}</div>;
}
