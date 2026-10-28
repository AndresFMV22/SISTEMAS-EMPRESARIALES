import IndicadorEstado from "@/components/compartidos/IndicadorEstado";
import { TableHead } from "@/components/ui/table";

export function EtiquetaEstado({ tono, estado, children }) {
  return <IndicadorEstado estado={estado ?? (typeof children === "string" ? children : undefined)} etiqueta={children} tono={tono} />;
}

export function Panel({ titulo, etiqueta, children, className = "" }) {
  return <div className={`rounded-2xl p-5 border border-border/70 bg-card/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(2,32,90,0.06)] ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-[15px] font-semibold text-foreground">{titulo}</h3>
      {etiqueta && <div className="text-[11px] font-medium text-blue-600">{etiqueta}</div>}
    </div>
    {children}
  </div>;
}

export function CabeceraTabla({ children }) {
  return <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">{children}</TableHead>;
}
