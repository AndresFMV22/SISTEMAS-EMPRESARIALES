import { useState, useMemo } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Panel, CabeceraTabla } from "@/components/administrador/ElementosTabla";
import DialogoPago from "@/components/administrador/DialogoPago";
import { useIdioma } from "@/lib/i18n.jsx";
import { nivelPago } from "@/lib/estados";
import { EstadoAsesor } from "@/components/compartidos/FormulariosReserva";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";

const campo = "mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring";

export default function ReservasAdministrador({ reservas, alPagar, obtenerSaldo, accion, esGestionada, alGestionar }) {
  const { t } = useIdioma();
  const [buscar, setBuscar] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [asesor, setAsesor] = useState("");
  const [estadoReserva, setEstadoReserva] = useState("");
  const [estadoPago, setEstadoPago] = useState("");
  const asesores = useMemo(() => [...new Set(reservas.map((fila) => fila[5]).filter(Boolean))], [reservas]);
  const estadosReserva = useMemo(() => [...new Set(reservas.map((fila) => fila[7]).filter(Boolean))], [reservas]);
  const nivelReserva = (reserva) => nivelPago(reserva[8]?.estado_pago, obtenerSaldo(reserva[0]));

  const texto = buscar.trim().toLowerCase();
  const filtradas = reservas.filter((reserva) => {
    if (texto && ![reserva[0], reserva[1], reserva[2]].some((c) => String(c || "").toLowerCase().includes(texto))) return false;
    if (desde && reserva[4] < desde) return false;
    if (hasta && reserva[4] > hasta) return false;
    if (asesor && reserva[5] !== asesor) return false;
    if (estadoReserva && reserva[7] !== estadoReserva) return false;
    if (estadoPago && nivelReserva(reserva) !== estadoPago) return false;
    return true;
  });
  const limpiar = () => { setBuscar(""); setDesde(""); setHasta(""); setAsesor(""); setEstadoReserva(""); setEstadoPago(""); };

  return <Panel titulo={t("nav.reservas")} etiqueta={accion}>
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card/60 p-3">
      <label className="text-xs text-muted-foreground">{t("flt.buscarReserva")}<Input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder={t("tb.search")} className="mt-1 w-60" /></label>
      <label className="text-xs text-muted-foreground">{t("dash.from")}<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={campo} /></label>
      <label className="text-xs text-muted-foreground">{t("dash.to")}<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} /></label>
      <label className="text-xs text-muted-foreground">{t("col.asesor")}<select value={asesor} onChange={(e) => setAsesor(e.target.value)} className={campo}><option value="">{t("rep.todos")}</option>{asesores.map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">{t("fases.estadoReserva")}<select value={estadoReserva} onChange={(e) => setEstadoReserva(e.target.value)} className={campo}><option value="">{t("rep.todos")}</option>{estadosReserva.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">{t("fases.estadoPago")}<select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)} className={campo}><option value="">{t("rep.todos")}</option><option value="pendiente">{t("flt.pago.pendiente")}</option><option value="parcial">{t("flt.pago.parcial")}</option><option value="pagado">{t("flt.pago.pagado")}</option></select></label>
      <Button variant="outline" size="sm" onClick={limpiar}>{t("flt.limpiar")}</Button>
    </div>
    <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
      <CabeceraTabla>{t("col.reserva")}</CabeceraTabla><CabeceraTabla>{t("col.cliente")}</CabeceraTabla><CabeceraTabla>{t("col.paquete")}</CabeceraTabla><CabeceraTabla>{t("col.pax")}</CabeceraTabla>
      <CabeceraTabla>{t("col.fecha")}</CabeceraTabla><CabeceraTabla>{t("col.asesor")}</CabeceraTabla><CabeceraTabla>{t("fases.estadoReserva")}</CabeceraTabla><CabeceraTabla>{t("fases.estadoPago")}</CabeceraTabla><CabeceraTabla>{t("col.accion")}</CabeceraTabla>
    </TableRow></TableHeader><TableBody>
      {filtradas.map((reserva) => <TableRow key={reserva[0]} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
        <TableCell className="font-medium text-foreground">{reserva[0]}</TableCell><TableCell>{reserva[1]}</TableCell><TableCell>{reserva[2]}</TableCell><TableCell>{reserva[3]}</TableCell><TableCell>{reserva[4]}</TableCell><TableCell>{reserva[5]}</TableCell>
        <TableCell>{["Pagada", "Pago parcial", "En proceso"].includes(reserva[7]) && !esGestionada(reserva)
          ? <div className="flex flex-wrap gap-1"><IndicadorEstado estado="historico" etiqueta={t("fases.historico")} /><EstadoAsesor estado={reserva[7]} /></div>
          : <EstadoAsesor estado={reserva[7]} tipo="reserva" />}</TableCell>
        <TableCell><EstadoAsesor estado={reserva[8]?.estado_pago || (obtenerSaldo(reserva[0]).pagado > 0 ? obtenerSaldo(reserva[0]).saldo === 0 ? "Pagado" : "Pago parcial" : "Pendiente")} tipo="pago" /></TableCell>
        <TableCell><div className="flex flex-wrap gap-2">{esGestionada(reserva) && <Button size="sm" variant="outline" onClick={alGestionar}>{t("asesor.gestion")}</Button>}{["Cancelada", "Finalizada"].includes(reserva[7]) ? null : obtenerSaldo(reserva[0]).saldo <= 0
          ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-4 w-4" />{t("st.paid")}</span>
          : <DialogoPago codigo={reserva[0]} informacion={obtenerSaldo(reserva[0])} alPagar={alPagar} />}</div></TableCell>
      </TableRow>)}
      {filtradas.length === 0 && <TableRow><TableCell colSpan={9} className="py-6 text-center text-muted-foreground">{t("flt.sinResultados")}</TableCell></TableRow>}
    </TableBody></Table>
  </Panel>;
}
