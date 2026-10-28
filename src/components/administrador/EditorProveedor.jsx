import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CampoAsesor } from "@/components/compartidos/FormulariosReserva";
import { useIdioma } from "@/lib/i18n.jsx";
import { TIPOS_PROVEEDOR } from "@/lib/catalogo";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";

export default function EditorProveedor({ proveedor, ocupado, alGuardar, alCerrar }) {
  const { t } = useIdioma();
  const [error, cambiarError] = useState("");
  const [estado, cambiarEstado] = useState(proveedor ? ["Activo", "Inactivo"].includes(proveedor.estado) ? proveedor.estado : "" : "Activo");
  const tipos = [...new Set([...TIPOS_PROVEEDOR, ...(proveedor?.tipo ? [proveedor.tipo] : [])])];
  const enviar = async (evento) => {
    evento.preventDefault(); if (ocupado) return;
    const valores = Object.fromEntries(new FormData(evento.currentTarget));
    cambiarError("");
    try { if (await alGuardar({ ...valores, id: proveedor?.id ?? null, activo: valores.estado === "Activo" })) alCerrar(); }
    catch (fallo) { cambiarError(fallo.message); }
  };
  return <Dialog open onOpenChange={(abierto) => { if (!abierto && !ocupado) alCerrar(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{t(proveedor ? "catalogo.editarProveedor" : "catalogo.nuevoProveedor")}</DialogTitle></DialogHeader>
    <form onSubmit={enviar} className="space-y-4"><fieldset disabled={ocupado} className="space-y-4">
      <CampoAsesor etiqueta={t("catalogo.nombreProveedor")} name="nombre" defaultValue={proveedor?.nombre || ""} minLength={2} maxLength={200} required />
      <CampoAsesor etiqueta={t("catalogo.tipoProveedor")} name="tipo" defaultValue={proveedor?.tipo || ""} required opciones={[["", t("asesor.seleccionar")], ...tipos.map((tipo) => [tipo, t(`catalogo.proveedor.${tipo}`) === `catalogo.proveedor.${tipo}` ? tipo : t(`catalogo.proveedor.${tipo}`)])]} />
      <CampoAsesor etiqueta={t("catalogo.contacto")} name="contacto" defaultValue={proveedor?.contacto || ""} minLength={2} maxLength={254} required />
      <CampoAsesor etiqueta={t("catalogo.convenio")} name="convenio" defaultValue={proveedor?.convenio || ""} multilinea maxLength={4000} />
      <CampoAsesor etiqueta={t("col.estado")} name="estado" value={estado} onChange={(evento) => cambiarEstado(evento.target.value)} required opciones={[["", t("asesor.seleccionar")], ["Activo", t("st.active")], ["Inactivo", t("st.inactive")]]} />
      {estado && <IndicadorEstado estado={estado} etiqueta={t(estado === "Activo" ? "st.active" : "st.inactive")} />}
      <p className="text-xs text-muted-foreground">{t("catalogo.proveedorEstadoAyuda")}</p>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={alCerrar}>{t("btn.cancel")}</Button><Button type="submit">{t(ocupado ? "acceso.esperar" : "btn.save")}</Button></div>
    </fieldset></form>
  </DialogContent></Dialog>;
}
