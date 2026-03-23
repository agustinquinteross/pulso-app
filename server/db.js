import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import Lead from './models/Lead.js';
import Plan from './models/Plan.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

let supabase = null;
if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapLeadRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
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

function mapPlanRow(row) {
  if (!row) return null;
  let items = row.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) items = [];
  return {
    _id: row.id,
    nombre: row.nombre,
    prefijo: row.prefijo ?? '',
    precio: row.precio,
    entrega: row.entrega ?? '',
    desc: row.descripcion ?? '',
    items,
    order: row.orden ?? 0,
    destacado: Boolean(row.destacado),
  };
}

function planToSupabaseInsert(p, indexFallback) {
  const items = Array.isArray(p.items) ? p.items : [];
  return {
    nombre: p.nombre,
    prefijo: p.prefijo ?? '',
    precio: String(p.precio ?? ''),
    entrega: p.entrega ?? '',
    descripcion: p.desc ?? p.descripcion ?? '',
    items,
    orden: typeof p.order === 'number' ? p.order : indexFallback,
    destacado: Boolean(p.destacado),
  };
}

export async function initDB() {
  if (useSupabase) {
    const { error } = await supabase.from('plans').select('id').limit(1);
    if (error) {
      console.error('❌ Error conectando a Supabase:', error.message);
      return;
    }
    console.log('✅ Base de datos: Supabase (Postgres)');
    return;
  }

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI no está definido en el archivo .env');
    console.log('💡 Tip: Configurá SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, o MongoDB.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión exitosa a MongoDB');

    const count = await Plan.countDocuments();
    if (count === 0) {
      const allInitialPlans = [
        {
          nombre: 'Básico',
          prefijo: 'USD',
          precio: '350',
          entrega: '2–3 semanas',
          desc: 'Para emprendedores y marcas que necesitan su primera presencia digital profesional.',
          items: [
            'Sitio web de hasta 5 secciones',
            'Diseño 100% a medida (no plantillas)',
            'Formulario de contacto funcional',
            'Optimización SEO On-page básica',
            'Carga optimizada (PageSpeed +90)',
            'Dominio + hosting primer año incluido',
            '1 ronda de revisiones post-entrega',
          ],
          order: 1,
        },
        {
          nombre: 'Pro',
          prefijo: 'USD',
          precio: '1.800',
          entrega: '6–8 semanas',
          desc: 'Para negocios que necesitan una plataforma web completa con lógica de negocio propia.',
          items: [
            'Todo lo del plan Básico',
            'Aplicación web full-stack (React + Node)',
            'Base de datos + autenticación segura',
            'Panel de administración propio',
            'Integración con MercadoPago / Stripe',
            'API REST documentada',
            'Deploy en cloud (AWS / Vercel)',
            'Soporte técnico prioritario por 60 días',
          ],
          destacado: true,
          order: 2,
        },
        {
          nombre: 'Premium',
          prefijo: 'Desde USD',
          precio: '4.000',
          entrega: 'A definir',
          desc: 'Para proyectos complejos que requieren arquitectura robusta, escalabilidad y equipo dedicado.',
          items: [
            'Todo lo del plan Pro',
            'E-commerce con catálogo avanzado',
            'Integraciones con ERP / CRM externos',
            'Arquitectura cloud escalable (multi-región)',
            'Equipo dedicado (tech lead + diseñador)',
            'Panel analytics personalizado',
            'SLA garantizado + monitoreo 24/7',
            'Mantenimiento y roadmap post-entrega',
          ],
          order: 3,
        },
        {
          nombre: 'A definir',
          prefijo: '',
          precio: 'CONSULTAR',
          entrega: 'Variable',
          desc: 'Proyectos a medida con requerimientos específicos.',
          items: ['Análisis de requerimientos', 'Presupuesto personalizado'],
          order: 4,
        },
      ];
      await Plan.insertMany(allInitialPlans);
      console.log('📊 Planes iniciales insertados en MongoDB');
    }
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
  }
}

// ─── Leads ─────────────────────────────────────────────────

export async function leadsListPage({ estado, page, limit }) {
  const skip = (page - 1) * limit;
  const query = estado ? { estado } : {};

  if (!useSupabase) {
    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(query),
    ]);
    return { leads, total };
  }

  let q = supabase.from('leads').select('*', { count: 'exact' });
  if (estado) q = q.eq('estado', estado);
  const { data, error, count } = await q
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) throw error;
  return { leads: (data || []).map(mapLeadRow), total: count ?? 0 };
}

export async function leadFindById(id) {
  if (!useSupabase) {
    return Lead.findOne({ _id: id }).lean();
  }
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapLeadRow(data);
}

export async function leadCreate(payload) {
  if (!useSupabase) {
    const doc = await Lead.create(payload);
    return doc.toObject();
  }
  const row = {
    nombre: payload.nombre,
    email: payload.email,
    telefono: payload.telefono ?? null,
    plan: payload.plan ?? null,
    mensaje: payload.mensaje ?? null,
    estado: payload.estado ?? 'Nuevo',
  };
  const { data, error } = await supabase.from('leads').insert(row).select('*').single();
  if (error) throw error;
  return mapLeadRow(data);
}

export async function leadUpdateEstado(id, estado) {
  if (!useSupabase) {
    return Lead.updateOne({ _id: id }, { $set: { estado } });
  }
  const { data, error } = await supabase.from('leads').update({ estado }).eq('id', id).select('id');
  if (error) throw error;
  return { matchedCount: data?.length ? 1 : 0 };
}

export async function leadDelete(id) {
  if (!useSupabase) {
    return Lead.deleteOne({ _id: id });
  }
  const { data, error } = await supabase.from('leads').delete().eq('id', id).select('id');
  if (error) throw error;
  return { deletedCount: data?.length ? 1 : 0 };
}

export async function leadStatsCounts() {
  if (!useSupabase) {
    const [total, nuevo, enContacto, cerrado] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ estado: 'Nuevo' }),
      Lead.countDocuments({ estado: 'En contacto' }),
      Lead.countDocuments({ estado: 'Cerrado' }),
    ]);
    return { total, nuevo, enContacto, cerrado };
  }

  async function countFilter(filter) {
    let q = supabase.from('leads').select('*', { count: 'exact', head: true });
    if (filter) q = q.eq('estado', filter);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  }

  const [total, nuevo, enContacto, cerrado] = await Promise.all([
    countFilter(null),
    countFilter('Nuevo'),
    countFilter('En contacto'),
    countFilter('Cerrado'),
  ]);
  return { total, nuevo, enContacto, cerrado };
}

// ─── Plans ─────────────────────────────────────────────────

export async function plansListSorted() {
  if (!useSupabase) {
    return Plan.find({}).sort({ order: 1 }).lean();
  }
  const { data, error } = await supabase.from('plans').select('*').order('orden', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapPlanRow);
}

export async function plansReplaceAll(plansArray) {
  if (!useSupabase) {
    await Plan.deleteMany({});
    return Plan.insertMany(plansArray);
  }

  const { error: delErr } = await supabase
    .from('plans')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) throw delErr;

  const rows = plansArray.map((p, i) => planToSupabaseInsert(p, i + 1));
  const { data, error } = await supabase.from('plans').insert(rows).select('*');
  if (error) throw error;
  return (data || []).map(mapPlanRow);
}

// Compat (por si algún módulo viejo lo importa)
export { Lead, Plan };

export function getLeadsDB() {
  if (useSupabase) {
    throw new Error('getLeadsDB() no aplica con Supabase: usá leadsListPage / leadCreate / …');
  }
  return Lead;
}

export function getPlansDB() {
  if (useSupabase) {
    throw new Error('getPlansDB() no aplica con Supabase: usá plansListSorted / plansReplaceAll');
  }
  return Plan;
}
