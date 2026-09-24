import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si no hay credenciales, la app corre con datos de demostración (fallback).
export const isSupabaseReady = Boolean(url && key);
export const supabase = isSupabaseReady ? createClient(url, key) : null;
