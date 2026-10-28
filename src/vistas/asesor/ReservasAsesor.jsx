import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useIdioma } from "@/lib/i18n.jsx";
import FormularioReserva from "@/components/compartidos/FormularioReserva";
import { CampoAsesor, SeccionAsesor, TablaAsesor, EstadoAsesor, mismoId, dineroOpcional } from "@/components/compartidos/FormulariosReserva";

export default function ReservasAsesor({ datos, perfil, ocupado, ejecutar, alReserva, administracion = false }) {
  const { t } = useIdioma();
  const [ambito, cambiarAmbito] = useState(administracion ? "todas" : "mis");
  const [busqueda, cambiarBusqueda] = useState("");
  const [desde, cambiarDesde] = useState("");
  const [hasta, cambiarHasta] = useState("");
  const [estado, cambiarEstado] = useState("");
  const reservas = datos.reservas.filter((reserva) => (ambito === "todas" || mismoId(reserva.empleado_id, perfil?.empleado_id))
    && `${reserva.codigo} ${reserva.cliente}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())
    && (!desde || reserva.fecha_viaje >= desde) && (!hasta || reserva.fecha_viaje <= hasta) && (!estado || reserva.estado === estado));
  return <div className="space-y-5">
    <SeccionAsesor>
      {!administracion && <div role="tablist" aria-label={t("nav.reservas")} className="flex gap-2">{["mis", "todas"].map((valor) => <Button key={valor} id={`pestana-${valor}`} role="tab" aria-selected={ambito === valor} aria-controls="lista-reservas" tabIndex={ambito === valor ? 0 : -1} variant={ambito === valor ? "default" : "outline"}
        onKeyDown={(evento) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
          evento.preventDefault();
          const destino = evento.key === "Home" ? "mis" : evento.key === "End" ? "todas" : valor === "mis" ? "todas" : "mis";
          cambiarAmbito(destino); document.getElementById(`pestana-${destino}`)?.focus();
        }} onClick={() => cambiarAmbito(valor)}>{t(`asesor.${valor}`)}</Button>)}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><CampoAsesor etiqueta={t("asesor.buscarReserva")} type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} /><CampoAsesor etiqueta={t("dash.from")} type="date" value={desde} onChange={(evento) => cambiarDesde(evento.target.value)} /><CampoAsesor etiqueta={t("dash.to")} type="date" value={hasta} onChange={(evento) => cambiarHasta(evento.target.value)} /><CampoAsesor etiqueta={t("col.estado")} value={estado} onChange={(evento) => cambiarEstado(evento.target.value)} opciones={[["", t("asesor.todas")], ...[...new Set(datos.reservas.map((fila) => fila.estado))].map((valor) => [valor, t(`asesor.estado.${valor}`) === `asesor.estado.${valor}` ? valor : t(`asesor.estado.${valor}`)])]} /></div>
      <div id="lista-reservas" role={administracion ? undefined : "tabpanel"} aria-labelledby={administracion ? undefined : `pestana-${ambito}`}>
        <TablaAsesor columnas={[t("col.reserva"), t("col.cliente"), t("col.paquete"), t("col.fecha"), t("fases.estadoReserva"), t("fases.estadoPago"), t("pay.total"), t("col.accion")]} filas={reservas.map((reserva) => [reserva.codigo, reserva.cliente, reserva.paquete, reserva.fecha_viaje, <EstadoAsesor key="estado" estado={reserva.estado} tipo="reserva" />, <EstadoAsesor key="pago" estado={reserva.estado_pago} tipo="pago" />, dineroOpcional(reserva.total), <Button key="detalle" size="sm" variant="outline" onClick={() => alReserva(reserva)}>{t("asesor.verDetalle")}</Button>])} />
      </div>
    </SeccionAsesor>
    {!administracion && <FormularioReserva datos={datos} ocupado={ocupado} ejecutar={ejecutar} />}
  </div>;
}
