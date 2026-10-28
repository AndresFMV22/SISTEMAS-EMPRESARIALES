import { aparienciaEstado } from "@/lib/estados";

export default function IndicadorEstado({ estado, etiqueta, tono, grande = false }) {
  const apariencia = aparienciaEstado(estado, tono);
  return <span data-estado={estado || "desconocido"} data-color={apariencia.color}
    className={`inline-flex max-w-full items-center gap-1.5 rounded-full border font-semibold leading-5 ${grande ? "px-3 py-1.5 text-lg tracking-wide" : "px-2.5 py-1 text-xs"} ${apariencia.clases}`}>
    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
    <span className="break-words">{etiqueta ?? estado ?? "—"}</span>
  </span>;
}
