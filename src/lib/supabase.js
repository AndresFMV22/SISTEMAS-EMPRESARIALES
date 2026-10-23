import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si no hay credenciales, la app corre con datos de demostración (fallback).
export const supabaseConfigurado = Boolean(url && clave);
export const supabase = supabaseConfigurado ? createClient(url, clave) : null;
