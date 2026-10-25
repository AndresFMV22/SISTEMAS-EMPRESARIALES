import { useState } from "react";
import { LayoutDashboard, Users, Palmtree, CalendarDays, CreditCard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import PanelUsuario from "@/components/compartidos/PanelUsuario";
import CatalogoPaquetes from "@/components/compartidos/CatalogoPaquetes";
import DetalleReserva from "@/components/compartidos/DetalleReserva";
import { mismoId } from "@/components/compartidos/FormulariosReserva";
import useAsesor from "@/hooks/useAsesor";
import { useIdioma } from "@/lib/i18n.jsx";
import ResumenAsesor from "./ResumenAsesor";
import ClientesAsesor from "./ClientesAsesor";
import ReservasAsesor from "./ReservasAsesor";
import PagosAsesor from "./PagosAsesor";
import CuentaAsesor from "./CuentaAsesor";

const navegacion = [
  { id: "resumen", icon: LayoutDashboard, etiqueta: "asesor.resumen" },
  { id: "clientes", icon: Users }, { id: "paquetes", icon: Palmtree },
  { id: "reservas", icon: CalendarDays }, { id: "pagos", icon: CreditCard },
  { id: "cuenta", icon: UserRound, etiqueta: "asesor.cuenta" },
];

export default function PanelAsesor({ perfil, alSalir, validarAcceso, controles }) {
  const { t } = useIdioma();
  const [vista, cambiarVista] = useState("resumen");
  const [seleccion, cambiarSeleccion] = useState(null);
  const { datos, cargando, ocupado, error, mensaje, ejecutar, refrescar } = useAsesor({ validarAcceso });
  const reserva = seleccion && datos?.reservas.find((fila) => mismoId(fila.id, seleccion.id) || (fila.id == null && fila.codigo === seleccion.codigo));
  const propiedades = { datos, perfil, ocupado, ejecutar, error, mensaje, alReserva: cambiarSeleccion };
  const navegar = (destino) => {
    if (ocupado || cargando) return false;
    cambiarSeleccion(null);
    cambiarVista(destino);
  };
  return <PanelUsuario perfil={perfil} alSalir={alSalir} navegacion={navegacion} vista={vista} alNavegar={navegar} titulo={t(navegacion.find((fila) => fila.id === vista)?.etiqueta || `nav.${vista}`)} subtitulo={t("asesor.operacion")} controles={controles}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{t("asesor.datosCompartidos")}</p><Button variant="outline" size="sm" disabled={cargando || ocupado} onClick={() => void refrescar()}>{t("asesor.actualizar")}</Button></div>
      {cargando && <p role="status">{t("acceso.validando")}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-600">{error}<span className="mt-1 block">{t("asesor.revisarAntesReintentar")}</span></p>}
      {mensaje && <p role="status" className="text-sm text-emerald-600">{t(mensaje)}</p>}
      {datos && <>
        {vista === "resumen" && <ResumenAsesor datos={datos} perfil={perfil} alReserva={cambiarSeleccion} />}
        {vista === "clientes" && <ClientesAsesor {...propiedades} />}
        {vista === "paquetes" && <CatalogoPaquetes paquetes={datos.paquetes} />}
        {vista === "reservas" && <ReservasAsesor {...propiedades} />}
        {vista === "pagos" && <PagosAsesor datos={datos} alReserva={cambiarSeleccion} />}
        {vista === "cuenta" && <CuentaAsesor perfil={perfil} ocupado={ocupado} ejecutar={ejecutar} />}
        {reserva && <DetalleReserva key={reserva.id ?? reserva.codigo} {...propiedades} reserva={reserva} alCerrar={() => cambiarSeleccion(null)} />}
      </>}
    </div>
  </PanelUsuario>;
}
