import { useState } from "react";
import { useIdioma } from "@/lib/i18n.jsx";
import { crearReserva } from "@/lib/asesor";
import { estadoPaquete, obtenerCupos } from "@/lib/paquetes";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { mostrarDinero } from "@/lib/dinero";
import { cotizarReserva, promocionesVigentes, beneficioPromocion, condicionPromocion } from "@/lib/promociones";
import useCotizacion from "@/hooks/useCotizacion";
import ResumenPrecio from "./ResumenPrecio";
import { Button } from "@/components/ui/button";
import { CampoAsesor, FormularioOperacion, SeccionAsesor, mismoId } from "@/components/compartidos/FormulariosReserva";

export default function FormularioReserva({ datos, ocupado, ejecutar, administracion = false }) {
  const { t } = useIdioma();
  const fecha = useFechaColombia();
  const [paqueteId, cambiarPaquete] = useState("");
  const [pax, cambiarPax] = useState("1");
  const [promocionId, cambiarPromocion] = useState("");
  const paquetes = datos.paquetes.filter((paquete) => paquete.id != null && estadoPaquete(paquete, fecha) === "disponible");
  const paquete = paquetes.find((fila) => mismoId(fila.id, paqueteId));
  const total = paquete ? paquete.precio * Number(pax) : null;
  const promociones = promocionesVigentes(paquete, fecha);
  const promocion = paquete?.promociones?.find((fila) => mismoId(fila.id, promocionId));
  const clave = paquete && Number.isSafeInteger(Number(pax)) && Number(pax) > 0 ? JSON.stringify([paquete, pax, promocionId, fecha]) : null;
  const cotizacion = useCotizacion(clave, () => {
    if (promocionId && !promociones.some((fila) => mismoId(fila.id, promocionId))) throw new Error(t("promos.ofertaNoDisponible"));
    return cotizarReserva({ paquete_id: paquete.id, pasajeros: Number(pax), promocion_id: promocion?.id ?? null });
  });
  return <SeccionAsesor titulo={t("asesor.nuevaReserva")}><FormularioOperacion ocupado={ocupado} deshabilitarEnvio={!cotizacion.datos || !!cotizacion.error} alEnviar={(valores) => {
    const cliente = datos.clientes.find((fila) => mismoId(fila.id, valores.cliente_id));
    const viajeros = Number(valores.pax);
    if (!paquete || estadoPaquete(paquete) !== "disponible") throw new Error(t("paquetes.noReservable"));
    if (!Number.isSafeInteger(viajeros) || viajeros <= 0 || viajeros > obtenerCupos(paquete).disponibles) throw new Error(t("paquetes.viajerosInvalidos"));
    if (!Number.isSafeInteger(total)) throw new Error(t("asesor.importeInvalido"));
    if (!cotizacion.datos || cotizacion.error || (promocionId && !promocion)) throw new Error(t("promos.revisarCotizacion"));
    const responsable = administracion && valores.empleado_id
      ? datos.asesores?.find((fila) => mismoId(fila.empleado_id, valores.empleado_id))?.empleado_id : null;
    if (administracion && valores.empleado_id && responsable == null) throw new Error(t("asesor.seleccionar"));
    return ejecutar(() => crearReserva({ cliente_id: cliente?.id, paquete_id: paquete.id, pax: viajeros, empleado_id: responsable,
      promocion_id: promocion?.id ?? null, cotizacion: cotizacion.datos.clave }));
  }}>
    <div className="grid gap-3 sm:grid-cols-2">
      <CampoAsesor etiqueta={t("col.cliente")} name="cliente_id" required opciones={[["", t("asesor.seleccionar")], ...datos.clientes.filter((fila) => fila.activo && fila.id != null).map((fila) => [fila.id, `${fila.nombre} · ${fila.documento}`])]} />
      <CampoAsesor etiqueta={t("col.paquete")} name="paquete_id" value={paqueteId} onChange={(evento) => { cambiarPaquete(evento.target.value); cambiarPromocion(""); }} required opciones={[["", t("asesor.seleccionar")], ...paquetes.map((fila) => [fila.id, fila.nombre])]} />
      <CampoAsesor etiqueta={t("col.pax")} name="pax" type="number" min="1" step="1" max={paquete ? obtenerCupos(paquete)?.disponibles : undefined} value={pax} onChange={(evento) => cambiarPax(evento.target.value)} required />
      <CampoAsesor etiqueta={t("pkg.salida")} value={paquete?.salida || ""} readOnly />
      <CampoAsesor etiqueta={t("pkg.regreso")} value={paquete?.regreso || ""} readOnly />
      {administracion && <CampoAsesor etiqueta={t("fases.responsable")} name="empleado_id"
        opciones={[["", t("fases.asignarme")], ...(datos.asesores || []).map((fila) => [fila.empleado_id, `${fila.nombre} · ${fila.correo}`])]} />}
    </div>
    <CampoAsesor etiqueta={t("promos.promocion")} value={promocionId} onChange={(evento) => cambiarPromocion(evento.target.value)}
      opciones={[["", t("promos.sinPromocion")], ...promociones.map((fila) => [fila.id, `${fila.nombre} · ${beneficioPromocion(fila, t)} · ${condicionPromocion(fila, t)}`]),
        ...(promocionId && !promociones.some((fila) => mismoId(fila.id, promocionId)) ? [[promocionId, t("promos.ofertaNoDisponible")]] : [])]} />
    <p className="text-xs text-muted-foreground">{t("promos.opcional")}</p>
    {cotizacion.cargando && <p role="status">{t("promos.cotizando")}</p>}
    {cotizacion.error && <p role="alert" className="text-sm text-rose-600">{cotizacion.error}</p>}
    {paquete && <Button type="button" variant="outline" onClick={cotizacion.recotizar}>{t("promos.actualizarCotizacion")}</Button>}
    {cotizacion.datos ? <ResumenPrecio cotizacion={cotizacion.datos} /> : <p className="text-sm">{t("asesor.precioPersona")}: <b>{paquete ? mostrarDinero(paquete.precio) : "—"}</b></p>}
  </FormularioOperacion></SeccionAsesor>;
}
