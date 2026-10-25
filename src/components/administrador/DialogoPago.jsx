import { useEffect, useState } from "react";
import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import CampoDinero from "@/components/compartidos/CampoDinero";
import { leerDinero, mostrarDinero } from "@/lib/dinero";
import { useIdioma } from "@/lib/i18n.jsx";

export default function DialogoPago({ codigo, informacion, alPagar }) {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");
  const [guardando, cambiarGuardando] = useState(false);
  useEffect(() => { if (abierto) { setMonto(String(informacion.saldo)); setError(""); } }, [abierto, informacion.saldo]);
  const enviar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;
    const numero = leerDinero(monto);
    if (numero <= 0) { setError(t("pay.min")); return; }
    if (numero > informacion.saldo) { setError(t("pay.over")); return; }
    cambiarGuardando(true); setError("");
    try { await alPagar(codigo, numero); setAbierto(false); }
    catch (fallo) { setError(fallo.message); }
    finally { cambiarGuardando(false); }
  };
  return <Dialog open={abierto} onOpenChange={(valor) => { if (!guardando) setAbierto(valor); }}>
    <DialogTrigger render={<Button size="sm" variant="outline" className="h-7 gap-1 border-blue-200 dark:border-sky-500/30 text-blue-700 dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-blue-400/15" />}><CreditCard className="h-3.5 w-3.5" />{t("btn.pay")}</DialogTrigger>
    <DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>{t("pay.title")} · {codigo}</DialogTitle></DialogHeader>
      <div className="space-y-1.5 rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">{t("pay.total")}</span><b className="text-foreground">{mostrarDinero(informacion.total)}</b></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("pay.paid")}</span><b className="text-emerald-600">{mostrarDinero(informacion.pagado)}</b></div>
        <div className="flex justify-between border-t border-border pt-1.5"><span className="font-medium text-foreground">{t("pay.saldo")}</span><b className="text-blue-600">{mostrarDinero(informacion.saldo)}</b></div>
      </div>
      {informacion.saldo <= 0 ? <p className="flex items-center justify-center gap-1 py-3 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" />{t("pay.done")}</p>
        : <form onSubmit={enviar} className="mt-3 space-y-3">
          <div className="space-y-1.5"><Label htmlFor="amount">{t("pay.amount")}</Label><CampoDinero id="amount" valor={monto} alCambiar={setMonto} placeholder="$ 0" /><p className="text-[11px] text-muted-foreground">{t("pay.maxHint")} {mostrarDinero(informacion.saldo)}</p></div>
          {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-2"><DialogClose disabled={guardando} render={<Button type="button" variant="outline" />}>{t("btn.cancel")}</DialogClose><Button type="submit" disabled={guardando} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t(guardando ? "acceso.esperar" : "btn.pay")}</Button></DialogFooter>
        </form>}
    </DialogContent>
  </Dialog>;
}
