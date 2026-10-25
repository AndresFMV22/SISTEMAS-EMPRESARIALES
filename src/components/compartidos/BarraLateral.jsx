// Composición inspirada en Sidebar de shadcn: cabecera y pie fijos,
// contenido central desplazable. El contenedor se mantiene unido a la ventana.
export function BarraLateral({ abierta, children }) {
  return <aside className={`fixed inset-y-0 left-0 z-30 flex h-dvh w-64 flex-col border-r border-border bg-sidebar p-4 backdrop-blur-xl transition-transform md:translate-x-0 ${abierta ? "translate-x-0" : "-translate-x-full"}`}>
    {children}
  </aside>;
}

export function CabeceraBarraLateral({ children }) {
  return <div className="mb-6 shrink-0">{children}</div>;
}

export function ContenidoBarraLateral({ etiqueta, children }) {
  return <nav aria-label={etiqueta} className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-4">{children}</nav>;
}

export function PieBarraLateral({ children }) {
  return <div className="shrink-0 space-y-3 border-t border-border pt-3 pb-[env(safe-area-inset-bottom)]">{children}</div>;
}
