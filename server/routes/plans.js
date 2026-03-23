import { Router } from 'express';
import { plansListSorted } from '../db.js';

const router = Router();

// GET /api/plans — Get all plans (Public)
router.get('/', async (req, res) => {
  try {
    const plans = await plansListSorted();
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo planes.' });
  }
});

export default router;
