import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Middlewares globales de seguridad y formato
app.use(express.json());
app.use(cors());

// Conectar las rutas de autenticación
// Todas las rutas dentro de authRoutes empezarán con /api/auth
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de WebMundial-26 corriendo en http://localhost:${PORT}`);
});