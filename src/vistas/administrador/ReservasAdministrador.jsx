import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Panel, CabeceraTabla } from "@/components/administrador/ElementosTabla";
import DialogoPago from "@/components/administrador/DialogoPago";
import { useIdioma } from "@/lib/i18n.jsx";
import { EstadoAsesor } from "@/components/compartidos/FormulariosReserva";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";

export default function ReservasAdministrador({ reservas, alPagar, obtenerSaldo, accion, esGestionada, alGestionar }) {
  const { t } = useIdioma();
  return <Panel titulo={t("nav.reservas")} etiqueta={accion}>
    <Table><TableHeader><TableRow className="border-border hover:bg-transparent">
      <CabeceraTabla>{t("col.reserva")}</CabeceraTabla><CabeceraTabla>{t("col.cliente")}</CabeceraTabla><CabeceraTabla>{t("col.paquete")}</CabeceraTabla><CabeceraTabla>{t("col.pax")}</CabeceraTabla>
      <CabeceraTabla>{t("col.fecha")}</CabeceraTabla><CabeceraTabla>{t("col.asesor")}</CabeceraTabla><CabeceraTabla>{t("fases.estadoReserva")}</CabeceraTabla><CabeceraTabla>{t("fases.estadoPago")}</CabeceraTabla><CabeceraTabla>{t("col.accion")}</CabeceraTabla>
    </TableRow></TableHeader><TableBody>
      {reservas.map((reserva) => <TableRow key={reserva[0]} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
        <TableCell className="font-medium text-foreground">{reserva[0]}</TableCell><TableCell>{reserva[1]}</TableCell><TableCell>{reserva[2]}</TableCell><TableCell>{reserva[3]}</TableCell><TableCell>{reserva[4]}</TableCell><TableCell>{reserva[5]}</TableCell>
        <TableCell>{["Pagada", "Pago parcial", "En proceso"].includes(reserva[7]) && !esGestionada(reserva)
          ? <div className="flex flex-wrap gap-1"><IndicadorEstado estado="historico" etiqueta={t("fases.historico")} /><EstadoAsesor estado={reserva[7]} /></div>
          : <EstadoAsesor estado={reserva[7]} tipo="reserva" />}</TableCell>
        <TableCell><EstadoAsesor estado={reserva[8]?.estado_pago || (obtenerSaldo(reserva[0]).pagado > 0 ? obtenerSaldo(reserva[0]).saldo === 0 ? "Pagado" : "Pago parcial" : "Pendiente")} tipo="pago" /></TableCell>
        <TableCell><div className="flex flex-wrap gap-2">{esGestionada(reserva) && <Button size="sm" variant="outline" onClick={alGestionar}>{t("asesor.gestion")}</Button>}{["Cancelada", "Finalizada"].includes(reserva[7]) ? null : obtenerSaldo(reserva[0]).saldo <= 0
          ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-4 w-4" />{t("st.paid")}</span>
          : <DialogoPago codigo={reserva[0]} informacion={obtenerSaldo(reserva[0])} alPagar={alPagar} />}</div></TableCell>
      </TableRow>)}
    </TableBody></Table>
  </Panel>;
}
