import { supabase, supabaseConfigurado } from "./supabase";
import { duracionPaquete, obtenerCupos } from "./paquetes";

export const TIPOS_SERVICIO = ["Alojamiento", "Vuelo", "Transporte", "Actividad", "Alimentación", "Seguro", "Otro"];
export const TIPOS_PROVEEDOR = ["Aerolínea", "Hotelería", "Operador terrestre", "Naviera", "Transporte", "Actividades", "Seguros", "Otro"];

async function llamar(nombre, parametros) {
  if (!supabaseConfigurado) throw new Error("El modo demostración no ejecuta operaciones en Supabase.");
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) {
    if (["PGRST202", "PGRST205", "42883", "42703", "42P01"].includes(error.code)) throw new Error("Falta la actualización de catálogo de fase 3. Consulta docs/FASE_3.md.");
    if (error.code === "42501") throw new Error("Solo un administrador activo puede gestionar el catálogo.");
    if (error.code === "23505") throw new Error("No repitas el mismo proveedor y tipo de servicio dentro del paquete.");
    throw new Error(error.code === "P0001" ? error.message : "No se pudo guardar o cargar el catálogo. Revisa los datos antes de repetir una operación.");
  }
  if (!data) throw new Error("Supabase no devolvió un resultado; no se puede confirmar la operación.");
  return data;
}

export const obtenerCatalogoAdministrativo = () => llamar("catalogo_administrativo");
export const guardarPaquete = (datos) => llamar("guardar_paquete", { datos });
export const guardarProveedor = (datos) => llamar("guardar_proveedor", { datos });

// Validación del formulario, compartida con la demostración; la BD vuelve a validar.
export function validarPaquete(datos, proveedores, anterior) {
  for (const [campo, minimo, maximo] of [["nombre", 2, 200], ["ubicacion", 2, 300], ["descripcion", 1, 10000], ["incluye", 1, 10000], ["condiciones", 1, 10000]]) {
    const longitud = String(datos[campo] || "").trim().length;
    if (longitud < minimo || longitud > maximo) throw new Error("Completa nombre, destino, descripción, incluidos y condiciones.");
  }
  if (!["nacional", "internacional"].includes(datos.tipo_destino)) throw new Error("Selecciona destino nacional o internacional.");
  if (!duracionPaquete(datos.salida, datos.regreso)) throw new Error("El regreso no puede ser anterior a la salida.");
  if (!Number.isSafeInteger(datos.precio) || datos.precio <= 0) throw new Error("El precio por persona debe ser un importe COP entero positivo.");
  if (!Number.isSafeInteger(datos.capacidad) || datos.capacidad <= 0 || datos.capacidad > 999999999) throw new Error("Indica una capacidad entera positiva válida.");
  if (anterior) {
    const cupos = obtenerCupos(anterior);
    if (!cupos) throw new Error("Revisa los cupos anteriores antes de editar la capacidad.");
    if (datos.capacidad < cupos.capacidad - cupos.disponibles) throw new Error("La capacidad no puede ser menor que los cupos comprometidos.");
  }
  if (!datos.servicios?.length || datos.servicios.length > 50) throw new Error("Agrega al menos un proveedor y su servicio (máximo 50).");
  const claves = new Set();
  for (const servicio of datos.servicios) {
    const proveedor = proveedores.find((fila) => String(fila.id) === String(servicio.proveedor_id));
    const existente = anterior?.servicios?.some((fila) => String(fila.proveedor_id) === String(servicio.proveedor_id) && fila.servicio === servicio.servicio);
    if (!proveedor || (!proveedor.activo && !existente)) throw new Error("No se pueden agregar proveedores inactivos.");
    if (!TIPOS_SERVICIO.includes(servicio.servicio) || !servicio.detalle?.trim() || servicio.detalle.trim().length > 2000) throw new Error("Indica tipo y detalle de cada servicio.");
    const clave = `${servicio.proveedor_id}:${servicio.servicio}`;
    if (claves.has(clave)) throw new Error("No repitas el mismo proveedor y tipo de servicio.");
    claves.add(clave);
  }
}

// IDs con prefijo demo solo para la interfaz en memoria; nunca se envían a RPC.
export function prepararCatalogoDemo(paquetes, filasProveedores) {
  const proveedores = filasProveedores.map((fila, indice) => ({ id: fila[6]?.id ?? `demo-prov-${indice}`, nombre: fila[0], tipo: fila[1], contacto: fila[2], convenio: fila[3], estado: fila[5], activo: fila[5] === "Activo" }));
  return { proveedores, paquetes: paquetes.map((paquete, indice) => ({ ...paquete, id: paquete.id ?? `demo-paq-${indice}`, servicios: (paquete.servicios || []).map((servicio) => {
    const proveedor = proveedores.find((fila) => String(fila.id) === String(servicio.proveedor_id));
    return proveedor ? { ...servicio, nombre: proveedor.nombre, tipo: proveedor.tipo, activo: proveedor.activo } : servicio;
  }) })) };
}

export function contenidoPaquete(paquete) {
  if (!paquete.catalogo_completo) return null;
  return { nombre: paquete.nombre, destino: paquete.ubicacion, tipo_destino: paquete.tipo_destino,
    descripcion: paquete.descripcion, incluye: paquete.incluye, no_incluye: paquete.no_incluye, condiciones: paquete.condiciones,
    servicios: (paquete.servicios || []).map(({ proveedor_id, nombre, tipo, servicio, detalle }) => ({ proveedor_id, nombre, tipo, servicio, detalle })) };
}
