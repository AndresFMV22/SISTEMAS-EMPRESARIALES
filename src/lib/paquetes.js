const formatoFechaColombia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
});

export function fechaColombia(instante = new Date()) {
  const partes = formatoFechaColombia.formatToParts(instante);
  const valor = (tipo) => partes.find((parte) => parte.type === tipo).value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

// Compatibilidad con el catálogo actual: «Cupos: 15 / 20» significa 15 libres.
export function obtenerCupos(paquete) {
  const coincidencia = String(paquete.cupo || "").match(/Cupos:\s*(\d+)\s*\/\s*(\d+)/i);
  if (!coincidencia) return null;
  const disponibles = Number(coincidencia[1]);
  const capacidad = Number(coincidencia[2]);
  if (!Number.isSafeInteger(disponibles) || !Number.isSafeInteger(capacidad) || capacidad <= 0 || disponibles > capacidad) return null;
  return { disponibles, capacidad };
}

function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) return false;
  const instante = new Date(`${fecha}T12:00:00Z`);
  return !Number.isNaN(instante.getTime()) && instante.toISOString().slice(0, 10) === fecha;
}

export function duracionPaquete(salida, regreso) {
  if (!fechaValida(salida) || !fechaValida(regreso) || regreso < salida) return null;
  const noches = Math.round((Date.parse(`${regreso}T12:00:00Z`) - Date.parse(`${salida}T12:00:00Z`)) / 86400000);
  return { dias: noches + 1, noches };
}

// La duración antigua estaba mezclada con el destino. Se muestra calculada, no se reescribe el historial.
export function ubicacionSinDuracion(ubicacion) {
  return String(ubicacion || "").replace(/\s*·\s*\d+\s*d[ií]as?(?:\s*\/\s*\d+\s*noches?)?\s*$/i, "");
}

export function estadoPaquete(paquete, fecha = fechaColombia()) {
  const salidaValida = fechaValida(paquete.salida);
  const regresoValido = fechaValida(paquete.regreso);
  if (regresoValido && paquete.regreso < fecha) return "finalizado";
  if (!salidaValida || !regresoValido || paquete.regreso < paquete.salida) return "incompleto";
  if (paquete.salida <= fecha) return "en_viaje";
  if (paquete.catalogo_completo && (!paquete.servicios?.length || paquete.servicios.some((servicio) => !servicio.activo))) return "incompleto";
  const cupos = obtenerCupos(paquete);
  if (!cupos) return "incompleto";
  return cupos.disponibles === 0 ? "lleno" : "disponible";
}
