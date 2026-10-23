// Pesos colombianos enteros, igual que el flujo de cobros actual.
const formatoPesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function leerDinero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? Math.round(valor) : 0;
  return Number(String(valor ?? "").replace(/[^\d]/g, "")) || 0;
}

export function mostrarDinero(valor) {
  return `$ ${formatoPesos.format(leerDinero(valor))}`;
}

export function formatearEntradaDinero(valor) {
  return /\d/.test(String(valor ?? "")) ? mostrarDinero(valor) : "";
}
