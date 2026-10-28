import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CampoAsesor, TablaAsesor, SeccionAsesor } from "@/components/compartidos/FormulariosReserva";
import EditorProveedor from "@/components/administrador/EditorProveedor";
import useCatalogoAdministrativo from "@/hooks/useCatalogoAdministrativo";
import { guardarProveedor } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase";
import { useIdioma } from "@/lib/i18n.jsx";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";

export default function ProveedoresAdministrador({ datosDemo, validarAcceso, alActualizar, alGuardarDemo }) {
  const { t } = useIdioma();
  const [busqueda, cambiarBusqueda] = useState("");
  const [filtro, cambiarFiltro] = useState("todos");
  const [seleccion, cambiarSeleccion] = useState(null);
  const [relacionado, cambiarRelacionado] = useState(null);
  const { datos, cargando, ocupado, error, ejecutar, recargar } = useCatalogoAdministrativo({ datosDemo, validarAcceso, alActualizar });
  const proveedor = datos?.proveedores.find((fila) => String(fila.id) === String(seleccion));
  const filas = datos?.proveedores.filter((fila) => `${fila.nombre} ${fila.tipo}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase()) && (filtro === "todos" || (filtro === "activos" ? fila.activo : !fila.activo))) || [];
  return <div className="space-y-4">
    {cargando && <p role="status">{t("acceso.validando")}</p>}
    {error && <p role="alert" className="text-sm text-rose-600">{error}<span className="block text-xs">{t("asesor.revisarAntesReintentar")}</span></p>}
    <div className="flex flex-wrap gap-2"><Button disabled={!datos || ocupado || cargando} onClick={() => cambiarSeleccion("nuevo")}>{t("catalogo.nuevoProveedor")}</Button><Button variant="outline" disabled={ocupado || cargando} onClick={() => void recargar()}>{t("asesor.actualizar")}</Button></div>
    {datos && <>
      <SeccionAsesor><div className="grid gap-3 sm:grid-cols-2"><CampoAsesor etiqueta={t("catalogo.buscarProveedor")} type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} /><CampoAsesor etiqueta={t("col.estado")} value={filtro} onChange={(evento) => cambiarFiltro(evento.target.value)} opciones={[["todos", t("paquetes.filtro.todos")], ["activos", t("st.active")], ["inactivos", t("catalogo.noActivos")]]} /></div>
        <TablaAsesor columnas={[t("catalogo.proveedor"), t("catalogo.tipoProveedor"), t("catalogo.contacto"), t("catalogo.convenio"), t("col.estado"), t("col.accion")]}
          filas={filas.map((fila) => [fila.nombre, fila.tipo, fila.contacto, fila.convenio,
            <IndicadorEstado key="estado" estado={fila.estado} etiqueta={fila.estado === "Activo" ? t("st.active") : fila.estado === "Inactivo" ? t("st.inactive") : fila.estado} />,
            <div key="acciones" className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={ocupado || cargando} onClick={() => cambiarSeleccion(fila.id)}>{t("catalogo.editar")}</Button><Button variant="outline" size="sm" onClick={() => cambiarRelacionado(fila.id)}>{t("catalogo.paquetesRelacionados")}</Button></div>])} />
      </SeccionAsesor>
      {relacionado && <SeccionAsesor titulo={`${t("catalogo.paquetesRelacionados")} · ${datos.proveedores.find((fila) => String(fila.id) === String(relacionado))?.nombre || ""}`}>
        <TablaAsesor columnas={[t("col.paquete"), t("catalogo.servicio"), t("catalogo.detalleServicio")]}
          filas={datos.paquetes.flatMap((paquete) => paquete.servicios.filter((servicio) => String(servicio.proveedor_id) === String(relacionado)).map((servicio) => [paquete.nombre, t(`catalogo.servicio.${servicio.servicio}`), servicio.detalle]))} />
      </SeccionAsesor>}
      {seleccion && <EditorProveedor key={seleccion} proveedor={seleccion === "nuevo" ? null : proveedor} ocupado={ocupado} alCerrar={() => cambiarSeleccion(null)}
        alGuardar={(valores) => ejecutar(() => supabaseConfigurado ? guardarProveedor(valores) : alGuardarDemo(valores))} />}
    </>}
  </div>;
}
