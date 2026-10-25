import { Badge } from "@/components/ui/badge";
import { TableHead } from "@/components/ui/table";

const estilosEstado = {
  ok: "bg-emerald-500/12 text-emerald-600 border-emerald-500/25",
  warn: "bg-amber-500/12 text-amber-600 border-amber-500/25",
  bad: "bg-rose-500/12 text-rose-600 border-rose-500/25",
  info: "bg-sky-500/12 text-sky-600 border-sky-500/25",
};

export function EtiquetaEstado({ tono, children }) {
  return <Badge variant="outline" className={`rounded-full font-semibold ${estilosEstado[tono] || estilosEstado.info}`}>
    {(tono === "ok" || tono === "bad") && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
    {children}
  </Badge>;
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
