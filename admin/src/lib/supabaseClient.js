import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getSupabase() {
  if (!url || !anon) {
    console.warn('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
    return null;
  }
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mapLeadFromRpc(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    plan: row.plan,
    mensaje: row.mensaje,
    estado: row.estado,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
