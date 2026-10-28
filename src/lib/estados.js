const paleta = {
  verde: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300",
  amarillo: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-300",
  naranja: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-500/35 dark:bg-orange-500/15 dark:text-orange-300",
  rojo: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-300",
  azul: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-300",
  violeta: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-500/35 dark:bg-violet-500/15 dark:text-violet-300",
  gris: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const colores = {
  activo: "verde", activa: "verde", confirmada: "verde", pagado: "verde", pagada: "verde", aprobada: "verde", aceptada: "verde", disponible: "verde", vigente: "verde",
  pendiente: "amarillo", "pendiente de confirmacion": "amarillo", "sin pago": "amarillo", "por validar": "amarillo", "en revision": "amarillo", nuevo: "amarillo", incompleto: "amarillo", demo: "amarillo",
  "pago parcial": "naranja", abono: "naranja", "no aplica": "naranja",
  cancelada: "rojo", anulada: "rojo", anulado: "rojo", rechazada: "rojo", suspendido: "rojo", error: "rojo",
  "en proceso": "azul", "en viaje": "azul", enviada: "azul", invitado: "azul", loading: "azul", programada: "azul",
  finalizada: "violeta",
  inactivo: "gris", inactiva: "gris", sinacceso: "gris", "sin cuenta": "gris", lleno: "gris", historico: "gris", vencida: "gris", deshabilitada: "gris", "sin promocion": "gris",
};

export function aparienciaEstado(estado, tono) {
  const nombre = String(estado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_\s-]+/g, " ").trim();
  const color = colores[nombre] || (nombre.startsWith("abono") ? "naranja" : null)
    || ({ ok: "verde", warn: "amarillo", bad: "rojo", info: "azul" }[tono]) || "gris";
  return { color, clases: paleta[color] };
}

// Nivel de pago de la reserva, independiente del estado de la reserva: pendiente | parcial | pagado.
// Usa el estado guardado si existe; si no, lo deduce del total y lo abonado.
export function nivelPago(estadoPago, { pagado = 0, saldo = 0 } = {}) {
  const n = String(estadoPago || "").toLowerCase();
  if (n.includes("pagad")) return "pagado";
  if (n.includes("parcial") || n.includes("abono")) return "parcial";
  if (!estadoPago && pagado > 0) return saldo === 0 ? "pagado" : "parcial";
  return "pendiente";
}
