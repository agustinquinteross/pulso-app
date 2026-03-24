import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
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
      'Optimización técnica de velocidad'
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
      'Panel de Administración y CMS local',
      'Integración de WhatsApp y Redes',
      'SEO y Métricas analíticas'
    ],
    destacado: true,
    orden: 2
  },
  {
    nombre: 'Business',
    prefijo: 'Desde ARS',
    precio: '800.000',
    entrega: 'A definir',
    descripcion: 'Arquitectura de software a medida. Construimos plataformas complejas, e-commerce avanzados y sistemas internos que impulsan el crecimiento masivo.',
    items: [
      'Desarrollo Full-Stack a medida',
      'Base de datos y Autenticación segura',
      'Integración con pasarelas de pago',
      'Soporte técnico 24/7'
    ],
    destacado: false,
    orden: 3
  }
];

async function run() {
  console.log('Limpiando planes antiguos...');
  const { error: delErr } = await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (delErr) {
    console.error('Error limpiando planes:', delErr);
    process.exit(1);
  }

  console.log('Insertando nuevos planes en ARS...');
  const { error: insErr } = await supabase.from('plans').insert(planes);
  
  if (insErr) {
    console.error('Error insertando planes:', insErr);
  } else {
    console.log('¡Planes actualizados con éxito en la base de datos de producción!');
  }
  process.exit(0);
}

run();
