import { createBrowserClient } from '@supabase/ssr';

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.warn('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }
  return createBrowserClient(url, anon);
}

export function mapPlanRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    prefijo: row.prefijo,
    precio: row.precio,
    entrega: row.entrega,
    desc: row.descripcion,
    items: row.items,
    order: row.orden,
    destacado: row.destacado,
  };
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
