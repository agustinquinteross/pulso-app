-- Pulso.app - Supabase quick setup
-- Run this entire script in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Leads
-- ------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  plan text,
  mensaje text,
  estado text not null default 'Nuevo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (email);

-- ------------------------------------------------------------
-- Plans
-- ------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  prefijo text not null default '',
  precio text not null,
  entrega text not null default '',
  descripcion text not null default '',
  items jsonb not null default '[]'::jsonb,
  orden integer not null default 0,
  destacado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_orden_idx on public.plans (orden asc);
create index if not exists plans_destacado_idx on public.plans (destacado);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_set_updated_at on public.leads;
create trigger trg_leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists trg_plans_set_updated_at on public.plans;
create trigger trg_plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Seed plans (idempotent)
-- ------------------------------------------------------------
insert into public.plans (nombre, prefijo, precio, entrega, descripcion, items, orden, destacado)
values
  (
    'Básico',
    'USD',
    '350',
    '2–3 semanas',
    'Para emprendedores y marcas que necesitan su primera presencia digital profesional.',
    '[
      "Sitio web de hasta 5 secciones",
      "Diseño 100% a medida (no plantillas)",
      "Formulario de contacto funcional",
      "Optimización SEO On-page básica",
      "Carga optimizada (PageSpeed +90)",
      "Dominio + hosting primer año incluido",
      "1 ronda de revisiones post-entrega"
    ]'::jsonb,
    1,
    false
  ),
  (
    'Pro',
    'USD',
    '1.800',
    '6–8 semanas',
    'Para negocios que necesitan una plataforma web completa con lógica de negocio propia.',
    '[
      "Todo lo del plan Básico",
      "Aplicación web full-stack (React + Node)",
      "Base de datos + autenticación segura",
      "Panel de administración propio",
      "Integración con MercadoPago / Stripe",
      "API REST documentada",
      "Deploy en cloud (AWS / Vercel)",
      "Soporte técnico prioritario por 60 días"
    ]'::jsonb,
    2,
    true
  ),
  (
    'Premium',
    'Desde USD',
    '4.000',
    'A definir',
    'Para proyectos complejos que requieren arquitectura robusta, escalabilidad y equipo dedicado.',
    '[
      "Todo lo del plan Pro",
      "E-commerce con catálogo avanzado",
      "Integraciones con ERP / CRM externos",
      "Arquitectura cloud escalable (multi-región)",
      "Equipo dedicado (tech lead + diseñador)",
      "Panel analytics personalizado",
      "SLA garantizado + monitoreo 24/7",
      "Mantenimiento y roadmap post-entrega"
    ]'::jsonb,
    3,
    false
  ),
  (
    'A definir',
    '',
    'CONSULTAR',
    'Variable',
    'Proyectos a medida con requerimientos específicos.',
    '[
      "Análisis de requerimientos",
      "Presupuesto personalizado"
    ]'::jsonb,
    4,
    false
  )
on conflict do nothing;

-- ------------------------------------------------------------
-- Optional: basic RLS (safe defaults)
-- ------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.plans enable row level security;

-- Public can read plans
drop policy if exists "plans_select_public" on public.plans;
create policy "plans_select_public"
on public.plans
for select
to anon, authenticated
using (true);

-- Only service role should write leads/plans from backend.
-- (No insert/update/delete policy for anon/authenticated)
