import { supabase, supabaseConfigurado } from "./supabase";

function exigirCliente() {
  if (!supabaseConfigurado || !supabase) throw new Error("La autenticación requiere Supabase configurado; el modo demostración no concede acceso real.");
  return supabase;
}

function comprobar(error, mensaje) {
  if (error) throw new Error(mensaje, { cause: error });
}

function obtenerRedireccion() {
  const direccion = import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}/`;
  const url = new URL(direccion);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("La URL de autenticación debe usar HTTPS, salvo en localhost.");
  }
  url.searchParams.set("flujo", "contrasena");
  return url.href;
}

// El cliente existente usa el flujo implícito y detecta automáticamente los tokens
// de invitación/recuperación en el fragmento URL. No se interpretan roles del JWT.
export async function obtenerSesion() {
  if (!supabaseConfigurado) return null;
  const { data, error } = await exigirCliente().auth.getSession();
  comprobar(error, "No se pudo consultar la sesión.");
  return data.session;
}

export function escucharSesion(callback) {
  let cancelado = false;
  if (!supabaseConfigurado) {
    queueMicrotask(() => { if (!cancelado) callback(null, "INITIAL_SESSION"); });
    return () => { cancelado = true; };
  }
  const { data } = exigirCliente().auth.onAuthStateChange((evento, sesion) => {
    // Evita bloquear el cerrojo de Auth si la UI consulta el perfil en el callback.
    queueMicrotask(() => { if (!cancelado) callback(sesion, evento); });
  });
  return () => { cancelado = true; data.subscription.unsubscribe(); };
}

export async function iniciarSesion(correo, contrasena) {
  const { data, error } = await exigirCliente().auth.signInWithPassword({ email: correo.trim(), password: contrasena });
  comprobar(error, "No se pudo iniciar sesión. Comprueba el correo y la contraseña.");
  return data.session;
}

export async function cerrarSesion() {
  const { error } = await exigirCliente().auth.signOut();
  comprobar(error, "No se pudo cerrar la sesión.");
}

export async function obtenerPerfil() {
  const { data, error } = await exigirCliente().rpc("obtener_perfil");
  comprobar(error, "Acceso no autorizado. Comprueba la activación de tu cuenta o consulta al administrador.");
  if (!data) throw new Error("Acceso no autorizado.");
  return data;
}

export async function solicitarRecuperacion(correo) {
  const { error } = await exigirCliente().auth.resetPasswordForEmail(correo.trim(), { redirectTo: obtenerRedireccion() });
  comprobar(error, "No se pudo solicitar la recuperación. Inténtalo más tarde.");
  // No confirma la existencia de una cuenta.
}

async function invocarAccesos(datos) {
  const { data, error } = await exigirCliente().functions.invoke("gestionar-accesos", { body: datos });
  if (error) {
    let mensaje = "No se pudo gestionar el acceso. Inténtalo de nuevo o consulta al administrador.";
    if (error.context instanceof Response) {
      const respuesta = await error.context.json().catch(() => null);
      if (respuesta?.message) mensaje = respuesta.message;
    }
    throw new Error(mensaje, { cause: error });
  }
  return data;
}

export async function establecerContrasena(contrasena) {
  if (typeof contrasena !== "string" || contrasena.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres.");
  return invocarAccesos({ accion: "establecer_contrasena", contrasena });
}

export async function listarAccesos() {
  const { data, error } = await exigirCliente().rpc("listar_accesos");
  comprobar(error, "Solo un administrador activo puede consultar los accesos.");
  return data;
}

export async function gestionarAcceso({ accion, empleado_id, correo }) {
  if (!["invitar", "reenviar", "suspender", "reactivar", "recuperar"].includes(accion)) throw new Error("Acción de acceso no válida.");
  return invocarAccesos({ accion, empleado_id, correo });
}
