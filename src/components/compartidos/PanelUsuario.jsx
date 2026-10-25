import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarraLateral, CabeceraBarraLateral, ContenidoBarraLateral, PieBarraLateral } from "@/components/compartidos/BarraLateral";
import { useIdioma } from "@/lib/i18n.jsx";
import TextoDegradado from "@/components/reactbits/TextoDegradado";

const coloresMarca = ["#2563eb", "#0ea5e9", "#2563eb"];

export default function PanelUsuario({ perfil, alSalir, navegacion, vista, alNavegar, titulo, subtitulo, controles, pie, children }) {
  const { t } = useIdioma();
  const reducirMovimiento = useReducedMotion();
  const [menuAbierto, cambiarMenu] = useState(false);
  const navegar = (destino) => { if (alNavegar(destino) !== false) cambiarMenu(false); };
  return <div className="relative z-10 flex min-h-screen">
    <a href="#contenido-panel" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3">{t("asesor.saltar")}</a>
    <BarraLateral abierta={menuAbierto}>
      <CabeceraBarraLateral><button type="button" onClick={() => navegar(navegacion[0].id)} title={t(navegacion[0].etiqueta || `nav.${navegacion[0].id}`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-1 hover:bg-sky-500/10 focus-visible:ring-2">
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(37,99,235,0.22)] ring-1 ring-blue-100"><img src="/logo-mark.png" alt="" width="32" height="32" /></span>
        <span className="text-lg font-bold">Nóva<TextoDegradado colors={coloresMarca}>Travel</TextoDegradado></span>
      </button></CabeceraBarraLateral>
      <ContenidoBarraLateral etiqueta={t("paquetes.navegacion")}>
        {navegacion.map((opcion) => <div key={opcion.id}>
          {opcion.group && <p className="mb-1 mt-4 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">{t(`grp.${opcion.group}`)}</p>}
          <button type="button" aria-current={vista === opcion.id ? "page" : undefined} onClick={() => navegar(opcion.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm focus-visible:ring-2 ${vista === opcion.id ? "border border-blue-200 bg-gradient-to-br from-sky-500/15 to-blue-600/15 font-medium text-blue-700 shadow-sm dark:border-sky-500/30 dark:text-sky-300" : "text-muted-foreground hover:bg-sky-500/10 hover:text-blue-700 dark:hover:text-sky-300"}`}>
            <opcion.icon aria-hidden="true" className="h-[18px] w-[18px]" />{t(opcion.etiqueta || `nav.${opcion.id}`)}
          </button>
        </div>)}
      </ContenidoBarraLateral>
      <PieBarraLateral>
        <Button variant="ghost" onClick={alSalir} className="w-full justify-start gap-3 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"><LogOut aria-hidden="true" className="h-4 w-4" />{t("paquetes.cerrarSesion")}</Button>
        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/60 px-3 py-3">
          <div aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">{perfil.nombre?.slice(0, 2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" title={perfil.nombre}>{perfil.nombre}</p><p className="truncate text-xs text-muted-foreground" title={perfil.correo || t("acceso.demo")}>{perfil.correo || t("acceso.demo")}</p></div>
        </div>
      </PieBarraLateral>
    </BarraLateral>
    {menuAbierto && <button type="button" aria-label={t("btn.cancel")} className="fixed inset-0 z-20 bg-slate-900/20 md:hidden" onClick={() => cambiarMenu(false)} />}
    <main id="contenido-panel" className="min-h-screen min-w-0 flex-1 p-6 md:ml-64 md:p-8">
      <motion.div initial={reducirMovimiento ? false : { y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3">
        <Button variant="outline" size="icon" aria-label={t("acceso.menu")} className="md:hidden" onClick={() => cambiarMenu(true)}><Menu aria-hidden="true" className="h-5 w-5" /></Button>
        <div><h1 className="text-2xl font-semibold">{titulo}</h1>{subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}</div>
      </div><div className="flex flex-wrap items-center justify-end gap-2">{controles}</div></motion.div>
      {children}{pie}
    </main>
  </div>;
}
