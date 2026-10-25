import { useState } from "react";
import { Shield, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIdioma } from "@/lib/i18n.jsx";

const POLITICAS = {
  privacy: [
    "En NóvaTravel tratamos tus datos personales conforme a la Ley 1581 de 2012 (Colombia) y su Decreto reglamentario 1377 de 2013.",
    "Recopilamos únicamente los datos necesarios para gestionar reservas, pagos y facturación: nombre, documento, contacto y detalles del viaje.",
    "No compartimos tu información con terceros salvo los proveedores necesarios para prestar el servicio (aerolíneas, hoteles y operadores).",
    "Puedes ejercer tus derechos de acceso, rectificación, actualización o supresión escribiendo a privacidad@novatravel.com.",
    "(Texto de ejemplo — reemplazar por la política legal definitiva de la empresa.)",
  ],
  cookies: [
    "Este sitio usa cookies propias y de terceros para recordar tus preferencias (como idioma y tema) y mejorar tu experiencia.",
    "Las cookies esenciales son necesarias para el funcionamiento del sistema; las no esenciales solo se usan si las aceptas.",
    "Puedes aceptar o rechazar las cookies no esenciales desde el aviso inferior, y cambiar tu decisión borrando los datos del navegador.",
    "(Texto de ejemplo — reemplazar por la política de cookies definitiva de la empresa.)",
  ],
};

function DialogoPolitica({ icono: Icono, titulo, parrafos }) {
  return <Dialog>
    <DialogTrigger render={<button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-blue-600" />}><Icono className="h-3.5 w-3.5" />{titulo}</DialogTrigger>
    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
      <div className="space-y-3 text-sm text-muted-foreground">{parrafos.map((parrafo, indice) => <p key={indice}>{parrafo}</p>)}</div>
    </DialogContent>
  </Dialog>;
}

export function AvisoCookies() {
  const { t } = useIdioma();
  const [show, setShow] = useState(() => { try { return !localStorage.getItem("nt_cookies"); } catch { return true; } });
  if (!show) return null;
  const choose = (v) => { try { localStorage.setItem("nt_cookies", v); } catch { /* noop */ } setShow(false); };
  return <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row">
    <Cookie className="h-6 w-6 shrink-0 text-blue-600" /><p className="flex-1 text-center text-xs text-muted-foreground sm:text-left">{t("cookie.msg")}</p>
    <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => choose("rejected")}>{t("cookie.reject")}</Button><Button size="sm" onClick={() => choose("accepted")} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t("cookie.accept")}</Button></div>
  </div>;
}

export function PiePagina() {
  const { t } = useIdioma();
  return <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
    <span>© 2026 NóvaTravel</span><DialogoPolitica icono={Shield} titulo={t("pol.privacy")} parrafos={POLITICAS.privacy} /><DialogoPolitica icono={Cookie} titulo={t("pol.cookies")} parrafos={POLITICAS.cookies} />
  </footer>;
}
