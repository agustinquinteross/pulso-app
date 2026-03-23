import { Router } from 'express';
import { leadCreate } from '../db.js';
import { sendLeadNotification } from '../mailer.js';

const router = Router();

// POST /api/contact — Receive new contact request
router.post('/', async (req, res) => {
  const { nombre, email, telefono, plan, mensaje } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido.' });
  }

  try {
    const lead = await leadCreate({
      nombre,
      email,
      telefono: telefono || null,
      plan: plan || null,
      mensaje: mensaje || null,
      estado: 'Nuevo',
    });

    sendLeadNotification({ nombre, email, telefono, plan, mensaje }).catch(err => {
      console.error('Error enviando email:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: '¡Gracias! Te contactamos en breve.',
      id: lead._id,
    });
  } catch (error) {
    console.error('Error guardando lead:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
