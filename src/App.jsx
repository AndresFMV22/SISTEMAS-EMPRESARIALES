import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Palmtree, CalendarDays, CreditCard,
  ReceiptText, Building2, BarChart3, Search, LogOut, Menu, TrendingUp,
  TrendingDown, Plus, Umbrella, Landmark, Waves, FerrisWheel, Mountain,
  Building, Bus, Ship, Plane, Database, CircleAlert, Check,
  Moon, Sun, Languages, Shield, Cookie, MessageSquarePlus, Power, X,
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
import { useLang, LANGS } from "@/lib/i18n.jsx";

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

const glass = "border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

const brandColors = ["#2563eb", "#0ea5e9", "#2563eb"];

/* --------------------------------- Login --------------------------------- */
function Login({ onLogin }) {
  const { t } = useLang();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(0);

  const submit = (e) => {
    e.preventDefault();
    if (usr.trim() === "admin" && pwd === "agencia2026") onLogin();
    else { setErr(t("login.bad")); setShake((s) => s + 1); }
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
            <span className="text-2xl font-bold tracking-wide text-foreground">
              Nóva<GradientText colors={brandColors} className="align-baseline">Travel</GradientText>
            </span>
          </motion.div>

          <motion.p variants={fade} custom={1} className="mb-7 text-center text-sm">
            <ShinyText text={t("app.tagline")} speed={4} />
          </motion.p>

          <motion.div variants={fade} custom={2} className="mb-4">
            <label className="mb-2 block text-xs font-medium tracking-wide text-blue-700">{t("login.user")}</label>
            <Input value={usr} onChange={(e) => setUsr(e.target.value)}
              placeholder={t("login.userPh")} autoComplete="off" className="h-11 border-border bg-background" />
          </motion.div>

          <motion.div variants={fade} custom={3} className="mb-6">
            <label className="mb-2 block text-xs font-medium tracking-wide text-blue-700">{t("login.pass")}</label>
            <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••" className="h-11 border-border bg-background" />
          </motion.div>

          <motion.div variants={fade} custom={4}>
            <Button type="submit"
              className="h-12 w-full bg-gradient-to-br from-sky-500 to-blue-600 text-base font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-transform hover:-translate-y-0.5 hover:from-sky-400 hover:to-blue-500">
              {t("login.enter")}
            </Button>
          </motion.div>

          <div className="mt-3 min-h-5 text-center text-sm text-rose-500">{err}</div>

          <motion.div variants={fade} custom={5}
            className="mt-3 border-t border-dashed border-border pt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
            {t("login.access")}<br />
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
          <p className="mb-2 text-[13px] text-muted-foreground">{k.lbl}</p>
          <p className="text-[27px] font-bold text-foreground">
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
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
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
          <small className="text-[11px] text-muted-foreground">{m}</small>
        </div>
      ))}
    </div>
  );
}

function Th({ children }) {
  return <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">{children}</TableHead>;
}

/* --------------------------------- Vistas -------------------------------- */
function Dashboard({ reservas }) {
  const { t } = useLang();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const filtradas = reservas.filter((r) => {
    const f = r[4];
    if (desde && (!f || f < desde)) return false;
    if (hasta && (!f || f > hasta)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => <StatCard key={k.lbl} k={k} i={i} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={t("dash.ventas")} tag="2026 · COP (M)"><BarChart /></Panel>
        <Panel title={t("dash.destinos")} tag="Top 5">
          <div className="divide-y divide-border">
            {DESTINOS.map((d) => (
              <div key={d.n} className="flex items-center gap-3 py-2.5 transition-all hover:pl-2">
                <Mono text={d.n} />
                <div className="flex-1">
                  <b className="text-sm text-foreground">{d.n}</b>
                  <small className="block text-[11.5px] text-muted-foreground">{d.d}</small>
                </div>
                <span className="text-sm font-semibold text-blue-600">{d.p}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={t("dash.recientes")} tag={
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">{t("dash.filter")}:</span>
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
      }>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <Th>{t("col.reserva")}</Th><Th>{t("col.cliente")}</Th><Th>{t("col.paquete")}</Th><Th>{t("col.fecha")}</Th><Th>{t("col.estado")}</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.slice(0, 12).map((r) => (
              <TableRow key={r[0]} className="border-border hover:bg-sky-50">
                <TableCell className="font-medium text-foreground">{r[0]}</TableCell>
                <TableCell>{r[1]}</TableCell>
                <TableCell>{r[2]}</TableCell>
                <TableCell>{r[4]}</TableCell>
                <TableCell><Pill tone={r[6]}>{r[7]}</Pill></TableCell>
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

function DataView({ title, cols, rows, cta, action }) {
  const tag = action || (cta && (
    <Button size="sm" className="h-8 gap-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white"><Plus className="h-3.5 w-3.5" />{cta}</Button>
  ));
  return (
    <Panel title={title} tag={tag}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">{cols.map((c) => <Th key={c}>{c}</Th>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, ri) => (
            <TableRow key={ri} className="border-border hover:bg-sky-50">
              {r.map((cell, ci) =>
                cell && typeof cell === "object"
                  ? <TableCell key={ci}><Pill tone={cell.tone}>{cell.text}</Pill></TableCell>
                  : <TableCell key={ci} className={ci === 0 ? "font-medium text-foreground" : ""}>{cell}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function ReservasView({ reservas, onPay, action }) {
  const { t } = useLang();
  return (
    <Panel title={t("nav.reservas")} tag={action}>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <Th>{t("col.reserva")}</Th><Th>{t("col.cliente")}</Th><Th>{t("col.paquete")}</Th><Th>{t("col.pax")}</Th>
            <Th>{t("col.fecha")}</Th><Th>{t("col.asesor")}</Th><Th>{t("col.estado")}</Th><Th>{t("col.accion")}</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map((r) => (
            <TableRow key={r[0]} className="border-border hover:bg-sky-50">
              <TableCell className="font-medium text-foreground">{r[0]}</TableCell>
              <TableCell>{r[1]}</TableCell>
              <TableCell>{r[2]}</TableCell>
              <TableCell>{r[3]}</TableCell>
              <TableCell>{r[4]}</TableCell>
              <TableCell>{r[5]}</TableCell>
              <TableCell><Pill tone={r[6]}>{r[7]}</Pill></TableCell>
              <TableCell>
                {r[7] === "Pagada" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-4 w-4" />{t("st.paid")}</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => onPay(r[0])}
                    className="h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <CreditCard className="h-3.5 w-3.5" />{t("btn.pay")}
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
  const { t } = useLang();
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
                <b className="text-[15px] text-foreground">{p.n}</b>
                <div className="mb-3 mt-0.5 text-xs text-muted-foreground">{p.loc}</div>
                <div className="text-lg font-bold text-blue-600">{p.precio}</div>
                <div className="mt-1.5 text-[11.5px] text-muted-foreground">{p.cupo}</div>
                {(p.salida || p.regreso) && (
                  <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    <span>{t("pkg.salida")}: <b className="font-medium text-foreground">{p.salida || "—"}</b></span>
                    <span>· {t("pkg.regreso")}: <b className="font-medium text-foreground">{p.regreso || "—"}</b></span>
                  </div>
                )}
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
              <p className="mb-2 text-[13px] text-muted-foreground">{k.lbl}</p>
              <p className="text-[27px] font-bold text-foreground">
                <CountUp to={k.to} prefix={k.prefix || ""} suffix={k.suffix || ""} decimals={k.decimals || 0} duration={1.6} />
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600"><TrendingUp className="h-3.5 w-3.5" />{k.delta}</p>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Ventas por asesor" tag="trimestre">
          <div className="divide-y divide-border">
            {asesores.map((r, i) => (
              <div key={r[0]} className="flex items-center gap-3 py-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 bg-blue-500/10 text-sm font-bold text-blue-700">{i + 1}</div>
                <div className="flex-1"><b className="text-sm text-foreground">{r[0]}</b><small className="block text-[11.5px] text-muted-foreground">{r[1]}</small></div>
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
                  <span className="flex items-center gap-2 text-foreground"><Icon className="h-4 w-4 text-blue-600" />{label}</span>
                  <span className="font-semibold text-blue-600">{val}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
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
        payload: { codigo, nombre: v.nombre, documento: v.documento, correo: v.correo, telefono: v.telefono, reservas: 0, activo: true, observaciones: "", obs_desde: null, obs_hasta: null },
        row: [codigo, v.nombre, v.documento, v.correo, v.telefono, 0, true, "", "", ""],
      };
    },
  },
  empleados: {
    entity: "empleados", table: "empleados", label: "Nuevo empleado", title: "Registrar nuevo empleado",
    fields: [
      { key: "nombre", label: "Nombre", ph: "Ej. Ana López" },
      { key: "cargo", label: "Cargo", select: ["Asesor comercial", "Gerente general", "Contador", "Soporte al cliente", "Coordinador de viajes", "Recursos humanos"], half: true },
      { key: "telefono", label: "Teléfono", ph: "300 000 0000", half: true },
      { key: "correo", label: "Correo", ph: "correo@novatravel.com", type: "email" },
    ],
    build: (v) => {
      const codigo = "EM-" + n4();
      return {
        payload: { codigo, nombre: v.nombre, cargo: v.cargo, correo: v.correo, telefono: v.telefono, activo: true, observaciones: "", obs_desde: null, obs_hasta: null },
        row: [codigo, v.nombre, v.cargo, v.correo, v.telefono, true, "", "", ""],
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
      { key: "salida", label: "Fecha de salida", type: "date", half: true },
      { key: "regreso", label: "Fecha de regreso", type: "date", half: true },
      { key: "icono", label: "Ícono", select: ["umbrella", "landmark", "waves", "ferriswheel", "mountain", "building"] },
    ],
    build: (v) => {
      const icono = v.icono || "umbrella";
      return {
        payload: { nombre: v.nombre, loc: v.loc, precio: v.precio, cupo: v.cupo, icono, salida: v.salida || null, regreso: v.regreso || null },
        row: { iconKey: icono, n: v.nombre, loc: v.loc, precio: v.precio, cupo: v.cupo, salida: v.salida || "", regreso: v.regreso || "" },
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
    const pasada = fields.find((f) => f.type === "date" && v[f.key] && v[f.key] < hoy());
    if (pasada) { setError("La fecha no puede ser anterior a hoy."); return; }
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
                  <Input id={f.key} type={f.type || "text"} value={v[f.key]} onChange={set(f.key)}
                    placeholder={f.ph || ""} min={f.type === "date" ? hoy() : undefined} />
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
  const { t } = useLang();
  if (source === "supabase")
    return <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 lg:flex"><Database className="h-3.5 w-3.5" />{t("tb.db")}</div>;
  return <div className="hidden items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 lg:flex"><CircleAlert className="h-3.5 w-3.5" />{t("tb.demo")}</div>;
}

/* --------------------------- Tema (claro/oscuro) --------------------------- */
function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("nt_theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("nt_theme", dark ? "dark" : "light"); } catch { /* noop */ }
  }, [dark]);
  return [dark, setDark];
}

function TopControls({ dark, setDark }) {
  const { t, lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" title={dark ? t("theme.light") : t("theme.dark")}
        onClick={() => setDark((d) => !d)} className="border-border">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Select value={lang} onValueChange={setLang}>
        <SelectTrigger className="h-9 w-[140px] gap-1 border-border" title={t("lang.label")} aria-label={t("lang.label")}>
          <Languages className="h-4 w-4 shrink-0 text-blue-600" />
          <span className="truncate">{LANGS.find((l) => l.code === lang)?.label || lang}</span>
        </SelectTrigger>
        <SelectContent>
          {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ------------------------ Observaciones de un registro ---------------------- */
function ObsDialog({ current, onSave }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [obs, setObs] = useState(current.obs);
  const [desde, setDesde] = useState(current.desde);
  const [hasta, setHasta] = useState(current.hasta);
  useEffect(() => { if (open) { setObs(current.obs); setDesde(current.desde); setHasta(current.hasta); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (e) => { e.preventDefault(); await onSave({ obs, desde, hasta }); setOpen(false); };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50">
          <MessageSquarePlus className="h-3.5 w-3.5" />{t("btn.observ")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("obs.title")}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("obs.text")}</Label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3}
              className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{t("obs.from")}</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>{t("obs.to")}</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild><Button type="button" variant="outline">{t("btn.cancel")}</Button></DialogClose>
            <Button type="submit" className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t("btn.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------- Vista de personas (Clientes / Empleados) con activo + obs ---------- */
function PeopleView({ title, action, rows, leadCols, actIdx, obsIdx, desIdx, hasIdx, onToggle, onObs }) {
  const { t } = useLang();
  return (
    <Panel title={title} tag={action}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {leadCols.map((c) => <Th key={c.label}>{c.label}</Th>)}
              <Th>{t("col.estado")}</Th><Th>{t("col.observ")}</Th><Th>{t("col.accion")}</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const activo = r[actIdx];
              return (
                <TableRow key={r[0]} className={`border-border hover:bg-sky-50 ${activo ? "" : "opacity-55"}`}>
                  {leadCols.map((c, i) => <TableCell key={i} className={i === 0 ? "font-medium text-foreground" : ""}>{r[c.idx]}</TableCell>)}
                  <TableCell><Pill tone={activo ? "ok" : "bad"}>{activo ? t("st.active") : t("st.inactive")}</Pill></TableCell>
                  <TableCell className="max-w-[280px] align-top">
                    {r[obsIdx] ? (
                      <div className="flex flex-col items-start gap-1 py-0.5">
                        <span className="text-xs leading-snug text-muted-foreground">{r[obsIdx]}</span>
                        {(r[desIdx] || r[hasIdx]) && (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            <CalendarDays className="h-3 w-3" />{r[desIdx] || "—"} → {r[hasIdx] || "—"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{t("empty")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ObsDialog current={{ obs: r[obsIdx] || "", desde: r[desIdx] || "", hasta: r[hasIdx] || "" }} onSave={(o) => onObs(r[0], o)} />
                      <Button size="sm" variant="outline" onClick={() => onToggle(r[0], !activo)}
                        className={`h-7 gap-1 ${activo ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                        <Power className="h-3.5 w-3.5" />{activo ? t("btn.deactivate") : t("btn.activate")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

/* -------------------------- Políticas y cookies -------------------------- */
const POLICY = {
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
function PolicyDialog({ icon: Icon, title, paragraphs }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-blue-600">
          <Icon className="h-3.5 w-3.5" />{title}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CookieBanner() {
  const { t } = useLang();
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

function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
      <span>© 2026 NóvaTravel</span>
      <PolicyDialog icon={Shield} title={t("pol.privacy")} paragraphs={POLICY.privacy} />
      <PolicyDialog icon={Cookie} title={t("pol.cookies")} paragraphs={POLICY.cookies} />
    </footer>
  );
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
function Shell({ onLogout, dark, setDark }) {
  const { t } = useLang();
  const [view, setView] = useState("dash");
  const [open, setOpen] = useState(false);
  const { data, setData, source } = useEntities();
  const t1 = t("nav." + view);
  const t2 = t("sub." + view);

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

  // Activar / desactivar (soft) sin borrar el registro
  const toggleActivo = async (entity, codigo, activo) => {
    const idx = entity === "clientes" ? 6 : 5;
    setData((d) => ({ ...d, [entity]: d[entity].map((r) => { if (r[0] !== codigo) return r; const c = [...r]; c[idx] = activo; return c; }) }));
    if (isSupabaseReady) { try { await updateRows(entity, "codigo", codigo, { activo }); } catch (err) { console.warn(err.message); } }
  };

  // Guardar observaciones + rango de fechas
  const saveObs = async (entity, codigo, o) => {
    const [oi, di, hi] = entity === "clientes" ? [7, 8, 9] : [6, 7, 8];
    setData((d) => ({ ...d, [entity]: d[entity].map((r) => { if (r[0] !== codigo) return r; const c = [...r]; c[oi] = o.obs; c[di] = o.desde; c[hi] = o.hasta; return c; }) }));
    if (isSupabaseReady) { try { await updateRows(entity, "codigo", codigo, { observaciones: o.obs, obs_desde: o.desde || null, obs_hasta: o.hasta || null }); } catch (err) { console.warn(err.message); } }
  };

  const addAction = (key) => (
    <AddDialog label={FORMS[key].label} title={FORMS[key].title} fields={FORMS[key].fields} onSubmit={submitFor(key)} selects={selects} />
  );

  const render = () => {
    switch (view) {
      case "dash": return <Dashboard reservas={data.reservas} />;
      case "clientes":
        return <PeopleView title={t("nav.clientes")} action={addAction("clientes")}
          rows={data.clientes}
          leadCols={[{ label: "ID", idx: 0 }, { label: t("col.nombre"), idx: 1 }, { label: t("col.doc"), idx: 2 }, { label: t("col.correo"), idx: 3 }, { label: t("col.tel"), idx: 4 }]}
          actIdx={6} obsIdx={7} desIdx={8} hasIdx={9}
          onToggle={(c, a) => toggleActivo("clientes", c, a)} onObs={(c, o) => saveObs("clientes", c, o)} />;
      case "empleados":
        return <PeopleView title={t("nav.empleados")} action={addAction("empleados")}
          rows={data.empleados || []}
          leadCols={[{ label: "ID", idx: 0 }, { label: t("col.nombre"), idx: 1 }, { label: t("col.cargo"), idx: 2 }, { label: t("col.correo"), idx: 3 }, { label: t("col.tel"), idx: 4 }]}
          actIdx={5} obsIdx={6} desIdx={7} hasIdx={8}
          onToggle={(c, a) => toggleActivo("empleados", c, a)} onObs={(c, o) => saveObs("empleados", c, o)} />;
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
        return <DataView title={t("nav.pagos")} action={addAction("pagos")}
          cols={["Recibo", "Reserva", "Cliente", "Método", "Valor", "Fecha", "Estado"]}
          rows={data.pagos.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "facturas":
        return <DataView title={t("nav.facturas")} action={addAction("facturas")}
          cols={["Factura", "Cliente", "NIT / CC", "Reserva", "Valor + IVA", "Fecha", "Estado DIAN"]}
          rows={data.facturas.map((r) => [r[0], r[1], r[2], r[3], r[4], r[5], { tone: r[6], text: r[7] }])} />;
      case "proveedores":
        return <DataView title={t("nav.proveedores")} action={addAction("proveedores")}
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
        className={`fixed z-30 h-screen w-64 shrink-0 border-r border-border bg-sidebar p-4 backdrop-blur-xl transition-transform md:sticky md:top-0 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center gap-3 px-2">
          <LogoMark size="h-10 w-10" img="h-8 w-8" />
          <span className="text-lg font-bold text-foreground">Nóva<GradientText colors={brandColors}>Travel</GradientText></span>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <div key={n.id}>
              {n.group && <p className="mb-1 mt-4 px-2 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">{t("grp." + n.group)}</p>}
              <button
                onClick={() => { setView(n.id); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  view === n.id
                    ? "border border-blue-200 bg-gradient-to-br from-sky-500/15 to-blue-600/15 font-medium text-blue-700 shadow-sm"
                    : "text-muted-foreground hover:bg-sky-50 hover:text-blue-700"
                }`}
              >
                <n.icon className="h-[18px] w-[18px]" />{t("nav." + n.id)}
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
              <h1 className="text-2xl font-semibold text-foreground">{t1}</h1>
              <p className="text-sm text-muted-foreground">{t2}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DbBadge source={source} />
            <div className={`hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-muted-foreground lg:flex ${glass}`}>
              <Search className="h-4 w-4" />
              <input placeholder={t("tb.search")} className="w-32 bg-transparent text-foreground outline-none placeholder:text-slate-400" />
            </div>
            <TopControls dark={dark} setDark={setDark} />
            <div className={`hidden items-center gap-2 rounded-xl px-3 py-1.5 sm:flex ${glass}`}>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-xs font-bold text-white">AF</div>
              <span className="hidden text-sm text-foreground md:inline">Andrés F.</span>
            </div>
            <Button variant="outline" onClick={onLogout} className="gap-2 border-border text-muted-foreground hover:border-rose-400 hover:text-rose-500">
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("tb.logout")}</span>
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

        <Footer />
      </main>
    </div>
  );
}

/* ---------------------------------- App ---------------------------------- */
export default function App() {
  const [auth, setAuth] = useState(false);
  const [dark, setDark] = useTheme();

  return (
    <ClickSpark sparkColor="#2563eb" sparkCount={9} sparkRadius={18}>
      <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-foreground dark:from-[#070d20] dark:via-[#0a1226] dark:to-[#0b1430]">
        <div className="pointer-events-none fixed inset-0 z-0">
          <Squares direction="diagonal" speed={0.4} squareSize={46}
            borderColor={dark ? "rgba(56,189,248,0.10)" : "rgba(37,99,235,0.10)"}
            hoverFillColor="rgba(56,189,248,0.10)" fadeColor={dark ? "#070d20" : "#eef4ff"} />
        </div>
        <div className="pointer-events-none fixed -right-24 -top-24 z-0 h-[420px] w-[420px] rounded-full bg-sky-300/25 blur-[90px] dark:bg-blue-600/20" />
        <div className="pointer-events-none fixed -bottom-32 -left-24 z-0 h-[380px] w-[380px] rounded-full bg-blue-300/20 blur-[90px] dark:bg-sky-500/15" />

        {!auth && <div className="fixed right-4 top-4 z-20"><TopControls dark={dark} setDark={setDark} /></div>}

        <AnimatePresence mode="wait">
          {auth
            ? <Shell key="shell" onLogout={() => setAuth(false)} dark={dark} setDark={setDark} />
            : <motion.div key="login" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35 }}>
                <Login onLogin={() => setAuth(true)} />
              </motion.div>}
        </AnimatePresence>

        <CookieBanner />
      </div>
    </ClickSpark>
  );
}
