import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CampoDinero from "@/components/compartidos/CampoDinero";
import { CampoAsesor } from "@/components/compartidos/FormulariosReserva";
import { useIdioma } from "@/lib/i18n.jsx";
import { leerDinero } from "@/lib/dinero";

export default function EditorPromocion({ promocion, paquetes, ocupado, alGuardar, alCerrar }) {
  const { t } = useIdioma();
  const [tipo, cambiarTipo] = useState(promocion?.tipo || "porcentaje");
  const [valor, cambiarValor] = useState(String(promocion?.valor || ""));
  const [condicion, cambiarCondicion] = useState(promocion?.condicion_pasajeros || "cualquiera");
  const [desde, cambiarDesde] = useState(promocion?.desde || "");
  const [hasta, cambiarHasta] = useState(promocion?.hasta || "");
  const [error, cambiarError] = useState("");
  const enviar = async (evento) => {
    evento.preventDefault(); if (ocupado) return;
    const formulario = new FormData(evento.currentTarget);
    const importe = tipo === "fijo" ? leerDinero(valor) : Number(valor);
    const datos = { id: promocion?.id ?? null, nombre: formulario.get("nombre"), descripcion: formulario.get("descripcion"), tipo, valor: importe,
      desde, hasta, condicion_pasajeros: condicion, cantidad_pasajeros: condicion === "cualquiera" ? null : Number(formulario.get("cantidad_pasajeros")),
      activa: formulario.get("activa") === "on", paquetes: formulario.getAll("paquetes").map(Number) };
    cambiarError("");
    try {
      if (!Number.isSafeInteger(importe) || importe <= 0 || (tipo === "porcentaje" && importe > 99)) throw new Error(t("promos.valorInvalido"));
      if (!datos.paquetes.length) throw new Error(t("promos.seleccionaPaquetes"));
      if (await alGuardar(datos)) alCerrar();
    } catch (fallo) { cambiarError(fallo.message); }
  };
  return <Dialog open onOpenChange={(abierto) => { if (!abierto && !ocupado) alCerrar(); }}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle>{t(promocion ? "promos.editar" : "promos.nueva")}</DialogTitle></DialogHeader>
    <form onSubmit={enviar} className="space-y-4"><fieldset disabled={ocupado} className="space-y-4">
      <CampoAsesor etiqueta={t("promos.nombre")} name="nombre" defaultValue={promocion?.nombre || ""} minLength={2} maxLength={200} required />
      <CampoAsesor etiqueta={t("catalogo.descripcion")} name="descripcion" defaultValue={promocion?.descripcion || ""} multilinea maxLength={4000} />
      <div className="grid gap-3 sm:grid-cols-2"><CampoAsesor etiqueta={t("promos.tipo")} value={tipo} onChange={(evento) => { cambiarTipo(evento.target.value); cambiarValor(""); }} opciones={[["porcentaje", t("promos.porcentaje")], ["fijo", t("promos.fijo")]]} />
        {tipo === "fijo" ? <div className="space-y-1.5"><label htmlFor="valor-promocion" className="text-sm font-medium">{t("promos.fijo")}</label><CampoDinero id="valor-promocion" valor={valor} alCambiar={cambiarValor} required /></div>
          : <CampoAsesor etiqueta={t("promos.porcentaje")} type="number" min="1" max="99" step="1" required value={valor} onChange={(evento) => cambiarValor(evento.target.value)} />}
        <CampoAsesor etiqueta={t("dash.from")} type="date" required value={desde} onChange={(evento) => { cambiarDesde(evento.target.value); if (hasta && hasta < evento.target.value) cambiarHasta(""); }} />
        <CampoAsesor etiqueta={t("dash.to")} type="date" min={desde || undefined} required value={hasta} onChange={(evento) => cambiarHasta(evento.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">{t("promos.vigenciaAyuda")}</p>
      <CampoAsesor etiqueta={t("promos.condicion")} value={condicion} onChange={(evento) => cambiarCondicion(evento.target.value)} opciones={[["cualquiera", t("promos.cualquiera")], ["exacta", t("promos.exacta")], ["minima", t("promos.minima")]]} />
      {condicion !== "cualquiera" && <CampoAsesor etiqueta={t("promos.cantidad")} name="cantidad_pasajeros" type="number" min="1" max="999999999" step="1" defaultValue={promocion?.cantidad_pasajeros ?? ""} required />}
      <p className="text-xs text-muted-foreground">{t("promos.reglaReservaCompleta")}</p>
      <section className="space-y-2"><h2 className="font-semibold">{t("promos.paquetesAplicables")}</h2>
        {paquetes.map((paquete) => <label key={paquete.id} className="flex items-start gap-2 rounded-lg border border-border p-2 text-sm"><input type="checkbox" name="paquetes" value={paquete.id} defaultChecked={promocion?.paquetes?.some((id) => String(id) === String(paquete.id))} className="mt-1" />{paquete.nombre}</label>)}
      </section>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="activa" defaultChecked={promocion ? promocion.activa : true} className="mt-1" />{t("promos.habilitada")}</label>
      <p className="text-xs text-muted-foreground">{t("promos.noRetroactivo")}</p>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={alCerrar}>{t("btn.cancel")}</Button><Button type="submit">{t(ocupado ? "acceso.esperar" : "btn.save")}</Button></div>
    </fieldset></form>
  </DialogContent></Dialog>;
}
