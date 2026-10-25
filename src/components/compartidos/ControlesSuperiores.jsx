import { Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useIdioma, IDIOMAS } from "@/lib/i18n.jsx";

export default function ControlesSuperiores({ oscuro, cambiarOscuro }) {
  const { t, idioma, cambiarIdioma } = useIdioma();
  return <div className="flex items-center gap-2">
    <Button variant="outline" size="icon" aria-label={oscuro ? t("theme.light") : t("theme.dark")} title={oscuro ? t("theme.light") : t("theme.dark")} onClick={() => cambiarOscuro((anterior) => !anterior)} className="border-border">
      {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
    <Select value={idioma} onValueChange={cambiarIdioma}>
      <SelectTrigger className="h-9 w-[140px] gap-1 border-border" title={t("lang.label")} aria-label={t("lang.label")}>
        <Languages className="h-4 w-4 shrink-0 text-blue-600" /><span className="truncate">{IDIOMAS.find((opcion) => opcion.code === idioma)?.label || idioma}</span>
      </SelectTrigger>
      <SelectContent>{IDIOMAS.map((opcion) => <SelectItem key={opcion.code} value={opcion.code}>{opcion.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}
