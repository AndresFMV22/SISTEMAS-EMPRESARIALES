import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CampoAsesor, FormularioOperacion, mismoId, saldoReserva } from "@/components/compartidos/FormulariosReserva";
import ResumenPrecio from "@/components/compartidos/ResumenPrecio";
import useCotizacion from "@/hooks/useCotizacion";
import { useIdioma } from "@/lib/i18n.jsx";
import { cotizarCambio, promocionesVigentes, beneficioPromocion, condicionPromocion } from "@/lib/promociones";
import { resolverSolicitud } from "@/lib/asesor";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { mostrarDinero } from "@/lib/dinero";

export default function ResolverSolicitudPrecio({ solicitud, reserva, datos, ocupado, ejecutar }) {
  const { t } = useIdioma();
  const fecha = useFechaColombia();
  const [decision, cambiarDecision] = useState("");
  const mismoPaquete = solicitud.paquete_id == null || mismoId(solicitud.paquete_id, reserva.paquete_id);
  const [eleccion, cambiarEleccion] = useState(mismoPaquete && reserva.promocion_contratada ? "contratada" : "sin");
  const paquete = datos.paquetes.find((fila) => mismoId(fila.id, solicitud.paquete_id ?? reserva.paquete_id));
  const ofertas = promocionesVigentes(paquete, fecha);
  const promocion = paquete?.promociones?.find((fila) => mismoId(fila.id, eleccion));
  const requiereCotizacion = decision === "aprobar" && solicitud.tipo === "cambio";
  const pagado = saldoReserva(reserva, datos).pagado;
  const clave = requiereCotizacion ? JSON.stringify([solicitud, reserva, paquete, eleccion, pagado, fecha]) : null;
  const cotizacion = useCotizacion(clave, () => {
    if (!["contratada", "sin"].includes(eleccion) && !ofertas.some((fila) => mismoId(fila.id, eleccion))) throw new Error(t("promos.ofertaNoDisponible"));
    return cotizarCambio({ solicitud_id: solicitud.id, promocion_id: promocion?.id ?? null, sustituir_promocion: eleccion !== "contratada" });
  });
  const cerrada = ["Cancelada", "Finalizada"].includes(reserva.estado);
  return <FormularioOperacion ocupado={ocupado} deshabilitarEnvio={requiereCotizacion && (!cotizacion.datos || !!cotizacion.error || cotizacion.datos.saldo < 0)} alEnviar={(valores) => {
    if (requiereCotizacion && (!cotizacion.datos || cotizacion.error || valores.aceptacion_cliente !== "on")) throw new Error(t("promos.revisarCotizacion"));
    return ejecutar(() => resolverSolicitud({ solicitud_id: solicitud.id, aprobar: decision === "aprobar", respuesta: valores.respuesta,
      promocion_id: promocion?.id ?? null, sustituir_promocion: eleccion !== "contratada", cotizacion: requiereCotizacion ? cotizacion.datos.clave : null,
      aceptacion_cliente: requiereCotizacion && valores.aceptacion_cliente === "on" }));
  }}>
    <CampoAsesor etiqueta={t("asesor.respuesta")} name="respuesta" multilinea required />
    <CampoAsesor etiqueta={t("asesor.decision")} value={decision} onChange={(evento) => cambiarDecision(evento.target.value)} required opciones={[["", t("asesor.seleccionar")], ...(!cerrada ? [["aprobar", t("asesor.aprobar")]] : []), ["rechazar", t("asesor.rechazar")]]} />
    {requiereCotizacion && <div className="space-y-3 rounded-xl border border-border p-3">
      <h3 className="font-semibold">{t("promos.nuevaCotizacion")}</h3>
      <CampoAsesor etiqueta={t("promos.promocion")} value={eleccion} onChange={(evento) => cambiarEleccion(evento.target.value)} opciones={[
        ...(mismoPaquete && reserva.promocion_contratada ? [["contratada", `${t("promos.conservar")} · ${reserva.promocion_contratada.nombre}`]] : []),
        ["sin", t("promos.sinPromocion")], ...ofertas.map((fila) => [fila.id, `${fila.nombre} · ${beneficioPromocion(fila, t)} · ${condicionPromocion(fila, t)}`]),
        ...(!["contratada", "sin"].includes(eleccion) && !ofertas.some((fila) => mismoId(fila.id, eleccion)) ? [[eleccion, t("promos.ofertaNoDisponible")]] : [])]} />
      <p className="text-xs text-muted-foreground">{t("promos.cambioAyuda")}</p>
      {cotizacion.cargando && <p role="status">{t("promos.cotizando")}</p>}
      {cotizacion.error && <p role="alert" className="text-sm text-rose-600">{cotizacion.error}</p>}
      <Button type="button" variant="outline" onClick={cotizacion.recotizar}>{t("promos.actualizarCotizacion")}</Button>
      {cotizacion.datos && <>
        <p>{cotizacion.datos.paquete_nombre} · {cotizacion.datos.pasajeros} {t("col.pax").toLocaleLowerCase()}</p>
        <p>{t("promos.totalAnterior")}: <b>{mostrarDinero(cotizacion.datos.total_anterior)}</b></p>
        <ResumenPrecio cotizacion={cotizacion.datos} />
        {cotizacion.datos.saldo < 0 ? <p role="alert" className="text-sm text-rose-600">{t("promos.requiereReembolso")}</p>
          : <label className="flex items-start gap-2"><input key={cotizacion.datos.clave} type="checkbox" name="aceptacion_cliente" required className="mt-1" />{t("promos.aceptacionCliente")}</label>}
      </>}
    </div>}
    <label className="flex items-start gap-2"><input type="checkbox" required className="mt-1" />{t("asesor.confirmarGestion")}</label>
  </FormularioOperacion>;
}
