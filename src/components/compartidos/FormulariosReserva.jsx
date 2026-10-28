/* eslint-disable react/only-export-components -- Utilidades pequeñas compartidas por la gestión de reservas. */
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";
import IndicadorEstado from "./IndicadorEstado";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const mismoId = (primero, segundo) => primero != null && segundo != null && String(primero) === String(segundo);
export const perteneceReserva = (fila, reserva) => fila.reserva_id != null ? mismoId(fila.reserva_id, reserva.id) : fila.reserva === reserva.codigo;
export function saldoReserva(reserva, datos) {
  const total = reserva.total ?? [...datos.facturas].reverse().find((fila) => perteneceReserva(fila, reserva))?.valor ?? null;
  const pagado = datos.pagos.filter((fila) => perteneceReserva(fila, reserva)).reduce((suma, fila) => suma + fila.valor, 0);
  return { total, pagado, saldo: total == null ? null : Math.max(0, total - pagado) };
}
export const dineroOpcional = (valor) => valor == null ? "—" : mostrarDinero(valor);

export function SeccionAsesor({ titulo, children }) {
  return <section className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-xl">{titulo && <h2 className="text-lg font-semibold">{titulo}</h2>}{children}</section>;
}

export function CampoAsesor({ etiqueta, opciones, multilinea = false, ...propiedades }) {
  const identificador = useId();
  return <div className="min-w-0 space-y-1.5"><label htmlFor={identificador} className="text-sm font-medium">{etiqueta}</label>
    {opciones ? <select id={identificador} {...propiedades} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring">{opciones.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}</select>
      : multilinea ? <textarea id={identificador} rows={3} maxLength={4000} {...propiedades} className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
        : <Input id={identificador} {...propiedades} />}
  </div>;
}

export function FormularioOperacion({ titulo, ocupado, alEnviar, etiqueta = "btn.save", deshabilitarEnvio = false, children }) {
  const { t } = useIdioma();
  const bloqueo = useRef(false);
  const aviso = useRef(null);
  const [error, cambiarError] = useState("");
  const enviar = async (evento) => {
    evento.preventDefault();
    if (bloqueo.current || ocupado || deshabilitarEnvio) return;
    const formulario = evento.currentTarget;
    bloqueo.current = true; cambiarError("");
    try { if (await alEnviar(Object.fromEntries(new FormData(formulario)))) formulario.reset(); }
    catch (fallo) { cambiarError(fallo.message); requestAnimationFrame(() => aviso.current?.focus()); }
    finally { bloqueo.current = false; }
  };
  return <form onSubmit={enviar} className="space-y-3" aria-busy={ocupado}>
    {titulo && <h3 className="font-semibold">{titulo}</h3>}
    <fieldset disabled={ocupado} className="space-y-3">{children}<Button type="submit" disabled={deshabilitarEnvio}>{t(ocupado ? "acceso.esperar" : etiqueta)}</Button></fieldset>
    {error && <p ref={aviso} tabIndex={-1} role="alert" className="text-sm text-rose-600 focus-visible:ring-2">{error}</p>}
  </form>;
}

export function TablaAsesor({ columnas, filas }) {
  const { t } = useIdioma();
  return <Table><TableHeader><TableRow>{columnas.map((columna) => <TableHead key={columna}>{columna}</TableHead>)}</TableRow></TableHeader><TableBody>
    {filas.map((fila, indice) => <TableRow key={indice}>{fila.map((celda, posicion) => <TableCell key={posicion} className="max-w-xs whitespace-normal break-words tabular-nums">{celda ?? "—"}</TableCell>)}</TableRow>)}
    {filas.length === 0 && <TableRow><TableCell colSpan={columnas.length} className="py-8 text-center text-muted-foreground">{t("acceso.sinRegistros")}</TableCell></TableRow>}
  </TableBody></Table>;
}

export function EstadoAsesor({ estado, tipo }) {
  const { t } = useIdioma();
  const etiqueta = estado === "Pendiente" && tipo === "reserva" ? t("fases.pendienteConfirmacion")
    : estado === "Pendiente" && tipo === "pago" ? t("fases.sinPago")
      : estado ? t(`asesor.estado.${estado}`) === `asesor.estado.${estado}` ? estado : t(`asesor.estado.${estado}`) : "—";
  return <IndicadorEstado estado={estado} etiqueta={etiqueta} />;
}
