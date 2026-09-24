import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Palmtree, CalendarDays, CreditCard,
  ReceiptText, Building2, BarChart3, Search, LogOut, Menu, TrendingUp,
  TrendingDown, Plus, Umbrella, Landmark, Waves, FerrisWheel, Mountain,
  Building, Bus, Ship, Plane, Database, CircleAlert, Check,
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
import Squares from "@/components/reactbits/Squares";
import ClickSpark from "@/components/reactbits/ClickSpark";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import GradientText from "@/components/reactbits/GradientText";
import ShinyText from "@/components/reactbits/ShinyText";
import CountUp from "@/components/reactbits/CountUp";
import { isSupabaseReady } from "@/lib/supabase";
import { fetchEntities, insertRow, updateRows } from "@/lib/db";
import { DEMO } from "@/lib/demoData";

const LOGO = "/logo-mark.png";

/* ------------------------- Datos de demostración ------------------------- */
const KPIS = [
  { lbl: "Reservas activas", to: 1284, delta: "+12,4% vs. mes anterior", up: true },
  { lbl: "Ingresos del mes", to: 342, prefix: "$ ", suffix: " M", delta: "+8,1%", up: true },
  { lbl: "Clientes registrados", to: 3917, delta: "+214 nuevos", up: true },
  { lbl: "Cupos disponibles", to: 486, delta: "-6,3%", up: false },
];

const VENTAS = [
  ["Ene", 180], ["Feb", 210], ["Mar", 260], ["Abr", 230], ["May", 300],
  ["Jun", 280], ["Jul", 340], ["Ago", 310], ["Sep", 342],
];

const DESTINOS = [
  { n: "Cancún", d: "México · playa todo incluido", p: 24 },
  { n: "Madrid", d: "España · city tour", p: 18 },
  { n: "San Andrés", d: "Colombia · isla", p: 16 },
  { n: "Orlando", d: "USA · parques", p: 13 },
  { n: "Cusco", d: "Perú · Machu Picchu", p: 11 },
];

const ICONS = { umbrella: Umbrella, landmark: Landmark, waves: Waves, ferriswheel: FerrisWheel, mountain: Mountain, building: Building };

const NAV = [
  { id: "dash", label: "Dashboard", icon: LayoutDashboard, group: null },
  { id: "clientes", label: "Clientes", icon: Users, group: "Operación" },
  { id: "paquetes", label: "Paquetes turísticos", icon: Palmtree, group: null },
  { id: "reservas", label: "Reservas", icon: CalendarDays, group: null },
  { id: "pagos", label: "Pagos", icon: CreditCard, group: "Finanzas" },
  { id: "facturas", label: "Facturación", icon: ReceiptText, group: null },
  { id: "proveedores", label: "Proveedores", icon: Building2, group: "Gestión" },
  { id: "reportes", label: "Reportes", icon: BarChart3, group: null },
];

const TITULOS = {
  dash: ["Dashboard", "Resumen general de la operación · Medellín, Colombia"],
  clientes: ["Clientes", "Gestión y seguimiento de clientes"],
  paquetes: ["Paquetes turísticos", "Catálogo de destinos y disponibilidad"],
  reservas: ["Reservas", "Control de reservas y cupos"],
  pagos: ["Pagos", "Recaudo, abonos y saldos"],
  facturas: ["Facturación", "Facturación electrónica DIAN"],
  proveedores: ["Proveedores", "Aerolíneas, hoteles y operadores"],
  reportes: ["Reportes", "Indicadores y toma de decisiones"],
};

/* ------------------------------ Utilidades UI ------------------------------ */
const pillClass = {
  ok: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
  warn: "bg-amber-500/12 text-amber-600 border-amber-500/25",
  bad: "bg-rose-500/12 text-rose-600 border-rose-500/25",
  info: "bg-sky-500/12 text-sky-600 border-sky-500/25",
};
function Pill({ tone, children }) {
  return (
    <Badge variant="outline" className={`rounded-full font-semibold ${pillClass[tone] || pillClass.info}`}>
      {(tone === "ok" || tone === "bad") && (
        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {children}
    </Badge>
  );
}

function Mono({ text }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 bg-blue-500/10 text-xs font-bold text-blue-700">
      {text.slice(0, 2).toUpperCase()}
    </div>
  );
}

function LogoMark({ size = "h-12 w-12", img = "h-10 w-10" }) {
  return (
    <div className={`grid ${size} place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(37,99,235,0.22)] ring-1 ring-blue-100`}>
      <img src={LOGO} alt="NóvaTravel" className={`${img} object-contain`} />
    </div>
  );
}

const glass = "border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

const brandColors = ["#2563eb", "#0ea5e9", "#2563eb"];

/* --------------------------------- Login --------------------------------- */
function Login({ onLogin }) {
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(0);

  const submit = (e) => {
    e.preventDefault();
    if (usr.trim() === "admin" && pwd === "agencia2026") onLogin();
    else { setErr("Usuario o contraseña incorrectos."); setShake((s) => s + 1); }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-5">
      <motion.form
        onSubmit={submit}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
        key={shake}
        className={`relative w-full max-w-[420px] rounded-3xl p-9 ${glass}`}
      >
        <motion.div animate={err ? { x: [0, -9, 9, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="flex flex-col gap-1">
          <motion.div variants={fade} custom={0} className="mb-1 flex items-center justify-center gap-3">
            <LogoMark />
            <span className="text-2xl font-bold tracking-wide text-slate-800">
              Nóva<GradientText colors={brandColors} className="align-baseline">Travel</GradientText>
            </span>
          </motion.div>

          <motion.p variants={fade} custom={1} className="mb-7 text-center text-sm">
            <ShinyText text="Sistema Empresarial · Gestión Integral de Agencia de Viajes" speed={4} />
          </motion.p>

          <motion.div variants={fade} custom={2} className="mb-4">
            <label className="mb-2 block text-xs font-medium tracking-wide text-blue-700">Usuario</label>
            <Input value={usr} onChange={(e) => setUsr(e.target.value)}
              placeholder="Ingrese su usuario" autoComplete="off" className="h-11 border-slate-200 bg-white" />
          </motion.div>

          <motion.div variants={fade} custom={3} className="mb-6">
            <label className="mb-2 block text-xs font-medium tracking-wide text-blue-700">Contraseña</label>
            <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••" className="h-11 border-slate-200 bg-white" />
          </motion.div>

          <motion.div variants={fade} custom={4}>
            <Button type="submit"
              className="h-12 w-full bg-gradient-to-br from-sky-500 to-blue-600 text-base font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-transform hover:-translate-y-0.5 hover:from-sky-400 hover:to-blue-500">
              Ingresar al sistema
            </Button>
          </motion.div>

          <div className="mt-3 min-h-5 text-center text-sm text-rose-500">{err}</div>

          <motion.div variants={fade} custom={5}
            className="mt-3 border-t border-dashed border-slate-200 pt-4 text-center text-[11.5px] leading-relaxed text-slate-500">
            Acceso interno del equipo<br />
            Usuario: <code className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">admin</code>{" "}
            Contraseña: <code className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">agencia2026</code>
          </motion.div>
        </motion.div>
      </motion.form>
    </div>
  );
}

/* -------------------------------- Widgets -------------------------------- */
function StatCard({ k, i }) {
  return (
    <motion.div variants={fade} custom={i} initial="hidden" animate="show">
      <SpotlightCard className={`rounded-2xl p-5 ${glass}`} spotlightColor="rgba(37,99,235,0.12)">
        <div className="relative z-[2]">
          <p className="mb-2 text-[13px] text-slate-500">{k.lbl}</p>
          <p className="text-[27px] font-bold text-slate-800">
            <CountUp to={k.to} prefix={k.prefix || ""} suffix={k.suffix || ""} duration={1.6} />
          </p>
          <p className={`mt-1.5 flex items-center gap-1 text-xs ${k.up ? "text-emerald-600" : "text-rose-500"}`}>
            {k.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {k.delta}
          </p>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

function Panel({ title, tag, children, className = "" }) {
  return (
    <div className={`rounded-2xl p-5 ${glass} ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
        {tag && <div className="text-[11px] font-medium text-blue-600">{tag}</div>}
      </div>
      {children}
    </div>
  );
}

function BarChart() {
  const max = Math.max(...VENTAS.map((m) => m[1]));
  return (
    <div className="flex h-[180px] items-end gap-3.5 pt-2">
      {VENTAS.map(([m, v], i) => (
        <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <motion.div
            className="w-3/5 rounded-t-lg bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:brightness-110"
            title={`$ ${v} M`}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          <small className="text-[11px] text-slate-500">{m}</small>
        </div>
      ))}
    </div>
  );
}

function Th({ children }) {
  return <TableHead className="text-[11px] uppercase tracking-wide text-slate-500">{children}</TableHead>;
}

/* --------------------------------- Vistas -------------------------------- */
function Dashboard({ reservas }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => <StatCard key={k.lbl} k={k} i={i} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Ventas por mes" tag="2026 · millones COP"><BarChart /></Panel>
        <Panel title="Destinos más solicitados" tag="Top 5">
          <div className="divide-y divide-slate-100">
            {DESTINOS.map((d) => (
              <div key={d.n} className="flex items-center gap-3 py-2.5 transition-all hover:pl-2">
                <Mono text={d.n} />
                <div className="flex-1">
                  <b className="text-sm text-slate-800">{d.n}</b>
                  <small className="block text-[11.5px] text-slate-500">{d.d}</small>
                </div>
                <span className="text-sm font-semibold text-blue-600">{d.p}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Reservas recientes" tag="últimas 24 h">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <Th>Reserva</Th><Th>Cliente</Th><Th>Paquete</Th><Th>Fecha viaje</Th><Th>Estado</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas.map((r) => (
              <TableRow key={r[0]} className="border-slate-100 hover:bg-sky-50">
                <TableCell className="font-medium text-slate-800">{r[0]}</TableCell>
                <TableCell>{r[1]}</TableCell>
                <TableCell>{r[2]}</TableCell>
                <TableCell>{r[4]}</TableCell>
                <TableCell><Pill tone={r[6]}>{r[7]}</Pill></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

function DataView({ title, cols, rows, cta, action }) {
  const tag = action || (cta && (
    <Button size="sm" className="h-8 gap-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white"><Plus className="h-3.5 w-3.5" />{cta}</Button>
  ));
  return (
    <Panel title={title} tag={tag}>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">{cols.map((c) => <Th key={c}>{c}</Th>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, ri) => (
            <TableRow key={ri} className="border-slate-100 hover:bg-sky-50">
              {r.map((cell, ci) =>
                cell && typeof cell === "object"
                  ? <TableCell key={ci}><Pill tone={cell.tone}>{cell.text}</Pill></TableCell>
                  : <TableCell key={ci} className={ci === 0 ? "font-medium text-slate-800" : ""}>{cell}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function ReservasView({ reservas, onPay, action }) {
  return (
    <Panel title="Gestión de reservas" tag={action}>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">
            <Th>Reserva</Th><Th>Cliente</Th><Th>Paquete</Th><Th>Pax</Th>
            <Th>Fecha viaje</Th><Th>Asesor</Th><Th>Estado</Th><Th>Acción</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map((r) => (
            <TableRow key={r[0]} className="border-slate-100 hover:bg-sky-50">
              <TableCell className="font-medium text-slate-800">{r[0]}</TableCell>
              <TableCell>{r[1]}</TableCell>
              <TableCell>{r[2]}</TableCell>
              <TableCell>{r[3]}</TableCell>
              <TableCell>{r[4]}</TableCell>
              <TableCell>{r[5]}</TableCell>
              <TableCell><Pill tone={r[6]}>{r[7]}</Pill></TableCell>
              <TableCell>
                {r[7] === "Pagada" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-4 w-4" />Pagada</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onPay(r[0])}
                    className="h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <CreditCard className="h-3.5 w-3.5" />Pagar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function Paquetes({ paquetes }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {paquetes.map((p, i) => {
        const Icon = ICONS[p.iconKey] || Palmtree;
        return (
          <motion.div key={p.n} variants={fade} custom={i} initial="hidden" animate="show">
            <SpotlightCard className={`overflow-hidden rounded-2xl ${glass} transition-transform hover:-translate-y-1`} spotlightColor="rgba(37,99,235,0.12)">
              <div className="grid h-28 place-items-center bg-gradient-to-br from-sky-500 to-blue-600">
                <Icon className="h-12 w-12 text-white" strokeWidth={1.5} />
              </div>
              <div className="p-4">
                <b className="text-[15px] text-slate-800">{p.n}</b>
                <div className="mb-3 mt-0.5 text-xs text-slate-500">{p.loc}</div>
                <div className="text-lg font-bold text-blue-600">{p.precio}</div>
                <div className="mt-1.5 text-[11.5px] text-slate-500">{p.cupo}</div>
              </div>
            </SpotlightCard>
          </motion.div>
        );
      })}
    </div>
  );
}

function Reportes() {
  const asesores = [
    ["Samuel Parra", "142 reservas", "$ 812 M"],
    ["Juan J. García", "118 reservas", "$ 690 M"],
    ["Andrés Martínez", "109 reservas", "$ 634 M"],
  ];
  const distrib = [[Plane, "Internacionales", 58], [Bus, "Nacionales", 31], [Ship, "Cruceros", 11]];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { lbl: "Ventas acumuladas 2026", to: 2940, prefix: "$ ", suffix: " M", delta: "+21% anual" },
          { lbl: "Ticket promedio", to: 5.8, prefix: "$ ", suffix: " M", delta: "+4%", decimals: 1 },
          { lbl: "Tasa de conversión", to: 62, suffix: "%", delta: "+5 pts" },
        ].map((k, i) => (
          <motion.div key={k.lbl} variants={fade} custom={i} initial="hidden" animate="show">
            <SpotlightCard className={`rounded-2xl p-5 ${glass}`} spotlightColor="rgba(37,99,235,0.12)">
              <p className="mb-2 text-[13px] text-slate-500">{k.lbl}</p>
              <p className="text-[27px] font-bold text-slate-800">
                <CountUp to={k.to} prefix={k.prefix || ""} suffix={k.suffix || ""} decimals={k.decimals || 0} duration={1.6} />
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600"><TrendingUp className="h-3.5 w-3.5" />{k.delta}</p>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Ventas por asesor" tag="trimestre">
          <div className="divide-y divide-slate-100">
            {asesores.map((r, i) => (
              <div key={r[0]} className="flex items-center gap-3 py-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 bg-blue-500/10 text-sm font-bold text-blue-700">{i + 1}</div>
                <div className="flex-1"><b className="text-sm text-slate-800">{r[0]}</b><small className="block text-[11.5px] text-slate-500">{r[1]}</small></div>
                <span className="text-sm font-semibold text-blue-600">{r[2]}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Distribución de ventas" tag="por tipo">
          <div className="space-y-4">
            {distrib.map(([Icon, label, val]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700"><Icon className="h-4 w-4 text-blue-600" />{label}</span>
                  <span className="font-semibold text-blue-600">{val}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600"
                    initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
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

// Cada config: qué tabla, qué campos, y cómo construir el registro para BD y para la tabla.
const FORMS = {
  clientes: {
    entity: "clientes", table: "clientes", label: "Nuevo cliente", title: "Registrar nuevo cliente",
    fields: [
      { key: "nombre", label: "Nombre completo", ph: "Ej. Juan García" },
      { key: "documento", label: "Documento", ph: "Cédula", half: true },
      { key: "telefono", label: "Teléfono", ph: "300 000 0000", half: true },
      { key: "correo", label: "Correo", ph: "correo@mail.com", type: "email" },
    ],
    build: (v) => {
      const codigo = "CL-" + n4();
      return {
        payload: { codigo, nombre: v.nombre, documento: v.documento, correo: v.correo, telefono: v.telefono, reservas: 0, tono: "warn", estado: "Nuevo" },
        row: [codigo, v.nombre, v.documento, v.correo, v.telefono, 0, "warn", "Nuevo"],
      };
    },
  },
  reservas: {
    entity: "reservas", table: "reservas", label: "Nueva reserva", title: "Registrar nueva reserva",
    fields: [
      { key: "cliente", label: "Cliente", select: "clientes" },
      { key: "paquete", label: "Paquete", select: "paquetes" },
      { key: "pax", label: "Pasajeros", ph: "2", type: "number", half: true },
      { key: "fecha_viaje", label: "Fecha de viaje", type: "date", half: true },
      { key: "asesor", label: "Asesor", select: ["Samuel P.", "Juan J.", "Andrés M."] },
    ],
    build: (v) => {
      const codigo = "#RS-" + n4();
      const pax = Number(v.pax) || 1;
      return {
        payload: { codigo, cliente: v.cliente, paquete: v.paquete, pax, fecha_viaje: v.fecha_viaje || null, asesor: v.asesor, tono: "info", estado: "En proceso" },
        row: [codigo, v.cliente, v.paquete, pax, v.fecha_viaje || "—", v.asesor, "info", "En proceso"],
      };
    },
  },
  pagos: {
    entity: "pagos", table: "pagos", label: "Registrar pago", title: "Registrar nuevo pago",
    fields: [
      { key: "reserva", label: "Reserva", select: "reservas", half: true },
      { key: "cliente", label: "Cliente", select: "clientes", half: true },
      { key: "metodo", label: "Método", select: ["Tarjeta crédito", "Transferencia", "PSE", "Efectivo", "Nequi"], half: true },
      { key: "valor", label: "Valor", ph: "$ 1.000.000", half: true },
    ],
    build: (v) => {
      const recibo = "#PG-" + n4();
      return {
        payload: { recibo, reserva: v.reserva, cliente: v.cliente, metodo: v.metodo, valor: v.valor, fecha: hoy(), tono: "warn", estado: "Abono" },
        row: [recibo, v.reserva, v.cliente, v.metodo, v.valor, hoy(), "warn", "Abono"],
      };
    },
  },
  facturas: {
    entity: "facturas", table: "facturas", label: "Emitir factura", title: "Emitir nueva factura",
    fields: [
      { key: "cliente", label: "Cliente", select: "clientes" },
      { key: "nit", label: "NIT / CC", ph: "900.000.000-0", half: true },
      { key: "reserva", label: "Reserva", select: "reservas", half: true },
      { key: "valor", label: "Valor + IVA", ph: "$ 6.480.000" },
    ],
    build: (v) => {
      const factura = "FE-" + n6();
      return {
        payload: { factura, cliente: v.cliente, nit: v.nit, reserva: v.reserva, valor: v.valor, fecha: hoy(), tono: "info", estado: "Enviada" },
        row: [factura, v.cliente, v.nit, v.reserva, v.valor, hoy(), "info", "Enviada"],
      };
    },
  },
  proveedores: {
    entity: "proveedores", table: "proveedores", label: "Nuevo proveedor", title: "Registrar nuevo proveedor",
    fields: [
      { key: "nombre", label: "Proveedor", ph: "Ej. Avianca" },
      { key: "tipo", label: "Tipo", select: ["Aerolínea", "Hotelería", "Operador terrestre", "Naviera"], half: true },
      { key: "convenio", label: "Convenio", ph: "Comisión 8%", half: true },
      { key: "contacto", label: "Contacto", ph: "correo@proveedor.com" },
    ],
    build: (v) => ({
      payload: { nombre: v.nombre, tipo: v.tipo, contacto: v.contacto, convenio: v.convenio, tono: "info", estado: "Nuevo" },
      row: [v.nombre, v.tipo, v.contacto, v.convenio, "info", "Nuevo"],
    }),
  },
  paquetes: {
    entity: "paquetes", table: "paquetes", label: "Nuevo paquete", title: "Registrar nuevo paquete",
    fields: [
      { key: "nombre", label: "Nombre del paquete", ph: "Ej. Cancún Paraíso" },
      { key: "loc", label: "Ubicación / duración", ph: "México · 7 días / 6 noches" },
      { key: "precio", label: "Precio", ph: "$ 6.480.000", half: true },
      { key: "cupo", label: "Cupos", ph: "Cupos: 12 / 40", half: true },
      { key: "icono", label: "Ícono", select: ["umbrella", "landmark", "waves", "ferriswheel", "mountain", "building"] },
    ],
    build: (v) => {
      const icono = v.icono || "umbrella";
      return {
        payload: { nombre: v.nombre, loc: v.loc, precio: v.precio, cupo: v.cupo, icono },
        row: { iconKey: icono, n: v.nombre, loc: v.loc, precio: v.precio, cupo: v.cupo },
      };
    },
  },
};

function AddDialog({ label, title, fields, onSubmit, selects = {} }) {
  const empty = Object.fromEntries(fields.map((f) => [f.key, ""]));
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const setVal = (k, val) => setV((s) => ({ ...s, [k]: val }));
  const optsOf = (f) => (Array.isArray(f.select) ? f.select : selects[f.select] || []);

  const submit = async (e) => {
    e.preventDefault();
    const first = fields[0];
    if (first && !String(v[first.key] || "").trim()) { setError(`${first.label} es obligatorio.`); return; }
    setSaving(true); setError("");
    try {
      await onSubmit(v);
      setV(empty); setOpen(false);
    } catch (err) {
      setError("No se pudo guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <Plus className="h-3.5 w-3.5" />{label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key} className={`space-y-1.5 ${f.half ? "" : "col-span-2"}`}>
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.select ? (
                  <Select value={v[f.key]} onValueChange={(val) => setVal(f.key, val)}>
                    <SelectTrigger id={f.key} className="w-full">
                      <SelectValue placeholder={`Selecciona ${f.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {optsOf(f).length === 0
                        ? <div className="px-2 py-1.5 text-sm text-slate-400">Sin opciones</div>
                        : optsOf(f).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id={f.key} type={f.type || "text"} value={v[f.key]} onChange={set(f.key)} placeholder={f.ph || ""} />
                )}
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={saving} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Estado BD ------------------------------- */
function DbBadge({ source }) {
  if (source === "supabase")
    return <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 md:flex"><Database className="h-3.5 w-3.5" />Base de datos</div>;
  return <div className="hidden items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 md:flex"><CircleAlert className="h-3.5 w-3.5" />Datos demo</div>;
}

/* -------------------------------- useEntities ------------------------------ */
function useEntities() {
  const [data, setData] = useState(DEMO);
  const [source, setSource] = useState(isSupabaseReady ? "loading" : "demo");

  useEffect(() => {
    if (!isSupabaseReady) return;
    let alive = true;
    fetchEntities()
      .then((d) => { if (alive && d) { setData(d); setSource("supabase"); } })
      .catch((err) => { console.error("Supabase:", err.message); if (alive) setSource("demo"); });
    return () => { alive = false; };
  }, []);

  return { data, setData, source };
}

/* ------------------------------- Dashboard ------------------------------- */
function Shell({ onLogout }) {
  const [view, setView] = useState("dash");
  const [open, setOpen] = useState(false);
  const { data, setData, source } = useEntities();
  const [t1, t2] = TITULOS[view];

  // Opciones para los menús desplegables (se arman con lo que ya existe)
  const selects = {
    clientes: data.clientes.map((c) => c[1]),
    paquetes: data.paquetes.map((p) => p.n),
    reservas: data.reservas.map((r) => r[0]),
  };

  const submitFor = (key) => async (values) => {
    if (key === "reservas") return addReserva(values);
    const cfg = FORMS[key];
    const { payload, row } = cfg.build(values);
    setData((d) => ({ ...d, [cfg.entity]: [row, ...d[cfg.entity]] }));
    if (isSupabaseReady) {
      try { await insertRow(cfg.table, payload); }
      catch (err) { console.warn("No se persistió en Supabase:", err.message); }
    }
  };

  // Nueva reserva -> arranca "Pendiente" y genera su factura automáticamente
  const addReserva = async (values) => {
    const { payload, row } = FORMS.reservas.build(values);
    const rrow = [...row]; rrow[6] = "bad"; rrow[7] = "Pendiente";
    const rpay = { ...payload, tono: "bad", estado: "Pendiente" };
    const precio = data.paquetes.find((p) => p.n === values.paquete)?.precio || "$ 0";
    const nit = data.clientes.find((c) => c[1] === values.cliente)?.[2] || "";
    const factura = "FE-" + n6();
    const frow = [factura, values.cliente, nit, payload.codigo, precio, hoy(), "warn", "Por validar"];
    const fpay = { factura, cliente: values.cliente, nit, reserva: payload.codigo, valor: precio, fecha: hoy(), tono: "warn", estado: "Por validar" };
    setData((d) => ({ ...d, reservas: [rrow, ...d.reservas], facturas: [frow, ...d.facturas] }));
    if (isSupabaseReady) {
      try { await insertRow("reservas", rpay); await insertRow("facturas", fpay); }
      catch (err) { console.warn("No se persistió en Supabase:", err.message); }
    }
  };

  // Pagar -> registra el pago, marca la reserva "Pagada" y su factura "Aceptada"
  const payReserva = async (code) => {
    const r = data.reservas.find((x) => x[0] === code);
    if (!r) return;
    const valor = data.facturas.find((x) => x[3] === code)?.[4] || "$ 0";
    const recibo = "#PG-" + n4();
    const pgrow = [recibo, code, r[1], "Tarjeta crédito", valor, hoy(), "ok", "Pagado"];
    setData((d) => ({
      ...d,
      pagos: [pgrow, ...d.pagos],
      reservas: d.reservas.map((x) => (x[0] === code ? [...x.slice(0, 6), "ok", "Pagada"] : x)),
      facturas: d.facturas.map((x) => (x[3] === code ? [...x.slice(0, 6), "ok", "Aceptada"] : x)),
    }));
    if (isSupabaseReady) {
      try {
        await insertRow("pagos", { recibo, reserva: code, cliente: r[1], metodo: "Tarjeta crédito", valor, fecha: hoy(), tono: "ok", estado: "Pagado" });
        await updateRows("reservas", "codigo", code, { tono: "ok", estado: "Pagada" });
        await updateRows("facturas", "reserva", code, { tono: "ok", estado: "Aceptada" });
      } catch (err) { console.warn("No se persistió en Supabase:", err.message); }
    }
  };

  const addAction = (key) => (
    <AddDialog label={FORMS[key].label} title={FORMS[key].title} fields={FORMS[key].fields} onSubmit={submitFor(key)} selects={selects} />
  );

  const render = () => {
    switch (view) {
      case "dash": return <Dashboard reservas={data.reservas} />;
      case "clientes":
        return <DataView title="Clientes registrados" action={addAction("clientes")}
          cols={["ID", "Nombre", "Documento", "Correo", "Teléfono", "Reservas", "Estado"]}
          rows={data.clientes.map((c) => [c[0], c[1], c[2], c[3], c[4], c[5], { tone: c[6], text: c[7] }])} />;
      case "paquetes":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">{addAction("paquetes")}</div>
            <Paquetes paquetes={data.paquetes} />
          </div>
        );
      case "reservas":
        return <ReservasView reservas={data.reservas} onPay={payReserva} action={addAction("reservas")} />;
      case "pagos":
        return <DataView title="Registro de pagos" action={addAction("pagos")}
          cols={["Recibo", "Reserva", "Cliente", "Método", "Valor", "Fecha", "Estado"]}
          rows={data.pagos.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "facturas":
        return <DataView title="Facturación electrónica" action={addAction("facturas")}
          cols={["Factura", "Cliente", "NIT / CC", "Reserva", "Valor + IVA", "Fecha", "Estado DIAN"]}
          rows={data.facturas.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "proveedores":
        return <DataView title="Proveedores y operadores" action={addAction("proveedores")}
          cols={["Proveedor", "Tipo", "Contacto", "Convenio", "Estado"]}
          rows={data.proveedores.map((r) => [r[0], r[1], r[2], r[3], { tone: r[4], text: r[5] }])} />;
      case "reportes": return <Reportes />;
      default: return null;
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen">
      <motion.aside
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed z-30 h-screen w-64 shrink-0 border-r border-slate-200 bg-white/85 p-4 backdrop-blur-xl transition-transform md:sticky md:top-0 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center gap-3 px-2">
          <LogoMark size="h-10 w-10" img="h-8 w-8" />
          <span className="text-lg font-bold text-slate-800">Nóva<GradientText colors={brandColors}>Travel</GradientText></span>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <div key={n.id}>
              {n.group && <p className="mb-1 mt-4 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">{n.group}</p>}
              <button
                onClick={() => { setView(n.id); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  view === n.id
                    ? "border border-blue-200 bg-gradient-to-br from-sky-500/15 to-blue-600/15 font-medium text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-sky-50 hover:text-blue-700"
                }`}
              >
                <n.icon className="h-[18px] w-[18px]" />{n.label}
              </button>
            </div>
          ))}
        </nav>
      </motion.aside>

      {open && <div className="fixed inset-0 z-20 bg-slate-900/20 md:hidden" onClick={() => setOpen(false)} />}

      <main className="min-h-screen flex-1 p-6 md:p-8">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">{t1}</h1>
              <p className="text-sm text-slate-500">{t2}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DbBadge source={source} />
            <div className={`hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-slate-500 sm:flex ${glass}`}>
              <Search className="h-4 w-4" />
              <input placeholder="Buscar..." className="w-40 bg-transparent text-slate-700 outline-none placeholder:text-slate-400" />
            </div>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${glass}`}>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-xs font-bold text-white">AF</div>
              <span className="hidden text-sm text-slate-700 sm:inline">Andrés F.</span>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2 border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-500">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={view}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>
            {render()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------------------------------- App ---------------------------------- */
export default function App() {
  const [auth, setAuth] = useState(false);

  return (
    <ClickSpark sparkColor="#2563eb" sparkCount={9} sparkRadius={18}>
      <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-800">
        <div className="pointer-events-none fixed inset-0 z-0">
          <Squares direction="diagonal" speed={0.4} squareSize={46}
            borderColor="rgba(37,99,235,0.10)" hoverFillColor="rgba(56,189,248,0.10)" fadeColor="#eef4ff" />
        </div>
        <div className="pointer-events-none fixed -right-24 -top-24 z-0 h-[420px] w-[420px] rounded-full bg-sky-300/25 blur-[90px]" />
        <div className="pointer-events-none fixed -bottom-32 -left-24 z-0 h-[380px] w-[380px] rounded-full bg-blue-300/20 blur-[90px]" />

        <AnimatePresence mode="wait">
          {auth
            ? <Shell key="shell" onLogout={() => setAuth(false)} />
            : <motion.div key="login" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35 }}>
                <Login onLogin={() => setAuth(true)} />
              </motion.div>}
        </AnimatePresence>
      </div>
    </ClickSpark>
  );
}
