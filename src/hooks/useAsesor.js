import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerDatosAsesor, obtenerGestionReservas } from "@/lib/asesor";

// Una lectura en curso compartida por montaje (también durante StrictMode).
export default function useAsesor({ gestion = false, validarAcceso, alActualizar }) {
  const [datos, cambiarDatos] = useState(null);
  const [cargando, cambiarCargando] = useState(true);
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  const lectura = useRef(null);
  const bloqueo = useRef(false);
  const requiereRevision = useRef(false);
  const vigente = useRef(false);
  const validar = useRef(validarAcceso);
  const notificarActualizacion = useRef(alActualizar);
  useEffect(() => { validar.current = validarAcceso; }, [validarAcceso]);
  useEffect(() => { notificarActualizacion.current = alActualizar; }, [alActualizar]);
  const refrescar = useCallback(async () => {
    if (!lectura.current) {
      cambiarCargando(true);
      lectura.current = (gestion ? obtenerGestionReservas() : obtenerDatosAsesor())
        .then((resultado) => {
          if (!vigente.current) return resultado;
          cambiarDatos(resultado);
          return resultado;
        })
        // Intentar también la lectura del padre si la RPC de gestión falla:
        // una mutación puede haberse guardado antes del fallo de lectura.
        .finally(async () => { if (vigente.current) await notificarActualizacion.current?.(); })
        .then((resultado) => { requiereRevision.current = false; return resultado; })
        .catch((fallo) => { requiereRevision.current = true; throw fallo; })
        .finally(() => { lectura.current = null; if (vigente.current) cambiarCargando(false); });
    }
    return lectura.current;
  }, [gestion]);
  useEffect(() => {
    vigente.current = true;
    void refrescar().catch((fallo) => { if (vigente.current) cambiarError(fallo.message); });
    const enfocar = async () => {
      if (bloqueo.current) return;
      try { await validar.current(); await refrescar(); }
      catch (fallo) { if (vigente.current) cambiarError(fallo.message); }
    };
    window.addEventListener("focus", enfocar);
    return () => { vigente.current = false; window.removeEventListener("focus", enfocar); };
  }, [refrescar]);
  const ejecutar = async (operacion) => {
    if (bloqueo.current) return false;
    bloqueo.current = true; cambiarOcupado(true); cambiarError(""); cambiarMensaje("");
    try {
      await validar.current();
      if (lectura.current) await lectura.current;
      if (requiereRevision.current) await refrescar();
      if (!vigente.current) return false;
      await operacion();
      requiereRevision.current = true;
      await refrescar();
      if (vigente.current) cambiarMensaje("asesor.guardado");
      return true;
    } catch (fallo) {
      // Un fallo de transporte puede ocultar una escritura confirmada por BD.
      // Reconciliar antes de habilitar otro intento; nunca fabricar filas.
      requiereRevision.current = true;
      try { await refrescar(); } catch { /* Bloquea nuevas escrituras hasta reconciliar. */ }
      if (vigente.current) cambiarError(fallo.message);
      throw fallo;
    } finally {
      bloqueo.current = false;
      if (vigente.current) cambiarOcupado(false);
    }
  };
  const recargar = async () => {
    cambiarError(""); cambiarMensaje("");
    try { await validar.current(); await refrescar(); }
    catch (fallo) { if (vigente.current) cambiarError(fallo.message); }
  };
  return { datos, cargando, ocupado, error, mensaje, ejecutar, refrescar: recargar };
}
