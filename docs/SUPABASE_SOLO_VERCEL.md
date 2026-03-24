# Solo Supabase + Vercel (sin Node)

## Variables en Vercel (build)

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clave **anon / publishable** (Project Settings → API) |

No uses la **service_role** en el frontend.

## SQL en Supabase (orden)

1. `supabase/init.sql` — tablas `leads`, `plans`, RLS básico.
2. `supabase/supabase_only.sql` — `app_settings`, RPC de admin, política de insert en `leads`.

## Token de administrador (en la base)

El panel no lee un `.env`: el token se guarda **hasheado** en Postgres:

```sql
insert into public.app_settings (key, value)
values ('admin_token_hash', crypt('TU_TOKEN_SECRETO', gen_salt('bf')))
on conflict (key) do update set value = excluded.value;
```

Para entrar al admin usás el texto **`TU_TOKEN_SECRETO`** (el que pusiste dentro de `crypt(...)`, no el hash).

## URLs

- Landing: `https://tu-proyecto.vercel.app`
- Admin: `https://tu-proyecto.vercel.app/admin/`

## Email

El envío por SMTP del servidor Node ya no aplica. Podés usar webhooks de Supabase u otro servicio después.
