import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import recompensasRoutes from './routes/recompensas.routes.js'
import experienciasRouter from './routes/experiencias.routes.js';
import helmet from 'helmet';
import { seedAdmin } from './config/seedAdmin.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recompensas', recompensasRoutes);
app.use('/api/experiencias', experienciasRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor de WebMundial-26 corriendo en http://localhost:${PORT}`);
    await seedAdmin();
});