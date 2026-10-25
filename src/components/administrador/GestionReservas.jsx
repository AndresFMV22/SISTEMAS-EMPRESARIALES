import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIdioma } from "@/lib/i18n.jsx";
import useAsesor from "@/hooks/useAsesor";
import ReservasAsesor from "@/vistas/asesor/ReservasAsesor";
import DetalleReserva from "@/components/compartidos/DetalleReserva";
import { SeccionAsesor, TablaAsesor, mismoId } from "@/components/compartidos/FormulariosReserva";

export default function GestionReservas({ validarAcceso, alActualizar, alCambiarOcupado, alVolver }) {
  const { t } = useIdioma();
  const [seleccion, cambiarSeleccion] = useState(null);
  const { datos, cargando, ocupado, error, mensaje, ejecutar, refrescar } = useAsesor({ gestion: true, validarAcceso, alActualizar });
  useEffect(() => {
    alCambiarOcupado(cargando || ocupado);
    return () => alCambiarOcupado(false);
  }, [cargando, ocupado, alCambiarOcupado]);
  const reserva = seleccion && datos?.reservas.find((fila) => mismoId(fila.id, seleccion.id) || (fila.id == null && fila.codigo === seleccion.codigo));
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={cargando || ocupado} onClick={() => { cambiarSeleccion(null); alVolver(); }}>{t("asesor.volverReservas")}</Button><Button variant="outline" disabled={cargando || ocupado} onClick={() => void refrescar()}>{t("asesor.actualizar")}</Button></div>
    {cargando && <p role="status">{t("acceso.validando")}</p>}
    {error && <p role="alert" className="text-sm text-rose-600">{error}<span className="block">{t("asesor.revisarAntesReintentar")}</span></p>}
    {mensaje && <p role="status" className="text-sm text-emerald-600">{t(mensaje)}</p>}
    {datos && <>
      <SeccionAsesor titulo={t("asesor.bandeja")}><TablaAsesor columnas={[t("col.reserva"), t("col.asesor"), t("asesor.tipoSolicitud"), t("asesor.motivo"), t("col.accion")]} filas={datos.solicitudes.filter((fila) => fila.estado === "pendiente").map((solicitud) => {
        const relacionada = datos.reservas.find((fila) => mismoId(fila.id, solicitud.reserva_id));
        return [relacionada?.codigo || `ID ${solicitud.reserva_id}`, solicitud.autor_nombre, t(`asesor.${solicitud.tipo}`), solicitud.motivo, relacionada ? <Button key="detalle" variant="outline" onClick={() => cambiarSeleccion(relacionada)}>{t("asesor.verDetalle")}</Button> : "—"];
      })} /></SeccionAsesor>
      <ReservasAsesor datos={datos} ocupado={ocupado} ejecutar={ejecutar} alReserva={cambiarSeleccion} administracion />
      {reserva && <DetalleReserva key={reserva.id ?? reserva.codigo} datos={datos} reserva={reserva} ocupado={ocupado} ejecutar={ejecutar} error={error} mensaje={mensaje} alCerrar={() => cambiarSeleccion(null)} administracion />}
    </>}
  </div>;
}
