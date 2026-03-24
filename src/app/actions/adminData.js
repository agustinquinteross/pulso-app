'use server';

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function getDashboardData() {
  'use server';
  
  // 1. Fetch leads
  const { data: leads, error: leadsErr } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Fetch plans
  const { data: plans, error: plansErr } = await supabaseAdmin
    .from('plans')
    .select('*')
    .order('orden', { ascending: true });

  if (leadsErr || plansErr) {
    console.error(leadsErr || plansErr);
    return { leads: [], plans: [], stats: null };
  }

  // 3. Calculate Stats directly in Node
  const stats = {
    total: leads.length,
    nuevo: leads.filter(l => l.estado === 'Nuevo').length,
    enContacto: leads.filter(l => l.estado === 'En contacto').length,
    cerrado: leads.filter(l => l.estado === 'Cerrado').length,
  };

  return { leads, plans, stats };
}

export async function getPublicPlans() {
  'use server';
  try {
    const { data, error } = await supabaseAdmin.from('plans').select('*').order('orden', { ascending: true });
    if (error || !data || data.length === 0) throw new Error('No plans found');
    
    return data.map(row => ({
      id: row.id,
      nombre: row.nombre,
      prefijo: row.prefijo,
      precio: row.precio,
      entrega: row.entrega,
      desc: row.descripcion,
      items: row.items,
      order: row.orden,
      destacado: row.destacado,
    }));
  } catch (err) {
    console.error('Fallback plans triggered:', err.message);
    // Hardcoded fallback data in ARS as requested
    return [
      { nombre: 'Básico', prefijo: 'ARS', precio: '300.000', entrega: '2 a 3 semanas', desc: 'Presencia digital impecable. Ideal para marcas y negocios.', items: ['Landing Page de alto impacto', 'Diseño UX/UI 100% responsivo', 'Formulario integrado'], destacado: false, order: 1 },
      { nombre: 'Premium', prefijo: 'ARS', precio: '500.000', entrega: '4 a 6 semanas', desc: 'Solución corporativa completa. Pensado para pymes.', items: ['Sistema Web Multi-página', 'Panel de Administración', 'Métricas Analíticas'], destacado: true, order: 2 },
      { nombre: 'Business', prefijo: 'Desde ARS', precio: '800.000', entrega: 'A definir', desc: 'Arquitectura a medida. Plataformas complejas y e-commerce.', items: ['Desarrollo Full-Stack a medida', 'Base de datos segura', 'Soporte 24/7'], destacado: false, order: 3 },
    ];
  }
}

export async function updateLeadEstado(id, estado) {
  'use server';
  const { error } = await supabaseAdmin.from('leads').update({ estado }).eq('id', id);
  return { success: !error, error: error?.message };
}

export async function deleteLead(id) {
  'use server';
  const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
  return { success: !error, error: error?.message };
}

export async function replacePlans(newPlans) {
  'use server';
  // Delete all
  const { error: delErr } = await supabaseAdmin.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
  if (delErr) return { success: false, error: delErr.message };

  // Insert new
  const mapped = newPlans.map((p, i) => ({
    nombre: p.nombre,
    prefijo: p.prefijo || '',
    precio: p.precio,
    entrega: p.entrega || '',
    descripcion: p.desc || p.descripcion || '',
    items: p.items || [],
    orden: p.order || p.orden || i,
    destacado: !!p.destacado
  }));

  const { error: insErr } = await supabaseAdmin.from('plans').insert(mapped);
  return { success: !insErr, error: insErr?.message };
}

export async function submitLead(leadData) {
  'use server';
  const dbPromise = supabaseAdmin.from('leads').insert({
    nombre: leadData.nombre,
    email: leadData.email,
    telefono: leadData.telefono || null,
    plan: leadData.plan || null,
    mensaje: leadData.mensaje || null,
    estado: 'Nuevo',
  });

  // Configurar Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // 1. Email al Administrador (en paralelo)
  const mail1 = transporter.sendMail({
    from: `"Pulso Web" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER, 
    subject: `Nuevo Lead ⚡: ${leadData.nombre}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #000000; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden;">
          <tr><td height="4" style="background-color: #39FF14;"></td></tr>
          <tr>
            <td style="padding: 30px; text-align: center; border-bottom: 1px solid #1a1a1a;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">PULSO<span style="color: #39FF14;">.</span>APP</h1>
              <p style="color: #888888; margin: 10px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Nuevo prospecto recibido</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="color: #ffffff; font-size: 16px; margin-bottom: 25px;">Acabas de recibir una nueva solicitud de contacto. A continuación, los detalles:</p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 35%;">Nombre</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px; font-weight: bold;">${leadData.nombre}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #39FF14; font-size: 15px;"><a href="mailto:${leadData.email}" style="color: #39FF14; text-decoration: none;">${leadData.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Teléfono</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px;">${leadData.telefono || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Plan</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #1a1a1a; color: #ffffff; font-size: 15px;">
                    <span style="background-color: rgba(57, 255, 20, 0.1); color: #39FF14; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${leadData.plan || 'No especificado'}</span>
                  </td>
                </tr>
              </table>
              <div style="background-color: #111111; border-left: 3px solid #39FF14; padding: 20px; border-radius: 0 4px 4px 0;">
                <p style="color: #888888; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Mensaje</p>
                <p style="color: #ffffff; margin: 0; font-size: 15px; line-height: 1.6; font-style: italic;">"${leadData.mensaje ? leadData.mensaje.replace(/\n/g, '<br/>') : 'Sin mensaje adicional.'}"</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="https://pulso.app/admin" style="display: inline-block; background-color: #39FF14; color: #000000; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">Abrir Panel de Gestión</a>
            </td>
          </tr>
        </table>
      </div>
    `
  }).catch(e => console.error('Error enviando email admin:', e));

  // 2. Respuesta Automática al Cliente (en paralelo)
  const mail2 = transporter.sendMail({
    from: `"PULSO.APP" <${process.env.GMAIL_USER}>`,
    to: leadData.email,
    subject: 'Hemos recibido tu solicitud - PULSO',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #FFFFFF; border: 1px solid #1a1a1a; padding: 40px; border-radius: 8px;">
        <h1 style="color: #39FF14; font-family: sans-serif; text-transform: uppercase;">¡Hola ${leadData.nombre.split(' ')[0]}!</h1>
        <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">Hemos recibido correctamente tu solicitud de contacto en <strong>PULSO.APP</strong>.</p>
        <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">Nuestro equipo está revisando los detalles de tu proyecto y nos pondremos en contacto contigo a la brevedad posible (generalmente en menos de 24 horas).</p>
        <div style="margin: 30px 0; border-top: 1px solid #1a1a1a;"></div>
        <p style="font-size: 14px; color: rgba(255,255,255,0.4);">Este es un correo automático, por favor no respondas a este mensaje.</p>
      </div>
    `
  }).catch(e => console.error('Error enviando autorespuesta:', e));

  // Esperar a que todo termine simultáneamente
  const [dbResult] = await Promise.all([dbPromise, mail1, mail2]);

  return { success: !dbResult.error, error: dbResult.error?.message };
}
