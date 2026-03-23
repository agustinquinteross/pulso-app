import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import contactRouter from './routes/contact.js';
import adminRouter from './routes/admin.js';
import plansRouter from './routes/plans.js';
import { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Init database
initDB();

// API Routes
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/plans', plansRouter);

// Serve landing page
app.use(express.static(path.join(__dirname, '../dist')));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
});

// Landing page catch-all (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Pulso.app en puerto ${PORT}`);
});
