import { Router } from 'express';
import {
  leadsListPage,
  leadFindById,
  leadUpdateEstado,
  leadDelete,
  plansListSorted,
  plansReplaceAll,
  leadStatsCounts,
} from '../db.js';
import { sendLeadNotification } from '../mailer.js';

const router = Router();

function auth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  next();
}

// GET /api/admin/leads
router.get('/leads', auth, async (req, res) => {
  try {
    const { estado, page = 1, limit = 50 } = req.query;
    const { leads, total } = await leadsListPage({
      estado: estado || undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json({ leads, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo leads.' });
  }
});

// GET /api/admin/leads/:id
router.get('/leads/:id', auth, async (req, res) => {
  try {
    const lead = await leadFindById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead no encontrado.' });
    res.json(lead);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo lead.' });
  }
});

// PATCH /api/admin/leads/:id
router.patch('/leads/:id', auth, async (req, res) => {
  const { estado } = req.body;
  const validStates = ['Nuevo', 'En contacto', 'Cerrado', 'Archivado'];

  if (!validStates.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Use: ${validStates.join(', ')}` });
  }

  try {
    const result = await leadUpdateEstado(req.params.id, estado);
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Lead no encontrado.' });
    res.json({ success: true, estado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error actualizando lead.' });
  }
});

// DELETE /api/admin/leads/:id
router.delete('/leads/:id', auth, async (req, res) => {
  try {
    const result = await leadDelete(req.params.id);
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Lead no encontrado.' });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error eliminando lead.' });
  }
});

// POST /api/admin/test-email — Send a test notification
router.post('/test-email', auth, async (req, res) => {
  try {
    const dummyLead = {
      nombre: 'Cliente de Prueba',
      email: 'test@pulso.app',
      telefono: '+54 11 1234-5678',
      plan: 'Elite — Unlimited',
      mensaje: 'Este es un mensaje de prueba para verificar el nuevo diseño de notificaciones de Pulso.app. ¡Se ve increíble!',
    };
    await sendLeadNotification(dummyLead);
    res.json({ success: true });
  } catch (error) {
    console.error('Error enviando mail de prueba:', error);
    res.status(500).json({ error: 'Error enviando el mail de prueba.' });
  }
});

// GET /api/admin/plans
router.get('/plans', auth, async (req, res) => {
  try {
    const plans = await plansListSorted();
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo planes.' });
  }
});

// POST /api/admin/plans — Update all plans
router.post('/plans', auth, async (req, res) => {
  const { plans } = req.body;
  if (!Array.isArray(plans)) return res.status(400).json({ error: 'Plans must be an array.' });

  try {
    const inserted = await plansReplaceAll(plans);
    res.json({ success: true, plans: inserted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error guardando planes.' });
  }
});

// GET /api/admin/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const { total, nuevo, enContacto, cerrado } = await leadStatsCounts();
    res.json({ total, nuevo, enContacto, cerrado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo estadísticas.' });
  }
});

export default router;
