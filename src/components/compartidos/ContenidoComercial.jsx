import { useIdioma } from "@/lib/i18n.jsx";
import IndicadorEstado from "./IndicadorEstado";

function ListaTexto({ texto }) {
  const lineas = String(texto || "").split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean);
  return lineas.length ? <ul className="list-disc space-y-1 pl-5">{lineas.map((linea, indice) => <li key={indice} className="whitespace-pre-wrap break-words">{linea}</li>)}</ul> : <p>—</p>;
}

export default function ContenidoComercial({ contenido, contratado = false }) {
  const { t } = useIdioma();
  if (!contenido) return <p className="text-xs text-muted-foreground">{t(contratado ? "catalogo.sinSnapshot" : "asesor.sinServicios")}</p>;
  const servicios = Array.isArray(contenido.servicios) ? contenido.servicios : [];
  return <div className="space-y-3 break-words text-sm">
    {contratado && <p className="text-xs text-muted-foreground">{t("catalogo.snapshotAyuda")}</p>}
    {contenido.tipo_destino && <p className="font-medium">{t(`catalogo.${contenido.tipo_destino}`)}</p>}
    {contenido.destino && <p>{contenido.destino}</p>}
    <div><h3 className="font-semibold">{t("catalogo.descripcion")}</h3><p className="whitespace-pre-wrap">{contenido.descripcion || "—"}</p></div>
    <div><h3 className="font-semibold">{t("catalogo.incluye")}</h3><ListaTexto texto={contenido.incluye} /></div>
    <div><h3 className="font-semibold">{t("catalogo.noIncluye")}</h3><ListaTexto texto={contenido.no_incluye} /></div>
    <div><h3 className="font-semibold">{t("catalogo.condiciones")}</h3><p className="whitespace-pre-wrap">{contenido.condiciones || "—"}</p></div>
    <div className="space-y-2"><h3 className="font-semibold">{t("catalogo.servicios")}</h3>
      {servicios.length ? servicios.map((servicio, indice) => <div key={`${servicio.proveedor_id}-${servicio.servicio}-${indice}`} className="rounded-lg border border-border/70 p-3">
        <p className="font-medium">{servicio.nombre} · {t(`catalogo.servicio.${servicio.servicio}`)}</p><p className="whitespace-pre-wrap">{servicio.detalle}</p>
        {!contratado && servicio.activo != null && <div className="mt-2"><IndicadorEstado estado={servicio.activo ? "activo" : "inactivo"} etiqueta={t(servicio.activo ? "st.active" : "st.inactive")} /></div>}
        {!contratado && servicio.activo === false && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t("catalogo.servicioInactivo")}</p>}
      </div>) : <p className="text-xs text-muted-foreground">{t("catalogo.sinServiciosAsociados")}</p>}
    </div>
  </div>;
}
