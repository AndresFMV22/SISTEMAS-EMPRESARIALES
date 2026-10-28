import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, Palmtree, CalendarDays, CreditCard, ReceiptText, Building2, BarChart3, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseConfigurado } from "@/lib/supabase";
import { obtenerEntidades, insertarFila, actualizarFilas } from "@/lib/db";
import { DATOS_DEMO } from "@/lib/demoData";
import { useIdioma } from "@/lib/i18n.jsx";
import { estadoPaquete, obtenerCupos } from "@/lib/paquetes";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { leerDinero, mostrarDinero } from "@/lib/dinero";
import PanelUsuario from "@/components/compartidos/PanelUsuario";
import PaquetesAdministrador from "./PaquetesAdministrador";
import ControlesSuperiores from "@/components/compartidos/ControlesSuperiores";
import { PiePagina } from "@/components/compartidos/Politicas";
import GestionReservas from "@/components/administrador/GestionReservas";
import EstadoConexion from "@/components/administrador/EstadoConexion";
import DialogoAgregar from "@/components/administrador/DialogoAgregar";
import CrearReservaAdministrador from "@/components/administrador/CrearReservaAdministrador";
import { registrarAbono } from "@/lib/asesor";
import { prepararCatalogoDemo, validarPaquete, contenidoPaquete } from "@/lib/catalogo";
import { FORMULARIOS, hoy, n4, n6 } from "@/components/administrador/formularios";
import ResumenAdministrador from "./ResumenAdministrador";
import ClientesAdministrador from "./ClientesAdministrador";
import EmpleadosAdministrador from "./EmpleadosAdministrador";
import ReservasAdministrador from "./ReservasAdministrador";
import PagosAdministrador from "./PagosAdministrador";
import FacturasAdministrador from "./FacturasAdministrador";
import ProveedoresAdministrador from "./ProveedoresAdministrador";
import ReportesAdministrador from "./ReportesAdministrador";
import PromocionesAdministrador from "./PromocionesAdministrador";

const cristal = "border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)]";
const NAVEGACION = [
  { id: "dash", icon: LayoutDashboard, group: null },
  { id: "clientes", icon: Users, group: "operacion" },
  { id: "paquetes", icon: Palmtree, group: null },
  { id: "promociones", icon: Tag, group: null },
  { id: "reservas", icon: CalendarDays, group: null },
  { id: "pagos", icon: CreditCard, group: "finanzas" },
  { id: "facturas", icon: ReceiptText, group: null },
  { id: "proveedores", icon: Building2, group: "gestion" },
  { id: "empleados", icon: Users, group: null },
  { id: "reportes", icon: BarChart3, group: null },
];

// El estado y las acciones del administrador permanecen juntos; las vistas solo reciben props.
function useEntidades() {
  const [datos, setDatos] = useState(() => supabaseConfigurado ? { clientes: [], paquetes: [], reservas: [], pagos: [], facturas: [], proveedores: [], empleados: [] } : DATOS_DEMO);
  const [origen, setOrigen] = useState(supabaseConfigurado ? "loading" : "demo");
  const [error, cambiarError] = useState("");
  const vigente = useRef(false);
  const lectura = useRef(null);
  const recargar = useCallback(() => {
    if (!supabaseConfigurado) return Promise.resolve();
    if (!lectura.current) {
      lectura.current = obtenerEntidades().then((resultado) => {
        if (!resultado) throw new Error("acceso.errorDatos");
        if (vigente.current) { setDatos(resultado); setOrigen("supabase"); cambiarError(""); }
      }).catch((fallo) => {
        if (vigente.current) { setOrigen("error"); cambiarError("acceso.errorDatos"); }
        throw fallo;
      }).finally(() => { lectura.current = null; });
    }
    return lectura.current;
  }, []);
  useEffect(() => {
    vigente.current = true;
    void recargar().catch(() => {});
    return () => { vigente.current = false; };
  }, [recargar]);
  return { datos, setDatos, origen, error, recargar };
}

export default function PanelAdministrador({ alSalir, oscuro, cambiarOscuro, perfil, validarAcceso }) {
  const { t } = useIdioma();
  const fechaCatalogo = useFechaColombia();
  const [vista, cambiarVista] = useState("dash");
  const [gestionOcupada, cambiarGestionOcupada] = useState(false);
  const { datos, setDatos, origen, error: errorDatos, recargar } = useEntidades();
  const tituloVista = t("nav." + vista);
  const subtituloVista = t("sub." + vista);
  const esGestionada = (reserva) => reserva[8]?.gestiona_cupos === true || reserva[8] === true;
  const navegar = (destino) => {
    if (gestionOcupada) return false;
    cambiarVista(destino);
  };
  const sincronizarGestion = async () => {
    await validarAcceso();
    try { await recargar(); }
    catch { throw new Error(t("asesor.errorSincronizacion")); }
  };
  const opciones = {
    clientes: datos.clientes.map((cliente) => cliente[1]),
    paquetes: datos.paquetes.filter((paquete) => estadoPaquete(paquete, fechaCatalogo) === "disponible").map((paquete) => paquete.nombre),
    reservas: datos.reservas.filter((reserva) => !["Cancelada", "Finalizada"].includes(reserva[7])).map((reserva) => reserva[0]),
  };
  const catalogoDemo = prepararCatalogoDemo(datos.paquetes, datos.proveedores);
  const guardarPaqueteDemo = async (valores) => {
    const anterior = catalogoDemo.paquetes.find((paquete) => String(paquete.id) === String(valores.id));
    validarPaquete(valores, catalogoDemo.proveedores, anterior);
    const cupos = anterior ? obtenerCupos(anterior) : null;
    const ocupados = cupos ? cupos.capacidad - cupos.disponibles : 0;
    const id = anterior?.id ?? `demo-paq-${crypto.randomUUID()}`;
    const nuevo = { ...valores, id, precio: mostrarDinero(valores.precio), cupo: `Cupos: ${valores.capacidad - ocupados} / ${valores.capacidad}`, catalogo_completo: true,
      servicios: valores.servicios.map((servicio) => {
        const proveedor = catalogoDemo.proveedores.find((fila) => String(fila.id) === String(servicio.proveedor_id));
        return { ...servicio, nombre: proveedor.nombre, tipo: proveedor.tipo, activo: proveedor.activo };
      }) };
    setDatos((actuales) => ({ ...actuales, paquetes: anterior
      ? actuales.paquetes.map((paquete, indice) => String(paquete.id ?? `demo-paq-${indice}`) === String(id) ? nuevo : paquete)
      : [nuevo, ...actuales.paquetes.map((paquete, indice) => ({ ...paquete, id: paquete.id ?? `demo-paq-${indice}` }))] }));
  };
  const guardarProveedorDemo = async (valores) => {
    const id = valores.id ?? `demo-prov-${crypto.randomUUID()}`;
    const estado = valores.activo ? "Activo" : "Inactivo";
    const fila = [valores.nombre, valores.tipo, valores.contacto, valores.convenio, valores.activo ? "ok" : "bad", estado, { id }];
    setDatos((actuales) => ({ ...actuales, proveedores: valores.id
      ? actuales.proveedores.map((proveedor, indice) => String(proveedor[6]?.id ?? `demo-prov-${indice}`) === String(id) ? fila : proveedor)
      : [fila, ...actuales.proveedores.map((proveedor, indice) => [...proveedor.slice(0, 6), { id: proveedor[6]?.id ?? `demo-prov-${indice}` }])],
      paquetes: actuales.paquetes.map((paquete) => ({ ...paquete, servicios: paquete.servicios?.map((servicio) => String(servicio.proveedor_id) === String(id)
        ? { ...servicio, nombre: valores.nombre, tipo: valores.tipo, activo: valores.activo } : servicio) })) }));
  };
  const enviarFormulario = (clave) => async (valores) => {
    if (clave === "reservas") return agregarReserva(valores);
    if (["pagos", "facturas"].includes(clave)) {
      const reserva = datos.reservas.find((fila) => fila[0] === valores.reserva);
      if (clave === "facturas" && reserva && esGestionada(reserva)) throw new Error(t("asesor.usarGestion"));
      if (!reserva || reserva[1] !== valores.cliente) throw new Error(t("asesor.clienteReservaInvalido"));
      if (clave === "pagos") return pagarReserva(reserva[0], leerDinero(valores.valor), valores.metodo);
    }
    const formulario = FORMULARIOS[clave];
    const { datos: datosNuevos, fila } = formulario.construir(valores);
    if (supabaseConfigurado) {
      await validarAcceso();
      await insertarFila(formulario.tabla, datosNuevos);
    }
    setDatos((actuales) => ({ ...actuales, [formulario.entidad]: [fila, ...actuales[formulario.entidad]] }));
  };
  const agregarReserva = async (valores) => {
    // Demostracion aislada; conectado utiliza el formulario compartido y la RPC comun.
    if (supabaseConfigurado) throw new Error(t("asesor.usarGestion"));
    const paqueteElegido = datos.paquetes.find((paquete) => paquete.nombre === valores.paquete);
    if (!paqueteElegido || estadoPaquete(paqueteElegido) !== "disponible") throw new Error(t("paquetes.noReservable"));
    const viajeros = Number(valores.pax);
    if (!Number.isSafeInteger(viajeros) || viajeros <= 0 || viajeros > obtenerCupos(paqueteElegido).disponibles) throw new Error(t("paquetes.viajerosInvalidos"));
    const { datos: datosReservaInicial, fila } = FORMULARIOS.reservas.construir(valores);
    const filaReserva = [...fila]; filaReserva[6] = "bad"; filaReserva[7] = "Pendiente";
    const precioPersona = leerDinero(paqueteElegido.precio);
    const total = precioPersona * viajeros;
    const precio = mostrarDinero(total);
    filaReserva[8] = { id: null, gestiona_cupos: false, total, precio_persona: precioPersona, estado_pago: "Pendiente", contenido_contratado: contenidoPaquete(paqueteElegido) };
    const nit = datos.clientes.find((cliente) => cliente[1] === valores.cliente)?.[2] || "";
    const factura = "FE-" + n6();
    const filaFactura = [factura, valores.cliente, nit, datosReservaInicial.codigo, precio, hoy(), "warn", "Por validar"];
    const cupos = obtenerCupos(paqueteElegido);
    setDatos((actuales) => ({ ...actuales, reservas: [filaReserva, ...actuales.reservas], facturas: [filaFactura, ...actuales.facturas],
      paquetes: actuales.paquetes.map((paquete) => paquete === paqueteElegido
        ? { ...paquete, cupo: paquete.cupo.replace(/^(Cupos:\s*)\d+/i, (_, prefijo) => `${prefijo}${cupos.disponibles - viajeros}`) } : paquete) }));
  };
  const obtenerSaldo = (codigo) => {
    const reserva = datos.reservas.find((fila) => fila[0] === codigo);
    const totalTexto = reserva?.[8]?.total ?? (datos.facturas.find((factura) => factura[3] === codigo)?.[4]
      || datos.paquetes.find((paquete) => paquete.nombre === (reserva ? reserva[2] : null))?.precio || "0");
    const total = leerDinero(totalTexto);
    const pagado = datos.pagos.filter((pago) => pago[1] === codigo).reduce((acumulado, pago) => acumulado + leerDinero(pago[4]), 0);
    return { total, pagado, saldo: Math.max(total - pagado, 0) };
  };
  const pagarReserva = async (codigo, montoSolicitado, metodo) => {
    const reserva = datos.reservas.find((fila) => fila[0] === codigo);
    if (!reserva) return;
    const { saldo } = obtenerSaldo(codigo);
    const monto = montoSolicitado;
    if (!Number.isSafeInteger(monto) || monto <= 0) throw new Error(t("pay.min"));
    if (monto > saldo) throw new Error(t("pay.over"));
    const completa = monto >= saldo;
    const recibo = "#PG-" + n4();
    const valorTexto = mostrarDinero(monto);
    const tonoPago = completa ? "ok" : "warn";
    const estadoPago = completa ? "Pagado" : "Abono";
    if (supabaseConfigurado) {
      await validarAcceso();
      await registrarAbono({ reserva_id: reserva[8]?.id, valor: monto, metodo });
      try { await recargar(); } catch { throw new Error(t("acceso.pagoParcial")); }
      return;
    }
    setDatos((actuales) => ({
      ...actuales,
      pagos: [[recibo, codigo, reserva[1], metodo, valorTexto, hoy(), tonoPago, estadoPago], ...actuales.pagos],
      reservas: actuales.reservas.map((fila) => (fila[0] === codigo
        ? [...fila.slice(0, 8), { ...fila[8], estado_pago: completa ? "Pagado" : "Pago parcial" }] : fila)),
    }));
  };
  const cambiarActivo = async (entidad, codigo, activo) => {
    const indice = entidad === "clientes" ? 6 : 5;
    if (supabaseConfigurado) { await validarAcceso(); await actualizarFilas(entidad, "codigo", codigo, { activo }); }
    setDatos((actuales) => ({ ...actuales, [entidad]: actuales[entidad].map((fila) => { if (fila[0] !== codigo) return fila; const nueva = [...fila]; nueva[indice] = activo; return nueva; }) }));
  };
  const guardarObservacion = async (entidad, codigo, observacion) => {
    const [indiceTexto, indiceDesde, indiceHasta] = entidad === "clientes" ? [7, 8, 9] : [6, 7, 8];
    if (supabaseConfigurado) { await validarAcceso(); await actualizarFilas(entidad, "codigo", codigo, { observaciones: observacion.obs, obs_desde: observacion.desde || null, obs_hasta: observacion.hasta || null }); }
    setDatos((actuales) => ({ ...actuales, [entidad]: actuales[entidad].map((fila) => { if (fila[0] !== codigo) return fila; const nueva = [...fila]; nueva[indiceTexto] = observacion.obs; nueva[indiceDesde] = observacion.desde; nueva[indiceHasta] = observacion.hasta; return nueva; }) }));
  };
  const accionAgregar = (clave) => clave === "reservas" && supabaseConfigurado
    ? <CrearReservaAdministrador validarAcceso={validarAcceso} alActualizar={sincronizarGestion} />
    : <DialogoAgregar label={FORMULARIOS[clave].etiqueta} title={FORMULARIOS[clave].titulo} fields={FORMULARIOS[clave].campos} onSubmit={enviarFormulario(clave)} selects={opciones}
      reservasRelacionadas={["pagos", "facturas"].includes(clave) ? datos.reservas.filter((reserva) => !["Cancelada", "Finalizada"].includes(reserva[7]) && (clave === "pagos" || !esGestionada(reserva))) : null} />;

  const mostrarVista = () => {
    switch (vista) {
      case "dash": return <ResumenAdministrador datos={datos} />;
      case "clientes": return <ClientesAdministrador filas={datos.clientes} accion={accionAgregar("clientes")}
        alCambiarActivo={(codigo, activo) => cambiarActivo("clientes", codigo, activo)} alObservar={(codigo, observacion) => guardarObservacion("clientes", codigo, observacion)} />;
      case "empleados": return <EmpleadosAdministrador filas={datos.empleados} accion={accionAgregar("empleados")} validarAcceso={validarAcceso}
        alCambiarActivo={(codigo, activo) => cambiarActivo("empleados", codigo, activo)} alObservar={(codigo, observacion) => guardarObservacion("empleados", codigo, observacion)} />;
      case "paquetes": return <PaquetesAdministrador datosDemo={catalogoDemo} validarAcceso={validarAcceso} alActualizar={sincronizarGestion} alGuardarDemo={guardarPaqueteDemo} />;
      case "promociones": return <PromocionesAdministrador validarAcceso={validarAcceso} />;
      case "reservas": return <ReservasAdministrador reservas={datos.reservas} alPagar={pagarReserva} obtenerSaldo={obtenerSaldo} esGestionada={esGestionada} alGestionar={() => cambiarVista("gestionReservas")}
        accion={<div className="flex flex-wrap gap-2">{accionAgregar("reservas")}<Button size="sm" variant="outline" onClick={() => cambiarVista("gestionReservas")}>{t("asesor.gestion")}</Button></div>} />;
      case "gestionReservas": return <GestionReservas validarAcceso={validarAcceso} alActualizar={sincronizarGestion} alCambiarOcupado={cambiarGestionOcupada} alVolver={() => navegar("reservas")} />;
      case "pagos": return <PagosAdministrador filas={datos.pagos} accion={accionAgregar("pagos")} />;
      case "facturas": return <FacturasAdministrador filas={datos.facturas} accion={accionAgregar("facturas")} />;
      case "proveedores": return <ProveedoresAdministrador datosDemo={catalogoDemo} validarAcceso={validarAcceso} alActualizar={sincronizarGestion} alGuardarDemo={guardarProveedorDemo} />;
      case "reportes": return <ReportesAdministrador datos={datos} />;
      default: return null;
    }
  };
  return <PanelUsuario perfil={perfil} alSalir={alSalir} navegacion={NAVEGACION} vista={vista === "gestionReservas" ? "reservas" : vista} alNavegar={navegar}
    titulo={vista === "gestionReservas" ? t("asesor.gestion") : tituloVista} subtitulo={vista === "gestionReservas" ? t("sub.reservas") : subtituloVista} pie={<PiePagina />} controles={<>
      <EstadoConexion origen={origen} />
      <div className={`hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-muted-foreground lg:flex ${cristal}`}><Search className="h-4 w-4" /><input placeholder={t("tb.search")} className="w-32 bg-transparent text-foreground outline-none placeholder:text-slate-400" /></div>
      <ControlesSuperiores oscuro={oscuro} cambiarOscuro={cambiarOscuro} />
    </>}>
    <motion.div key={vista} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      {vista === "gestionReservas" ? mostrarVista() : origen === "loading" ? <p role="status">{t("acceso.validando")}</p> : errorDatos ? <div className="space-y-3"><p role="alert" className="text-rose-600">{t(errorDatos)}</p><Button variant="outline" onClick={() => void sincronizarGestion().catch(() => {})}>{t("asesor.actualizar")}</Button></div> : mostrarVista()}
    </motion.div>
  </PanelUsuario>;
}
