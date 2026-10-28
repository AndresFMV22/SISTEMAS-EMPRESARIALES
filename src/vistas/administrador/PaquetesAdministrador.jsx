import { useState } from "react";
import { Button } from "@/components/ui/button";
import CatalogoPaquetes from "@/components/compartidos/CatalogoPaquetes";
import EditorPaquete from "@/components/administrador/EditorPaquete";
import useCatalogoAdministrativo from "@/hooks/useCatalogoAdministrativo";
import { guardarPaquete } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase";
import { useIdioma } from "@/lib/i18n.jsx";

export default function PaquetesAdministrador({ datosDemo, validarAcceso, alActualizar, alGuardarDemo }) {
  const { t } = useIdioma();
  const [seleccion, cambiarSeleccion] = useState(null);
  const { datos, cargando, ocupado, error, ejecutar, recargar } = useCatalogoAdministrativo({ datosDemo, validarAcceso, alActualizar });
  const seleccionado = seleccion && datos?.paquetes.find((paquete) => String(paquete.id) === String(seleccion));
  return <div className="space-y-4">
    {cargando && <p role="status">{t("acceso.validando")}</p>}
    {error && <p role="alert" className="text-sm text-rose-600">{error}<span className="block text-xs">{t("asesor.revisarAntesReintentar")}</span></p>}
    <Button variant="outline" disabled={cargando || ocupado} onClick={() => void recargar()}>{t("asesor.actualizar")}</Button>
    {datos && <CatalogoPaquetes paquetes={datos.paquetes} accion={<Button disabled={ocupado || cargando} onClick={() => cambiarSeleccion("nuevo")}>{t("catalogo.nuevoPaquete")}</Button>}
      alEditar={(paquete) => { if (!ocupado && !cargando) cambiarSeleccion(paquete.id); }} />}
    {datos && seleccion && <EditorPaquete key={seleccion} paquete={seleccion === "nuevo" ? null : seleccionado} proveedores={datos.proveedores} ocupado={ocupado}
      alCerrar={() => cambiarSeleccion(null)} alGuardar={(valores) => ejecutar(() => supabaseConfigurado ? guardarPaquete(valores) : alGuardarDemo(valores))} />}
  </div>;
}
