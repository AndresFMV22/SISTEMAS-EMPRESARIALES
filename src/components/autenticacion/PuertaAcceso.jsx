import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIdioma } from "@/lib/i18n.jsx";
import { supabase, supabaseConfigurado } from "@/lib/supabase";
import { obtenerSesion, escucharSesion, obtenerPerfil, iniciarSesion, cerrarSesion, solicitarRecuperacion, establecerContrasena } from "@/lib/autenticacion";

function tieneFlujoContrasena() {
  return new URLSearchParams(window.location.search).get("flujo") === "contrasena";
}

function tieneErrorEnlace() {
  const direccion = new URL(window.location.href);
  const fragmento = new URLSearchParams(direccion.hash.slice(1));
  return [direccion.searchParams, fragmento].some((parametros) => ["error", "error_code", "error_description"].some((clave) => parametros.has(clave)));
}

// Captura solo la presencia del error, antes de que Auth pueda limpiar la URL.
// Nunca se conserva ni muestra el texto libre del callback ni sus tokens.
const ERROR_ENLACE_INICIAL = tieneErrorEnlace();

async function consultarIdentidadContrasena(sesion) {
  if (!sesion) throw new Error("acceso.cuentaCambio");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email || data.user.is_anonymous || data.user.id !== sesion.user.id) throw new Error("acceso.identidadNoVerificada");
  return { id: data.user.id, correo: data.user.email };
}

function retirarFlujo() {
  const direccion = new URL(window.location.href);
  direccion.searchParams.delete("flujo");
  ["error", "error_code", "error_description"].forEach((clave) => direccion.searchParams.delete(clave));
  direccion.hash = "";
  window.history.replaceState(null, "", direccion);
}

export default function PuertaAcceso({ panelAdministrador: PanelAdministrador, panelAsesor: PanelAsesor, propiedadesPanel, controles }) {
  const { t } = useIdioma();
  const [demo, cambiarDemo] = useState(false);
  const [estado, cambiarEstado] = useState({ cargando: supabaseConfigurado, sesion: null, perfil: null, error: "" });
  const [flujoContrasena, cambiarFlujo] = useState(() => tieneFlujoContrasena() || ERROR_ENLACE_INICIAL);
  const [errorEnlace, cambiarErrorEnlace] = useState(ERROR_ENLACE_INICIAL);
  const flujoActual = useRef(flujoContrasena);
  const revision = useRef(0);
  const enValidacion = useRef(null);
  const [saliendo, cambiarSaliendo] = useState(false);

  const validarSesion = useCallback(async (sesion) => {
    const turno = ++revision.current;
    if (!sesion) {
      cambiarEstado({ cargando: false, sesion: null, perfil: null, error: "" });
      return null;
    }
    if (flujoActual.current) {
      try {
        const identidadContrasena = await consultarIdentidadContrasena(sesion);
        if (turno === revision.current) cambiarEstado({ cargando: false, sesion, identidadContrasena, perfil: null, error: "" });
      } catch (fallo) {
        if (turno === revision.current) cambiarEstado({ cargando: false, sesion, perfil: null, error: fallo.message });
      }
      return null;
    }
    try {
      const perfil = await obtenerPerfil();
      if (perfil.id !== sesion.user.id || !perfil.activo || perfil.estado_acceso !== "activo" || !["administrador", "asesor"].includes(perfil.rol)) throw new Error("Acceso no autorizado.");
      if (turno !== revision.current) return null;
      cambiarEstado({ cargando: false, sesion, perfil, error: "" });
      return perfil;
    } catch (fallo) {
      if (turno === revision.current) cambiarEstado({ cargando: false, sesion, perfil: null, error: fallo.message });
      throw fallo;
    }
  }, []);

  const revalidar = useCallback(() => {
    if (!enValidacion.current) {
      const turno = ++revision.current;
      enValidacion.current = obtenerSesion().then((sesion) => {
        if (turno !== revision.current) return null;
        return validarSesion(sesion);
      }, (fallo) => {
        // Solo trata el error de obtenerSesion. validarSesion ya protege su
        // propia revisión: no repetir aquí la escritura de un error de perfil.
        if (turno === revision.current) cambiarEstado((anterior) => ({ ...anterior, cargando: false, perfil: null, error: fallo.message }));
        throw fallo;
      }).finally(() => { enValidacion.current = null; });
    }
    return enValidacion.current;
  }, [validarSesion]);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    let vigente = true;
    const contadorRevision = revision;
    const cancelar = escucharSesion((sesion, evento) => {
      if (!vigente) return;
      if (evento === "PASSWORD_RECOVERY") {
        flujoActual.current = true;
        cambiarFlujo(true);
        const direccion = new URL(window.location.href);
        direccion.searchParams.set("flujo", "contrasena");
        window.history.replaceState(null, "", direccion);
      }
      void validarSesion(sesion).catch(() => {});
    });
    const alEnfocar = () => { if (!flujoActual.current) void revalidar().catch(() => {}); };
    window.addEventListener("focus", alEnfocar);
    return () => { vigente = false; contadorRevision.current++; cancelar(); window.removeEventListener("focus", alEnfocar); };
  }, [revalidar, validarSesion]);

  const salir = async () => {
    if (saliendo) return;
    cambiarSaliendo(true);
    try {
      if (supabaseConfigurado) await cerrarSesion();
      revision.current++;
      flujoActual.current = false;
      cambiarFlujo(false);
      cambiarErrorEnlace(false);
      retirarFlujo();
      cambiarDemo(false);
      cambiarEstado({ cargando: false, sesion: null, perfil: null, error: "" });
    } catch (fallo) {
      cambiarEstado((anterior) => ({ ...anterior, perfil: null, error: fallo.message }));
    } finally { cambiarSaliendo(false); }
  };

  if (!supabaseConfigurado && demo) return <PanelAdministrador {...propiedadesPanel} perfil={{ nombre: t("acceso.demo"), rol: "administrador" }} alSalir={salir} validarAcceso={async () => {}} />;
  if (estado.perfil?.rol === "administrador" && !flujoContrasena) return <PanelAdministrador key={estado.perfil.id} {...propiedadesPanel} perfil={estado.perfil} alSalir={salir} validarAcceso={async () => {
    const perfil = await revalidar();
    if (perfil?.rol !== "administrador") throw new Error(t("acceso.bloqueado"));
  }} />;
  if (estado.perfil?.rol === "asesor" && !flujoContrasena) return <PanelAsesor key={estado.perfil.id} {...propiedadesPanel} perfil={estado.perfil} alSalir={salir} validarAcceso={async () => {
    const perfil = await revalidar();
    if (perfil?.rol !== "asesor" || perfil.id !== estado.perfil.id) throw new Error(t("acceso.bloqueado"));
  }} />;

  return <><div className="absolute right-4 top-4 z-20">{controles}</div><main className="relative z-10 flex min-h-screen items-center justify-center px-5 pb-32 pt-24">
    <section className="w-full max-w-[440px] space-y-5 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl backdrop-blur-xl sm:p-9">
      <div className="flex items-center justify-center gap-3"><img src={`${import.meta.env.BASE_URL}logo-mark.png`} alt="" width="48" height="48" className="rounded-xl bg-white p-1" /><span className="text-2xl font-bold">Nóva<span className="text-blue-600 dark:text-sky-300">Travel</span></span></div>
      {estado.cargando ? <p role="status">{t("acceso.validando")}</p>
        : !supabaseConfigurado ? <><h1 className="text-xl font-semibold">{t("acceso.demo")}</h1><p className="text-sm text-muted-foreground">{t("acceso.demoAviso")}</p><Button className="w-full" onClick={() => cambiarDemo(true)}>{t("acceso.abrirDemo")}</Button></>
        : errorEnlace ? <><p role="alert" className="text-sm text-amber-600">{t("acceso.errorEnlace")}</p>{estado.identidadContrasena && <p className="break-words text-sm">{t("acceso.sesionActual")} <strong>{estado.identidadContrasena.correo}</strong></p>}<FormularioAcceso key="enlace-invalido" modo="recuperar" soloRecuperacion alCompletar={revalidar} /></>
        : flujoContrasena && estado.sesion && !estado.identidadContrasena ? estado.error ? <FormularioAcceso modo="recuperar" soloRecuperacion alCompletar={revalidar} /> : <p role="status">{t("acceso.validando")}</p>
        : flujoContrasena && estado.sesion && estado.identidadContrasena ? <FormularioAcceso key={estado.identidadContrasena.id} modo="contrasena" identidad={estado.identidadContrasena} verificarCuenta={async () => {
          const identidad = await consultarIdentidadContrasena(await obtenerSesion());
          if (identidad.id !== estado.identidadContrasena.id || identidad.correo !== estado.identidadContrasena.correo) throw new Error("acceso.cuentaCambio");
        }} alCompletar={async () => {
          flujoActual.current = false;
          cambiarFlujo(false);
          retirarFlujo();
          await revalidar();
        }} />
        : estado.perfil?.rol === "asesor" ? <><h1 className="text-xl font-semibold">{t("acceso.bienvenida")}, {estado.perfil.nombre}</h1><p className="break-words text-sm">{estado.perfil.correo}</p><p className="text-sm text-muted-foreground">{t("acceso.cuentaAsesor")}</p></>
        : estado.sesion ? <><h1 className="text-xl font-semibold">{t("acceso.bloqueado")}</h1><p className="text-sm text-muted-foreground">{t("acceso.preparacion")}</p><Button variant="outline" onClick={() => void revalidar().catch(() => {})}>{t("acceso.reintentar")}</Button></>
        : <>{flujoContrasena && <p role="alert" className="text-sm text-amber-600">{t("acceso.enlaceVencido")}</p>}<FormularioAcceso modo={flujoContrasena ? "recuperar" : "ingresar"} alCompletar={revalidar} /></>}
      {estado.error && <p role="alert" className="text-sm text-rose-600">{t(estado.error)}</p>}
      {estado.sesion && <Button disabled={saliendo} variant="outline" className="w-full" onClick={salir}>{t(saliendo ? "acceso.esperar" : "tb.logout")}</Button>}
    </section>
  </main></>;
}

function FormularioAcceso({ modo: modoInicial, alCompletar, identidad, verificarCuenta, soloRecuperacion = false }) {
  const { t } = useIdioma();
  const [modo, cambiarModo] = useState(modoInicial);
  const [ocupado, cambiarOcupado] = useState(false);
  const [error, cambiarError] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  const [errorOperacion, cambiarErrorOperacion] = useState(false);
  const bloqueo = useRef(false);
  const enviar = async (evento) => {
    evento.preventDefault();
    if (bloqueo.current) return;
    const valores = new FormData(evento.currentTarget);
    cambiarErrorOperacion(false);
    if (modo === "contrasena" && valores.get("contrasena") !== valores.get("confirmacion")) { cambiarError(t("acceso.noCoinciden")); evento.currentTarget.elements.confirmacion.focus(); return; }
    bloqueo.current = true;
    cambiarOcupado(true); cambiarError(""); cambiarMensaje("");
    try {
      if (modo === "recuperar") {
        await solicitarRecuperacion(valores.get("correo"));
        cambiarMensaje(t("acceso.correoSolicitado"));
      } else {
        if (modo === "contrasena") {
          await verificarCuenta();
          await establecerContrasena(valores.get("contrasena"));
        }
        else await iniciarSesion(valores.get("correo"), valores.get("contrasena"));
        await alCompletar();
      }
    } catch (fallo) { cambiarError(fallo.message); cambiarErrorOperacion(true); }
    finally { bloqueo.current = false; cambiarOcupado(false); }
  };
  return <form onSubmit={enviar} className="space-y-4" aria-busy={ocupado}>
    <h1 className="text-xl font-semibold">{t(`acceso.${modo}`)}</h1>
    {modo === "contrasena" && <div className="space-y-2 rounded-xl border border-border p-3 text-sm"><p>{t("acceso.cuentaDestino")}</p><p className="break-words font-semibold">{identidad.correo}</p><p className="text-xs text-muted-foreground">{t("acceso.avisoIdentidad")}</p></div>}
    <fieldset disabled={ocupado} className="space-y-4">
      {modo !== "contrasena" && <div className="space-y-2"><Label htmlFor="correo-acceso">{t("col.correo")}</Label><Input id="correo-acceso" name="correo" type="email" autoComplete="username" spellCheck={false} required /></div>}
      {modo !== "recuperar" && <div className="space-y-2"><Label htmlFor="contrasena-acceso">{t("login.pass")}</Label><Input id="contrasena-acceso" name="contrasena" type="password" autoComplete={modo === "contrasena" ? "new-password" : "current-password"} minLength={modo === "contrasena" ? 12 : undefined} maxLength={1024} required />{modo === "contrasena" && <p className="text-xs text-muted-foreground">{t("acceso.minimo")}</p>}</div>}
      {modo === "contrasena" && <div className="space-y-2"><Label htmlFor="confirmacion-acceso">{t("acceso.confirmar")}</Label><Input id="confirmacion-acceso" name="confirmacion" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required /></div>}
      {modo === "contrasena" && <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="cuentaConfirmada" required className="mt-1 accent-blue-600" /><span>{t("acceso.confirmarCuenta")}</span></label>}
      <Button type="submit" className="w-full bg-gradient-to-br from-sky-500 to-blue-600 text-white">{t(ocupado ? "acceso.esperar" : modo === "ingresar" ? "login.enter" : modo === "recuperar" ? "acceso.enviar" : "btn.save")}</Button>
      {modo !== "contrasena" && !soloRecuperacion && <Button type="button" variant="ghost" className="w-full" onClick={() => { cambiarModo(modo === "ingresar" ? "recuperar" : "ingresar"); cambiarError(""); cambiarMensaje(""); }}>{t(modo === "ingresar" ? "acceso.olvido" : "acceso.volver")}</Button>}
    </fieldset>
    {error && <p role="alert" className="text-sm text-rose-600">{t(error)}{modo === "contrasena" && errorOperacion && <span className="block">{t("acceso.preparacion")}</span>}</p>}
    {mensaje && <p role="status" className="text-sm text-emerald-600">{mensaje}</p>}
  </form>;
}
