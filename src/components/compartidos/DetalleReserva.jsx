import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampoDinero from "@/components/compartidos/CampoDinero";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero, leerDinero } from "@/lib/dinero";
import { agregarObservacion, registrarAbonoAsesor, solicitarCambioReserva, resolverSolicitud, reasignarReserva, cambiarEstadoReserva } from "@/lib/asesor";
import { estadoPaquete } from "@/lib/paquetes";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { CampoAsesor, FormularioOperacion, SeccionAsesor, TablaAsesor, EstadoAsesor, mismoId, perteneceReserva, saldoReserva, dineroOpcional } from "./FormulariosReserva";

export default function DetalleReserva({ reserva, datos, perfil, ocupado, ejecutar, error, mensaje, alCerrar, administracion = false }) {
  const { t, idioma } = useIdioma();
  const fecha = useFechaColombia();
  const [monto, cambiarMonto] = useState("");
  const [tipo, cambiarTipo] = useState("cambio");
  const propia = mismoId(reserva.empleado_id, perfil?.empleado_id);
  const gestionada = reserva.gestiona_cupos && reserva.id != null && reserva.cliente_id != null && reserva.paquete_id != null && reserva.empleado_id != null;
  const puedeOperar = gestionada && (administracion || propia);
  const cerrada = ["Cancelada", "Finalizada"].includes(reserva.estado);
  const solicitudes = datos.solicitudes.filter((fila) => mismoId(fila.reserva_id, reserva.id));
  const pendiente = solicitudes.some((fila) => fila.estado === "pendiente");
  const pagos = datos.pagos.filter((fila) => perteneceReserva(fila, reserva));
  const facturas = datos.facturas.filter((fila) => perteneceReserva(fila, reserva));
  const saldo = saldoReserva(reserva, datos);
  const paquetes = datos.paquetes.filter((fila) => fila.id != null && estadoPaquete(fila, fecha) === "disponible");
  const fechaTexto = (valor) => valor && !Number.isNaN(Date.parse(valor)) ? new Intl.DateTimeFormat(idioma, { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor)) : "—";
  return <Dialog open onOpenChange={(abierto) => { if (!abierto && !ocupado) alCerrar(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto overscroll-contain sm:max-w-3xl">
      <DialogHeader><DialogTitle className="break-words">{t("asesor.verDetalle")} · {reserva.codigo}</DialogTitle></DialogHeader>
      {error && <p role="alert" className="text-sm text-rose-600">{error}<span className="block">{t("asesor.revisarAntesReintentar")}</span></p>}
      {mensaje && <p role="status" className="text-sm text-emerald-600">{t(mensaje)}</p>}
      <div className="space-y-5">
        <SeccionAsesor titulo={t("asesor.comprobante")}>
          <p className="text-xs text-muted-foreground">{t("asesor.noDian")}</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">{[["col.cliente", reserva.cliente], ["col.paquete", reserva.paquete], ["col.asesor", reserva.asesor], ["col.pax", reserva.pax], ["pkg.salida", reserva.fecha_viaje], ["pkg.regreso", reserva.fecha_regreso], ["asesor.precioPersona", dineroOpcional(reserva.precio_persona)], ["pay.total", dineroOpcional(saldo.total)], ["pay.paid", mostrarDinero(saldo.pagado)], ["pay.saldo", dineroOpcional(saldo.saldo)]].map(([clave, valor]) => <div key={clave}><dt className="text-muted-foreground">{t(clave)}</dt><dd className="break-words font-semibold tabular-nums">{valor ?? "—"}</dd></div>)}</dl>
          <div className="flex flex-wrap gap-3"><span className="text-sm">{t("col.estado")}: <EstadoAsesor estado={reserva.estado} /></span><span className="text-sm">{t("nav.pagos")}: <EstadoAsesor estado={reserva.estado_pago} /></span></div>
          {saldo.total == null && <p role="status" className="text-sm text-amber-600">{t("asesor.totalDesconocido")}</p>}
          <TablaAsesor columnas={[t("asesor.recibo"), t("asesor.metodo"), t("asesor.valor"), t("col.fecha"), t("col.estado")]} filas={pagos.map((fila) => [fila.recibo, fila.metodo, mostrarDinero(fila.valor), fila.fecha, fila.estado])} />
          {facturas.length > 0 && <><h3 className="text-sm font-semibold">{t("asesor.documentosInternos")}</h3><TablaAsesor columnas={[t("asesor.referencia"), t("asesor.valor"), t("col.fecha"), t("col.estado")]} filas={facturas.map((fila) => [fila.factura, mostrarDinero(fila.valor), fila.fecha, fila.estado])} /></>}
        </SeccionAsesor>
        {!gestionada ? <p role="status" className="text-sm text-amber-600">{t("asesor.historica")}</p> : !puedeOperar ? <p className="text-sm text-muted-foreground">{t("asesor.soloLectura")}</p> : cerrada ? <p className="text-sm text-muted-foreground">{t("asesor.cerrada")}</p> : null}
        {puedeOperar && !cerrada && saldo.saldo != null && saldo.saldo > 0 && <SeccionAsesor titulo={t("pay.title")}><FormularioOperacion ocupado={ocupado} etiqueta="btn.pay" alEnviar={async (valores) => {
          const valor = leerDinero(monto);
          if (!Number.isSafeInteger(valor) || valor <= 0) throw new Error(t("pay.min"));
          if (valor > saldo.saldo) throw new Error(t("pay.over"));
          const resultado = await ejecutar(() => registrarAbonoAsesor({ reserva_id: reserva.id, valor, metodo: valores.metodo }));
          if (resultado) cambiarMonto("");
          return resultado;
        }}><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="monto-abono" className="text-sm font-medium">{t("pay.amount")}</label><CampoDinero id="monto-abono" valor={monto} alCambiar={cambiarMonto} /><p className="text-xs text-muted-foreground">{t("pay.maxHint")} {mostrarDinero(saldo.saldo)}</p></div><CampoAsesor etiqueta={t("asesor.metodo")} name="metodo" required opciones={[["", t("asesor.seleccionar")], ...["Efectivo", "Transferencia", "Tarjeta crédito", "Tarjeta débito"].map((valor) => [valor, t(`asesor.metodo.${valor}`)])]} /></div></FormularioOperacion></SeccionAsesor>}
        <SeccionAsesor titulo={t("col.observ")}>
          {datos.observaciones.filter((fila) => mismoId(fila.reserva_id, reserva.id)).map((fila) => <div key={fila.id} className="rounded-xl border border-border p-3 text-sm"><p className="whitespace-pre-wrap break-words">{fila.texto}</p><p className="mt-2 text-xs text-muted-foreground">{fila.autor_nombre} · {fechaTexto(fila.creado_en)}</p></div>)}
          {!datos.observaciones.some((fila) => mismoId(fila.reserva_id, reserva.id)) && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
          {puedeOperar && <FormularioOperacion ocupado={ocupado} alEnviar={(valores) => ejecutar(() => agregarObservacion({ reserva_id: reserva.id, texto: valores.texto }))}><CampoAsesor etiqueta={t("obs.text")} name="texto" multilinea required /></FormularioOperacion>}
        </SeccionAsesor>
        <SeccionAsesor titulo={t("asesor.solicitudes")}>
          {solicitudes.length === 0 && <p className="text-sm text-muted-foreground">{t("acceso.sinRegistros")}</p>}
          {solicitudes.map((solicitud) => <div key={solicitud.id} className="space-y-3 rounded-xl border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2"><b>{t(`asesor.${solicitud.tipo}`)}</b><EstadoAsesor estado={solicitud.estado} /></div>
            <p className="whitespace-pre-wrap break-words">{solicitud.motivo}</p><p className="text-xs text-muted-foreground">{solicitud.autor_nombre} · {fechaTexto(solicitud.creado_en)}</p>
            {solicitud.paquete_id != null && <p>{t("col.paquete")}: {datos.paquetes.find((fila) => mismoId(fila.id, solicitud.paquete_id))?.nombre || `ID ${solicitud.paquete_id}`}</p>}{solicitud.pax != null && <p>{t("col.pax")}: {solicitud.pax}</p>}
            {solicitud.respuesta && <p className="whitespace-pre-wrap break-words"><b>{t("asesor.respuesta")}:</b> {solicitud.respuesta}</p>}
            {administracion && solicitud.estado === "pendiente" && <FormularioOperacion ocupado={ocupado} alEnviar={(valores) => ejecutar(() => resolverSolicitud({ solicitud_id: solicitud.id, aprobar: valores.decision === "aprobar", respuesta: valores.respuesta }))}>
              <CampoAsesor etiqueta={t("asesor.respuesta")} name="respuesta" multilinea required /><CampoAsesor etiqueta={t("asesor.decision")} name="decision" required opciones={[["", t("asesor.seleccionar")], ...(!cerrada ? [["aprobar", t("asesor.aprobar")]] : []), ["rechazar", t("asesor.rechazar")]]} /><label className="flex items-start gap-2"><input type="checkbox" required className="mt-1" />{t("asesor.confirmarGestion")}</label>
            </FormularioOperacion>}
          </div>)}
          {pendiente && <p role="status" className="text-sm text-amber-600">{t("asesor.pendiente")}</p>}
          {puedeOperar && !cerrada && !pendiente && <FormularioOperacion titulo={t("asesor.nuevaSolicitud")} ocupado={ocupado} alEnviar={(valores) => {
            const propuesta = tipo === "cambio" && valores.paquete_id ? paquetes.find((fila) => mismoId(fila.id, valores.paquete_id))?.id : null;
            if (tipo === "cambio" && valores.paquete_id && propuesta == null) throw new Error(t("paquetes.noReservable"));
            return ejecutar(() => solicitarCambioReserva({ reserva_id: reserva.id, tipo, motivo: valores.motivo, paquete_id: propuesta ?? null, pax: tipo === "cambio" && valores.pax ? Number(valores.pax) : null }));
          }}>
            <CampoAsesor etiqueta={t("asesor.tipoSolicitud")} value={tipo} onChange={(evento) => cambiarTipo(evento.target.value)} opciones={[["cambio", t("asesor.cambio")], ["cancelacion", t("asesor.cancelacion")]]} />
            <CampoAsesor etiqueta={t("asesor.motivo")} name="motivo" multilinea required />
            {tipo === "cambio" && <div className="grid gap-3 sm:grid-cols-2"><CampoAsesor etiqueta={t("asesor.propuestaPaquete")} name="paquete_id" opciones={[["", t("asesor.sinPropuesta")], ...paquetes.map((fila) => [fila.id, fila.nombre])]} /><CampoAsesor etiqueta={t("asesor.propuestaPax")} name="pax" type="number" min="1" step="1" /></div>}
            {tipo === "cancelacion" && <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" />{t("asesor.confirmarCancelacion")}</label>}
          </FormularioOperacion>}
        </SeccionAsesor>
        {administracion && gestionada && <SeccionAsesor titulo={t("asesor.gestion")}>
          <FormularioOperacion titulo={t("asesor.reasignar")} ocupado={ocupado} alEnviar={(valores) => ejecutar(() => reasignarReserva({ reserva_id: reserva.id, empleado_id: datos.asesores.find((fila) => mismoId(fila.empleado_id, valores.empleado_id))?.empleado_id }))}>
            <CampoAsesor etiqueta={t("col.asesor")} name="empleado_id" required opciones={[["", t("asesor.seleccionar")], ...(datos.asesores || []).map((fila) => [fila.empleado_id, `${fila.nombre} · ${fila.correo}`])]} /><label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" />{t("asesor.confirmarGestion")}</label>
          </FormularioOperacion>
          {!cerrada && <FormularioOperacion titulo={t("asesor.cambiarEstado")} ocupado={ocupado} alEnviar={(valores) => ejecutar(() => cambiarEstadoReserva({ reserva_id: reserva.id, estado: valores.estado }))}><CampoAsesor etiqueta={t("col.estado")} name="estado" required opciones={[["", t("asesor.seleccionar")], ...["Pendiente", "Confirmada", "Finalizada"].map((valor) => [valor, t(`asesor.estado.${valor}`)])]} /><label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" />{t("asesor.confirmarGestion")}</label></FormularioOperacion>}
        </SeccionAsesor>}
      </div>
    </DialogContent>
  </Dialog>;
}
