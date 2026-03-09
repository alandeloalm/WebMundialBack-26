import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import recompensasRoutes from './routes/recompensas.routes.js'
import experienciasRouter from './routes/experiencias.routes.js';
import lugaresRoutes from './routes/lugares.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import helmet from 'helmet';
import { seedAdmin } from './config/seedAdmin.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((req, res, next) => {
  const rutasStream = ['/api/lugares', '/api/experiencias/completar'];
  if (rutasStream.some(r => req.path.startsWith(r)) && req.method !== 'GET') return next();
  express.json({ limit: '100kb' })(req, res, next);
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recompensas', recompensasRoutes);
app.use('/api/experiencias', experienciasRouter);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor de WebMundial-26 corriendo en http://localhost:${PORT}`);
    await seedAdmin();
});