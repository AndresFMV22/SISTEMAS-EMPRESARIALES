import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Panel, CabeceraTabla, EtiquetaEstado } from "@/components/administrador/ElementosTabla";
import IndicadorEstado from "@/components/compartidos/IndicadorEstado";
import ComprobanteInterno from "@/components/compartidos/ComprobanteInterno";
import { useIdioma } from "@/lib/i18n.jsx";
import { mostrarDinero } from "@/lib/dinero";

const campo = "mt-1 block h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring";

export default function FacturasAdministrador({ filas, datos, accion }) {
  const { t } = useIdioma();
  const [comprobante, setComprobante] = useState(null);
  const [vigencia, setVigencia] = useState("vigentes");
  const reservas = datos?.reservas || [];
  const pagos = datos?.pagos || [];
  const paquetes = datos?.paquetes || [];

  // Documento interno anulado cuando su reserva queda Cancelada (misma fuente de verdad) o ya viene marcado así.
  const esAnulado = (factura) => reservas.find((fila) => fila[0] === factura[3])?.[7] === "Cancelada" || /anulad/i.test(factura[7]);

  const abrir = (factura) => {
    const reserva = reservas.find((fila) => fila[0] === factura[3]) || null;
    const pagosReserva = pagos.filter((fila) => fila[1] === factura[3]);
    const paquete = reserva ? paquetes.find((fila) => fila.nombre === reserva[2]) : null;
    setComprobante({ factura, reserva, pagos: pagosReserva, paquete, anulado: esAnulado(factura) });
  };

  const visibles = filas.filter((factura) => vigencia === "todos" || (vigencia === "anulados") === esAnulado(factura));

  return (
    <Panel titulo={t("nav.facturas")} etiqueta={accion}>
      <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{t("fac.aviso")}</p>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card/60 p-3">
        <label className="text-xs text-muted-foreground">{t("fac.vigencia")}<select value={vigencia} onChange={(e) => setVigencia(e.target.value)} className={campo}>
          <option value="vigentes">{t("fac.vigentes")}</option><option value="anulados">{t("fac.anulados")}</option><option value="todos">{t("rep.todos")}</option>
        </select></label>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <CabeceraTabla>{t("fac.documento")}</CabeceraTabla>
            <CabeceraTabla>{t("col.cliente")}</CabeceraTabla>
            <CabeceraTabla>{t("col.doc")}</CabeceraTabla>
            <CabeceraTabla>{t("col.reserva")}</CabeceraTabla>
            <CabeceraTabla>{t("fac.valor")}</CabeceraTabla>
            <CabeceraTabla>{t("col.fecha")}</CabeceraTabla>
            <CabeceraTabla>{t("col.estado")}</CabeceraTabla>
            <CabeceraTabla>{t("fac.vigencia")}</CabeceraTabla>
            <CabeceraTabla>{t("col.accion")}</CabeceraTabla>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.map((fila, indice) => {
            const anulado = esAnulado(fila);
            return (
            <TableRow key={indice} className={`border-border hover:bg-sky-50 dark:hover:bg-sky-400/10 ${anulado ? "opacity-70" : ""}`}>
              <TableCell className="font-medium text-foreground">{fila[0]}</TableCell>
              <TableCell>{fila[1]}</TableCell>
              <TableCell>{fila[2]}</TableCell>
              <TableCell>{fila[3]}</TableCell>
              <TableCell>{mostrarDinero(fila[4])}</TableCell>
              <TableCell>{fila[5]}</TableCell>
              <TableCell><EtiquetaEstado estado={fila[7]} tono={fila[6]}>{fila[7]}</EtiquetaEstado></TableCell>
              <TableCell><IndicadorEstado estado={anulado ? "anulada" : "vigente"} etiqueta={anulado ? t("fac.anulado") : t("fac.vigente")} /></TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => abrir(fila)}
                  className="h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-sky-500/30 dark:text-sky-300 dark:hover:bg-blue-400/15">
                  <Printer className="h-3.5 w-3.5" />{t("fac.ver")}
                </Button>
              </TableCell>
            </TableRow>
            );
          })}
          {visibles.length === 0 && <TableRow><TableCell colSpan={9} className="py-6 text-center text-muted-foreground">{t("flt.sinResultados")}</TableCell></TableRow>}
        </TableBody>
      </Table>

      {comprobante && <ComprobanteInterno {...comprobante} alCerrar={() => setComprobante(null)} />}
    </Panel>
  );
}
