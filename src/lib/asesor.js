import { supabase, supabaseConfigurado } from "./supabase";
import { DATOS_DEMO } from "./demoData";

/**
 * React → Supabase directo. Importes COP enteros; IDs reales de BD (null en demo/históricos).
 * Lectura: {clientes, paquetes, reservas, pagos, facturas, observaciones, solicitudes}.
 * Reserva: IDs cliente/paquete/empleado, textos legacy, pax, fecha_viaje, estado,
 * estado_pago independiente, total y precio_persona number|null, gestiona_cupos boolean.
 * fecha_viaje/fecha_regreso: snapshots de fechas (regreso null en históricos).
 * Paquete: {id,nombre,ubicacion,precio:number,cupo,salida,regreso,icono}.
 * Mutaciones: devuelve la fila afectada o {id}; refrescar el dataset después de esperar.
 * Rechaza con Error en español; permisos, propiedad, fechas, saldo y cupos se verifican en BD.
 * Demo: lectura sin identidades inventadas; las mutaciones requieren Supabase y sesión real.
 */
async function llamarRpc(nombre, parametros) {
  if (!supabaseConfigurado || !supabase) {
    throw new Error("Esta operación requiere Supabase configurado y una cuenta activa; el modo demo es de solo lectura.");
  }
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) {
    if (["PGRST202", "PGRST205", "42883", "42P01", "42703"].includes(error.code)) {
      throw new Error("Falta la migración de funcionalidad asesor o actualizar la caché de Supabase. Consulta ASESOR_SUPABASE.md.");
    }
    const mensaje = error.code === "42501"
      ? "Acceso denegado: verifica tu cuenta activa, rol y la propiedad de la reserva."
      : error.code === "23505" ? "Ya existe el documento o una solicitud pendiente para esta reserva."
        : error.code === "23503" ? "La relación indicada no existe o ya no está disponible."
          : error.code === "P0001" ? error.message : "No se pudo completar la operación en Supabase. Inténtalo de nuevo o consulta al administrador.";
    throw new Error(mensaje, { cause: error });
  }
  if (data == null) throw new Error("Supabase no devolvió un resultado; no se puede confirmar la operación.");
  return data;
}

function enteroPositivo(valor, nombre) {
  if (!Number.isSafeInteger(valor) || valor <= 0) throw new Error(`${nombre} debe ser un entero positivo.`);
  return valor;
}

function importeDemo(valor) {
  return Number(String(valor).replace(/[^0-9]/g, ""));
}

function obtenerDemo() {
  const clientes = DATOS_DEMO.clientes.map(([codigo, nombre, documento, correo, telefono, reservas, activo]) =>
    ({ id: null, codigo, nombre, documento, correo, telefono, reservas, activo }));
  const paquetes = DATOS_DEMO.paquetes.map((paquete) => ({ ...paquete, id: null, precio: importeDemo(paquete.precio) }));
  const pagos = DATOS_DEMO.pagos.map(([recibo, reserva, cliente, metodo, valor, fecha, , estado]) =>
    ({ id: null, recibo, reserva_id: null, reserva, cliente, metodo, valor: importeDemo(valor), fecha, estado }));
  const facturas = DATOS_DEMO.facturas.map(([factura, cliente, , reserva, valor, fecha, , estado]) =>
    ({ id: null, factura, reserva, cliente, valor: importeDemo(valor), fecha, estado }));
  const reservas = DATOS_DEMO.reservas.map(([codigo, cliente, paquete, pax, fecha_viaje, asesor, , estado]) => {
    const coincidencias = paquetes.filter((fila) => fila.nombre === paquete);
    const total = facturas.find((fila) => fila.reserva === codigo)?.valor ??
      (coincidencias.length === 1 ? coincidencias[0].precio : null);
    const abonado = pagos.filter((fila) => fila.reserva === codigo).reduce((suma, fila) => suma + fila.valor, 0);
    return { id: null, codigo, cliente_id: null, paquete_id: null, empleado_id: null, cliente, paquete, pax,
      fecha_viaje, fecha_regreso: null, asesor, estado, total, precio_persona: null, gestiona_cupos: false,
      estado_pago: abonado > 0 ? total !== null && abonado >= total ? "Pagado" : "Pago parcial" : "Pendiente" };
  });
  return { clientes, paquetes, reservas, pagos, facturas, observaciones: [], solicitudes: [] };
}

function validarDatos(datos) {
  for (const tabla of ["clientes", "paquetes", "reservas", "pagos", "facturas", "observaciones", "solicitudes"]) {
    if (!Array.isArray(datos[tabla])) throw new Error("Respuesta de asesor incompleta: verifica la migración de Supabase.");
  }
  const incidencias = [];
  for (const [tabla, campo] of [["paquetes", "precio"], ["pagos", "valor"], ["facturas", "valor"]]) {
    for (const fila of datos[tabla]) {
      if (!Number.isSafeInteger(fila[campo]) || fila[campo] < 0) {
        incidencias.push(`${tabla} ID ${fila.id ?? "desconocido"}: ${campo} no interpretable`);
      }
    }
  }
  for (const reserva of datos.reservas) {
    for (const campo of ["total", "precio_persona"]) {
      if (reserva[campo] !== null && (!Number.isSafeInteger(reserva[campo]) || reserva[campo] < 0)) {
        incidencias.push(`reservas ID ${reserva.id ?? "desconocido"}: ${campo} no interpretable`);
      }
    }
  }
  if (incidencias.length) {
    // La UI actual suma/formatea números; devolver null en pagos lo convertiría en cero.
    // No omitir filas ni cambiar el contrato silenciosamente: indicar exactamente qué bloquea la lectura.
    throw new Error(`No se puede cargar el panel de asesor con seguridad: ${incidencias.slice(0, 8).join("; ")}${incidencias.length > 8 ? `; y ${incidencias.length - 8} incidencias más` : ""}. No se han ocultado registros ni sustituido importes por cero. Un administrador debe revisar esos datos; el panel administrativo legacy sigue disponible.`);
  }
  return datos;
}

/** Lectura compartida para asesor/administrador activos; no ejecuta escrituras. */
export async function obtenerDatosAsesor() {
  if (!supabaseConfigurado) return obtenerDemo();
  return validarDatos(await llamarRpc("datos_asesor", { gestion: false }));
}

/** Solo administrador. Mismo dataset + asesores:[{empleado_id,nombre,correo}] activos vinculados. */
export async function obtenerGestionReservas() {
  return validarDatos(await llamarRpc("datos_asesor", { gestion: true }));
}

/** {nombre,documento,correo,telefono}; documento único normalizado en BD. No crea cuenta Auth. */
export async function registrarCliente({ nombre, documento, correo, telefono }) {
  return llamarRpc("operar_asesor", { accion: "cliente", datos: { nombre, documento, correo, telefono } });
}

/** Actualiza únicamente contacto; asesor/administrador activos. */
export async function actualizarContactoCliente(id, { correo, telefono }) {
  enteroPositivo(id, "El identificador del cliente");
  return llamarRpc("operar_asesor", { accion: "contacto", datos: { id, correo, telefono } });
}

/** {cliente_id,paquete_id,pax}; reserva y factura internas atómicas, precio/cupos bajo bloqueo. */
export async function crearReservaAsesor({ cliente_id, paquete_id, pax }) {
  enteroPositivo(cliente_id, "El cliente"); enteroPositivo(paquete_id, "El paquete"); enteroPositivo(pax, "La cantidad de pasajeros");
  return llamarRpc("operar_asesor", { accion: "crear", datos: { cliente_id, paquete_id, pax } });
}

/** Abono propio (admin: cualquiera gestionada), sin cambiar estado de reserva; devuelve {id}. */
export async function registrarAbonoAsesor({ reserva_id, valor, metodo }) {
  enteroPositivo(reserva_id, "La reserva"); enteroPositivo(valor, "El monto");
  return llamarRpc("operar_asesor", { accion: "abono", datos: { reserva_id, valor, metodo } });
}

/** Append de texto en reserva propia; autor y fecha siempre los fija BD. Devuelve {id}. */
export async function agregarObservacion({ reserva_id, texto }) {
  enteroPositivo(reserva_id, "La reserva");
  return llamarRpc("operar_asesor", { accion: "observacion", datos: { reserva_id, texto } });
}

/** Una pendiente por reserva propia. tipo:'cambio'|'cancelacion'; propuesta opcional. Devuelve {id}. */
export async function solicitarCambioReserva({ reserva_id, tipo, motivo, paquete_id = null, pax = null }) {
  enteroPositivo(reserva_id, "La reserva");
  if (paquete_id !== null) enteroPositivo(paquete_id, "El paquete");
  if (pax !== null) enteroPositivo(pax, "La cantidad de pasajeros");
  return llamarRpc("operar_asesor", { accion: "solicitud", datos: { reserva_id, tipo, motivo, paquete_id, pax } });
}

/** Solo admin. {solicitud_id,aprobar:boolean,respuesta}; devuelve solicitud resuelta. */
export async function resolverSolicitud({ solicitud_id, aprobar, respuesta }) {
  enteroPositivo(solicitud_id, "La solicitud");
  if (typeof aprobar !== "boolean") throw new Error("Indica si apruebas o rechazas la solicitud.");
  return llamarRpc("operar_asesor", { accion: "resolver", datos: { solicitud_id, aprobar, respuesta } });
}

/** Solo admin; destino asesor activo con perfil, no un empleado sin acceso. */
export async function reasignarReserva({ reserva_id, empleado_id }) {
  enteroPositivo(reserva_id, "La reserva"); enteroPositivo(empleado_id, "El asesor");
  return llamarRpc("operar_asesor", { accion: "reasignar", datos: { reserva_id, empleado_id } });
}

/** Solo admin managed. estado:'Pendiente'|'Confirmada'|'Finalizada'; cancelación por solicitud. */
export async function cambiarEstadoReserva({ reserva_id, estado }) {
  enteroPositivo(reserva_id, "La reserva");
  return llamarRpc("operar_asesor", { accion: "estado", datos: { reserva_id, estado } });
}
