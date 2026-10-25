import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useIdioma } from "@/lib/i18n.jsx";
import { registrarCliente, actualizarContactoCliente } from "@/lib/asesor";
import { mostrarDinero } from "@/lib/dinero";
import { CampoAsesor, FormularioOperacion, SeccionAsesor, TablaAsesor, EstadoAsesor, mismoId, perteneceReserva } from "@/components/compartidos/FormulariosReserva";

export default function ClientesAsesor({ datos, ocupado, ejecutar, alReserva }) {
  const { t } = useIdioma();
  const [busqueda, cambiarBusqueda] = useState("");
  const [seleccion, cambiarSeleccion] = useState(null);
  const cliente = datos.clientes.find((fila) => mismoId(fila.id, seleccion));
  const reservas = cliente ? datos.reservas.filter((fila) => mismoId(fila.cliente_id, cliente.id)) : [];
  const pagos = datos.pagos.filter((pago) => reservas.some((reserva) => perteneceReserva(pago, reserva)));
  return <div className="space-y-5">
    <SeccionAsesor><CampoAsesor etiqueta={t("asesor.buscarCliente")} type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} />
      <TablaAsesor columnas={[t("col.nombre"), t("col.doc"), t("col.correo"), t("col.tel"), t("col.accion")]} filas={datos.clientes.filter((fila) => `${fila.nombre} ${fila.documento}`.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())).map((fila) => [fila.nombre, fila.documento, fila.correo, fila.telefono, <Button key="historial" variant="outline" size="sm" disabled={fila.id == null} onClick={() => cambiarSeleccion(fila.id)}>{t("asesor.historial")}</Button>])} />
    </SeccionAsesor>
    {cliente && <SeccionAsesor titulo={`${t("asesor.historial")} · ${cliente.nombre}`}>
      <p className="text-xs text-muted-foreground">{t("asesor.historialVinculado")}</p>
      <FormularioOperacion key={cliente.id} titulo={t("asesor.editarContacto")} ocupado={ocupado} alEnviar={(valores) => ejecutar(() => actualizarContactoCliente(cliente.id, valores))}>
        <div className="grid gap-3 sm:grid-cols-2"><CampoAsesor etiqueta={t("col.correo")} name="correo" type="email" spellCheck={false} autoComplete="email" defaultValue={cliente.correo} required /><CampoAsesor etiqueta={t("col.tel")} name="telefono" type="tel" autoComplete="tel" defaultValue={cliente.telefono} required /></div>
      </FormularioOperacion>
      <TablaAsesor columnas={[t("col.reserva"), t("col.paquete"), t("col.estado"), t("col.accion")]} filas={reservas.map((reserva) => [reserva.codigo, reserva.paquete, <EstadoAsesor key="estado" estado={reserva.estado} />, <Button key="detalle" variant="outline" onClick={() => alReserva(reserva)}>{t("asesor.verDetalle")}</Button>])} />
      <h3 className="font-semibold">{t("nav.pagos")}</h3><TablaAsesor columnas={[t("asesor.recibo"), t("col.reserva"), t("asesor.valor"), t("col.fecha")]} filas={pagos.map((pago) => [pago.recibo, pago.reserva, mostrarDinero(pago.valor), pago.fecha])} />
    </SeccionAsesor>}
    <SeccionAsesor titulo={t("asesor.nuevoCliente")}><FormularioOperacion ocupado={ocupado} alEnviar={(valores) => ejecutar(() => registrarCliente(valores))}>
      <div className="grid gap-3 sm:grid-cols-2"><CampoAsesor etiqueta={t("col.nombre")} name="nombre" minLength={2} maxLength={200} autoComplete="name" required /><CampoAsesor etiqueta={t("col.doc")} name="documento" minLength={3} maxLength={40} required /><CampoAsesor etiqueta={t("col.correo")} name="correo" type="email" spellCheck={false} autoComplete="email" required /><CampoAsesor etiqueta={t("col.tel")} name="telefono" type="tel" autoComplete="tel" required /></div>
      <p className="text-xs text-muted-foreground">{t("asesor.documentoUnico")}</p>
    </FormularioOperacion></SeccionAsesor>
  </div>;
}
