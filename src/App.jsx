import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Palmtree, CalendarDays, CreditCard,
  ReceiptText, Building2, BarChart3, Search, LogOut, Menu, TrendingUp,
  TrendingDown, Plus, Umbrella, Landmark, Waves, FerrisWheel, Mountain,
  Building, Bus, Ship, Plane, Database, CircleAlert,
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
import Squares from "@/components/reactbits/Squares";
import ClickSpark from "@/components/reactbits/ClickSpark";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import GradientText from "@/components/reactbits/GradientText";
import ShinyText from "@/components/reactbits/ShinyText";
import CountUp from "@/components/reactbits/CountUp";
import { isSupabaseReady } from "@/lib/supabase";
import { fetchEntities, insertCliente } from "@/lib/db";

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

const DEMO = {
  clientes: [
    ["CL-0031", "María Restrepo", "43.118.902", "maria.r@mail.com", "310 555 8841", 7, "ok", "Frecuente"],
    ["CL-0032", "Carlos Gómez", "71.204.663", "c.gomez@mail.com", "301 442 1290", 3, "info", "Activo"],
    ["CL-0033", "Laura Muñoz", "1.017.554.210", "laura.m@mail.com", "312 908 7756", 2, "info", "Activo"],
    ["CL-0034", "Andrés Vélez", "98.552.117", "a.velez@mail.com", "314 220 3341", 5, "ok", "Frecuente"],
    ["CL-0035", "Sofía Álvarez", "1.037.889.004", "sofia.a@mail.com", "300 771 4420", 1, "warn", "Nuevo"],
  ],
  paquetes: [
    { iconKey: "umbrella", n: "Cancún Paraíso", loc: "México · 7 días / 6 noches", precio: "$ 6.480.000", cupo: "Cupos: 12 / 40 · Todo incluido" },
    { iconKey: "landmark", n: "Madrid Imperial", loc: "España · 8 días / 7 noches", precio: "$ 9.120.000", cupo: "Cupos: 5 / 25 · Vuelo + hotel" },
    { iconKey: "waves", n: "San Andrés Mar", loc: "Colombia · 4 días / 3 noches", precio: "$ 2.750.000", cupo: "Cupos: 20 / 50 · Con snorkel" },
    { iconKey: "ferriswheel", n: "Orlando Familiar", loc: "USA · 9 días / 8 noches", precio: "$ 14.300.000", cupo: "Cupos: 3 / 30 · Parques incluidos" },
    { iconKey: "mountain", n: "Cusco Ancestral", loc: "Perú · 6 días / 5 noches", precio: "$ 5.900.000", cupo: "Cupos: 8 / 20 · Machu Picchu" },
    { iconKey: "building", n: "París Romántico", loc: "Francia · 7 días / 6 noches", precio: "$ 11.450.000", cupo: "Cupos: 6 / 24 · City tour" },
  ],
  reservas: [
    ["#RS-20841", "María Restrepo", "Cancún Paraíso", 2, "2026-10-12", "Samuel P.", "ok", "Confirmada"],
    ["#RS-20840", "Carlos Gómez", "Madrid Imperial", 1, "2026-11-03", "Juan J.", "warn", "Pago parcial"],
    ["#RS-20839", "Laura Muñoz", "San Andrés Mar", 3, "2026-10-01", "Andrés M.", "ok", "Confirmada"],
    ["#RS-20838", "Andrés Vélez", "Orlando Familiar", 4, "2026-12-20", "Samuel P.", "info", "En proceso"],
    ["#RS-20837", "Sofía Álvarez", "Cusco Ancestral", 2, "2026-10-28", "Juan J.", "bad", "Pendiente"],
  ],
  pagos: [
    ["#PG-9912", "#RS-20841", "María Restrepo", "Tarjeta crédito", "$ 6.480.000", "2026-09-23", "ok", "Pagado"],
    ["#PG-9911", "#RS-20840", "Carlos Gómez", "Transferencia", "$ 4.500.000", "2026-09-23", "warn", "Abono 50%"],
    ["#PG-9910", "#RS-20839", "Laura Muñoz", "PSE", "$ 2.750.000", "2026-09-22", "ok", "Pagado"],
    ["#PG-9909", "#RS-20837", "Sofía Álvarez", "Efectivo", "$ 1.000.000", "2026-09-22", "warn", "Abono"],
  ],
  facturas: [
    ["FE-004821", "María Restrepo", "43.118.902", "#RS-20841", "$ 6.480.000", "2026-09-23", "ok", "Aceptada"],
    ["FE-004820", "Laura Muñoz", "1.017.554.210", "#RS-20839", "$ 2.750.000", "2026-09-22", "ok", "Aceptada"],
    ["FE-004819", "Carlos Gómez", "71.204.663", "#RS-20840", "$ 4.500.000", "2026-09-23", "info", "Enviada"],
    ["FE-004818", "Viajes Corp S.A.S", "900.552.118-4", "#RS-20835", "$ 22.900.000", "2026-09-21", "warn", "Por validar"],
  ],
  proveedores: [
    ["Avianca", "Aerolínea", "ventas@avianca.com", "Comisión 8%", "ok", "Activo"],
    ["Decameron", "Hotelería", "corporativo@decameron.com", "Tarifa neta", "ok", "Activo"],
    ["LATAM Airlines", "Aerolínea", "b2b@latam.com", "Comisión 6%", "ok", "Activo"],
    ["Meliá Hotels", "Hotelería", "reservas@melia.com", "Cupo garantizado", "warn", "En revisión"],
    ["ExpediTours", "Operador terrestre", "ops@expeditours.com", "Por servicio", "info", "Nuevo"],
  ],
};

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

/* --------------------------- Nuevo cliente (form) --------------------------- */
function NewClienteDialog({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ nombre: "", documento: "", correo: "", telefono: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError("");
    const codigo = "CL-" + Math.floor(1000 + Math.random() * 9000);
    const payload = { codigo, ...f, reservas: 0, tono: "warn", estado: "Nuevo" };
    try {
      if (isSupabaseReady) await insertCliente(payload);
      onCreate([codigo, f.nombre, f.documento, f.correo, f.telefono, 0, "warn", "Nuevo"]);
      setF({ nombre: "", documento: "", correo: "", telefono: "" });
      setOpen(false);
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
          <Plus className="h-3.5 w-3.5" />Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Registrar nuevo cliente</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" value={f.nombre} onChange={set("nombre")} placeholder="Ej. Juan García" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc">Documento</Label>
              <Input id="doc" value={f.documento} onChange={set("documento")} placeholder="Cédula" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tel">Teléfono</Label>
              <Input id="tel" value={f.telefono} onChange={set("telefono")} placeholder="300 000 0000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mail">Correo</Label>
            <Input id="mail" type="email" value={f.correo} onChange={set("correo")} placeholder="correo@mail.com" />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={saving} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">
              {saving ? "Guardando..." : "Guardar cliente"}
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

  const addCliente = (row) => setData((d) => ({ ...d, clientes: [row, ...d.clientes] }));

  const render = () => {
    switch (view) {
      case "dash": return <Dashboard reservas={data.reservas} />;
      case "clientes":
        return <DataView title="Clientes registrados" action={<NewClienteDialog onCreate={addCliente} />}
          cols={["ID", "Nombre", "Documento", "Correo", "Teléfono", "Reservas", "Estado"]}
          rows={data.clientes.map((c) => [c[0], c[1], c[2], c[3], c[4], c[5], { tone: c[6], text: c[7] }])} />;
      case "paquetes": return <Paquetes paquetes={data.paquetes} />;
      case "reservas":
        return <DataView title="Gestión de reservas" cta="Nueva reserva"
          cols={["Reserva", "Cliente", "Paquete", "Pax", "Fecha viaje", "Asesor", "Estado"]}
          rows={data.reservas.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "pagos":
        return <DataView title="Registro de pagos"
          cols={["Recibo", "Reserva", "Cliente", "Método", "Valor", "Fecha", "Estado"]}
          rows={data.pagos.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "facturas":
        return <DataView title="Facturación electrónica" cta="Emitir factura"
          cols={["Factura", "Cliente", "NIT / CC", "Reserva", "Valor + IVA", "Fecha", "Estado DIAN"]}
          rows={data.facturas.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "proveedores":
        return <DataView title="Proveedores y operadores" cta="Nuevo proveedor"
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
