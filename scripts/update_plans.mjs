import { createClient } from '@supabase/supabase-js';

// Usar el token administrativo desde el .env.local o el .env
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const planes = [
  {
    nombre: 'Básico',
    prefijo: 'ARS',
    precio: '300.000',
    entrega: '2 a 3 semanas',
    descripcion: 'Presencia digital impecable. Ideal para marcas personales y negocios que necesitan validar su presencia online con un diseño que destaque.',
    items: [
      'Landing Page de alto impacto',
      'Diseño UX/UI 100% responsivo',
      'Formulario de contacto integrado',
      'Optimización de carga rápida'
    ],
    destacado: false,
    orden: 1
  },
  {
    nombre: 'Premium',
    prefijo: 'ARS',
    precio: '500.000',
    entrega: '4 a 6 semanas',
    descripcion: 'Solución corporativa completa y escalable. Pensado para pymes y empresas que buscan convertir visitantes en clientes.',
    items: [
      'Sistema Web Multi-página',
      'Panel de Administración central',
      'Integración de WhatsApp y Redes',
      'SEO Avanzado y Métricas Analíticas'
    ],
    destacado: true,
    orden: 2
  },
  {
    nombre: 'Business',
    prefijo: 'Desde ARS',
    precio: '800.000',
    entrega: 'A definir',
    descripcion: 'Arquitectura de software a medida. Construimos plataformas complejas, e-commerce avanzados y sistemas internos a gran escala.',
    items: [
      'Desarrollo Full-Stack a medida',
      'Bases de datos y Autenticación',
      'Pasarelas de pago (MercadoPago/Stripe)',
      'Soporte Técnico prioritario e Infraestructura'
    ],
    destacado: false,
    orden: 3
  }
];

async function run() {
  console.log('Borrandp planes antiguos...');
  await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Insertando planes nuevos en ARS...');
  const { error } = await supabase.from('plans').insert(planes);
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log('¡Planes actualizados con éxito en producción!');
  process.exit(0);
}

run();
