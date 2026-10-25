import { Input } from "@/components/ui/input";
import { formatearEntradaDinero } from "@/lib/dinero";

export default function CampoDinero({ valor, alCambiar, ...propiedades }) {
  const cambiar = (evento) => {
    const entrada = evento.target;
    const posicion = entrada.selectionStart ?? entrada.value.length;
    const digitosAnteriores = entrada.value.slice(0, posicion).replace(/\D/g, "").length;
    const nuevoValor = formatearEntradaDinero(entrada.value);
    alCambiar(nuevoValor);
    // Mantener el lugar de edición aunque aparezcan nuevos separadores de miles.
    requestAnimationFrame(() => {
      if (document.activeElement !== entrada) return;
      let cursor = nuevoValor ? 2 : 0;
      let encontrados = 0;
      while (cursor < nuevoValor.length && encontrados < digitosAnteriores) {
        if (/\d/.test(nuevoValor[cursor])) encontrados++;
        cursor++;
      }
      entrada.setSelectionRange(cursor, cursor);
    });
  };
  return <Input {...propiedades} type="text" inputMode="numeric" value={formatearEntradaDinero(valor)} onChange={cambiar} />;
}
