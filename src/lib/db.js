import { supabase, isSupabaseReady } from "./supabase";

// Trae todas las entidades desde Supabase y las mapea al formato que usa la UI.
// Devuelve null si no hay credenciales (la app usa los datos demo).
export async function fetchEntities() {
  if (!isSupabaseReady) return null;
  const tables = ["clientes", "paquetes", "reservas", "pagos", "facturas", "proveedores", "empleados"];
  const results = await Promise.all(
    tables.map((t) => supabase.from(t).select("*").order("id"))
  );
  const bad = results.find((r) => r.error);
  if (bad) throw bad.error;
  const [cli, paq, res, pag, fac, prov, emp] = results.map((r) => r.data);

  return {
    clientes: cli.map((c) => [c.codigo, c.nombre, c.documento, c.correo, c.telefono, c.reservas, !!c.activo, c.observaciones || "", c.obs_desde || "", c.obs_hasta || ""]),
    paquetes: paq.map((p) => ({ iconKey: p.icono, n: p.nombre, loc: p.loc, precio: p.precio, cupo: p.cupo, salida: p.salida || "", regreso: p.regreso || "" })),
    reservas: res.map((r) => [r.codigo, r.cliente, r.paquete, r.pax, r.fecha_viaje, r.asesor, r.tono, r.estado]),
    pagos: pag.map((p) => [p.recibo, p.reserva, p.cliente, p.metodo, p.valor, p.fecha, p.tono, p.estado]),
    facturas: fac.map((f) => [f.factura, f.cliente, f.nit, f.reserva, f.valor, f.fecha, f.tono, f.estado]),
    proveedores: prov.map((v) => [v.nombre, v.tipo, v.contacto, v.convenio, v.tono, v.estado]),
    empleados: (emp || []).map((e) => [e.codigo, e.nombre, e.cargo, e.correo, e.telefono, !!e.activo, e.observaciones || "", e.obs_desde || "", e.obs_hasta || ""]),
  };
}

// Inserta un registro en cualquier tabla. Devuelve la fila creada.
export async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

// Actualiza filas de una tabla donde matchCol == matchVal.
export async function updateRows(table, matchCol, matchVal, patch) {
  const { error } = await supabase.from(table).update(patch).eq(matchCol, matchVal);
  if (error) throw error;
}
