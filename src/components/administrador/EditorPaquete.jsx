import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CampoDinero from "@/components/compartidos/CampoDinero";
import { CampoAsesor } from "@/components/compartidos/FormulariosReserva";
import { useIdioma } from "@/lib/i18n.jsx";
import { leerDinero } from "@/lib/dinero";
import { duracionPaquete, fechaColombia, obtenerCupos, ubicacionSinDuracion } from "@/lib/paquetes";
import { TIPOS_SERVICIO, validarPaquete } from "@/lib/catalogo";

const servicioNuevo = () => ({ clave: crypto.randomUUID(), proveedor_id: "", servicio: "Alojamiento", detalle: "" });

export default function EditorPaquete({ paquete, proveedores, ocupado, alGuardar, alCerrar }) {
  const { t } = useIdioma();
  const [precio, cambiarPrecio] = useState(paquete?.precio ?? "");
  const [salida, cambiarSalida] = useState(paquete?.salida || "");
  const [regreso, cambiarRegreso] = useState(paquete?.regreso || "");
  const [capacidad, cambiarCapacidad] = useState(String(paquete ? obtenerCupos(paquete)?.capacidad ?? "" : ""));
  const [servicios, cambiarServicios] = useState(() => paquete?.servicios?.length ? paquete.servicios.map((fila) => ({ ...fila, clave: crypto.randomUUID() })) : [servicioNuevo()]);
  const [error, cambiarError] = useState("");
  const duracion = duracionPaquete(salida, regreso);
  const cupos = paquete ? obtenerCupos(paquete) : null;
  const comprometidos = cupos ? cupos.capacidad - cupos.disponibles : 0;
  const cambiarServicio = (clave, campo, valor) => cambiarServicios((anteriores) => anteriores.map((fila) => fila.clave === clave ? { ...fila, [campo]: valor } : fila));
  const enviar = async (evento) => {
    evento.preventDefault(); if (ocupado) return;
    const valores = Object.fromEntries(new FormData(evento.currentTarget));
    const datos = { ...valores, id: paquete?.id ?? null, salida, regreso, precio: leerDinero(precio), capacidad: Number(capacidad),
      servicios: servicios.map((fila) => ({ proveedor_id: proveedores.find((proveedor) => String(proveedor.id) === String(fila.proveedor_id))?.id,
        servicio: fila.servicio, detalle: fila.detalle.trim() })) };
    cambiarError("");
    try { validarPaquete(datos, proveedores, paquete); if (await alGuardar(datos)) alCerrar(); }
    catch (fallo) { cambiarError(fallo.message); }
  };
  return <Dialog open onOpenChange={(abierto) => { if (!abierto && !ocupado) alCerrar(); }}>
    <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{t(paquete ? "catalogo.editarPaquete" : "catalogo.nuevoPaquete")}</DialogTitle></DialogHeader>
      <form onSubmit={enviar} className="space-y-5"><fieldset disabled={ocupado} className="space-y-5">
        {paquete && !paquete.catalogo_completo && <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">{t("catalogo.completarAntiguo")}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoAsesor etiqueta={t("catalogo.nombrePaquete")} name="nombre" defaultValue={paquete?.nombre || ""} minLength={2} maxLength={200} required />
          <CampoAsesor etiqueta={t("catalogo.destino")} name="ubicacion" defaultValue={ubicacionSinDuracion(paquete?.ubicacion)} minLength={2} maxLength={300} required />
          <CampoAsesor etiqueta={t("catalogo.tipoDestino")} name="tipo_destino" defaultValue={paquete?.tipo_destino || ""} required opciones={[["", t("asesor.seleccionar")], ["nacional", t("catalogo.nacional")], ["internacional", t("catalogo.internacional")]]} />
          <CampoAsesor etiqueta={t("catalogo.icono")} name="icono" defaultValue={paquete?.icono || "umbrella"} opciones={[["umbrella", t("catalogo.iconoPlaya")], ["landmark", t("catalogo.iconoCultura")], ["waves", t("catalogo.iconoMar")], ["ferriswheel", t("catalogo.iconoParques")], ["mountain", t("catalogo.iconoMontana")], ["building", t("catalogo.iconoCiudad")]]} />
        </div>
        <CampoAsesor etiqueta={t("catalogo.descripcion")} name="descripcion" defaultValue={paquete?.descripcion || ""} multilinea maxLength={10000} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoAsesor etiqueta={t("pkg.salida")} type="date" required min={paquete ? undefined : fechaColombia()} value={salida} onChange={(evento) => { const valor = evento.target.value; cambiarSalida(valor); if (regreso && regreso < valor) cambiarRegreso(""); }} />
          <CampoAsesor etiqueta={t("pkg.regreso")} type="date" required min={salida || (paquete ? undefined : fechaColombia())} value={regreso} onChange={(evento) => cambiarRegreso(evento.target.value)} />
          <div className="space-y-1.5"><label htmlFor="precio-paquete" className="text-sm font-medium">{t("catalogo.precioPersona")}</label><CampoDinero id="precio-paquete" valor={precio} alCambiar={cambiarPrecio} required /></div>
          <CampoAsesor etiqueta={t("catalogo.capacidad")} type="number" min={Math.max(1, comprometidos)} max="999999999" step="1" required value={capacidad} onChange={(evento) => cambiarCapacidad(evento.target.value)} />
        </div>
        <p role="status" className="rounded-xl bg-muted/60 p-3 text-sm">{t("fases.duracion")}: <b>{duracion ? `${duracion.dias} ${t(duracion.dias === 1 ? "fases.dia" : "fases.dias")} / ${duracion.noches} ${t(duracion.noches === 1 ? "fases.noche" : "fases.noches")}` : "—"}</b>
          <span className="mt-1 block">{t("catalogo.comprometidos")}: {comprometidos} · {t("catalogo.disponiblesCalculados")}: {Number.isSafeInteger(Number(capacidad)) && Number(capacidad) >= comprometidos ? Number(capacidad) - comprometidos : "—"}</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoAsesor etiqueta={t("catalogo.incluye")} name="incluye" defaultValue={paquete?.incluye || ""} multilinea maxLength={10000} required />
          <CampoAsesor etiqueta={t("catalogo.noIncluye")} name="no_incluye" defaultValue={paquete?.no_incluye || ""} multilinea maxLength={10000} />
        </div>
        <CampoAsesor etiqueta={t("catalogo.condiciones")} name="condiciones" defaultValue={paquete?.condiciones || ""} multilinea maxLength={10000} required />
        <section className="space-y-3"><h2 className="font-semibold">{t("catalogo.servicios")}</h2><p className="text-xs text-muted-foreground">{t("catalogo.proveedorObligatorio")}</p>
          {servicios.map((fila, indice) => <div key={fila.clave} className="space-y-3 rounded-xl border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoAsesor etiqueta={`${t("catalogo.proveedor")} ${indice + 1}`} required value={fila.proveedor_id} onChange={(evento) => cambiarServicio(fila.clave, "proveedor_id", evento.target.value)}
                opciones={[["", t("asesor.seleccionar")], ...proveedores.filter((proveedor) => proveedor.activo || paquete?.servicios?.some((servicio) => String(servicio.proveedor_id) === String(proveedor.id))).map((proveedor) => [proveedor.id, `${proveedor.nombre} · ${proveedor.tipo}${proveedor.activo ? "" : ` (${t("st.inactive")})`}`])]} />
              <CampoAsesor etiqueta={`${t("catalogo.servicio")} ${indice + 1}`} required value={fila.servicio} onChange={(evento) => cambiarServicio(fila.clave, "servicio", evento.target.value)} opciones={TIPOS_SERVICIO.map((tipo) => [tipo, t(`catalogo.servicio.${tipo}`)])} />
            </div>
            <CampoAsesor etiqueta={`${t("catalogo.detalleServicio")} ${indice + 1}`} value={fila.detalle} onChange={(evento) => cambiarServicio(fila.clave, "detalle", evento.target.value)} multilinea maxLength={2000} required />
            <Button type="button" variant="outline" disabled={servicios.length === 1} onClick={() => cambiarServicios((anteriores) => anteriores.filter((servicio) => servicio.clave !== fila.clave))}>{t("catalogo.quitarServicio")}</Button>
          </div>)}
          <Button type="button" variant="outline" disabled={servicios.length >= 50} onClick={() => cambiarServicios((anteriores) => [...anteriores, servicioNuevo()])}>{t("catalogo.agregarServicio")}</Button>
          {!proveedores.some((proveedor) => proveedor.activo) && <p className="text-sm text-amber-700 dark:text-amber-300">{t("catalogo.sinProveedoresActivos")}</p>}
        </section>
        {error && <p role="alert" className="text-sm text-rose-600">{error}<span className="block text-xs">{t("asesor.revisarAntesReintentar")}</span></p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={alCerrar}>{t("btn.cancel")}</Button><Button type="submit">{t(ocupado ? "acceso.esperar" : "btn.save")}</Button></div>
      </fieldset></form>
    </DialogContent>
  </Dialog>;
}
