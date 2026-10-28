import { fechaColombia } from "@/lib/paquetes";
import { mostrarDinero } from "@/lib/dinero";
import { METODOS_PAGO } from "@/lib/asesor";

export const hoy = fechaColombia;
export const n4 = () => Math.floor(1000 + Math.random() * 9000);
export const n6 = () => Math.floor(100000 + Math.random() * 900000);

// Configuración de los formularios actuales del administrador, sin cambios de contrato.
export const FORMULARIOS = {
  clientes: {
    entidad: "clientes", tabla: "clientes", etiqueta: "Nuevo cliente", titulo: "Registrar nuevo cliente",
    campos: [
      { key: "nombre", label: "Nombre completo", ph: "Ej. Juan García" },
      { key: "documento", label: "Documento", ph: "Cédula", half: true },
      { key: "telefono", label: "Teléfono", ph: "300 000 0000", half: true },
      { key: "correo", label: "Correo", ph: "correo@mail.com", type: "email" },
    ],
    construir: (valores) => {
      const codigo = "CL-" + n4();
      return {
        datos: { codigo, nombre: valores.nombre, documento: valores.documento, correo: valores.correo, telefono: valores.telefono, reservas: 0, activo: true, observaciones: "", obs_desde: null, obs_hasta: null },
        fila: [codigo, valores.nombre, valores.documento, valores.correo, valores.telefono, 0, true, "", "", ""],
      };
    },
  },
  empleados: {
    entidad: "empleados", tabla: "empleados", etiqueta: "Nuevo empleado", titulo: "Registrar nuevo empleado",
    campos: [
      { key: "nombre", label: "Nombre", ph: "Ej. Ana López" },
      { key: "cargo", label: "Cargo", select: ["Asesor comercial", "Gerente general", "Contador", "Soporte al cliente", "Coordinador de viajes", "Recursos humanos"], half: true },
      { key: "telefono", label: "Teléfono", ph: "300 000 0000", half: true },
      { key: "correo", label: "Correo", ph: "correo@novatravel.com", type: "email" },
    ],
    construir: (valores) => {
      const codigo = "EM-" + n4();
      return {
        datos: { codigo, nombre: valores.nombre, cargo: valores.cargo, correo: valores.correo, telefono: valores.telefono, activo: true, observaciones: "", obs_desde: null, obs_hasta: null },
        fila: [codigo, valores.nombre, valores.cargo, valores.correo, valores.telefono, true, "", "", ""],
      };
    },
  },
  reservas: {
    entidad: "reservas", tabla: "reservas", etiqueta: "Nueva reserva", titulo: "Registrar nueva reserva",
    campos: [
      { key: "cliente", label: "Cliente", select: "clientes" },
      { key: "paquete", label: "Paquete", select: "paquetes" },
      { key: "pax", label: "Pasajeros", ph: "2", type: "number", half: true },
      { key: "fecha_viaje", label: "Fecha de viaje", type: "date", half: true },
      { key: "asesor", label: "Asesor", select: ["Samuel P.", "Juan J.", "Andrés M."] },
    ],
    construir: (valores) => {
      const codigo = "#RS-" + n4();
      const pax = Number(valores.pax) || 1;
      return {
        datos: { codigo, cliente: valores.cliente, paquete: valores.paquete, pax, fecha_viaje: valores.fecha_viaje || null, asesor: valores.asesor, tono: "info", estado: "En proceso" },
        fila: [codigo, valores.cliente, valores.paquete, pax, valores.fecha_viaje || "—", valores.asesor, "info", "En proceso"],
      };
    },
  },
  pagos: {
    entidad: "pagos", tabla: "pagos", etiqueta: "Registrar pago", titulo: "Registrar nuevo pago",
    campos: [
      { key: "reserva", label: "Reserva", select: "reservas", half: true },
      { key: "cliente", label: "Cliente", select: "clientes", half: true },
      { key: "metodo", label: "Método", select: METODOS_PAGO, half: true },
      { key: "valor", label: "Valor", ph: "$ 1.000.000", moneda: true, half: true },
    ],
    construir: (valores) => {
      const recibo = "#PG-" + n4();
      return {
        datos: { recibo, reserva: valores.reserva, cliente: valores.cliente, metodo: valores.metodo, valor: mostrarDinero(valores.valor), fecha: hoy(), tono: "warn", estado: "Abono" },
        fila: [recibo, valores.reserva, valores.cliente, valores.metodo, mostrarDinero(valores.valor), hoy(), "warn", "Abono"],
      };
    },
  },
  facturas: {
    entidad: "facturas", tabla: "facturas", etiqueta: "Emitir factura", titulo: "Emitir nueva factura",
    campos: [
      { key: "cliente", label: "Cliente", select: "clientes" },
      { key: "nit", label: "NIT / CC", ph: "900.000.000-0", half: true },
      { key: "reserva", label: "Reserva", select: "reservas", half: true },
      { key: "valor", label: "Valor + IVA", ph: "$ 6.480.000", moneda: true },
    ],
    construir: (valores) => {
      const factura = "FE-" + n6();
      return {
        datos: { factura, cliente: valores.cliente, nit: valores.nit, reserva: valores.reserva, valor: mostrarDinero(valores.valor), fecha: hoy(), tono: "info", estado: "Enviada" },
        fila: [factura, valores.cliente, valores.nit, valores.reserva, mostrarDinero(valores.valor), hoy(), "info", "Enviada"],
      };
    },
  },
};
