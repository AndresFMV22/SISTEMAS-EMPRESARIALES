import { useEffect, useState } from "react";
import { fechaColombia } from "./paquetes";

// Actualiza el catálogo sin recargar al cambiar de día o volver a la pestaña.
export function useFechaColombia() {
  const [fecha, cambiarFecha] = useState(fechaColombia);
  useEffect(() => {
    const actualizar = () => cambiarFecha(fechaColombia());
    const intervalo = window.setInterval(actualizar, 30000);
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, []);
  return fecha;
}
