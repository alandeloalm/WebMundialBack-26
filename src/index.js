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
  origin: [
      'http://localhost:4200',
      'https://tu-app.vercel.app'  
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cors({
  origin: (origin, callback) => {
      const allowed = [
          'http://localhost:4200',
          'https://web-mundial-front-26.vercel.app'
      ];
      // Permite cualquier subdominio de vercel.app del proyecto
      if (!origin || allowed.includes(origin) || origin.includes('web-mundial-front-26')) {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recompensas', recompensasRoutes);
app.use('/api/experiencias', experienciasRouter);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await seedAdmin();
});