import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Palmtree, CalendarDays, CreditCard,
  ReceiptText, Building2, BarChart3, Search, LogOut, Menu,
  Plus, Umbrella, Landmark, Waves, FerrisWheel, Mountain,
  Building, Bus, Ship, Plane, Database, CircleAlert, Check,
  Moon, Sun, Languages, Shield, Cookie, MessageSquarePlus, Power, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import Cuadricula from "@/components/reactbits/Cuadricula";
import ChispasAlClic from "@/components/reactbits/ChispasAlClic";
import TarjetaIluminada from "@/components/reactbits/TarjetaIluminada";
import TextoDegradado from "@/components/reactbits/TextoDegradado";
import ContadorAnimado from "@/components/reactbits/ContadorAnimado";
import BordeBrillante from "@/components/reactbits/BordeBrillante";
import { supabaseConfigurado } from "@/lib/supabase";
import { obtenerEntidades, insertarFila, actualizarFilas } from "@/lib/db";
import { DATOS_DEMO } from "@/lib/demoData";
import { useIdioma, IDIOMAS } from "@/lib/i18n.jsx";
import PuertaAcceso from "@/components/PuertaAcceso";
import GestionAccesosEmpleados from "@/components/GestionAccesosEmpleados";

const LOGO = "/logo-mark.png";

// Indicadores derivados de las mismas filas que muestran las tablas.
function crearIndicadores({ clientes, paquetes, reservas, pagos }) {
  const ingresos = pagos.reduce((total, pago) => total + leerDinero(pago[4]), 0);
  const cupos = paquetes.reduce((total, paquete) => total + (Number(paquete.cupo?.match(/Cupos:\s*(\d+)/i)?.[1]) || 0), 0);
  return [
    { lbl: "Reservas activas", to: reservas.filter((reserva) => !["Cancelada", "Finalizada"].includes(reserva[7])).length },
    { lbl: "Pagos registrados", to: ingresos / 1000000, prefix: "$ ", suffix: " M", decimals: 1 },
    { lbl: "Clientes registrados", to: clientes.length },
    { lbl: "Cupos mostrados", to: cupos },
  ];
}

function ventasPorMes(pagos) {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return meses.map((mes, indice) => [mes, pagos.filter((pago) => Number(pago[5]?.slice(5, 7)) === indice + 1).reduce((suma, pago) => suma + leerDinero(pago[4]), 0) / 1000000]);
}

function paquetesMasReservados(reservas) {
  const cantidades = new Map();
  reservas.forEach((reserva) => cantidades.set(reserva[2], (cantidades.get(reserva[2]) || 0) + 1));
  return [...cantidades].sort((primero, segundo) => segundo[1] - primero[1]).slice(0, 5);
}

const ICONOS = { umbrella: Umbrella, landmark: Landmark, waves: Waves, ferriswheel: FerrisWheel, mountain: Mountain, building: Building };

const NAVEGACION = [
  { id: "dash", icon: LayoutDashboard, group: null },
  { id: "clientes", icon: Users, group: "operacion" },
  { id: "paquetes", icon: Palmtree, group: null },
  { id: "reservas", icon: CalendarDays, group: null },
  { id: "pagos", icon: CreditCard, group: "finanzas" },
  { id: "facturas", icon: ReceiptText, group: null },
  { id: "proveedores", icon: Building2, group: "gestion" },
  { id: "empleados", icon: Users, group: null },
  { id: "reportes", icon: BarChart3, group: null },
];

/* ------------------------------ Utilidades UI ------------------------------ */
const estilosEstado = {
  ok: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
  warn: "bg-amber-500/12 text-amber-600 border-amber-500/25",
  bad: "bg-rose-500/12 text-rose-600 border-rose-500/25",
  info: "bg-sky-500/12 text-sky-600 border-sky-500/25",
};
function EtiquetaEstado({ tono, children }) {
  return (
    <Badge variant="outline" className={`rounded-full font-semibold ${estilosEstado[tono] || estilosEstado.info}`}>
      {(tono === "ok" || tono === "bad") && (
        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {children}
    </Badge>
  );
}

function Iniciales({ texto }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 dark:border-sky-500/30 bg-blue-500/10 text-xs font-bold text-blue-700 dark:text-sky-300">
      {texto.slice(0, 2).toUpperCase()}
    </div>
  );
}

function Marca({ tamano = "h-12 w-12", imagen = "h-10 w-10" }) {
  return (
    <div className={`grid ${tamano} place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(37,99,235,0.22)] ring-1 ring-blue-100`}>
      <img src={LOGO} alt="NóvaTravel" className={`${imagen} object-contain`} />
    </div>
  );
}

const cristal = "border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";

const aparecer = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

const coloresMarca = ["#2563eb", "#0ea5e9", "#2563eb"];

/* -------------------------------- Widgets -------------------------------- */
function TarjetaIndicador({ indicador, indice }) {
  return (
    <motion.div variants={aparecer} custom={indice} initial="hidden" animate="show">
      <BordeBrillante color="#38bdf8" speed="6s" thickness={1}>
        <TarjetaIluminada className={`rounded-2xl p-5 ${cristal}`} spotlightColor="rgba(37,99,235,0.12)">
          <div className="relative z-[2]">
            <p className="mb-2 text-[13px] text-muted-foreground">{indicador.lbl}</p>
            <p className="text-[27px] font-bold text-foreground">
              <ContadorAnimado to={indicador.to} prefix={indicador.prefix || ""} suffix={indicador.suffix || ""} decimals={indicador.decimals || 0} duration={1.6} />
            </p>
          </div>
        </TarjetaIluminada>
      </BordeBrillante>
    </motion.div>
  );
}

function Panel({ titulo, etiqueta, children, className = "" }) {
  return (
    <div className={`rounded-2xl p-5 ${cristal} ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-foreground">{titulo}</h3>
        {etiqueta && <div className="text-[11px] font-medium text-blue-600">{etiqueta}</div>}
      </div>
      {children}
    </div>
  );
}

function GraficoBarras({ pagos }) {
  const ventas = ventasPorMes(pagos);
  const maximo = Math.max(1, ...ventas.map((mes) => mes[1]));
  return (
    <div className="flex h-[180px] items-end gap-3.5 pt-2">
      {ventas.map(([mes, valor], indice) => (
        <div key={mes} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <motion.div
            className="w-3/5 rounded-t-lg bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:brightness-110"
            title={`$ ${valor.toFixed(1)} M`}
            initial={{ height: 0 }}
            animate={{ height: `${(valor / maximo) * 100}%` }}
            transition={{ delay: indice * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          <small className="text-[11px] text-muted-foreground">{mes}</small>
        </div>
      ))}
    </div>
  );
}

function CabeceraTabla({ children }) {
  return <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">{children}</TableHead>;
}

/* --------------------------------- Vistas -------------------------------- */
function Resumen({ datos }) {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {crearIndicadores(datos).map((indicador, indice) => <TarjetaIndicador key={indicador.lbl} indicador={indicador} indice={indice} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel titulo={t("dash.ventas")} etiqueta="COP (M)"><GraficoBarras pagos={pagos} /></Panel>
        <Panel titulo={t("dash.destinos")} etiqueta="Top 5">
          <div className="divide-y divide-border">
            {paquetesMasReservados(reservas).map(([nombre, cantidad]) => (
              <div key={nombre} className="flex items-center gap-3 py-2.5 transition-all hover:pl-2">
                <Iniciales texto={nombre} />
                <div className="flex-1">
                  <b className="text-sm text-foreground">{nombre}</b>
                </div>
                <span className="text-sm font-semibold text-blue-600">{cantidad}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Filtro de fechas explícito */}
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 ${cristal}`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-blue-600" />{t("dash.filter")}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <label className="font-medium">{t("dash.from")}</label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 w-[160px]" />
          <label className="font-medium">{t("dash.to")}</label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 w-[160px]" />
          {(desde || hasta) && (
            <Button size="sm" variant="ghost" className="h-8 px-2 text-blue-600 dark:text-sky-300" onClick={() => { setDesde(""); setHasta(""); }}>
              {t("dash.clear")}
            </Button>
          )}
        </div>
        <span className="ml-auto rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-sky-300">
          {filtradas.length} · {t("nav.reservas")}
        </span>
      </div>

      <Panel titulo={t("dash.recientes")} etiqueta={<span className="text-[11px] font-medium text-blue-600 dark:text-sky-300">{t("col.fecha")}</span>}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <CabeceraTabla>{t("col.reserva")}</CabeceraTabla><CabeceraTabla>{t("col.cliente")}</CabeceraTabla><CabeceraTabla>{t("col.paquete")}</CabeceraTabla><CabeceraTabla>{t("col.fecha")}</CabeceraTabla><CabeceraTabla>{t("col.estado")}</CabeceraTabla>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filtradas.slice(0, 12).map((reserva) => (
              <TableRow key={reserva[0]} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
                <TableCell className="font-medium text-foreground">{reserva[0]}</TableCell>
                <TableCell>{reserva[1]}</TableCell>
                <TableCell>{reserva[2]}</TableCell>
                <TableCell>{reserva[4]}</TableCell>
                <TableCell><EtiquetaEstado tono={reserva[6]}>{reserva[7]}</EtiquetaEstado></TableCell>
              </TableRow>
            ))}
            {filtradas.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">—</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

function VistaDatos({ titulo, columnas, filas, accion }) {
  const etiqueta = accion;
  return (
    <Panel titulo={titulo} etiqueta={etiqueta}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">{columnas.map((columna) => <CabeceraTabla key={columna}>{columna}</CabeceraTabla>)}</TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila, indiceFila) => (
            <TableRow key={indiceFila} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
              {fila.map((celda, indiceCelda) =>
                celda && typeof celda === "object"
                  ? <TableCell key={indiceCelda}><EtiquetaEstado tono={celda.tono}>{celda.texto}</EtiquetaEstado></TableCell>
                  : <TableCell key={indiceCelda} className={indiceCelda === 0 ? "font-medium text-foreground" : ""}>{celda}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function DialogoPago({ codigo, informacion, alPagar }) {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");
  const [guardando, cambiarGuardando] = useState(false);
  useEffect(() => { if (abierto) { setMonto(String(informacion.saldo)); setError(""); } }, [abierto, informacion.saldo]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;
    const numero = leerDinero(monto);
    if (numero <= 0) { setError(t("pay.min")); return; }
    if (numero > informacion.saldo) { setError(t("pay.over")); return; }
    cambiarGuardando(true); setError("");
    try { await alPagar(codigo, numero); setAbierto(false); }
    catch (fallo) { setError(fallo.message); }
    finally { cambiarGuardando(false); }
  };

  return (
    <Dialog open={abierto} onOpenChange={(valor) => { if (!guardando) setAbierto(valor); }}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 gap-1 border-blue-200 dark:border-sky-500/30 text-blue-700 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-blue-400/15" />}>
          <CreditCard className="h-3.5 w-3.5" />{t("btn.pay")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{t("pay.title")} · {codigo}</DialogTitle></DialogHeader>
        <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("pay.total")}</span><b className="text-foreground">{mostrarDinero(informacion.total)}</b></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("pay.paid")}</span><b className="text-emerald-600">{mostrarDinero(informacion.pagado)}</b></div>
          <div className="flex justify-between border-t border-border pt-1.5"><span className="font-medium text-foreground">{t("pay.saldo")}</span><b className="text-blue-600">{mostrarDinero(informacion.saldo)}</b></div>
        </div>
        {informacion.saldo <= 0 ? (
          <p className="flex items-center justify-center gap-1 py-3 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" />{t("pay.done")}</p>
        ) : (
          <form onSubmit={enviar} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t("pay.amount")}</Label>
              <Input id="amount" inputMode="numeric" value={monto} onChange={(evento) => setMonto(evento.target.value)} placeholder="0" />
              <p className="text-[11px] text-muted-foreground">{t("pay.maxHint")} {mostrarDinero(informacion.saldo)}</p>
            </div>
            {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose disabled={guardando} render={<Button type="button" variant="outline" />}>{t("btn.cancel")}</DialogClose>
              <Button type="submit" disabled={guardando} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t(guardando ? "acceso.esperar" : "btn.pay")}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
function VistaReservas({ reservas, alPagar, obtenerSaldo, accion }) {
  const { t } = useIdioma();
  return (
    <Panel titulo={t("nav.reservas")} etiqueta={accion}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <CabeceraTabla>{t("col.reserva")}</CabeceraTabla><CabeceraTabla>{t("col.cliente")}</CabeceraTabla><CabeceraTabla>{t("col.paquete")}</CabeceraTabla><CabeceraTabla>{t("col.pax")}</CabeceraTabla>
            <CabeceraTabla>{t("col.fecha")}</CabeceraTabla><CabeceraTabla>{t("col.asesor")}</CabeceraTabla><CabeceraTabla>{t("col.estado")}</CabeceraTabla><CabeceraTabla>{t("col.accion")}</CabeceraTabla>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map((reserva) => (
            <TableRow key={reserva[0]} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
              <TableCell className="font-medium text-foreground">{reserva[0]}</TableCell>
              <TableCell>{reserva[1]}</TableCell>
              <TableCell>{reserva[2]}</TableCell>
              <TableCell>{reserva[3]}</TableCell>
              <TableCell>{reserva[4]}</TableCell>
              <TableCell>{reserva[5]}</TableCell>
              <TableCell><EtiquetaEstado tono={reserva[6]}>{reserva[7]}</EtiquetaEstado></TableCell>
              <TableCell>
                {reserva[7] === "Pagada" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-4 w-4" />{t("st.paid")}</span>
                ) : (
                  <DialogoPago codigo={reserva[0]} informacion={obtenerSaldo(reserva[0])} alPagar={alPagar} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function VistaPaquetes({ paquetes, accion }) {
  const { t } = useIdioma();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const lista = paquetes.filter((paquete) => {
    if (desde && (!paquete.salida || paquete.salida < desde)) return false;
    if (hasta && (!paquete.salida || paquete.salida > hasta)) return false;
    return true;
  });
  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${cristal}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{t("pkg.salida")}:</span>
          <span>{t("dash.from")}</span>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-8 w-[150px]" />
          <span>{t("dash.to")}</span>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-8 w-[150px]" />
          {(desde || hasta) && (
            <Button size="sm" variant="ghost" className="h-8 px-2 text-blue-600" onClick={() => { setDesde(""); setHasta(""); }}>
              {t("dash.clear")}
            </Button>
          )}
        </div>
        {accion}
      </div>

      {lista.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">—</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((paquete, indice) => {
            const Icono = ICONOS[paquete.icono] || Palmtree;
            return (
          <motion.div key={paquete.nombre} variants={aparecer} custom={indice} initial="hidden" animate="show">
            <TarjetaIluminada className={`overflow-hidden rounded-2xl ${cristal} transition-transform hover:-translate-y-1`} spotlightColor="rgba(37,99,235,0.12)">
              <div className="grid h-28 place-items-center bg-gradient-to-br from-sky-500 to-blue-600">
                <Icono className="h-12 w-12 text-white" strokeWidth={1.5} />
              </div>
              <div className="p-4">
                <b className="text-[15px] text-foreground">{paquete.nombre}</b>
                <div className="mb-3 mt-0.5 text-xs text-muted-foreground">{paquete.ubicacion}</div>
                <div className="text-lg font-bold text-blue-600">{paquete.precio}</div>
                <div className="mt-1.5 text-[11.5px] text-muted-foreground">{paquete.cupo}</div>
                {(paquete.salida || paquete.regreso) && (
                  <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    <span>{t("pkg.salida")}: <b className="font-medium text-foreground">{paquete.salida || "—"}</b></span>
                    <span>· {t("pkg.regreso")}: <b className="font-medium text-foreground">{paquete.regreso || "—"}</b></span>
                  </div>
                )}
              </div>
            </TarjetaIluminada>
          </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VistaReportes({ datos }) {
  const { reservas, pagos, paquetes } = datos;
  const ventas = pagos.reduce((suma, pago) => suma + leerDinero(pago[4]), 0);
  const asesores = Object.entries(reservas.reduce((agrupados, reserva) => {
    const asesor = reserva[5] || "Sin asignar";
    agrupados[asesor] = (agrupados[asesor] || 0) + 1;
    return agrupados;
  }, {})).sort((primero, segundo) => segundo[1] - primero[1]);
  const nacionales = reservas.filter((reserva) => paquetes.find((paquete) => paquete.nombre === reserva[2])?.ubicacion?.includes("Colombia")).length;
  const totalViajes = reservas.length || 1;
  const distribucion = [[Plane, "Internacionales", Math.round((reservas.length - nacionales) / totalViajes * 100)], [Bus, "Nacionales", Math.round(nacionales / totalViajes * 100)], [Ship, "Cruceros", 0]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { lbl: "Pagos registrados", to: ventas / 1000000, prefix: "$ ", suffix: " M", decimals: 1 },
          { lbl: "Pago promedio", to: pagos.length ? ventas / pagos.length / 1000000 : 0, prefix: "$ ", suffix: " M", decimals: 1 },
          { lbl: "Reservas registradas", to: reservas.length },
        ].map((k, i) => (
          <motion.div key={k.lbl} variants={aparecer} custom={i} initial="hidden" animate="show">
            <TarjetaIluminada className={`rounded-2xl p-5 ${cristal}`} spotlightColor="rgba(37,99,235,0.12)">
              <p className="mb-2 text-[13px] text-muted-foreground">{k.lbl}</p>
              <p className="text-[27px] font-bold text-foreground">
                <ContadorAnimado to={k.to} prefix={k.prefix || ""} suffix={k.suffix || ""} decimals={k.decimals || 0} duration={1.6} />
              </p>
            </TarjetaIluminada>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel titulo="Reservas por asesor" etiqueta="total">
          <div className="divide-y divide-border">
            {asesores.map(([asesor, cantidad], indice) => (
              <div key={asesor} className="flex items-center gap-3 py-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 dark:border-sky-500/30 bg-blue-500/10 text-sm font-bold text-blue-700 dark:text-sky-300">{indice + 1}</div>
                <div className="flex-1"><b className="text-sm text-foreground">{asesor}</b></div>
                <span className="text-sm font-semibold text-blue-600">{cantidad} reservas</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel titulo="Distribución de reservas" etiqueta="por tipo">
          <div className="space-y-4">
            {distribucion.map(([Icono, etiqueta, porcentaje]) => (
              <div key={etiqueta}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground"><Icono className="h-4 w-4 text-blue-600" />{etiqueta}</span>
                  <span className="font-semibold text-blue-600">{porcentaje}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600"
                    initial={{ width: 0 }} animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* --------------------------- Formularios por entidad --------------------------- */
const hoy = () => new Date().toISOString().slice(0, 10);
const n4 = () => Math.floor(1000 + Math.random() * 9000);
const n6 = () => Math.floor(100000 + Math.random() * 900000);
const leerDinero = (valor) => Number(String(valor ?? "").replace(/[^\d]/g, "")) || 0;
const mostrarDinero = (valor) => "$ " + Math.round(valor).toLocaleString("es-CO");

// Cada formulario indica la tabla, los campos y cómo construir el registro.
const FORMULARIOS = {
  clientes: {
    entidad: "clientes", tabla: "clientes", etiqueta: "Nuevo cliente", titulo: "Registrar nuevo cliente",
    campos: [
      { key: "nombre", label: "Nombre completo", ph: "Ej. Juan García" },
      { key: "documento", label: "Documento", ph: "Cédula", half: true },
      { key: "telefono", label: "Teléfono", ph: "300 000 0000", half: true },
      { key: "correo", label: "Correo", ph: "correo@mail.com", type: "email" },
    ],
    construir: (valores) => {
      const codigo = "CL-" + n4();
      return {
        datos: { codigo, nombre: valores.nombre, documento: valores.documento, correo: valores.correo, telefono: valores.telefono, reservas: 0, activo: true, observaciones: "", obs_desde: null, obs_hasta: null },
        fila: [codigo, valores.nombre, valores.documento, valores.correo, valores.telefono, 0, true, "", "", ""],
      };
    },
  },
  empleados: {
    entidad: "empleados", tabla: "empleados", etiqueta: "Nuevo empleado", titulo: "Registrar nuevo empleado",
    campos: [
      { key: "nombre", label: "Nombre", ph: "Ej. Ana López" },
      { key: "cargo", label: "Cargo", select: ["Asesor comercial", "Gerente general", "Contador", "Soporte al cliente", "Coordinador de viajes", "Recursos humanos"], half: true },
      { key: "telefono", label: "Teléfono", ph: "300 000 0000", half: true },
      { key: "correo", label: "Correo", ph: "correo@novatravel.com", type: "email" },
    ],
    construir: (valores) => {
      const codigo = "EM-" + n4();
      return {
        datos: { codigo, nombre: valores.nombre, cargo: valores.cargo, correo: valores.correo, telefono: valores.telefono, activo: true, observaciones: "", obs_desde: null, obs_hasta: null },
        fila: [codigo, valores.nombre, valores.cargo, valores.correo, valores.telefono, true, "", "", ""],
      };
    },
  },
  reservas: {
    entidad: "reservas", tabla: "reservas", etiqueta: "Nueva reserva", titulo: "Registrar nueva reserva",
    campos: [
      { key: "cliente", label: "Cliente", select: "clientes" },
      { key: "paquete", label: "Paquete", select: "paquetes" },
      { key: "pax", label: "Pasajeros", ph: "2", type: "number", half: true },
      { key: "fecha_viaje", label: "Fecha de viaje", type: "date", half: true },
      { key: "asesor", label: "Asesor", select: ["Samuel P.", "Juan J.", "Andrés M."] },
    ],
    construir: (valores) => {
      const codigo = "#RS-" + n4();
      const pax = Number(valores.pax) || 1;
      return {
        datos: { codigo, cliente: valores.cliente, paquete: valores.paquete, pax, fecha_viaje: valores.fecha_viaje || null, asesor: valores.asesor, tono: "info", estado: "En proceso" },
        fila: [codigo, valores.cliente, valores.paquete, pax, valores.fecha_viaje || "—", valores.asesor, "info", "En proceso"],
      };
    },
  },
  pagos: {
    entidad: "pagos", tabla: "pagos", etiqueta: "Registrar pago", titulo: "Registrar nuevo pago",
    campos: [
      { key: "reserva", label: "Reserva", select: "reservas", half: true },
      { key: "cliente", label: "Cliente", select: "clientes", half: true },
      { key: "metodo", label: "Método", select: ["Tarjeta crédito", "Transferencia", "PSE", "Efectivo", "Nequi"], half: true },
      { key: "valor", label: "Valor", ph: "$ 1.000.000", half: true },
    ],
    construir: (valores) => {
      const recibo = "#PG-" + n4();
      return {
        datos: { recibo, reserva: valores.reserva, cliente: valores.cliente, metodo: valores.metodo, valor: valores.valor, fecha: hoy(), tono: "warn", estado: "Abono" },
        fila: [recibo, valores.reserva, valores.cliente, valores.metodo, valores.valor, hoy(), "warn", "Abono"],
      };
    },
  },
  facturas: {
    entidad: "facturas", tabla: "facturas", etiqueta: "Emitir factura", titulo: "Emitir nueva factura",
    campos: [
      { key: "cliente", label: "Cliente", select: "clientes" },
      { key: "nit", label: "NIT / CC", ph: "900.000.000-0", half: true },
      { key: "reserva", label: "Reserva", select: "reservas", half: true },
      { key: "valor", label: "Valor + IVA", ph: "$ 6.480.000" },
    ],
    construir: (valores) => {
      const factura = "FE-" + n6();
      return {
        datos: { factura, cliente: valores.cliente, nit: valores.nit, reserva: valores.reserva, valor: valores.valor, fecha: hoy(), tono: "info", estado: "Enviada" },
        fila: [factura, valores.cliente, valores.nit, valores.reserva, valores.valor, hoy(), "info", "Enviada"],
      };
    },
  },
  proveedores: {
    entidad: "proveedores", tabla: "proveedores", etiqueta: "Nuevo proveedor", titulo: "Registrar nuevo proveedor",
    campos: [
      { key: "nombre", label: "Proveedor", ph: "Ej. Avianca" },
      { key: "tipo", label: "Tipo", select: ["Aerolínea", "Hotelería", "Operador terrestre", "Naviera"], half: true },
      { key: "convenio", label: "Convenio", ph: "Comisión 8%", half: true },
      { key: "contacto", label: "Contacto", ph: "correo@proveedor.com" },
    ],
    construir: (valores) => ({
      datos: { nombre: valores.nombre, tipo: valores.tipo, contacto: valores.contacto, convenio: valores.convenio, tono: "info", estado: "Nuevo" },
      fila: [valores.nombre, valores.tipo, valores.contacto, valores.convenio, "info", "Nuevo"],
    }),
  },
  paquetes: {
    entidad: "paquetes", tabla: "paquetes", etiqueta: "Nuevo paquete", titulo: "Registrar nuevo paquete",
    campos: [
      { key: "nombre", label: "Nombre del paquete", ph: "Ej. Cancún Paraíso" },
      { key: "loc", label: "Ubicación / duración", ph: "México · 7 días / 6 noches" },
      { key: "precio", label: "Precio", ph: "$ 6.480.000", half: true },
      { key: "cupo", label: "Cupos", ph: "Cupos: 12 / 40", half: true },
      { key: "salida", label: "Fecha de salida", type: "date", half: true },
      { key: "regreso", label: "Fecha de regreso", type: "date", half: true },
      { key: "icono", label: "Ícono", select: ["umbrella", "landmark", "waves", "ferriswheel", "mountain", "building"] },
    ],
    construir: (valores) => {
      const icono = valores.icono || "umbrella";
      return {
        datos: { nombre: valores.nombre, loc: valores.loc, precio: valores.precio, cupo: valores.cupo, icono, salida: valores.salida || null, regreso: valores.regreso || null },
        fila: { icono, nombre: valores.nombre, ubicacion: valores.loc, precio: valores.precio, cupo: valores.cupo, salida: valores.salida || "", regreso: valores.regreso || "" },
      };
    },
  },
};

function DialogoAgregar({ label: etiqueta, title: titulo, fields: campos, onSubmit: alEnviar, selects: opciones = {} }) {
  const vacio = Object.fromEntries(campos.map((campo) => [campo.key, ""]));
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiarCampo = (clave) => (evento) => setValores((anteriores) => ({ ...anteriores, [clave]: evento.target.value }));
  const elegirCampo = (clave, valor) => setValores((anteriores) => ({ ...anteriores, [clave]: valor }));
  const opcionesDe = (campo) => (Array.isArray(campo.select) ? campo.select : opciones[campo.select] || []);

  const enviar = async (evento) => {
    evento.preventDefault();
    const primero = campos[0];
    if (primero && !String(valores[primero.key] || "").trim()) { setError(`${primero.label} es obligatorio.`); return; }
    const pasada = campos.find((campo) => campo.type === "date" && valores[campo.key] && valores[campo.key] < hoy());
    if (pasada) { setError("La fecha no puede ser anterior a hoy."); return; }
    setGuardando(true); setError("");
    try {
      await alEnviar(valores);
      setValores(vacio); setAbierto(false);
    } catch (fallo) {
      setError("No se pudo guardar: " + fallo.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={<Button size="sm" className="h-8 gap-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white" />}>
          <Plus className="h-3.5 w-3.5" />{etiqueta}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        <form onSubmit={enviar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {campos.map((campo) => (
              <div key={campo.key} className={`space-y-1.5 ${campo.half ? "" : "col-span-2"}`}>
                <Label htmlFor={campo.key}>{campo.label}</Label>
                {campo.select ? (
                  <Select value={valores[campo.key]} onValueChange={(valor) => elegirCampo(campo.key, valor)}>
                    <SelectTrigger id={campo.key} className="w-full">
                      <SelectValue placeholder={`Selecciona ${campo.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {opcionesDe(campo).length === 0
                        ? <div className="px-2 py-1.5 text-sm text-slate-400">Sin opciones</div>
                        : opcionesDe(campo).map((opcion) => <SelectItem key={opcion} value={opcion}>{opcion}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id={campo.key} type={campo.type || "text"} value={valores[campo.key]} onChange={cambiarCampo(campo.key)}
                    placeholder={campo.ph || ""} min={campo.type === "date" ? hoy() : undefined} />
                )}
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose disabled={guardando} render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={guardando} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Estado BD ------------------------------- */
function EstadoConexion({ origen }) {
  const { t } = useIdioma();
  if (origen === "supabase")
    return <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 lg:flex"><Database className="h-3.5 w-3.5" />{t("tb.db")}</div>;
  return <div role="status" className="hidden items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 lg:flex"><CircleAlert className="h-3.5 w-3.5" />{t(origen === "demo" ? "tb.demo" : origen === "loading" ? "acceso.validando" : "acceso.bloqueado")}</div>;
}

/* --------------------------- Tema (claro/oscuro) --------------------------- */
function useTema() {
  const [oscuro, cambiarOscuro] = useState(() => {
    try { return localStorage.getItem("nt_theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
    try { localStorage.setItem("nt_theme", oscuro ? "dark" : "light"); } catch { /* noop */ }
  }, [oscuro]);
  return [oscuro, cambiarOscuro];
}

function ControlesSuperiores({ oscuro, cambiarOscuro }) {
  const { t, idioma, cambiarIdioma } = useIdioma();
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" aria-label={oscuro ? t("theme.light") : t("theme.dark")} title={oscuro ? t("theme.light") : t("theme.dark")}
        onClick={() => cambiarOscuro((anterior) => !anterior)} className="border-border">
        {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Select value={idioma} onValueChange={cambiarIdioma}>
        <SelectTrigger className="h-9 w-[140px] gap-1 border-border" title={t("lang.label")} aria-label={t("lang.label")}>
          <Languages className="h-4 w-4 shrink-0 text-blue-600" />
          <span className="truncate">{IDIOMAS.find((opcion) => opcion.code === idioma)?.label || idioma}</span>
        </SelectTrigger>
        <SelectContent>
          {IDIOMAS.map((opcion) => <SelectItem key={opcion.code} value={opcion.code}>{opcion.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ------------------------ Observaciones de un registro ---------------------- */
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
  return (
    <Dialog open={abierto} onOpenChange={(valor) => { if (!guardando) cambiarAbierto(valor); }}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 gap-1 border-blue-200 dark:border-sky-500/30 text-blue-700 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-blue-400/15" />}>
          <MessageSquarePlus className="h-3.5 w-3.5" />{t("btn.observ")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("obs.title")}</DialogTitle></DialogHeader>
        <form onSubmit={guardar} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("obs.text")}</Label>
            <textarea value={observacion} onChange={(evento) => cambiarObservacion(evento.target.value)} rows={3}
              className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
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
    </Dialog>
  );
}

/* ----------- Vista de personas (Clientes / Empleados) con activo + obs ---------- */
function VistaPersonas({ titulo, accion, filas, columnas, indiceActivo, indiceObservacion, indiceDesde, indiceHasta, alCambiarActivo, alObservar, mostrarAcceso }) {
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
  return (
    <Panel titulo={titulo} etiqueta={accion}>
      {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {columnas.map((columna) => <CabeceraTabla key={columna.label}>{columna.label}</CabeceraTabla>)}
              <CabeceraTabla>{t(mostrarAcceso ? "acceso.estadoEmpleado" : "col.estado")}</CabeceraTabla>{mostrarAcceso && <CabeceraTabla>{t("acceso.acceso")}</CabeceraTabla>}<CabeceraTabla>{t("col.observ")}</CabeceraTabla><CabeceraTabla>{t("col.accion")}</CabeceraTabla>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => {
              const activo = fila[indiceActivo];
              return (
                <TableRow key={fila[0]} className={`border-border hover:bg-sky-50 dark:hover:bg-sky-400/10 ${activo ? "" : "opacity-55"}`}>
                  {columnas.map((columna, indice) => <TableCell key={indice} className={indice === 0 ? "font-medium text-foreground" : ""}>{fila[columna.idx]}</TableCell>)}
                   <TableCell><EtiquetaEstado tono={activo ? "ok" : "bad"}>{activo ? t("st.active") : t("st.inactive")}</EtiquetaEstado></TableCell>
                   {mostrarAcceso && <TableCell>{mostrarAcceso(fila)}</TableCell>}
                  <TableCell className="max-w-[280px] align-top">
                    {fila[indiceObservacion] ? (
                      <div className="flex flex-col items-start gap-1 py-0.5">
                        <span className="text-xs leading-snug text-muted-foreground">{fila[indiceObservacion]}</span>
                        {(fila[indiceDesde] || fila[indiceHasta]) && (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            <CalendarDays className="h-3 w-3" />{fila[indiceDesde] || "—"} → {fila[indiceHasta] || "—"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{t("empty")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                       <DialogoObservacion actual={{ obs: fila[indiceObservacion] || "", desde: fila[indiceDesde] || "", hasta: fila[indiceHasta] || "" }} alGuardar={(observacion) => alObservar(fila[0], observacion)} />
                        <Button size="sm" variant="outline" disabled={ocupado} onClick={() => cambiarEstado(fila[0], !activo)}
                        className={`h-7 gap-1 ${activo ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/15" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-400/15"}`}>
                        <Power className="h-3.5 w-3.5" />{activo ? t("btn.deactivate") : t("btn.activate")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filas.length === 0 && <TableRow><TableCell colSpan={columnas.length + (mostrarAcceso ? 4 : 3)} className="py-6 text-center text-muted-foreground">{t("acceso.sinRegistros")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

/* -------------------------- Políticas y cookies -------------------------- */
const POLITICAS = {
  privacy: [
    "En NóvaTravel tratamos tus datos personales conforme a la Ley 1581 de 2012 (Colombia) y su Decreto reglamentario 1377 de 2013.",
    "Recopilamos únicamente los datos necesarios para gestionar reservas, pagos y facturación: nombre, documento, contacto y detalles del viaje.",
    "No compartimos tu información con terceros salvo los proveedores necesarios para prestar el servicio (aerolíneas, hoteles y operadores).",
    "Puedes ejercer tus derechos de acceso, rectificación, actualización o supresión escribiendo a privacidad@novatravel.com.",
    "(Texto de ejemplo — reemplazar por la política legal definitiva de la empresa.)",
  ],
  cookies: [
    "Este sitio usa cookies propias y de terceros para recordar tus preferencias (como idioma y tema) y mejorar tu experiencia.",
    "Las cookies esenciales son necesarias para el funcionamiento del sistema; las no esenciales solo se usan si las aceptas.",
    "Puedes aceptar o rechazar las cookies no esenciales desde el aviso inferior, y cambiar tu decisión borrando los datos del navegador.",
    "(Texto de ejemplo — reemplazar por la política de cookies definitiva de la empresa.)",
  ],
};
function DialogoPolitica({ icono: Icono, titulo, parrafos }) {
  return (
    <Dialog>
      <DialogTrigger render={<button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-blue-600" />}>
          <Icono className="h-3.5 w-3.5" />{titulo}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          {parrafos.map((parrafo, indice) => <p key={indice}>{parrafo}</p>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AvisoCookies() {
  const { t } = useIdioma();
  const [show, setShow] = useState(() => { try { return !localStorage.getItem("nt_cookies"); } catch { return true; } });
  if (!show) return null;
  const choose = (v) => { try { localStorage.setItem("nt_cookies", v); } catch { /* noop */ } setShow(false); };
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row">
      <Cookie className="h-6 w-6 shrink-0 text-blue-600" />
      <p className="flex-1 text-center text-xs text-muted-foreground sm:text-left">{t("cookie.msg")}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => choose("rejected")}>{t("cookie.reject")}</Button>
        <Button size="sm" onClick={() => choose("accepted")} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t("cookie.accept")}</Button>
      </div>
    </div>
  );
}

function PiePagina() {
  const { t } = useIdioma();
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
      <span>© 2026 NóvaTravel</span>
       <DialogoPolitica icono={Shield} titulo={t("pol.privacy")} parrafos={POLITICAS.privacy} />
       <DialogoPolitica icono={Cookie} titulo={t("pol.cookies")} parrafos={POLITICAS.cookies} />
    </footer>
  );
}

/* ----------------------------- Carga de entidades --------------------------- */
function useEntidades() {
  const [datos, setDatos] = useState(() => supabaseConfigurado ? { clientes: [], paquetes: [], reservas: [], pagos: [], facturas: [], proveedores: [], empleados: [] } : DATOS_DEMO);
  const [origen, setOrigen] = useState(supabaseConfigurado ? "loading" : "demo");
  const [error, cambiarError] = useState("");

  useEffect(() => {
    if (!supabaseConfigurado) return;
    let vigente = true;
    obtenerEntidades()
      .then((resultado) => { if (vigente && resultado) { setDatos(resultado); setOrigen("supabase"); } })
      .catch(() => { if (vigente) { setOrigen("error"); cambiarError("acceso.errorDatos"); } });
    return () => { vigente = false; };
  }, []);

  return { datos, setDatos, origen, error };
}

/* ------------------------------- Panel principal ----------------------------- */
function PanelPrincipal({ alSalir, oscuro, cambiarOscuro, perfil, validarAcceso }) {
  const { t } = useIdioma();
  const [vista, cambiarVista] = useState("dash");
  const [menuAbierto, cambiarMenu] = useState(false);
  const { datos, setDatos, origen, error: errorDatos } = useEntidades();
  const tituloVista = t("nav." + vista);
  const subtituloVista = t("sub." + vista);

  // Opciones para los menús desplegables (se arman con lo que ya existe)
  const opciones = {
    clientes: datos.clientes.map((cliente) => cliente[1]),
    paquetes: datos.paquetes.map((paquete) => paquete.nombre),
    reservas: datos.reservas.map((reserva) => reserva[0]),
  };

  const enviarFormulario = (clave) => async (valores) => {
    if (clave === "reservas") return agregarReserva(valores);
    const formulario = FORMULARIOS[clave];
    const { datos: datosNuevos, fila } = formulario.construir(valores);
    if (supabaseConfigurado) {
      await validarAcceso();
      await insertarFila(formulario.tabla, datosNuevos);
    }
    setDatos((actuales) => ({ ...actuales, [formulario.entidad]: [fila, ...actuales[formulario.entidad]] }));
  };

  // Nueva reserva -> arranca "Pendiente" y genera su factura automáticamente
  const agregarReserva = async (valores) => {
    const { datos: datosReservaInicial, fila } = FORMULARIOS.reservas.construir(valores);
    const filaReserva = [...fila]; filaReserva[6] = "bad"; filaReserva[7] = "Pendiente";
    const datosReserva = { ...datosReservaInicial, tono: "bad", estado: "Pendiente" };
    const precio = datos.paquetes.find((paquete) => paquete.nombre === valores.paquete)?.precio || "$ 0";
    const nit = datos.clientes.find((cliente) => cliente[1] === valores.cliente)?.[2] || "";
    const factura = "FE-" + n6();
    const filaFactura = [factura, valores.cliente, nit, datosReservaInicial.codigo, precio, hoy(), "warn", "Por validar"];
    const datosFactura = { factura, cliente: valores.cliente, nit, reserva: datosReservaInicial.codigo, valor: precio, fecha: hoy(), tono: "warn", estado: "Por validar" };
    if (supabaseConfigurado) {
      await validarAcceso();
      await insertarFila("reservas", datosReserva);
      try { await insertarFila("facturas", datosFactura); }
      catch { throw new Error(t("acceso.reservaParcial")); }
    }
    setDatos((actuales) => ({ ...actuales, reservas: [filaReserva, ...actuales.reservas], facturas: [filaFactura, ...actuales.facturas] }));
  };

  // Total del viaje, abonado y saldo pendiente de una reserva
  const obtenerSaldo = (codigo) => {
    const reserva = datos.reservas.find((fila) => fila[0] === codigo);
    const totalTexto = datos.facturas.find((factura) => factura[3] === codigo)?.[4]
      || datos.paquetes.find((paquete) => paquete.nombre === (reserva ? reserva[2] : null))?.precio || "0";
    const total = leerDinero(totalTexto);
    const pagado = datos.pagos.filter((pago) => pago[1] === codigo).reduce((acumulado, pago) => acumulado + leerDinero(pago[4]), 0);
    return { total, pagado, saldo: Math.max(total - pagado, 0) };
  };

  // Pagar (abono o pago total). No permite pagar más que el saldo.
  const pagarReserva = async (codigo, montoSolicitado) => {
    const reserva = datos.reservas.find((fila) => fila[0] === codigo);
    if (!reserva) return;
    const { saldo } = obtenerSaldo(codigo);
    const monto = Math.min(montoSolicitado, saldo);
    if (monto <= 0) return;
    const completa = monto >= saldo;
    const recibo = "#PG-" + n4();
    const valorTexto = mostrarDinero(monto);
    const tonoPago = completa ? "ok" : "warn";
    const estadoPago = completa ? "Pagado" : "Abono";
    const tonoReserva = completa ? "ok" : "warn";
    const estadoReserva = completa ? "Pagada" : "Pago parcial";
    if (supabaseConfigurado) {
      await validarAcceso();
      await insertarFila("pagos", { recibo, reserva: codigo, cliente: reserva[1], metodo: "Tarjeta crédito", valor: valorTexto, fecha: hoy(), tono: tonoPago, estado: estadoPago });
      try {
        await actualizarFilas("reservas", "codigo", codigo, { tono: tonoReserva, estado: estadoReserva });
        if (completa) await actualizarFilas("facturas", "reserva", codigo, { tono: "ok", estado: "Aceptada" });
      } catch { throw new Error(t("acceso.pagoParcial")); }
    }
    setDatos((actuales) => ({
      ...actuales,
      pagos: [[recibo, codigo, reserva[1], "Tarjeta crédito", valorTexto, hoy(), tonoPago, estadoPago], ...actuales.pagos],
      reservas: actuales.reservas.map((fila) => (fila[0] === codigo ? [...fila.slice(0, 6), tonoReserva, estadoReserva] : fila)),
      facturas: completa ? actuales.facturas.map((fila) => (fila[3] === codigo ? [...fila.slice(0, 6), "ok", "Aceptada"] : fila)) : actuales.facturas,
    }));
  };

  // Activar / desactivar (soft) sin borrar el registro
  const cambiarActivo = async (entidad, codigo, activo) => {
    const indice = entidad === "clientes" ? 6 : 5;
    if (supabaseConfigurado) { await validarAcceso(); await actualizarFilas(entidad, "codigo", codigo, { activo }); }
    setDatos((actuales) => ({ ...actuales, [entidad]: actuales[entidad].map((fila) => { if (fila[0] !== codigo) return fila; const nueva = [...fila]; nueva[indice] = activo; return nueva; }) }));
  };

  // Guardar observaciones + rango de fechas
  const guardarObservacion = async (entidad, codigo, observacion) => {
    const [indiceTexto, indiceDesde, indiceHasta] = entidad === "clientes" ? [7, 8, 9] : [6, 7, 8];
    if (supabaseConfigurado) { await validarAcceso(); await actualizarFilas(entidad, "codigo", codigo, { observaciones: observacion.obs, obs_desde: observacion.desde || null, obs_hasta: observacion.hasta || null }); }
    setDatos((actuales) => ({ ...actuales, [entidad]: actuales[entidad].map((fila) => { if (fila[0] !== codigo) return fila; const nueva = [...fila]; nueva[indiceTexto] = observacion.obs; nueva[indiceDesde] = observacion.desde; nueva[indiceHasta] = observacion.hasta; return nueva; }) }));
  };

  const accionAgregar = (clave) => (
    <DialogoAgregar label={FORMULARIOS[clave].etiqueta} title={FORMULARIOS[clave].titulo} fields={FORMULARIOS[clave].campos} onSubmit={enviarFormulario(clave)} selects={opciones} />
  );

  const mostrarVista = () => {
    switch (vista) {
      case "dash": return <Resumen datos={datos} />;
      case "clientes":
        return <VistaPersonas titulo={t("nav.clientes")} accion={accionAgregar("clientes")}
          filas={datos.clientes}
          columnas={[{ label: "ID", idx: 0 }, { label: t("col.nombre"), idx: 1 }, { label: t("col.doc"), idx: 2 }, { label: t("col.correo"), idx: 3 }, { label: t("col.tel"), idx: 4 }]}
          indiceActivo={6} indiceObservacion={7} indiceDesde={8} indiceHasta={9}
          alCambiarActivo={(codigo, activo) => cambiarActivo("clientes", codigo, activo)} alObservar={(codigo, observacion) => guardarObservacion("clientes", codigo, observacion)} />;
      case "empleados":
        return <GestionAccesosEmpleados empleados={datos.empleados} validarAcceso={validarAcceso}>{(mostrarAcceso) => <VistaPersonas titulo={t("nav.empleados")} accion={accionAgregar("empleados")}
          mostrarAcceso={mostrarAcceso}
          filas={datos.empleados || []}
          columnas={[{ label: "ID", idx: 0 }, { label: t("col.nombre"), idx: 1 }, { label: t("col.cargo"), idx: 2 }, { label: t("col.correo"), idx: 3 }, { label: t("col.tel"), idx: 4 }]}
          indiceActivo={5} indiceObservacion={6} indiceDesde={7} indiceHasta={8}
          alCambiarActivo={(codigo, activo) => cambiarActivo("empleados", codigo, activo)} alObservar={(codigo, observacion) => guardarObservacion("empleados", codigo, observacion)} />}</GestionAccesosEmpleados>;
      case "paquetes":
        return <VistaPaquetes paquetes={datos.paquetes} accion={accionAgregar("paquetes")} />;
      case "reservas":
        return <VistaReservas reservas={datos.reservas} alPagar={pagarReserva} obtenerSaldo={obtenerSaldo} accion={accionAgregar("reservas")} />;
      case "pagos":
        return <VistaDatos titulo={t("nav.pagos")} accion={accionAgregar("pagos")}
          columnas={["Recibo", "Reserva", "Cliente", "Método", "Valor", "Fecha", "Estado"]}
          filas={datos.pagos.map((fila) => [fila[0], fila[1], fila[2], fila[3], fila[4], fila[5], { tono: fila[6], texto: fila[7] }])} />;
      case "facturas":
        return <VistaDatos titulo={t("nav.facturas")} accion={accionAgregar("facturas")}
          columnas={["Factura", "Cliente", "NIT / CC", "Reserva", "Valor + IVA", "Fecha", "Estado DIAN"]}
          filas={datos.facturas.map((fila) => [fila[0], fila[1], fila[2], fila[3], fila[4], fila[5], { tono: fila[6], texto: fila[7] }])} />;
      case "proveedores":
        return <VistaDatos titulo={t("nav.proveedores")} accion={accionAgregar("proveedores")}
          columnas={["Proveedor", "Tipo", "Contacto", "Convenio", "Estado"]}
          filas={datos.proveedores.map((fila) => [fila[0], fila[1], fila[2], fila[3], { tono: fila[4], texto: fila[5] }])} />;
      case "reportes": return <VistaReportes datos={datos} />;
      default: return null;
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen">
      <motion.aside
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed z-30 h-screen w-64 shrink-0 border-r border-border bg-sidebar p-4 backdrop-blur-xl transition-transform md:sticky md:top-0 md:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button type="button" onClick={() => { cambiarVista("dash"); cambiarMenu(false); }} title={t("nav.dash")}
          className="mb-6 flex w-full items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-sky-50 dark:hover:bg-sky-400/10">
          <Marca tamano="h-10 w-10" imagen="h-8 w-8" />
          <span className="text-lg font-bold text-foreground">Nóva<TextoDegradado colors={coloresMarca}>Travel</TextoDegradado></span>
        </button>
        <nav className="space-y-1">
          {NAVEGACION.map((opcion) => (
            <div key={opcion.id}>
              {opcion.group && <p className="mb-1 mt-4 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">{t("grp." + opcion.group)}</p>}
              <button
                onClick={() => { cambiarVista(opcion.id); cambiarMenu(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  vista === opcion.id
                    ? "border border-blue-200 dark:border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-blue-600/15 font-medium text-blue-700 dark:text-sky-300 shadow-sm"
                    : "text-muted-foreground hover:bg-sky-50 dark:hover:bg-sky-400/10 hover:text-blue-700 dark:text-sky-300"
                }`}
              >
                <opcion.icon className="h-[18px] w-[18px]" />{t("nav." + opcion.id)}
              </button>
            </div>
          ))}
        </nav>
      </motion.aside>

      {menuAbierto && <div className="fixed inset-0 z-20 bg-slate-900/20 md:hidden" onClick={() => cambiarMenu(false)} />}

      <main className="min-h-screen min-w-0 flex-1 p-6 md:p-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" aria-label={t("acceso.menu")} className="md:hidden" onClick={() => cambiarMenu(true)}><Menu className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{tituloVista}</h1>
              <p className="text-sm text-muted-foreground">{subtituloVista}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <EstadoConexion origen={origen} />
            <div className={`hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-muted-foreground lg:flex ${cristal}`}>
              <Search className="h-4 w-4" />
              <input placeholder={t("tb.search")} className="w-32 bg-transparent text-foreground outline-none placeholder:text-slate-400" />
            </div>
            <ControlesSuperiores oscuro={oscuro} cambiarOscuro={cambiarOscuro} />
            <div className={`hidden items-center gap-2 rounded-xl px-3 py-1.5 sm:flex ${cristal}`}>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-xs font-bold text-white">{perfil.nombre.slice(0, 2).toUpperCase()}</div>
              <span className="hidden text-sm text-foreground md:inline">{perfil.nombre}</span>
            </div>
            <Button variant="outline" aria-label={t("tb.logout")} onClick={alSalir} className="gap-2 border-border text-muted-foreground hover:border-rose-400 hover:text-rose-500">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("tb.logout")}</span>
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={vista}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>
            {origen === "loading" ? <p role="status">{t("acceso.validando")}</p> : errorDatos ? <p role="alert" className="text-rose-600">{t(errorDatos)}</p> : mostrarVista()}
          </motion.div>
        </AnimatePresence>

        <PiePagina />
      </main>
    </div>
  );
}

/* ---------------------------------- App ---------------------------------- */
export default function Aplicacion() {
  const [oscuro, cambiarOscuro] = useTema();

  return (
    <ChispasAlClic sparkColor="#2563eb" sparkCount={9} sparkRadius={18}>
      <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-foreground dark:from-[#070d20] dark:via-[#0a1226] dark:to-[#0b1430]">
        <div className="pointer-events-none fixed inset-0 z-0">
          <Cuadricula direction="diagonal" speed={0.4} squareSize={46}
            borderColor={oscuro ? "rgba(56,189,248,0.10)" : "rgba(37,99,235,0.10)"}
            hoverFillColor="rgba(56,189,248,0.10)" fadeColor={oscuro ? "#070d20" : "#eef4ff"} />
        </div>
        <div className="pointer-events-none fixed -right-24 -top-24 z-0 h-[420px] w-[420px] rounded-full bg-sky-300/25 blur-[90px] dark:bg-blue-600/20" />
        <div className="pointer-events-none fixed -bottom-32 -left-24 z-0 h-[380px] w-[380px] rounded-full bg-blue-300/20 blur-[90px] dark:bg-sky-500/15" />

        <PuertaAcceso panelAdministrador={PanelPrincipal} propiedadesPanel={{ oscuro, cambiarOscuro }} controles={<ControlesSuperiores oscuro={oscuro} cambiarOscuro={cambiarOscuro} />} />

        <AvisoCookies />
      </div>
    </ChispasAlClic>
  );
}
