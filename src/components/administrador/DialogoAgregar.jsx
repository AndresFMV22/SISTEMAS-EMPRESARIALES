import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CampoDinero from "@/components/compartidos/CampoDinero";
import { hoy } from "./formularios";

export default function DialogoAgregar({ label: etiqueta, title: titulo, fields: campos, onSubmit: alEnviar, selects: opciones = {}, reservasRelacionadas = null }) {
  const vacio = Object.fromEntries(campos.map((campo) => [campo.key, ""]));
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiarCampo = (clave) => (evento) => setValores((anteriores) => ({ ...anteriores, [clave]: evento.target.value }));
  const elegirCampo = (clave, valor) => setValores((anteriores) => {
    const siguientes = { ...anteriores, [clave]: valor };
    if (reservasRelacionadas && clave === "reserva") {
      const reserva = reservasRelacionadas.find((fila) => fila[0] === valor);
      if (reserva) siguientes.cliente = reserva[1];
    }
    if (reservasRelacionadas && clave === "cliente" && anteriores.reserva
      && !reservasRelacionadas.some((fila) => fila[0] === anteriores.reserva && fila[1] === valor)) siguientes.reserva = "";
    return siguientes;
  });
  const opcionesDe = (campo) => campo.select === "reservas" && reservasRelacionadas
    ? reservasRelacionadas.filter((fila) => !valores.cliente || fila[1] === valores.cliente).map((fila) => fila[0])
    : Array.isArray(campo.select) ? campo.select : opciones[campo.select] || [];

  const enviar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;
    const primero = campos[0];
    if (primero && !String(valores[primero.key] || "").trim()) { setError(`${primero.label} es obligatorio.`); return; }
    const pasada = campos.find((campo) => campo.type === "date" && valores[campo.key] && valores[campo.key] < hoy());
    if (pasada) { setError("La fecha no puede ser anterior a hoy."); return; }
    setGuardando(true); setError("");
    try { await alEnviar(valores); setValores(vacio); setAbierto(false); }
    catch (fallo) { setError("No se pudo guardar: " + fallo.message); }
    finally { setGuardando(false); }
  };

  return <Dialog open={abierto} onOpenChange={(valor) => { if (!guardando) setAbierto(valor); }}>
    <DialogTrigger render={<Button size="sm" className="h-8 gap-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white" />}><Plus className="h-3.5 w-3.5" />{etiqueta}</DialogTrigger>
    <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
      <form onSubmit={enviar} className="space-y-3"><div className="grid grid-cols-2 gap-3">
        {campos.map((campo) => <div key={campo.key} className={`space-y-1.5 ${campo.half ? "" : "col-span-2"}`}>
          <Label htmlFor={campo.key}>{campo.label}</Label>
          {campo.select ? <Select value={valores[campo.key]} onValueChange={(valor) => elegirCampo(campo.key, valor)}>
            <SelectTrigger id={campo.key} className="w-full"><SelectValue placeholder={`Selecciona ${campo.label.toLowerCase()}`} /></SelectTrigger>
            <SelectContent className="max-h-64">{opcionesDe(campo).length === 0
              ? <div className="px-2 py-1.5 text-sm text-slate-400">Sin opciones</div>
              : opcionesDe(campo).map((opcion) => <SelectItem key={opcion} value={opcion}>{opcion}</SelectItem>)}</SelectContent>
          </Select> : campo.moneda ? <CampoDinero id={campo.key} valor={valores[campo.key]} alCambiar={(valor) => elegirCampo(campo.key, valor)} placeholder={campo.ph} />
            : <Input id={campo.key} type={campo.type || "text"} value={valores[campo.key]} onChange={cambiarCampo(campo.key)} placeholder={campo.ph || ""} min={campo.type === "date" ? hoy() : undefined} />}
        </div>)}
      </div>{error && <p className="text-sm text-rose-500">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose disabled={guardando} render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
          <Button type="submit" disabled={guardando} className="bg-gradient-to-br from-sky-500 to-blue-600 text-white">{guardando ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
