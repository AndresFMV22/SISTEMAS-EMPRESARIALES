import Cuadricula from "@/components/reactbits/Cuadricula";
import ChispasAlClic from "@/components/reactbits/ChispasAlClic";
import PuertaAcceso from "@/components/autenticacion/PuertaAcceso";
import ControlesSuperiores from "@/components/compartidos/ControlesSuperiores";
import { AvisoCookies } from "@/components/compartidos/Politicas";
import PanelAdministrador from "@/vistas/administrador/PanelAdministrador";
import PanelAsesor from "@/vistas/asesor/PanelAsesor";
import useTema from "@/hooks/useTema";

export default function Aplicacion() {
  const [oscuro, cambiarOscuro] = useTema();
  return <ChispasAlClic sparkColor="#2563eb" sparkCount={9} sparkRadius={18}>
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 text-foreground dark:from-[#070d20] dark:via-[#0a1226] dark:to-[#0b1430]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Cuadricula direction="diagonal" speed={0.4} squareSize={46}
          borderColor={oscuro ? "rgba(56,189,248,0.10)" : "rgba(37,99,235,0.10)"}
          hoverFillColor="rgba(56,189,248,0.10)" fadeColor={oscuro ? "#070d20" : "#eef4ff"} />
      </div>
      <div className="pointer-events-none fixed -right-24 -top-24 z-0 h-[420px] w-[420px] rounded-full bg-sky-300/25 blur-[90px] dark:bg-blue-600/20" />
      <div className="pointer-events-none fixed -bottom-32 -left-24 z-0 h-[380px] w-[380px] rounded-full bg-blue-300/20 blur-[90px] dark:bg-sky-500/15" />
      <PuertaAcceso panelAdministrador={PanelAdministrador} panelAsesor={PanelAsesor}
        propiedadesPanel={{ oscuro, cambiarOscuro, controles: <ControlesSuperiores oscuro={oscuro} cambiarOscuro={cambiarOscuro} /> }}
        controles={<ControlesSuperiores oscuro={oscuro} cambiarOscuro={cambiarOscuro} />} />
      <AvisoCookies />
    </div>
  </ChispasAlClic>;
}
