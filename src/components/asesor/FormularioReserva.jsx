import { useState } from "react";
import { useIdioma } from "@/lib/i18n.jsx";
import { crearReservaAsesor } from "@/lib/asesor";
import { estadoPaquete, obtenerCupos } from "@/lib/paquetes";
import { useFechaColombia } from "@/hooks/useFechaColombia";
import { mostrarDinero } from "@/lib/dinero";
import { CampoAsesor, FormularioOperacion, SeccionAsesor, mismoId } from "@/components/compartidos/FormulariosReserva";

export default function FormularioReserva({ datos, ocupado, ejecutar }) {
  const { t } = useIdioma();
  const fecha = useFechaColombia();
  const [paqueteId, cambiarPaquete] = useState("");
  const [pax, cambiarPax] = useState("1");
  const paquetes = datos.paquetes.filter((paquete) => paquete.id != null && estadoPaquete(paquete, fecha) === "disponible");
  const paquete = paquetes.find((fila) => mismoId(fila.id, paqueteId));
  const total = paquete ? paquete.precio * Number(pax) : null;
  return <SeccionAsesor titulo={t("asesor.nuevaReserva")}><FormularioOperacion ocupado={ocupado} alEnviar={(valores) => {
    const cliente = datos.clientes.find((fila) => mismoId(fila.id, valores.cliente_id));
    const viajeros = Number(valores.pax);
    if (!paquete || estadoPaquete(paquete) !== "disponible") throw new Error(t("paquetes.noReservable"));
    if (!Number.isSafeInteger(viajeros) || viajeros <= 0 || viajeros > obtenerCupos(paquete).disponibles) throw new Error(t("paquetes.viajerosInvalidos"));
    if (!Number.isSafeInteger(total)) throw new Error(t("asesor.importeInvalido"));
    return ejecutar(() => crearReservaAsesor({ cliente_id: cliente?.id, paquete_id: paquete.id, pax: viajeros }));
  }}>
    <div className="grid gap-3 sm:grid-cols-2">
      <CampoAsesor etiqueta={t("col.cliente")} name="cliente_id" required opciones={[["", t("asesor.seleccionar")], ...datos.clientes.filter((fila) => fila.activo && fila.id != null).map((fila) => [fila.id, `${fila.nombre} · ${fila.documento}`])]} />
      <CampoAsesor etiqueta={t("col.paquete")} name="paquete_id" value={paqueteId} onChange={(evento) => cambiarPaquete(evento.target.value)} required opciones={[["", t("asesor.seleccionar")], ...paquetes.map((fila) => [fila.id, fila.nombre])]} />
      <CampoAsesor etiqueta={t("col.pax")} name="pax" type="number" min="1" step="1" max={paquete ? obtenerCupos(paquete)?.disponibles : undefined} value={pax} onChange={(evento) => cambiarPax(evento.target.value)} required />
      <CampoAsesor etiqueta={t("pkg.salida")} value={paquete?.salida || ""} readOnly />
    </div>
    <p className="text-sm">{t("asesor.precioPersona")}: <b>{paquete ? mostrarDinero(paquete.precio) : "—"}</b> · {t("pay.total")}: <b>{Number.isSafeInteger(total) ? mostrarDinero(total) : "—"}</b></p>
  </FormularioOperacion></SeccionAsesor>;
}
