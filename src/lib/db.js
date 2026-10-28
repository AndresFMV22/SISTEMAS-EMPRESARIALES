import { supabase, supabaseConfigurado } from "./supabase";
import { mostrarDinero, leerDinero } from "./dinero";

// Trae todas las entidades desde Supabase y las mapea al formato que usa la UI.
// Devuelve null si no hay credenciales (la app usa los datos demo).
export async function obtenerEntidades() {
  if (!supabaseConfigurado) return null;
  const tablas = ["clientes", "paquetes", "reservas", "pagos", "facturas", "proveedores", "empleados"];
  const resultados = await Promise.all(
    tablas.map((tabla) => supabase.from(tabla).select("*").order("id"))
  );
  const fallo = resultados.find((resultado) => resultado.error);
  if (fallo) throw fallo.error;
  const [clientes, paquetes, reservas, pagos, facturas, proveedores, empleados] = resultados.map((resultado) => resultado.data);

  return {
    clientes: clientes.map((cliente) => [cliente.codigo, cliente.nombre, cliente.documento, cliente.correo, cliente.telefono, cliente.reservas, cliente.activo ?? cliente.estado !== "Inactivo", cliente.observaciones || "", cliente.obs_desde || "", cliente.obs_hasta || ""]),
    paquetes: paquetes.map((paquete) => ({ id: paquete.id, icono: paquete.icono, nombre: paquete.nombre, ubicacion: paquete.loc, precio: mostrarDinero(paquete.precio), cupo: paquete.cupo, salida: paquete.salida || "", regreso: paquete.regreso || "", descripcion: paquete.descripcion || "", tipo_destino: paquete.tipo_destino, incluye: paquete.incluye || "", no_incluye: paquete.no_incluye || "", condiciones: paquete.condiciones || "", catalogo_completo: !!paquete.catalogo_completo })),
    reservas: reservas.map((reserva) => {
      const valor = reserva.total ?? facturas.find((factura) => factura.reserva === reserva.codigo)?.valor
        ?? paquetes.find((paquete) => paquete.nombre === reserva.paquete)?.precio;
      const total = valor == null ? null : leerDinero(valor);
      const pagado = pagos.filter((pago) => pago.reserva_id != null ? pago.reserva_id === reserva.id : pago.reserva === reserva.codigo)
        .reduce((suma, pago) => suma + leerDinero(pago.valor), 0);
      const estadoPago = reserva.estado_pago || (pagado > 0 ? total !== null && pagado >= total ? "Pagado" : "Pago parcial" : "Pendiente");
      return [reserva.codigo, reserva.cliente, reserva.paquete, reserva.pax, reserva.fecha_viaje, reserva.asesor, reserva.tono, reserva.estado,
        { id: reserva.id, paquete_id: reserva.paquete_id ?? null, cliente_id: reserva.cliente_id ?? null, contenido_contratado: reserva.contenido_contratado ?? null,
          descuento: Number(reserva.descuento || 0), promocion_contratada: reserva.promocion_contratada ?? null,
          gestiona_cupos: !!reserva.gestiona_cupos, estado_pago: estadoPago, total, precio_persona: reserva.precio_persona == null ? null : Number(reserva.precio_persona) }];
    }),
    pagos: pagos.map((pago) => [pago.recibo, pago.reserva, pago.cliente, pago.metodo, mostrarDinero(pago.valor), pago.fecha, pago.tono, pago.estado]),
    facturas: facturas.map((factura) => [factura.factura, factura.cliente, factura.nit, factura.reserva, mostrarDinero(factura.valor), factura.fecha, factura.tono, factura.estado]),
    proveedores: proveedores.map((proveedor) => [proveedor.nombre, proveedor.tipo, proveedor.contacto, proveedor.convenio, proveedor.tono, proveedor.estado]),
    empleados: empleados.map((empleado) => [empleado.codigo, empleado.nombre, empleado.cargo, empleado.correo, empleado.telefono, !!empleado.activo, empleado.observaciones || "", empleado.obs_desde || "", empleado.obs_hasta || ""]),
  };
}

// Inserta un registro en cualquier tabla. Devuelve la fila creada.
export async function insertarFila(tabla, datos) {
  const { data, error } = await supabase.from(tabla).insert(datos).select().single();
  if (error) throw error;
  return data;
}

// Actualiza filas de una tabla donde matchCol == matchVal.
export async function actualizarFilas(tabla, columna, valor, cambios) {
  const { error } = await supabase.from(tabla).update(cambios).eq(columna, valor);
  if (error) throw error;
}
