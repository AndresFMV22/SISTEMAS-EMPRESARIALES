import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Panel, CabeceraTabla, EtiquetaEstado } from "@/components/administrador/ElementosTabla";
import DialogoPago from "@/components/administrador/DialogoPago";
import { useIdioma } from "@/lib/i18n.jsx";

export default function ReservasAdministrador({ reservas, alPagar, obtenerSaldo, accion, esGestionada, alGestionar }) {
  const { t } = useIdioma();
  return <Panel titulo={t("nav.reservas")} etiqueta={accion}>
    <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
      <CabeceraTabla>{t("col.reserva")}</CabeceraTabla><CabeceraTabla>{t("col.cliente")}</CabeceraTabla><CabeceraTabla>{t("col.paquete")}</CabeceraTabla><CabeceraTabla>{t("col.pax")}</CabeceraTabla>
      <CabeceraTabla>{t("col.fecha")}</CabeceraTabla><CabeceraTabla>{t("col.asesor")}</CabeceraTabla><CabeceraTabla>{t("col.estado")}</CabeceraTabla><CabeceraTabla>{t("col.accion")}</CabeceraTabla>
    </TableRow></TableHeader><TableBody>
      {reservas.map((reserva) => <TableRow key={reserva[0]} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
        <TableCell className="font-medium text-foreground">{reserva[0]}</TableCell><TableCell>{reserva[1]}</TableCell><TableCell>{reserva[2]}</TableCell><TableCell>{reserva[3]}</TableCell><TableCell>{reserva[4]}</TableCell><TableCell>{reserva[5]}</TableCell>
        <TableCell><EtiquetaEstado tono={reserva[6]}>{reserva[7]}</EtiquetaEstado></TableCell>
        <TableCell>{esGestionada(reserva) ? <Button size="sm" variant="outline" onClick={alGestionar}>{t("asesor.gestion")}</Button> : reserva[7] === "Pagada"
          ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-4 w-4" />{t("st.paid")}</span>
          : <DialogoPago codigo={reserva[0]} informacion={obtenerSaldo(reserva[0])} alPagar={alPagar} />}</TableCell>
      </TableRow>)}
    </TableBody></Table>
  </Panel>;
}
