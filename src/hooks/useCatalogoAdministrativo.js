import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerCatalogoAdministrativo } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase";

export default function useCatalogoAdministrativo({ validarAcceso, alActualizar, datosDemo }) {
  const [datos, cambiarDatos] = useState(null);
  const [cargando, cambiarCargando] = useState(supabaseConfigurado);
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");
  const vigente = useRef(false);
  const bloqueo = useRef(false);
  const lectura = useRef(null);
  const requiereRevision = useRef(false);
  const callbacks = useRef({ validarAcceso, alActualizar });
  useEffect(() => { callbacks.current = { validarAcceso, alActualizar }; }, [validarAcceso, alActualizar]);
  const recargar = useCallback(async () => {
    if (!supabaseConfigurado) return;
    if (!lectura.current) {
      cambiarCargando(true);
      lectura.current = obtenerCatalogoAdministrativo().then((resultado) => { if (vigente.current) cambiarDatos(resultado); })
        .finally(() => { lectura.current = null; if (vigente.current) cambiarCargando(false); });
    }
    return lectura.current;
  }, []);
  useEffect(() => {
    vigente.current = true;
    void recargar().catch((fallo) => { if (vigente.current) cambiarError(fallo.message); });
    return () => { vigente.current = false; };
  }, [recargar]);
  const ejecutar = async (operacion) => {
    if (bloqueo.current) return false;
    bloqueo.current = true; cambiarOcupado(true); cambiarError("");
    try {
      if (supabaseConfigurado) await callbacks.current.validarAcceso();
      if (lectura.current) await lectura.current;
      if (supabaseConfigurado && requiereRevision.current) { await recargar(); await callbacks.current.alActualizar(); requiereRevision.current = false; }
      if (!vigente.current) return false;
      await operacion();
      requiereRevision.current = true;
      if (supabaseConfigurado) { await recargar(); await callbacks.current.alActualizar(); }
      requiereRevision.current = false;
      return true;
    } catch (fallo) {
      requiereRevision.current = true;
      if (supabaseConfigurado) { try { await recargar(); await callbacks.current.alActualizar(); requiereRevision.current = false; } catch { /* Error visible; no se simula éxito. */ } }
      if (vigente.current) cambiarError(fallo.message);
      throw fallo;
    } finally { bloqueo.current = false; if (vigente.current) cambiarOcupado(false); }
  };
  return { datos: supabaseConfigurado ? datos : datosDemo, cargando, ocupado, error, ejecutar, recargar: async () => {
    cambiarError(""); try { await callbacks.current.validarAcceso(); await recargar(); } catch (fallo) { if (vigente.current) cambiarError(fallo.message); }
  } };
}
