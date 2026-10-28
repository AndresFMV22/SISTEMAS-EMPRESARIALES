import { useState } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Panel, CabeceraTabla, EtiquetaEstado } from "@/components/administrador/ElementosTabla";
import BordeBrillante from "@/components/reactbits/BordeBrillante";
import TarjetaIluminada from "@/components/reactbits/TarjetaIluminada";
import ContadorAnimado from "@/components/reactbits/ContadorAnimado";
import { useIdioma } from "@/lib/i18n.jsx";
import { leerDinero, mostrarDinero } from "@/lib/dinero";

const cristal = "border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";
const aparecer = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

function crearIndicadores({ clientes, paquetes, reservas, pagos }) {
  const ingresos = pagos.reduce((total, pago) => total + leerDinero(pago[4]), 0);
  const cupos = paquetes.reduce((total, paquete) => total + (Number(paquete.cupo?.match(/Cupos:\s*(\d+)/i)?.[1]) || 0), 0);
  return [
    { lbl: "Reservas activas", to: reservas.filter((reserva) => !["Cancelada", "Finalizada"].includes(reserva[7])).length },
    { lbl: "Pagos registrados", to: ingresos, prefix: "$ " },
    { lbl: "Clientes registrados", to: clientes.length },
    { lbl: "Cupos mostrados", to: cupos },
  ];
}

function ventasPorMes(pagos) {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return meses.map((mes, indice) => [mes, pagos.filter((pago) => Number(pago[5]?.slice(5, 7)) === indice + 1).reduce((suma, pago) => suma + leerDinero(pago[4]), 0)]);
}

function paquetesMasReservados(reservas) {
  const cantidades = new Map();
  reservas.forEach((reserva) => cantidades.set(reserva[2], (cantidades.get(reserva[2]) || 0) + 1));
  return [...cantidades].sort((primero, segundo) => segundo[1] - primero[1]).slice(0, 5);
}

function TarjetaIndicador({ indicador, indice }) {
  return <motion.div variants={aparecer} custom={indice} initial="hidden" animate="show">
    <BordeBrillante color="#38bdf8" speed="6s" thickness={1}>
      <TarjetaIluminada className={`rounded-2xl p-5 ${cristal}`} spotlightColor="rgba(37,99,235,0.12)">
        <div className="relative z-[2]">
          <p className="mb-2 text-[13px] text-muted-foreground">{indicador.lbl}</p>
          <p className="break-words text-[clamp(1.05rem,2vw,1.6875rem)] font-bold text-foreground">
            <ContadorAnimado to={indicador.to} prefix={indicador.prefix || ""} suffix={indicador.suffix || ""} decimals={indicador.decimals || 0} duration={1.6} />
          </p>
        </div>
      </TarjetaIluminada>
    </BordeBrillante>
  </motion.div>;
}

function GraficoBarras({ pagos }) {
  const ventas = ventasPorMes(pagos);
  const maximo = Math.max(1, ...ventas.map((mes) => mes[1]));
  return <div className="flex h-[180px] items-end gap-3.5 pt-2">
    {ventas.map(([mes, valor], indice) => <div key={mes} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <motion.div className="w-3/5 rounded-t-lg bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:brightness-110"
        title={mostrarDinero(valor)} initial={{ height: 0 }} animate={{ height: `${(valor / maximo) * 100}%` }}
        transition={{ delay: indice * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      <small className="text-[11px] text-muted-foreground">{mes}</small>
    </div>)}
  </div>;
}

export default function ResumenAdministrador({ datos }) {
  const { t } = useIdioma();
  const { reservas, pagos } = datos;
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const filtradas = reservas.filter((reserva) => {
    const fecha = reserva[4];
    if (desde && (!fecha || fecha < desde)) return false;
    if (hasta && (!fecha || fecha > hasta)) return false;
    return true;
  });
  return <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {crearIndicadores(datos).map((indicador, indice) => <TarjetaIndicador key={indicador.lbl} indicador={indicador} indice={indice} />)}
    </div>
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <Panel titulo={t("dash.ventas")} etiqueta="COP"><GraficoBarras pagos={pagos} /></Panel>
      <Panel titulo={t("dash.destinos")} etiqueta="Top 5"><div className="divide-y divide-border">
        {paquetesMasReservados(reservas).map(([nombre, cantidad]) => <div key={nombre} className="flex items-center gap-3 py-2.5 transition-all hover:pl-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 dark:border-sky-500/30 bg-blue-500/10 text-xs font-bold text-blue-700 dark:text-sky-300">{nombre.slice(0, 2).toUpperCase()}</div>
          <div className="flex-1"><b className="text-sm text-foreground">{nombre}</b></div>
          <span className="text-sm font-semibold text-blue-600">{cantidad}</span>
        </div>)}
      </div></Panel>
    </div>
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 ${cristal}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4 text-blue-600" />{t("dash.filter")}</div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <label className="font-medium">{t("dash.from")}</label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 w-[160px]" />
        <label className="font-medium">{t("dash.to")}</label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 w-[160px]" />
        {(desde || hasta) && <Button size="sm" variant="ghost" className="h-8 px-2 text-blue-600 dark:text-sky-300" onClick={() => { setDesde(""); setHasta(""); }}>{t("dash.clear")}</Button>}
      </div>
      <span className="ml-auto rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-sky-300">{filtradas.length} · {t("nav.reservas")}</span>
    </div>
    <Panel titulo={t("dash.recientes")} etiqueta={<span className="text-[11px] font-medium text-blue-600 dark:text-sky-300">{t("col.fecha")}</span>}>
      <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
        <CabeceraTabla>{t("col.reserva")}</CabeceraTabla><CabeceraTabla>{t("col.cliente")}</CabeceraTabla><CabeceraTabla>{t("col.paquete")}</CabeceraTabla><CabeceraTabla>{t("col.fecha")}</CabeceraTabla><CabeceraTabla>{t("fases.estadoReserva")}</CabeceraTabla>
      </TableRow></TableHeader><TableBody>
        {filtradas.slice(0, 12).map((reserva) => <TableRow key={reserva[0]} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
          <TableCell className="font-medium text-foreground">{reserva[0]}</TableCell><TableCell>{reserva[1]}</TableCell><TableCell>{reserva[2]}</TableCell><TableCell>{reserva[4]}</TableCell><TableCell><EtiquetaEstado estado={reserva[7]} tono={reserva[6]}>{reserva[7] === "Pendiente" ? t("fases.pendienteConfirmacion") : reserva[7]}</EtiquetaEstado></TableCell>
        </TableRow>)}
        {filtradas.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">—</TableCell></TableRow>}
      </TableBody></Table>
    </Panel>
  </div>;
}
