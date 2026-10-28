import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";
import { useIdioma } from "@/lib/i18n.jsx";
import { leerDinero, mostrarDinero } from "@/lib/dinero";

// Comprobante interno de solo lectura, imprimible con el diálogo del navegador.
// No simula validación DIAN ni recalcula ventas: usa los datos pactados y guardados.
export default function ComprobanteInterno({ factura, reserva, pagos = [], paquete, anulado = false, alCerrar }) {
  const { t } = useIdioma();
  const meta = reserva && typeof reserva[8] === "object" ? reserva[8] : null;
  const pax = reserva?.[3] ?? null;
  const total = meta?.total != null ? meta.total : leerDinero(factura[4]);
  const descuento = Number(meta?.descuento || 0);
  const precioPersona = meta?.precio_persona != null ? meta.precio_persona : null;
  const subtotal = precioPersona != null && pax != null ? precioPersona * pax : total + descuento;
  const pagado = pagos.reduce((suma, pago) => suma + leerDinero(pago[4]), 0);
  const saldo = Math.max(total - pagado, 0);

  const resumen = [
    [t("col.cliente"), factura[1]],
    [t("col.doc"), factura[2]],
    [t("col.reserva"), factura[3] || "—"],
    [t("col.paquete"), reserva?.[2] || "—"],
    [t("col.asesor"), reserva?.[5] || "—"],
    [t("col.pax"), pax ?? "—"],
    [t("pkg.salida"), reserva?.[4] || "—"],
    [t("pkg.regreso"), paquete?.regreso || "—"],
  ];

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) alCerrar(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t("comp.titulo")} · {factura[0]}</DialogTitle></DialogHeader>

        <div className="comprobante-imprimible space-y-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-foreground">NóvaTravel</p>
              <p className="text-xs text-muted-foreground">{t("comp.titulo")} · {factura[0]}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{t("comp.emitido")}: {factura[5] || "—"}</p>
              <p className="mt-1"><IndicadorEstado estado={factura[7]} etiqueta={factura[7]} tono={factura[6]} /></p>
              <p className="mt-1"><IndicadorEstado estado={anulado ? "anulada" : "vigente"} etiqueta={anulado ? t("fac.anulado") : t("fac.vigente")} /></p>
            </div>
          </div>

          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{t("fac.aviso")}</p>
          {anulado && <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{t("fac.anuladoNota")}</p>}
          {anulado && pagado > 0 && <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{t("fac.devolucionNota")}</p>}
          {!reserva && <p className="text-xs text-muted-foreground">{t("comp.sinReserva")}</p>}

          <dl className="grid grid-cols-2 gap-3">
            {resumen.map(([clave, valor]) => (
              <div key={clave}>
                <dt className="text-muted-foreground">{clave}</dt>
                <dd className="break-words font-semibold">{valor}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-1 rounded-xl border border-border p-3">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("comp.subtotal")}</span><b className="tabular-nums">{mostrarDinero(subtotal)}</b></div>
            {descuento > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t("comp.descuento")}</span><b className="tabular-nums text-rose-600">- {mostrarDinero(descuento)}</b></div>}
            <div className="flex justify-between border-t border-border pt-1"><span className="font-medium">{t("comp.total")}</span><b className="tabular-nums">{mostrarDinero(total)}</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("pay.paid")}</span><b className="tabular-nums text-emerald-600">{mostrarDinero(pagado)}</b></div>
            <div className="flex justify-between"><span className="font-medium">{t("pay.saldo")}</span><b className="tabular-nums text-blue-600">{mostrarDinero(saldo)}</b></div>
          </div>

          {pagos.length > 0 && (
            <div>
              <p className="mb-1 font-semibold">{t("pay.paid")}</p>
              <table className="w-full text-xs">
                <tbody>
                  {pagos.map((pago, indice) => (
                    <tr key={indice} className="border-t border-border">
                      <td className="py-1">{pago[0]}</td>
                      <td>{pago[3]}</td>
                      <td className="text-right tabular-nums">{mostrarDinero(pago[4])}</td>
                      <td className="text-right text-muted-foreground">{pago[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="no-imprimir">
          <Button onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />{t("comp.imprimir")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
