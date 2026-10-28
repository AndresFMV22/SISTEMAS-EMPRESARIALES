import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase, supabaseConfigurado } from "@/lib/supabase";
import { gestionarAcceso, listarAccesos } from "@/lib/autenticacion";
import { useIdioma } from "@/lib/i18n.jsx";

// Solo se monta dentro del panel autorizado del administrador. Los códigos
// heredados sirven para presentar filas; nunca se envían como empleado_id.
export default function GestionAccesosEmpleados({ empleados, validarAcceso, children }) {
  const { t } = useIdioma();
  const [registros, cambiarRegistros] = useState([]);
  const [accesos, cambiarAccesos] = useState([]);
  const [cargando, cambiarCargando] = useState(supabaseConfigurado);
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  const [seleccion, cambiarSeleccion] = useState(null);
  const bloqueo = useRef(false);
  const vigente = useRef(false);
  const secuencia = useRef(0);
  const cargar = useCallback(async () => {
    const turno = ++secuencia.current;
    cambiarCargando(true);
    try {
      const [respuesta, lista] = await Promise.all([
        supabase.from("empleados").select("id,codigo,nombre,correo,activo").order("id"),
        listarAccesos(),
      ]);
      if (respuesta.error) throw new Error("No se pudo consultar el personal.");
      if (vigente.current && turno === secuencia.current) {
        cambiarRegistros(respuesta.data || []);
        cambiarAccesos(lista || []);
      }
    } finally { if (vigente.current && turno === secuencia.current) cambiarCargando(false); }
  }, []);

  useEffect(() => {
    vigente.current = true;
    let cancelado = false;
    const contadorSecuencia = secuencia;
    if (supabaseConfigurado) queueMicrotask(() => {
      if (!cancelado) void cargar().catch((fallo) => { if (!cancelado) cambiarError(fallo.message); });
    });
    return () => { cancelado = true; vigente.current = false; contadorSecuencia.current++; };
  }, [cargar, empleados]);

  const actualizar = async () => {
    cambiarError("");
    try { await validarAcceso(); await cargar(); }
    catch (fallo) { cambiarError(fallo.message); }
  };
  const ejecutar = async () => {
    if (bloqueo.current || !seleccion) return;
    bloqueo.current = true; cambiarOcupado(true); cambiarError(""); cambiarMensaje("");
    try {
      await validarAcceso();
      const resultado = await gestionarAcceso({ accion: seleccion.accion, empleado_id: seleccion.empleado.id, correo: seleccion.accion === "suspender" ? null : seleccion.empleado.correo });
      if (!resultado?.estado_acceso) throw new Error(t("acceso.respuestaInvalida"));
      cambiarMensaje(t(resultado.correo_enviado ? "acceso.envioAceptado" : "acceso.actualizado"));
      cambiarSeleccion(null);
    } catch (fallo) { cambiarError(fallo.message); }
    finally {
      // También refresca tras fallos parciales de provisión o de correo.
      try { await cargar(); } catch (fallo) { cambiarError((anterior) => [anterior, fallo.message].filter(Boolean).join(" ")); }
      bloqueo.current = false; cambiarOcupado(false);
    }
  };

  const mostrarAcceso = (fila) => {
    if (!supabaseConfigurado) return <span className="text-xs text-muted-foreground">{t("acceso.soloReal")}</span>;
    if (cargando) return <span className="text-xs">{t("acceso.esperar")}</span>;
    if (error && registros.length === 0) return <span>—</span>;
    const empleado = registros.find((registro) => registro.codigo === fila[0]);
    const acceso = empleado && accesos.find((registro) => String(registro.empleado_id) === String(empleado.id));
    if (!empleado) return <span className="text-xs">{t("acceso.refrescar")}</span>;
    const estado = acceso?.estado_acceso || "sinAcceso";
    const esAsesor = !acceso || acceso.rol === "asesor";
    const acciones = !acceso ? ["invitar", "suspender"] : estado === "suspendido" ? ["reactivar"] : ["reenviar", "suspender", ...(acceso.id ? ["recuperar"] : [])];
    return <div className="min-w-40 space-y-2">
      <IndicadorEstado estado={estado} etiqueta={t(`acceso.${estado}`)} />
      {esAsesor ? <div className="flex flex-wrap gap-1">{acciones.map((accion) => <Button key={accion} size="sm" variant="outline" disabled={ocupado || cargando || !!error || (accion !== "suspender" && (!empleado.activo || !fila[5] || !empleado.correo)) || (typeof empleado.id === "number" && !Number.isSafeInteger(empleado.id))} onClick={() => { cambiarError(""); cambiarMensaje(""); cambiarSeleccion({ accion, empleado }); }}>{t(`acceso.${accion}`)}</Button>)}</div> : <p className="text-xs text-muted-foreground">{t("acceso.administradorExterno")}</p>}
    </div>;
  };

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/80 p-3">
      <p className="text-xs text-muted-foreground">{t(supabaseConfigurado ? "acceso.altaExplicita" : "acceso.soloReal")}</p>
      {supabaseConfigurado && <Button size="sm" variant="outline" disabled={ocupado || cargando} onClick={actualizar}>{t("acceso.refrescar")}</Button>}
    </div>
    {error && <p role="alert" className="rounded-xl border border-rose-300 p-3 text-sm text-rose-600">{error} {t("acceso.preparacion")}</p>}
    {mensaje && <p role="status" className="text-sm text-emerald-600">{mensaje}</p>}
    {children(mostrarAcceso)}
    <Dialog open={!!seleccion} onOpenChange={(abierto) => { if (!abierto && !ocupado) cambiarSeleccion(null); }}>
      <DialogContent showCloseButton={!ocupado}>
        <DialogHeader><DialogTitle>{seleccion && t(`acceso.${seleccion.accion}`)}</DialogTitle><DialogDescription>{t("acceso.confirmarOperacion")}</DialogDescription></DialogHeader>
        <p className="break-words text-sm">{seleccion?.empleado.nombre}<br />{seleccion?.empleado.correo}</p>
        <p className="text-xs text-muted-foreground">{t("acceso.sinContrasenaAdmin")}</p>
        {error && <p role="alert" className="text-sm text-rose-600">{error} {t("acceso.preparacion")}</p>}
        <DialogFooter><Button variant="outline" disabled={ocupado} onClick={() => cambiarSeleccion(null)}>{t("btn.cancel")}</Button><Button disabled={ocupado} onClick={ejecutar}>{t(ocupado ? "acceso.esperar" : "acceso.confirmarAccion")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
