# Subir Pulso.app a GitHub

## 1. Instalar Git (solo una vez)

1. Descargá **Git for Windows**: https://git-scm.com/download/win  
2. Instalá con opciones por defecto.  
3. **Cerrá y volvé a abrir** la terminal o Cursor.

Comprobá:

```powershell
git --version
```

## 2. Crear el repositorio en GitHub

1. Entrá a https://github.com/new  
2. Nombre del repo (ej. `pulso-app`), **público** o privado.  
3. **No** marques “Add a README” si ya tenés proyecto local.  
4. Creá el repo y copiá la URL (HTTPS), por ejemplo:  
   `https://github.com/TU_USUARIO/pulso-app.git`

## 3. Primer commit y push (en la carpeta del proyecto)

Abrí PowerShell en `pulso.app` y ejecutá:

```powershell
cd "c:\Users\aguch\OneDrive\Escritorio\pulso.app"

git init
git branch -M main
git add .
git status
```

Revisá que **no** aparezca `.env` en los archivos a commitear (está en `.gitignore`).

```powershell
git commit -m "Initial commit: Pulso.app landing + API + Supabase"
git remote add origin https://github.com/TU_USUARIO/pulso-app.git
git push -u origin main
```

La primera vez GitHub puede pedirte login: usá un **Personal Access Token** (Settings → Developer settings → Tokens) en lugar de la contraseña, o el **GitHub CLI** / **GitHub Desktop**.

## 4. Alternativa sin consola: GitHub Desktop

1. https://desktop.github.com/  
2. File → Add local repository → elegí la carpeta `pulso.app`.  
3. Publish repository.

## Seguridad

- **Nunca** subas `.env` (claves Gmail, Supabase, admin, etc.).  
- Copiá solo `.env.example` y completá valores en cada máquina o en el servidor.
