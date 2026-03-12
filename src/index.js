import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import recompensasRoutes from './routes/recompensas.routes.js'
import experienciasRouter from './routes/experiencias.routes.js';
import lugaresRoutes from './routes/lugares.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import chatRoutes from './routes/chat.routes.js';
import helmet from 'helmet';
import { seedAdmin } from './config/seedAdmin.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:4200',
    process.env.FRONTEND_URL,
  ],
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
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await seedAdmin();
});