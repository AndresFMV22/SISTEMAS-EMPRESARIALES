import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CampoAsesor, SeccionAsesor, TablaAsesor } from "@/components/compartidos/FormulariosReserva";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";
import EditorPromocion from "@/components/administrador/EditorPromocion";
import { obtenerPromociones, guardarPromocion, estadoPromocion, beneficioPromocion, condicionPromocion } from "@/lib/promociones";
import { supabaseConfigurado } from "@/lib/supabase";
import { useIdioma } from "@/lib/i18n.jsx";
import { useFechaColombia } from "@/hooks/useFechaColombia";

export default function PromocionesAdministrador({ validarAcceso }) {
  const { t } = useIdioma();
  const fecha = useFechaColombia();
  const [datos, cambiarDatos] = useState(null);
  const [error, cambiarError] = useState("");
  const [cargando, cambiarCargando] = useState(supabaseConfigurado);
  const [ocupado, cambiarOcupado] = useState(false);
  const [seleccion, cambiarSeleccion] = useState(null);
  const [busqueda, cambiarBusqueda] = useState("");
  const [filtro, cambiarFiltro] = useState("todos");
  const lectura = useRef(null);const vigente = useRef(false);const bloqueo = useRef(false);
  const recargar = useCallback(async () => {
    if (!supabaseConfigurado) return;
    if (!lectura.current) {
      cambiarCargando(true);
      lectura.current = obtenerPromociones().then((resultado) => { if (vigente.current) cambiarDatos(resultado); })
        .finally(() => { lectura.current = null; if (vigente.current) cambiarCargando(false); });
    }
    return lectura.current;
  }, []);
  useEffect(() => { vigente.current = true; void recargar().catch((fallo) => { if (vigente.current) cambiarError(fallo.message); }); return () => { vigente.current = false; }; }, [recargar]);
  const guardar = async (valores) => {
    if (bloqueo.current) return false;
    bloqueo.current = true;cambiarOcupado(true);cambiarError("");
    try { await validarAcceso();await recargar();await guardarPromocion(valores);await recargar();return true; }
    catch (fallo) { try { await recargar(); } catch { /* Revisar datos antes de repetir. */ } if (vigente.current) cambiarError(fallo.message);throw fallo; }
    finally { bloqueo.current = false;if (vigente.current) cambiarOcupado(false); }
  };
  const filas = datos?.promociones.filter((fila) => fila.nombre.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase()) && (filtro === "todos" || estadoPromocion(fila, fecha) === filtro)) || [];
  const editando = datos?.promociones.find((fila) => String(fila.id) === String(seleccion));
  return <div className="space-y-4">
    {!supabaseConfigurado && <p role="status">{t("promos.soloReal")}</p>}
    {cargando && <p role="status">{t("acceso.validando")}</p>}
    {error && <p role="alert" className="text-sm text-rose-600">{error}<span className="block text-xs">{t("asesor.revisarAntesReintentar")}</span></p>}
    <div className="flex flex-wrap gap-2"><Button disabled={!datos || ocupado || cargando} onClick={() => cambiarSeleccion("nueva")}>{t("promos.nueva")}</Button>
      {supabaseConfigurado && <Button variant="outline" disabled={ocupado || cargando} onClick={() => { cambiarError("");void recargar().catch((fallo) => cambiarError(fallo.message)); }}>{t("asesor.actualizar")}</Button>}</div>
    {datos && <SeccionAsesor><div className="grid gap-3 sm:grid-cols-2"><CampoAsesor etiqueta={t("promos.buscar")} type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} /><CampoAsesor etiqueta={t("col.estado")} value={filtro} onChange={(evento) => cambiarFiltro(evento.target.value)} opciones={[["todos", t("paquetes.filtro.todos")], ...["programada", "vigente", "vencida", "deshabilitada"].map((estado) => [estado, t(`promos.${estado}`)])]} /></div>
      <TablaAsesor columnas={[t("promos.nombre"), t("promos.beneficio"), t("promos.condicion"), t("promos.vigencia"), t("promos.paquetesAplicables"), t("col.estado"), t("col.accion")]}
        filas={filas.map((fila) => [fila.nombre, beneficioPromocion(fila, t), condicionPromocion(fila, t), `${fila.desde} — ${fila.hasta}`,
          fila.paquetes.map((id) => datos.paquetes.find((paquete) => String(paquete.id) === String(id))?.nombre || `ID ${id}`).join(", "),
          <IndicadorEstado key="estado" estado={estadoPromocion(fila, fecha)} etiqueta={t(`promos.${estadoPromocion(fila, fecha)}`)} />,
          <Button key="editar" size="sm" variant="outline" disabled={ocupado || cargando} onClick={() => cambiarSeleccion(fila.id)}>{t("catalogo.editar")}</Button>])} />
    </SeccionAsesor>}
    {datos && seleccion && <EditorPromocion key={seleccion} promocion={seleccion === "nueva" ? null : editando} paquetes={datos.paquetes} ocupado={ocupado}
      alGuardar={guardar} alCerrar={() => cambiarSeleccion(null)} />}
  </div>;
}
