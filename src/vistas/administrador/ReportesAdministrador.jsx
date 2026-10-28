import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, MapPin, Plane, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/administrador/ElementosTabla";
import TarjetaIluminada from "@/components/reactbits/TarjetaIluminada";
import ContadorAnimado from "@/components/reactbits/ContadorAnimado";
import { useIdioma } from "@/lib/i18n.jsx";
import { leerDinero } from "@/lib/dinero";

const cristal = "rounded-2xl p-5 border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";
const aparecer = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

const anioDe = (fecha) => (typeof fecha === "string" && /^\d{4}/.test(fecha) ? fecha.slice(0, 4) : null);

// Total pactado de una reserva (neto de descuentos). Null si no se conoce con fiabilidad.
function totalReserva(reserva, paquetes) {
  const meta = reserva[8] && typeof reserva[8] === "object" ? reserva[8] : null;
  if (meta?.total != null) return meta.total;
  const paquete = paquetes.find((fila) => fila.nombre === reserva[2]);
  const pax = Number(reserva[3]) || 0;
  return paquete && pax ? leerDinero(paquete.precio) * pax : null;
}

function tipoDestino(reserva, paquetes) {
  const meta = reserva[8] && typeof reserva[8] === "object" ? reserva[8] : null;
  const paquete = meta?.paquete_id != null
    ? paquetes.find((fila) => String(fila.id) === String(meta.paquete_id))
    : paquetes.find((fila) => fila.nombre === reserva[2]);
  const tipo = meta?.contenido_contratado?.tipo_destino || paquete?.tipo_destino;
  if (tipo === "nacional") return "nacional";
  if (tipo === "internacional") return "internacional";
  return "sinClasificar";
}

function Indicador({ etiqueta, valor, prefijo = "", indice, nota }) {
  return <motion.div variants={aparecer} custom={indice} initial="hidden" animate="show">
    <TarjetaIluminada className={cristal} spotlightColor="rgba(37,99,235,0.12)">
      <p className="mb-2 text-[13px] text-muted-foreground">{etiqueta}</p>
      <p className="break-words text-[clamp(1.05rem,2vw,1.6875rem)] font-bold text-foreground"><ContadorAnimado to={valor} prefix={prefijo} duration={1.6} /></p>
      {nota && <p className="mt-1 text-[11px] text-muted-foreground">{nota}</p>}
    </TarjetaIluminada>
  </motion.div>;
}

export default function ReportesAdministrador({ datos }) {
  const { t } = useIdioma();
  const { reservas, pagos, paquetes } = datos;
  const [anio, setAnio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const enPeriodo = (fecha) => {
    if (!fecha) return false;
    if (anio && anioDe(fecha) !== anio) return false;
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    return true;
  };

  const anios = [...new Set([...pagos.map((pago) => anioDe(pago[5])), ...reservas.map((reserva) => anioDe(reserva[4]))].filter(Boolean))].sort().reverse();

  // Cobros: por fecha de pago. Reservas: por fecha de viaje.
  const cobros = pagos.filter((pago) => enPeriodo(pago[5]));
  const dineroAbonado = cobros.reduce((suma, pago) => suma + leerDinero(pago[4]), 0);
  const reservasPeriodo = reservas.filter((reserva) => enPeriodo(reserva[4]));

  let valorReservado = 0;
  let sinTotal = 0;
  let saldoPendiente = 0;
  reservasPeriodo.forEach((reserva) => {
    const total = totalReserva(reserva, paquetes);
    if (total == null) { sinTotal += 1; return; }
    valorReservado += total;
    if (reserva[7] !== "Cancelada") {
      const pagado = pagos.filter((pago) => pago[1] === reserva[0]).reduce((suma, pago) => suma + leerDinero(pago[4]), 0);
      saldoPendiente += Math.max(total - pagado, 0);
    }
  });

  const asesorPorReserva = new Map(reservas.map((reserva) => [reserva[0], reserva[5] || "Sin asignar"]));
  const porAsesor = new Map();
  reservasPeriodo.forEach((reserva) => {
    const asesor = reserva[5] || "Sin asignar";
    const registro = porAsesor.get(asesor) || { reservas: 0, abonado: 0 };
    registro.reservas += 1;
    porAsesor.set(asesor, registro);
  });
  cobros.forEach((pago) => {
    const asesor = asesorPorReserva.get(pago[1]) || "Sin asignar";
    const registro = porAsesor.get(asesor) || { reservas: 0, abonado: 0 };
    registro.abonado += leerDinero(pago[4]);
    porAsesor.set(asesor, registro);
  });
  const asesores = [...porAsesor.entries()].sort((a, b) => b[1].reservas - a[1].reservas);

  const conteoTipo = { nacional: 0, internacional: 0, sinClasificar: 0 };
  reservasPeriodo.forEach((reserva) => { conteoTipo[tipoDestino(reserva, paquetes)] += 1; });
  const totalTipo = reservasPeriodo.length || 1;
  const distribucion = [
    [MapPin, t("rep.nacionales"), conteoTipo.nacional],
    [Plane, t("rep.internacionales"), conteoTipo.internacional],
    [HelpCircle, t("rep.sinClasificar"), conteoTipo.sinClasificar],
  ];

  return <div className="space-y-6">
    {/* Filtro de periodo explícito */}
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${cristal} py-3`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4 text-blue-600" />{t("rep.filtrar")}</div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <label className="font-medium">{t("rep.anio")}</label>
        <select value={anio} onChange={(e) => setAnio(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground">
          <option value="">{t("rep.todos")}</option>
          {anios.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
        </select>
        <label className="font-medium">{t("dash.from")}</label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 w-[150px]" />
        <label className="font-medium">{t("dash.to")}</label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 w-[150px]" />
        {(anio || desde || hasta) && <Button size="sm" variant="ghost" className="h-8 px-2 text-blue-600 dark:text-sky-300" onClick={() => { setAnio(""); setDesde(""); setHasta(""); }}>{t("dash.clear")}</Button>}
      </div>
      <span className="ml-auto text-[11px] text-muted-foreground">{t("rep.alcance")}</span>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Indicador etiqueta={t("rep.dineroAbonado")} valor={dineroAbonado} prefijo="$ " indice={0} nota={`${cobros.length} ${t("rep.pagosNota")}`} />
      <Indicador etiqueta={t("rep.valorReservado")} valor={valorReservado} prefijo="$ " indice={1} nota={sinTotal ? `${sinTotal} ${t("rep.sinTotal")}` : null} />
      <Indicador etiqueta={t("pay.saldo")} valor={saldoPendiente} prefijo="$ " indice={2} nota={t("rep.excluyeCanceladas")} />
      <Indicador etiqueta={t("rep.reservasPeriodo")} valor={reservasPeriodo.length} indice={3} />
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Panel titulo={t("rep.porAsesor")} etiqueta={t("rep.periodo")}>
        <div className="divide-y divide-border">
          {asesores.length === 0 && <p className="py-2 text-sm text-muted-foreground">—</p>}
          {asesores.map(([asesor, registro], indice) => <div key={asesor} className="flex items-center gap-3 py-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 dark:border-sky-500/30 bg-blue-500/10 text-sm font-bold text-blue-700 dark:text-sky-300">{indice + 1}</div>
            <div className="flex-1"><b className="text-sm text-foreground">{asesor}</b><small className="block text-[11.5px] text-muted-foreground">{registro.reservas} {t("rep.reservasSuf")} · {t("pay.paid").toLowerCase()} $ {registro.abonado.toLocaleString("es-CO")}</small></div>
            <span className="text-sm font-semibold text-blue-600">$ {registro.abonado.toLocaleString("es-CO")}</span>
          </div>)}
        </div>
      </Panel>
      <Panel titulo={t("rep.distribucion")} etiqueta={t("rep.porReservasPeriodo")}>
        <div className="space-y-4">
          {distribucion.map(([Icono, etiqueta, cantidad]) => {
            const porcentaje = Math.round((cantidad / totalTipo) * 100);
            return <div key={etiqueta}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground"><Icono className="h-4 w-4 text-blue-600" />{etiqueta}</span>
                <span className="font-semibold text-blue-600">{cantidad} · {porcentaje}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600" initial={{ width: 0 }} animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} /></div>
            </div>;
          })}
          <p className="text-[11px] text-muted-foreground">{t("rep.notaSinClasificar")}</p>
        </div>
      </Panel>
    </div>
  </div>;
}
