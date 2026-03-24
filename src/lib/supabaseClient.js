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

export function mapPlanRow(p) {
  if (!p) return null;
  return {
    ...p,
    desc: p.desc ?? p.descripcion ?? '',
    order: p.order ?? p.orden ?? 0,
    _id: p.id,
  };
}
