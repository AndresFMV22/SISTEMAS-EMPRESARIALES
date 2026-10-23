import { createClient } from "npm:@supabase/supabase-js@2.117.1";

const url = Deno.env.get("SUPABASE_URL")!;
const clavePublica = Deno.env.get("SUPABASE_ANON_KEY")!;
const clavePrivada = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const redireccion = Deno.env.get("AUTH_REDIRECT_URL")!;
const origenes = (Deno.env.get("AUTH_ALLOWED_ORIGINS") || "").split(",").map((valor) => valor.trim()).filter(Boolean);
// Misma versión de API que usa auth-js; asegura códigos de error estructurados.
const cabecerasAuth = { apikey: clavePublica, "X-Supabase-Api-Version": "2024-01-01" };

Deno.serve(async (peticion: Request) => {
  const origen = peticion.headers.get("Origin");
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json", "Vary": "Origin", "Cache-Control": "no-store",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (origen && origenes.includes(origen)) cabeceras["Access-Control-Allow-Origin"] = origen;
  const responder = (datos: unknown, estado = 200) => new Response(JSON.stringify(datos), { status: estado, headers: cabeceras });
  if (origen && !origenes.includes(origen)) return responder({ message: "Origen no autorizado." }, 403);
  if (peticion.method === "OPTIONS") return new Response(null, { status: 204, headers: cabeceras });
  if (peticion.method !== "POST") return responder({ message: "Método no permitido." }, 405);
  try {
    const autorizacion = peticion.headers.get("Authorization") || "";
    if (!autorizacion.startsWith("Bearer ")) return responder({ message: "Debes iniciar sesión." }, 401);
    const opciones = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
    const clienteUsuario = createClient(url, clavePublica, { ...opciones, global: { headers: { Authorization: autorizacion } } });
    const { data: identidad, error: errorIdentidad } = await clienteUsuario.auth.getUser(autorizacion.slice(7));
    if (errorIdentidad || !identidad.user || identidad.user.is_anonymous) return responder({ message: "La sesión no es válida." }, 401);
    if (Number(peticion.headers.get("Content-Length") || 0) > 8192) return responder({ message: "Solicitud demasiado grande." }, 413);
    const texto = await peticion.text();
    if (texto.length > 8192) return responder({ message: "Solicitud demasiado grande." }, 413);
    let datos;
    try { datos = JSON.parse(texto); } catch { return responder({ message: "Solicitud no válida." }, 400); }
    if (!datos || typeof datos !== "object") return responder({ message: "Solicitud no válida." }, 400);
    const { accion, empleado_id, correo, contrasena } = datos;
    const clientePrivado = createClient(url, clavePrivada, opciones);

    if (accion === "establecer_contrasena") {
      if (typeof contrasena !== "string" || contrasena.length < 12 || contrasena.length > 1024) return responder({ message: "La contraseña debe tener entre 12 y 1024 caracteres." }, 400);
      // Comprueba el perfil antes de tocar Auth, incluyendo invitaciones pendientes.
      const { data: perfil, error: errorPerfil } = await clienteUsuario.from("perfiles").select("id,estado_acceso").eq("id", identidad.user.id).maybeSingle();
      if (errorPerfil || !perfil || perfil.estado_acceso === "suspendido") return responder({ message: "No existe una invitación habilitada para esta cuenta." }, 403);
      // El cliente de Edge no almacena sesión/refresh token. Usa el endpoint Auth
      // con el JWT real (no admin.updateUserById, que omitiría las garantías Auth).
      const cambio = await fetch(`${url}/auth/v1/user`, {
        method: "PUT", headers: { ...cabecerasAuth, Authorization: autorizacion, "Content-Type": "application/json" },
        body: JSON.stringify({ password: contrasena }),
      });
      if (!cambio.ok) {
        const fallo = await cambio.json().catch(() => null);
        if (cambio.status !== 422 || fallo?.code !== "same_password") {
          return responder({ message: "No se pudo establecer la contraseña. Comprueba su seguridad o solicita otro enlace." }, 400);
        }
        // same_password NO es prueba suficiente por sí solo. Verifica la
        // contraseña en Auth con clave pública y la identidad obtenida de getUser,
        // nunca con un correo/ID aportado en el cuerpo de la solicitud.
        if (!identidad.user.email) return responder({ message: "No se pudo verificar la identidad de la cuenta." }, 403);
        const comprobacion = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: "POST", headers: { ...cabecerasAuth, "Content-Type": "application/json" },
          body: JSON.stringify({ email: identidad.user.email, password: contrasena }),
        });
        const verificacion = await comprobacion.json().catch(() => null);
        const tokenTemporal = verificacion?.access_token;
        const identidadCoincide = comprobacion.ok && typeof tokenTemporal === "string" && tokenTemporal.length > 0
          && verificacion?.user?.id === identidad.user.id && verificacion.user.is_anonymous === false
          && verificacion.user.email?.toLowerCase() === identidad.user.email.toLowerCase();
        // No persiste ni devuelve la sesión usada para comprobar la contraseña.
        // Revoca solo esa sesión temporal: nunca cierra las sesiones del usuario.
        if (typeof tokenTemporal === "string" && tokenTemporal.length > 0) {
          const cierre = await fetch(`${url}/auth/v1/logout?scope=local`, {
            method: "POST", headers: { ...cabecerasAuth, Authorization: `Bearer ${tokenTemporal}` },
          });
          if (!cierre.ok) return responder({ message: "No se pudo completar la verificación segura. Inténtalo más tarde." }, 503);
        }
        if (!identidadCoincide) return responder({ message: "No se pudo verificar la contraseña y la identidad de la cuenta." }, 403);
      }
      const activacion = await clientePrivado.rpc("activar_acceso", { usuario: identidad.user.id });
      if (activacion.error) return responder({ message: "Contraseña guardada, pero acceso no activado. Comprueba el estado del empleado con el administrador y reintenta." }, 409);
      return responder(activacion.data);
    }

    const { data: perfilAdministrador, error: errorAdministrador } = await clienteUsuario.rpc("obtener_perfil");
    if (errorAdministrador || perfilAdministrador?.rol !== "administrador") return responder({ message: "Se requiere un administrador activo." }, 403);
    if (!["invitar", "reenviar", "suspender", "reactivar", "recuperar"].includes(accion)
      || !/^[1-9]\d{0,18}$/.test(String(empleado_id)) || BigInt(empleado_id) > 9223372036854775807n
      || (typeof empleado_id === "number" && !Number.isSafeInteger(empleado_id))
      || (accion !== "suspender" && correo !== undefined && correo !== null && typeof correo !== "string")) {
      return responder({ message: "Acción, empleado o correo no válidos." }, 400);
    }
    // Nunca acepta un redirect aportado por el solicitante.
    let destino: URL | null = null;
    if (!["suspender", "reactivar"].includes(accion)) {
      destino = new URL(redireccion);
      if (destino.protocol !== "https:" && !(destino.protocol === "http:" && ["localhost", "127.0.0.1"].includes(destino.hostname))) throw new Error("Configuración de redirección inválida");
      destino.searchParams.set("flujo", "contrasena");
    }
    const { data: preparacion, error: errorPreparacion } = await clientePrivado.rpc("preparar_acceso", {
      administrador: identidad.user.id, empleado: empleado_id, correo_solicitado: accion === "suspender" ? null : correo || null, accion,
    });
    if (errorPreparacion) return responder({ message: errorPreparacion.code === "23505"
      ? "Ese correo ya está reservado para otro empleado."
      : ["P0001", "42501"].includes(errorPreparacion.code) ? errorPreparacion.message : "No se pudo preparar el acceso. Revisa la configuración del servicio." }, 409);
    if (["suspender", "reactivar"].includes(accion)) return responder(preparacion);

    let usuario = preparacion.usuario_id;
    let invitacionEnviada = false;
    if (!usuario) {
      const invitacion = await clientePrivado.auth.admin.inviteUserByEmail(preparacion.correo, { redirectTo: destino!.href });
      if (invitacion.error || !invitacion.data.user) {
        // Auth puede haber creado la cuenta antes de fallar el envío/respuesta.
        // No se borra nada: el próximo intento busca de nuevo por correo en BD.
        return responder({ message: "No se pudo completar la invitación. Reintenta en dos minutos; se reconciliará cualquier cuenta creada." }, 409);
      }
      usuario = invitacion.data.user.id;
      invitacionEnviada = true;
    }
    const confirmacion = await clientePrivado.rpc("confirmar_acceso", {
      administrador: identidad.user.id, empleado: empleado_id, token_operacion: preparacion.token, usuario,
    });
    if (confirmacion.error) return responder({ message: "Cuenta creada o existente, pero vinculación pendiente. Reintenta en dos minutos; no elimines la cuenta." }, 409);
    if (!invitacionEnviada) {
      // También sirve para cuentas ya existentes o invitaciones cuyo envío falló.
      const envio = await clientePrivado.auth.resetPasswordForEmail(preparacion.correo, { redirectTo: destino!.href });
      if (envio.error) return responder({ message: "La cuenta quedó vinculada, pero el correo no pudo enviarse. Reintenta con reenviar después de un minuto." }, 409);
    }
    return responder({ ...confirmacion.data, correo_enviado: true });
  } catch {
    // No registra JWT, contraseñas, enlaces de acceso ni claves privilegiadas.
    return responder({ message: "No se pudo procesar la solicitud. Revisa la configuración del servicio." }, 500);
  }
});
