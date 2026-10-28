import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormularioReserva from "@/components/compartidos/FormularioReserva";
import useAsesor from "@/hooks/useAsesor";
import { useIdioma } from "@/lib/i18n.jsx";

function ContenidoCrear({ validarAcceso, alActualizar, alCerrar, alCambiarOcupado }) {
  const { t } = useIdioma();
  const { datos, cargando, ocupado, error, ejecutar, refrescar } = useAsesor({ gestion: true, validarAcceso, alActualizar });
  useEffect(() => { alCambiarOcupado(ocupado); return () => alCambiarOcupado(false); }, [ocupado, alCambiarOcupado]);
  return <>
    {cargando && <p role="status">{t("acceso.validando")}</p>}
    {error && <div className="space-y-2"><p role="alert" className="text-sm text-rose-600">{error}</p><p className="text-xs text-muted-foreground">{t("asesor.revisarAntesReintentar")}</p>
      <Button variant="outline" disabled={ocupado || cargando} onClick={() => void refrescar()}>{t("asesor.actualizar")}</Button></div>}
    {datos && <FormularioReserva datos={datos} ocupado={ocupado || cargando} administracion ejecutar={async (operacion) => {
      const resultado = await ejecutar(operacion);
      if (resultado) alCerrar();
      return resultado;
    }} />}
  </>;
}

export default function CrearReservaAdministrador({ validarAcceso, alActualizar }) {
  const { t } = useIdioma();
  const [abierto, cambiarAbierto] = useState(false);
  const [ocupado, cambiarOcupado] = useState(false);
  return <Dialog open={abierto} onOpenChange={(valor) => { if (!ocupado) cambiarAbierto(valor); }}>
    <DialogTrigger render={<Button size="sm" className="h-8 gap-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white" />}><Plus className="h-3.5 w-3.5" />{t("asesor.nuevaReserva")}</DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{t("asesor.nuevaReserva")}</DialogTitle></DialogHeader>
      {abierto && <ContenidoCrear validarAcceso={validarAcceso} alActualizar={alActualizar} alCerrar={() => cambiarAbierto(false)} alCambiarOcupado={cambiarOcupado} />}
    </DialogContent>
  </Dialog>;
}
