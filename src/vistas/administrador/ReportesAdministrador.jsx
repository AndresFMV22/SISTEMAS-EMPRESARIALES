import { motion } from "framer-motion";
import { Plane, Bus, Ship } from "lucide-react";
import { Panel } from "@/components/administrador/ElementosTabla";
import TarjetaIluminada from "@/components/reactbits/TarjetaIluminada";
import ContadorAnimado from "@/components/reactbits/ContadorAnimado";
import { leerDinero } from "@/lib/dinero";

const aparecer = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

export default function ReportesAdministrador({ datos }) {
  const { reservas, pagos, paquetes } = datos;
  const ventas = pagos.reduce((suma, pago) => suma + leerDinero(pago[4]), 0);
  const asesores = Object.entries(reservas.reduce((agrupados, reserva) => {
    const asesor = reserva[5] || "Sin asignar";
    agrupados[asesor] = (agrupados[asesor] || 0) + 1;
    return agrupados;
  }, {})).sort((primero, segundo) => segundo[1] - primero[1]);
  const nacionales = reservas.filter((reserva) => {
    const paquete = reserva[8]?.paquete_id != null ? paquetes.find((fila) => String(fila.id) === String(reserva[8].paquete_id)) : paquetes.find((fila) => fila.nombre === reserva[2]);
    const tipo = reserva[8]?.contenido_contratado?.tipo_destino || paquete?.tipo_destino;
    return tipo ? tipo === "nacional" : paquete?.ubicacion?.includes("Colombia");
  }).length;
  const totalViajes = reservas.length || 1;
  const distribucion = [[Plane, "Internacionales", Math.round((reservas.length - nacionales) / totalViajes * 100)], [Bus, "Nacionales", Math.round(nacionales / totalViajes * 100)], [Ship, "Cruceros", 0]];
  return <div className="space-y-6">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[
        { lbl: "Pagos registrados", to: ventas, prefix: "$ " },
        { lbl: "Pago promedio", to: pagos.length ? Math.round(ventas / pagos.length) : 0, prefix: "$ " },
        { lbl: "Reservas registradas", to: reservas.length },
      ].map((k, i) => <motion.div key={k.lbl} variants={aparecer} custom={i} initial="hidden" animate="show">
        <TarjetaIluminada className="rounded-2xl p-5 border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]" spotlightColor="rgba(37,99,235,0.12)">
          <p className="mb-2 text-[13px] text-muted-foreground">{k.lbl}</p>
          <p className="break-words text-[clamp(1.05rem,2vw,1.6875rem)] font-bold text-foreground"><ContadorAnimado to={k.to} prefix={k.prefix || ""} suffix={k.suffix || ""} decimals={k.decimals || 0} duration={1.6} /></p>
        </TarjetaIluminada>
      </motion.div>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel titulo="Reservas por asesor" etiqueta="total"><div className="divide-y divide-border">
        {asesores.map(([asesor, cantidad], indice) => <div key={asesor} className="flex items-center gap-3 py-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 dark:border-sky-500/30 bg-blue-500/10 text-sm font-bold text-blue-700 dark:text-sky-300">{indice + 1}</div>
          <div className="flex-1"><b className="text-sm text-foreground">{asesor}</b></div><span className="text-sm font-semibold text-blue-600">{cantidad} reservas</span>
        </div>)}
      </div></Panel>
      <Panel titulo="Distribución de reservas" etiqueta="por tipo"><div className="space-y-4">
        {distribucion.map(([Icono, etiqueta, porcentaje]) => <div key={etiqueta}>
          <div className="mb-1 flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-foreground"><Icono className="h-4 w-4 text-blue-600" />{etiqueta}</span><span className="font-semibold text-blue-600">{porcentaje}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600" initial={{ width: 0 }} animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} /></div>
        </div>)}
      </div></Panel>
    </div>
  </div>;
}
