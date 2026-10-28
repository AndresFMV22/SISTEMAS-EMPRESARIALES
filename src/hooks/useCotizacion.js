import { useEffect, useRef, useState } from "react";

// Descarta respuestas anteriores al cambiar paquete, pasajeros u oferta. No reserva cupos.
export default function useCotizacion(clave, obtener) {
  const [revision, cambiarRevision] = useState(0);
  const turno = clave ? `${clave}:${revision}` : null;
  const peticion = useRef(obtener);
  useEffect(() => { peticion.current = obtener; }, [obtener]);
  const [estado, cambiarEstado] = useState({ clave: null, datos: null, error: "" });
  useEffect(() => {
    if (!turno) return;
    let vigente = true;
    const temporizador = window.setTimeout(() => {
      Promise.resolve().then(() => peticion.current()).then((datos) => { if (vigente) cambiarEstado({ clave: turno, datos, error: "" }); })
        .catch((fallo) => { if (vigente) cambiarEstado({ clave: turno, datos: null, error: fallo.message }); });
    }, 200);
    return () => { vigente = false; window.clearTimeout(temporizador); };
  }, [turno]);
  return { datos: turno && estado.clave === turno ? estado.datos : null, error: estado.clave === turno ? estado.error : "", cargando: !!turno && estado.clave !== turno,
    recotizar: () => cambiarRevision((anterior) => anterior + 1) };
}
