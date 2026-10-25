import { establecerContrasena } from "@/lib/autenticacion";
import { useIdioma } from "@/lib/i18n.jsx";
import { CampoAsesor, FormularioOperacion, SeccionAsesor } from "@/components/compartidos/FormulariosReserva";

export default function CuentaAsesor({ perfil, ocupado, ejecutar }) {
  const { t } = useIdioma();
  return <SeccionAsesor titulo={t("asesor.cuenta")}>
    <p className="break-words font-semibold">{perfil.nombre}</p><p className="break-words text-sm text-muted-foreground">{perfil.correo}</p>
    <FormularioOperacion titulo={t("acceso.contrasena")} ocupado={ocupado} alEnviar={(valores) => {
      if (valores.contrasena !== valores.confirmacion) throw new Error(t("acceso.noCoinciden"));
      return ejecutar(() => establecerContrasena(valores.contrasena));
    }}><CampoAsesor etiqueta={t("login.pass")} name="contrasena" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /><CampoAsesor etiqueta={t("acceso.confirmar")} name="confirmacion" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /><p className="text-xs text-muted-foreground">{t("acceso.minimo")}</p></FormularioOperacion>
  </SeccionAsesor>;
}
