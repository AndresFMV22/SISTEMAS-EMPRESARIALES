import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Panel, CabeceraTabla, EtiquetaEstado } from "./ElementosTabla";

export default function TablaRegistros({ titulo, columnas, filas, accion }) {
  return <Panel titulo={titulo} etiqueta={accion}>
    <Table><TableHeader><TableRow className="border-border hover:bg-transparent">{columnas.map((columna) => <CabeceraTabla key={columna}>{columna}</CabeceraTabla>)}</TableRow></TableHeader>
      <TableBody>{filas.map((fila, indiceFila) => <TableRow key={indiceFila} className="border-border hover:bg-sky-50 dark:hover:bg-sky-400/10">
        {fila.map((celda, indiceCelda) => celda && typeof celda === "object"
          ? <TableCell key={indiceCelda}><EtiquetaEstado tono={celda.tono}>{celda.texto}</EtiquetaEstado></TableCell>
          : <TableCell key={indiceCelda} className={indiceCelda === 0 ? "font-medium text-foreground" : ""}>{celda}</TableCell>)}
      </TableRow>)}</TableBody>
    </Table>
  </Panel>;
}
