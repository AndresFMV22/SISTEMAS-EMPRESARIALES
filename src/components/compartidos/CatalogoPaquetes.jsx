import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Palmtree, Umbrella, Landmark, Waves, FerrisWheel, Mountain, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIdioma } from "@/lib/i18n.jsx";
import { estadoPaquete, obtenerCupos, duracionPaquete, ubicacionSinDuracion } from "@/lib/paquetes";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { mostrarDinero } from "@/lib/dinero";
import ContenidoComercial from "./ContenidoComercial";
import IndicadorEstado from "./IndicadorEstado";
import { promocionesVigentes, beneficioPromocion, condicionPromocion } from "@/lib/promociones";

const iconos = { umbrella: Umbrella, landmark: Landmark, waves: Waves, ferriswheel: FerrisWheel, mountain: Mountain, building: Building };
const cristal = "border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";

export default function CatalogoPaquetes({ paquetes, accion, alEditar }) {
  const { t } = useIdioma();
  const reducirMovimiento = useReducedMotion();
  const fecha = useFechaColombia();
  const [desde, cambiarDesde] = useState("");
  const [hasta, cambiarHasta] = useState("");
  const [filtroEstado, cambiarFiltroEstado] = useState("todos");
  const catalogo = paquetes.map((paquete) => ({ paquete, estado: estadoPaquete(paquete, fecha) })).filter(({ estado }) => estado !== "finalizado");
  const lista = catalogo.filter(({ paquete, estado }) => (filtroEstado === "todos" || estado === filtroEstado)
    && (!desde || (paquete.salida && paquete.salida >= desde)) && (!hasta || (paquete.salida && paquete.salida <= hasta)));
  return <div className="space-y-5">
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${cristal}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays aria-hidden="true" className="h-4 w-4 text-blue-500" /><span className="font-medium">{t("pkg.salida")}:</span>
        <label htmlFor="catalogo-desde">{t("dash.from")}</label><Input id="catalogo-desde" type="date" value={desde} onChange={(evento) => cambiarDesde(evento.target.value)} className="h-8 w-[150px]" />
        <label htmlFor="catalogo-hasta">{t("dash.to")}</label><Input id="catalogo-hasta" type="date" value={hasta} onChange={(evento) => cambiarHasta(evento.target.value)} className="h-8 w-[150px]" />
        {(desde || hasta) && <Button size="sm" variant="ghost" onClick={() => { cambiarDesde(""); cambiarHasta(""); }}>{t("dash.clear")}</Button>}
      </div>{accion}
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("paquetes.filtroEstado")}>
      {["todos", "disponible", "lleno", "en_viaje", "incompleto"].map((estado) => {
        const cantidad = estado === "todos" ? catalogo.length : catalogo.filter((elemento) => elemento.estado === estado).length;
        if (estado === "incompleto" && cantidad === 0) return null;
        return <Button key={estado} variant={filtroEstado === estado ? "default" : "outline"} aria-pressed={filtroEstado === estado} onClick={() => cambiarFiltroEstado(estado)}>{t(`paquetes.filtro.${estado}`)} <span className="ml-1 tabular-nums">{cantidad}</span></Button>;
      })}
    </div>
    {lista.length === 0 ? <p role="status" className={`rounded-2xl px-5 py-12 text-center text-sm text-muted-foreground ${cristal}`}>{t(catalogo.length === 0 ? "paquetes.catalogoVacio" : "paquetes.sinResultados")}</p>
      : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{lista.map(({ paquete, estado }, indice) => {
        const Icono = iconos[paquete.icono] || Palmtree;
        const cupos = obtenerCupos(paquete);
        const duracion = duracionPaquete(paquete.salida, paquete.regreso);
        const lleno = estado === "lleno", enViaje = estado === "en_viaje", incompleto = estado === "incompleto";
        const superficie = lleno ? "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800" : enViaje ? "border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950" : incompleto ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950" : "border-border/70 bg-card/80";
        const cabecera = lleno ? "bg-slate-300 dark:bg-slate-700" : enViaje ? "bg-sky-200 dark:bg-sky-900" : incompleto ? "bg-amber-100 dark:bg-amber-900" : "bg-gradient-to-br from-sky-500 to-blue-600";
        return <motion.div key={paquete.id ?? paquete.nombre} initial={reducirMovimiento ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: indice * 0.06, duration: 0.45 }}>
          <article aria-label={`${paquete.nombre}: ${t(`paquetes.estado.${estado}`)}`} className={`h-full overflow-hidden rounded-2xl border shadow-sm ${superficie}`}>
          <div className={`relative flex min-h-32 flex-col items-center justify-center gap-2 px-4 py-5 ${cabecera}`}>
            <Icono aria-hidden="true" className={`h-12 w-12 ${estado === "disponible" ? "text-white" : "text-slate-600 dark:text-slate-300"}`} strokeWidth={1.5} />
            <IndicadorEstado estado={estado} etiqueta={t(`paquetes.estado.${estado}`)} grande={estado !== "disponible"} />
          </div>
          <div className="p-4"><b className="text-[15px]">{paquete.nombre}</b><div className="mb-3 mt-0.5 text-xs text-muted-foreground">{ubicacionSinDuracion(paquete.ubicacion)}</div>
            {duracion && <p className="mb-2 text-xs text-muted-foreground">{duracion.dias} {t(duracion.dias === 1 ? "fases.dia" : "fases.dias")} / {duracion.noches} {t(duracion.noches === 1 ? "fases.noche" : "fases.noches")}</p>}
            <div className={`break-words text-lg font-bold ${lleno ? "text-slate-600 dark:text-slate-300" : "text-blue-700 dark:text-sky-300"}`}>{mostrarDinero(paquete.precio)}</div>
            {promocionesVigentes(paquete, fecha).map((promocion) => <div key={promocion.id} className="mt-2 space-y-1 rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <IndicadorEstado estado="vigente" etiqueta={t("promos.ofertaOpcional")} /><p className="font-semibold">{promocion.nombre} · {beneficioPromocion(promocion, t)}</p><p>{condicionPromocion(promocion, t)}</p><p>{promocion.desde} — {promocion.hasta}</p>
            </div>)}
            <p className="mt-2 text-xs font-semibold">{cupos ? `${cupos.disponibles} / ${cupos.capacidad} · ${t("paquetes.cuposDisponibles")}` : t("paquetes.cuposSinDefinir")}</p>
            {paquete.cupo?.includes("·") && <p className="mt-1 text-xs text-muted-foreground">{paquete.cupo.split("·").slice(1).join("·").trim()}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{t(`paquetes.detalle.${estado}`)}</p>
            {(paquete.salida || paquete.regreso) && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-blue-500" /><span>{t("pkg.salida")}: <b>{paquete.salida || "—"}</b></span><span>· {t("pkg.regreso")}: <b>{paquete.regreso || "—"}</b></span></div>}
            <details className="mt-3 text-sm"><summary className="cursor-pointer rounded focus-visible:ring-2">{t("asesor.detallePaquete")}</summary><div className="mt-3"><ContenidoComercial contenido={paquete.catalogo_completo || paquete.descripcion || paquete.servicios?.length ? paquete : null} /></div></details>
            {alEditar && <Button className="mt-3" variant="outline" size="sm" onClick={() => alEditar(paquete)}>{t("catalogo.editarPaquete")}</Button>}
          </div>
        </article></motion.div>;
      })}</div>}
  </div>;
}
