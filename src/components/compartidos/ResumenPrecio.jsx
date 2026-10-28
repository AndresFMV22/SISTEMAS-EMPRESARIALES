import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";
import { beneficioPromocion, condicionPromocion } from "@/lib/promociones";
import IndicadorEstado from "./IndicadorEstado";

export default function ResumenPrecio({ cotizacion }) {
  const { t } = useIdioma();
  const promocion = cotizacion.promocion;
  return <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
    <dl className="space-y-2 tabular-nums">{[["asesor.precioPersona", cotizacion.precio_persona], ["promos.subtotal", cotizacion.subtotal], ["promos.descuento", cotizacion.descuento], ["pay.total", cotizacion.total]].map(([clave, valor]) => <div key={clave} className={`flex flex-wrap justify-between gap-2 ${clave === "pay.total" ? "border-t border-border pt-2 font-bold" : ""}`}><dt>{t(clave)}</dt><dd>{valor == null ? "—" : mostrarDinero(valor)}</dd></div>)}</dl>
    {promocion ? <div className="space-y-1 border-t border-border pt-2"><p className="font-medium">{promocion.nombre} · {beneficioPromocion(promocion, t)}</p><p className="text-xs text-muted-foreground">{condicionPromocion(promocion, t)}</p>
      {!cotizacion.aplica && <><IndicadorEstado estado="no aplica" etiqueta={t("promos.noAplica")} /><p className="text-xs text-amber-700 dark:text-amber-300">{t("promos.condicionIncumplida")}</p></>}
    </div> : <IndicadorEstado estado="sin promocion" etiqueta={t("promos.sinPromocion")} />}
  </div>;
}
