import { useEffect, useState } from "react";
import { CalendarDays, MessageSquarePlus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Panel, CabeceraTabla, EtiquetaEstado } from "./ElementosTabla";
import { useIdioma } from "@/lib/i18n.jsx";

function DialogoObservacion({ actual, alGuardar }) {
  const { t } = useIdioma();
  const [abierto, cambiarAbierto] = useState(false);
  const [observacion, cambiarObservacion] = useState(actual.obs);
  const [desde, cambiarDesde] = useState(actual.desde);
  const [hasta, cambiarHasta] = useState(actual.hasta);
  const [guardando, cambiarGuardando] = useState(false);
  const [error, cambiarError] = useState("");
  useEffect(() => { if (abierto) { cambiarObservacion(actual.obs); cambiarDesde(actual.desde); cambiarHasta(actual.hasta); } }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps
  const guardar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;
    cambiarGuardando(true); cambiarError("");
    try { await alGuardar({ obs: observacion, desde, hasta }); cambiarAbierto(false); }
    catch (fallo) { cambiarError(fallo.message); }
    finally { cambiarGuardando(false); }
  };
  return <Dialog open={abierto} onOpenChange={(valor) => { if (!guardando) cambiarAbierto(valor); }}>
    <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 gap-1 border-blue-200 dark:border-sky-500/30 text-blue-700 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-blue-400/15" />}><MessageSquarePlus className="h-3.5 w-3.5" />{t("btn.observ")}</DialogTrigger>
    <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t("obs.title")}</DialogTitle></DialogHeader>
      <form onSubmit={guardar} className="space-y-3">
        <div className="space-y-1.5"><Label>{t("obs.text")}</Label><textarea value={observacion} onChange={(evento) => cambiarObservacion(evento.target.value)} rows={3} className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>{t("obs.from")}</Label><Input type="date" value={desde} onChange={(evento) => cambiarDesde(evento.target.value)} /></div>
          <div className="space-y-1.5"><Label>{t("obs.to")}</Label><Input type="date" value={hasta} onChange={(evento) => cambiarHasta(evento.target.value)} /></div>
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose disabled={guardando} render={<Button type="button" variant="outline" />}>{t("btn.cancel")}</DialogClose>
          <Button type="submit" disabled={guardando} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t(guardando ? "acceso.esperar" : "btn.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function VistaPersonas({ titulo, accion, filas, columnas, indiceActivo, indiceObservacion, indiceDesde, indiceHasta, alCambiarActivo, alObservar, mostrarAcceso }) {
  const { t } = useIdioma();
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");
  const cambiarEstado = async (codigo, activo) => {
    if (ocupado) return;
    cambiarOcupado(true); cambiarError("");
    try { await alCambiarActivo(codigo, activo); }
    catch (fallo) { cambiarError(fallo.message); }
    finally { cambiarOcupado(false); }
  };
  return <Panel titulo={titulo} etiqueta={accion}>
    {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
    <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-border hover:bg-transparent">
      {columnas.map((columna) => <CabeceraTabla key={columna.label}>{columna.label}</CabeceraTabla>)}
      <CabeceraTabla>{t(mostrarAcceso ? "acceso.estadoEmpleado" : "col.estado")}</CabeceraTabla>{mostrarAcceso && <CabeceraTabla>{t("acceso.acceso")}</CabeceraTabla>}<CabeceraTabla>{t("col.observ")}</CabeceraTabla><CabeceraTabla>{t("col.accion")}</CabeceraTabla>
    </TableRow></TableHeader><TableBody>
      {filas.map((fila) => {
        const activo = fila[indiceActivo];
        return <TableRow key={fila[0]} className={`border-border hover:bg-sky-50 dark:hover:bg-sky-400/10 ${activo ? "" : "opacity-55"}`}>
          {columnas.map((columna, indice) => <TableCell key={indice} className={indice === 0 ? "font-medium text-foreground" : ""}>{fila[columna.idx]}</TableCell>)}
          <TableCell><EtiquetaEstado tono={activo ? "ok" : "bad"}>{activo ? t("st.active") : t("st.inactive")}</EtiquetaEstado></TableCell>
          {mostrarAcceso && <TableCell>{mostrarAcceso(fila)}</TableCell>}
          <TableCell className="max-w-[280px] align-top">{fila[indiceObservacion] ? <div className="flex flex-col items-start gap-1 py-0.5">
            <span className="text-xs leading-snug text-muted-foreground">{fila[indiceObservacion]}</span>
            {(fila[indiceDesde] || fila[indiceHasta]) && <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600"><CalendarDays className="h-3 w-3" />{fila[indiceDesde] || "—"} → {fila[indiceHasta] || "—"}</span>}
          </div> : <span className="text-xs text-slate-400">{t("empty")}</span>}</TableCell>
          <TableCell><div className="flex items-center gap-1.5">
            <DialogoObservacion actual={{ obs: fila[indiceObservacion] || "", desde: fila[indiceDesde] || "", hasta: fila[indiceHasta] || "" }} alGuardar={(observacion) => alObservar(fila[0], observacion)} />
            <Button size="sm" variant="outline" disabled={ocupado} onClick={() => cambiarEstado(fila[0], !activo)} className={`h-7 gap-1 ${activo ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/15" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-400/15"}`}><Power className="h-3.5 w-3.5" />{activo ? t("btn.deactivate") : t("btn.activate")}</Button>
          </div></TableCell>
        </TableRow>;
      })}
      {filas.length === 0 && <TableRow><TableCell colSpan={columnas.length + (mostrarAcceso ? 4 : 3)} className="py-6 text-center text-muted-foreground">{t("acceso.sinRegistros")}</TableCell></TableRow>}
    </TableBody></Table></div>
  </Panel>;
}
