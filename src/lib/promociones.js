import { supabase, supabaseConfigurado } from "./supabase";
import { fechaColombia } from "./paquetes";
import { mostrarDinero } from "./dinero";

async function llamar(nombre, parametros) {
  if (!supabaseConfigurado) throw new Error("Las promociones requieren una cuenta real conectada a Supabase.");
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) {
    if (["PGRST202", "42883", "42P01", "42703"].includes(error.code)) throw new Error("Falta la actualización de promociones de fase 4. Consulta docs/FASE_4.md.");
    throw new Error(error.code === "42501" ? "Acceso denegado para esta operación de promociones." : error.code === "P0001" ? error.message : "No se pudo gestionar la promoción o cotización. Actualiza los datos antes de repetir.");
  }
  if (!data) throw new Error("No se pudo confirmar el resultado de Supabase.");
  return data;
}

export const obtenerPromociones = () => llamar("datos_promociones");
export const guardarPromocion = (datos) => llamar("guardar_promocion", { datos });
export const cotizarReserva = ({ paquete_id, pasajeros, promocion_id = null }) => llamar("cotizar_reserva", { paquete_id, pasajeros, promocion_id });
export const cotizarCambio = ({ solicitud_id, promocion_id = null, sustituir_promocion = false }) => llamar("cotizar_cambio", { solicitud_id, promocion_id, sustituir_promocion });

export function estadoPromocion(promocion, fecha = fechaColombia()) {
  if (!promocion.activa) return "deshabilitada";
  if (fecha < promocion.desde) return "programada";
  return fecha > promocion.hasta ? "vencida" : "vigente";
}
export const promocionesVigentes = (paquete, fecha = fechaColombia()) => (paquete?.promociones || []).filter((fila) => estadoPromocion(fila, fecha) === "vigente");
export function beneficioPromocion(promocion, traducir) {
  return promocion.tipo === "porcentaje" ? `${promocion.valor} %` : `${mostrarDinero(promocion.valor)} ${traducir("promos.porReserva")}`;
}
export function condicionPromocion(promocion, traducir) {
  return promocion.condicion_pasajeros === "cualquiera" ? traducir("promos.cualquiera")
    : `${traducir(`promos.${promocion.condicion_pasajeros}`)} ${promocion.cantidad_pasajeros} ${traducir("col.pax").toLocaleLowerCase()}`;
}

export function cumpleCondicionPromocion(promocion, pasajeros) {
  if (!promocion) return false;
  return promocion.condicion_pasajeros === "cualquiera" || (promocion.condicion_pasajeros === "exacta" && pasajeros === Number(promocion.cantidad_pasajeros))
    || (promocion.condicion_pasajeros === "minima" && pasajeros >= Number(promocion.cantidad_pasajeros));
}
