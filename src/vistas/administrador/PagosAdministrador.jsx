import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TablaRegistros from "@/components/administrador/TablaRegistros";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero, leerDinero } from "@/lib/dinero";
import { nivelPago } from "@/lib/estados";

const campo = "mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring";

export default function PagosAdministrador({ filas, reservas = [], obtenerSaldo, accion }) {
  const { t } = useIdioma();
  const [buscar, setBuscar] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [metodo, setMetodo] = useState("");
  const [estado, setEstado] = useState("");
  const metodos = useMemo(() => [...new Set(filas.map((fila) => fila[3]).filter(Boolean))], [filas]);
  const nivelReserva = (codigo) => nivelPago(reservas.find((fila) => fila[0] === codigo)?.[8]?.estado_pago, obtenerSaldo ? obtenerSaldo(codigo) : {});

  const texto = buscar.trim().toLowerCase();
  const filtradas = filas.filter((fila) => {
    if (texto && ![fila[0], fila[1], fila[2]].some((c) => String(c || "").toLowerCase().includes(texto))) return false;
    if (desde && fila[5] < desde) return false;
    if (hasta && fila[5] > hasta) return false;
    if (metodo && fila[3] !== metodo) return false;
    if (estado && nivelReserva(fila[1]) !== estado) return false;
    return true;
  });
  const total = filtradas.reduce((suma, fila) => suma + leerDinero(fila[4]), 0);
  const limpiar = () => { setBuscar(""); setDesde(""); setHasta(""); setMetodo(""); setEstado(""); };

  return <div className="space-y-3">
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card/60 p-3">
      <label className="text-xs text-muted-foreground">{t("flt.buscarPago")}<Input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder={t("tb.search")} className="mt-1 w-60" /></label>
      <label className="text-xs text-muted-foreground">{t("dash.from")}<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={campo} /></label>
      <label className="text-xs text-muted-foreground">{t("dash.to")}<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={campo} /></label>
      <label className="text-xs text-muted-foreground">{t("flt.metodo")}<select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={campo}><option value="">{t("rep.todos")}</option>{metodos.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">{t("fases.estadoPago")}<select value={estado} onChange={(e) => setEstado(e.target.value)} className={campo}><option value="">{t("rep.todos")}</option><option value="pendiente">{t("flt.pago.pendiente")}</option><option value="parcial">{t("flt.pago.parcial")}</option><option value="pagado">{t("flt.pago.pagado")}</option></select></label>
      <Button variant="outline" size="sm" onClick={limpiar}>{t("flt.limpiar")}</Button>
      <div className="ml-auto text-sm"><span className="text-muted-foreground">{t("flt.totalMovimientos")}: </span><b className="tabular-nums">{mostrarDinero(total)}</b></div>
    </div>
    <TablaRegistros titulo={t("nav.pagos")} accion={accion}
      columnas={["Recibo", "Reserva", "Cliente", "Método", "Valor", "Fecha", "Estado"]}
      filas={filtradas.map((fila) => [fila[0], fila[1], fila[2], fila[3], mostrarDinero(fila[4]), fila[5], { tono: fila[6], texto: fila[7] }])} />
    {filtradas.length === 0 && <p className="text-sm text-muted-foreground">{t("flt.sinResultados")}</p>}
  </div>;
}
