/**
 * Copia admin/dist → dist/admin para que Vercel sirva /admin junto a la landing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const adminDist = path.join(root, 'admin', 'dist');
const target = path.join(root, 'dist', 'admin');

if (!fs.existsSync(adminDist)) {
  console.error('❌ No existe admin/dist. Ejecutá antes: npm run build:admin');
  process.exit(1);
}

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(adminDist, target, { recursive: true });
console.log('✅ Admin copiado a dist/admin');
