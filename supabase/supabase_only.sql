-- Pulso.app — solo Supabase + Vercel (sin Node)
-- Ejecutá esto en el SQL Editor DESPUÉS de init.sql (o en proyecto nuevo, tras crear tablas).

create extension if not exists pgcrypto;

-- ─── Token de admin (hash bcrypt en DB, no el texto plano) ───────────────
create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;

drop policy if exists "deny_all_app_settings" on public.app_settings;
create policy "deny_all_app_settings"
on public.app_settings for all
using (false);

-- Configurá el token UNA VEZ (reemplazá TU_TOKEN_SEGURO):
-- insert into public.app_settings (key, value)
-- values ('admin_token_hash', crypt('TU_TOKEN_SEGURO', gen_salt('bf')))
-- on conflict (key) do update set value = excluded.value;

-- ─── Validación del token (usa el hash guardado) ─────────────────────────
create or replace function public.admin_token_valid(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return false;
  end if;
  select value into v_hash from public.app_settings where key = 'admin_token_hash';
  if v_hash is null then
    return false;
  end if;
  return crypt(p_token, v_hash) = v_hash;
end;
$$;

revoke all on function public.admin_token_valid(text) from public;
grant execute on function public.admin_token_valid(text) to anon, authenticated;

-- ─── RLS leads: solo insert público; lectura/edición vía RPC ─────────────
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
on public.leads for insert
to anon, authenticated
with check (true);

drop policy if exists "leads_select_anon" on public.leads;
create policy "leads_select_anon"
on public.leads for select
to anon, authenticated
using (false);

-- ─── RPC: listado + total ───────────────────────────────────────────────
create or replace function public.admin_list_leads(
  p_token text,
  p_estado text default null,
  p_page int default 1,
  p_limit int default 50
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset int;
  v_total bigint;
  v_rows json;
begin
  if not public.admin_token_valid(p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;
  v_offset := (greatest(p_page, 1) - 1) * greatest(p_limit, 1);

  select count(*)::bigint into v_total
  from public.leads
  where (p_estado is null or estado = p_estado);

  select coalesce(
    (select json_agg(row_to_json(t)) from (
      select id, nombre, email, telefono, plan, mensaje, estado, created_at, updated_at
      from public.leads
      where (p_estado is null or estado = p_estado)
      order by created_at desc
      limit greatest(p_limit, 1) offset v_offset
    ) t),
    '[]'::json
  ) into v_rows;

  return json_build_object(
    'leads', v_rows,
    'total', v_total,
    'page', p_page,
    'limit', p_limit
  );
end;
$$;

revoke all on function public.admin_list_leads(text, text, int, int) from public;
grant execute on function public.admin_list_leads(text, text, int, int) to anon, authenticated;

-- ─── RPC: stats ───────────────────────────────────────────────────────────
create or replace function public.admin_stats(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_token_valid(p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;
  return json_build_object(
    'total', (select count(*) from public.leads),
    'nuevo', (select count(*) from public.leads where estado = 'Nuevo'),
    'enContacto', (select count(*) from public.leads where estado = 'En contacto'),
    'cerrado', (select count(*) from public.leads where estado = 'Cerrado')
  );
end;
$$;

revoke all on function public.admin_stats(text) from public;
grant execute on function public.admin_stats(text) to anon, authenticated;

-- ─── RPC: lead update / delete ────────────────────────────────────────────
create or replace function public.admin_update_lead(p_token text, p_id uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_token_valid(p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;
  update public.leads set estado = p_estado where id = p_id;
  if not found then
    raise exception 'not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_update_lead(text, uuid, text) from public;
grant execute on function public.admin_update_lead(text, uuid, text) to anon, authenticated;

create or replace function public.admin_delete_lead(p_token text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_token_valid(p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;
  delete from public.leads where id = p_id;
  if not found then
    raise exception 'not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_delete_lead(text, uuid) from public;
grant execute on function public.admin_delete_lead(text, uuid) to anon, authenticated;

-- ─── RPC: planes (lista para admin) ─────────────────────────────────────
create or replace function public.admin_list_plans(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  if not public.admin_token_valid(p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;
  select coalesce(json_agg(row_to_json(t)), '[]'::json) into v
  from (
    select
      id,
      nombre,
      prefijo,
      precio,
      entrega,
      descripcion as "desc",
      items,
      orden as "order",
      destacado
    from public.plans
    order by orden asc
  ) t;
  return v;
end;
$$;

revoke all on function public.admin_list_plans(text) from public;
grant execute on function public.admin_list_plans(text) to anon, authenticated;

-- ─── RPC: reemplazar todos los planes ────────────────────────────────────
create or replace function public.admin_replace_plans(p_token text, p_plans jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  el jsonb;
begin
  if not public.admin_token_valid(p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;
  delete from public.plans;
  for el in select * from jsonb_array_elements(p_plans)
  loop
    insert into public.plans (nombre, prefijo, precio, entrega, descripcion, items, orden, destacado)
    values (
      el->>'nombre',
      coalesce(nullif(el->>'prefijo', ''), ''),
      coalesce(el->>'precio', ''),
      coalesce(nullif(el->>'entrega', ''), ''),
      coalesce(nullif(el->>'desc', ''), nullif(el->>'descripcion', ''), ''),
      coalesce(el->'items', '[]'::jsonb),
      coalesce((el->>'order')::int, (el->>'orden')::int, 0),
      coalesce((el->>'destacado')::boolean, false)
    );
  end loop;
end;
$$;

revoke all on function public.admin_replace_plans(text, jsonb) from public;
grant execute on function public.admin_replace_plans(text, jsonb) to anon, authenticated;
