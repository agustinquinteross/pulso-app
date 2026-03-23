# Vercel + API (admin y formulario)

## Qué pasaba

1. El build de Vercel solo generaba la **landing** (`vite build`). El **admin** no se copiaba a `dist`, así que `/admin` no existía o fallaba.
2. Sin **`VITE_API_URL`**, el admin y la landing llaman a `/api/...` en el dominio de Vercel, donde **no corre Express** → el login del admin y el formulario fallan.

## Qué hace el repo ahora

- `npm run build:vercel`: construye landing + admin y copia `admin/dist` → `dist/admin`.
- `vercel.json` usa ese comando y redirige `/admin` → `/admin/`.

## Qué tenés que configurar en Vercel

1. **Variables de entorno** (Settings → Environment Variables), para **Production** (y Preview si querés):

   | Nombre           | Valor |
   |-----------------|-------|
   | `VITE_API_URL`  | URL pública de tu backend Node (ej. `https://xxxx.up.railway.app`) **sin** `/` al final |

2. **Redeploy** el proyecto después de guardar las variables (el valor se “hornea” en el build).

## Backend

El servidor debe tener en producción, como mínimo: `ADMIN_TOKEN`, variables de Supabase si las usás, Gmail si mandás mails, etc. (ver `.env.example`).

## Probar

- Landing: `https://tu-proyecto.vercel.app`
- Admin: `https://tu-proyecto.vercel.app/admin/`
- Token: el mismo `ADMIN_TOKEN` del servidor.
