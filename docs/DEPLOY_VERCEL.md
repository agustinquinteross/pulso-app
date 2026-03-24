# Deploy en Vercel

## Variables de entorno (Production)

Para el modo **solo Supabase** (recomendado sin backend Node):

| Variable | Valor |
|----------|--------|
| `VITE_SUPABASE_URL` | URL del proyecto (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Clave **anon** / publishable |

Ejecutá en Supabase el SQL: `supabase/init.sql` y luego `supabase/supabase_only.sql`, y configurá el token de admin con el `INSERT` en `app_settings` (ver `docs/SUPABASE_SOLO_VERCEL.md`).

## Build

El proyecto usa `npm run build:vercel` (ver `vercel.json`): landing + panel admin copiado a `dist/admin`.

Tras cambiar variables, hacé **Redeploy** en Vercel.

## Modo antiguo (API Node en Railway)

Si seguís usando Express en otro host, podés mantener `VITE_API_URL` apuntando a esa API; el código actual prioriza **Supabase directo** cuando están `VITE_SUPABASE_*`.
