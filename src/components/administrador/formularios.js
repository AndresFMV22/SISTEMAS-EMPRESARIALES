import { fechaColombia } from "@/lib/paquetes";
import { mostrarDinero } from "@/lib/dinero";

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
      { key: "metodo", label: "Método", select: ["Tarjeta crédito", "Transferencia", "PSE", "Efectivo", "Nequi"], half: true },
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
  proveedores: {
    entidad: "proveedores", tabla: "proveedores", etiqueta: "Nuevo proveedor", titulo: "Registrar nuevo proveedor",
    campos: [
      { key: "nombre", label: "Proveedor", ph: "Ej. Avianca" },
      { key: "tipo", label: "Tipo", select: ["Aerolínea", "Hotelería", "Operador terrestre", "Naviera"], half: true },
      { key: "convenio", label: "Convenio", ph: "Comisión 8%", half: true },
      { key: "contacto", label: "Contacto", ph: "correo@proveedor.com" },
    ],
    construir: (valores) => ({
      datos: { nombre: valores.nombre, tipo: valores.tipo, contacto: valores.contacto, convenio: valores.convenio, tono: "info", estado: "Nuevo" },
      fila: [valores.nombre, valores.tipo, valores.contacto, valores.convenio, "info", "Nuevo"],
    }),
  },
  paquetes: {
    entidad: "paquetes", tabla: "paquetes", etiqueta: "Nuevo paquete", titulo: "Registrar nuevo paquete",
    campos: [
      { key: "nombre", label: "Nombre del paquete", ph: "Ej. Cancún Paraíso" },
      { key: "loc", label: "Ubicación / duración", ph: "México · 7 días / 6 noches" },
      { key: "precio", label: "Precio", ph: "$ 6.480.000", moneda: true, half: true },
      { key: "capacidad", label: "Capacidad total", ph: "40", type: "number", half: true },
      { key: "disponibles", label: "Cupos disponibles", ph: "12", type: "number", half: true },
      { key: "salida", label: "Fecha de salida", type: "date", half: true },
      { key: "regreso", label: "Fecha de regreso", type: "date", half: true },
      { key: "icono", label: "Ícono", select: ["umbrella", "landmark", "waves", "ferriswheel", "mountain", "building"] },
    ],
    construir: (valores) => {
      const icono = valores.icono || "umbrella";
      const capacidad = Number(valores.capacidad);
      const disponibles = Number(valores.disponibles);
      if (!String(valores.capacidad).trim() || !String(valores.disponibles).trim()
        || !Number.isSafeInteger(capacidad) || capacidad <= 0
        || !Number.isSafeInteger(disponibles) || disponibles < 0 || disponibles > capacidad) {
        throw new Error("Indica capacidad total y cupos disponibles enteros. La capacidad debe ser positiva y los disponibles deben estar entre cero y la capacidad.");
      }
      if (!valores.salida || !valores.regreso || valores.regreso < valores.salida) {
        throw new Error("Indica salida y regreso. El regreso no puede ser anterior a la salida.");
      }
      const cupo = `Cupos: ${disponibles} / ${capacidad}`;
      return {
        datos: { nombre: valores.nombre, loc: valores.loc, precio: mostrarDinero(valores.precio), cupo, icono, salida: valores.salida, regreso: valores.regreso },
        fila: { icono, nombre: valores.nombre, ubicacion: valores.loc, precio: mostrarDinero(valores.precio), cupo, salida: valores.salida, regreso: valores.regreso },
      };
    },
  },
};
