import { Router } from 'express';
import {
  getMetricasUsuarios,
  getMetricasCampanas,
  getMetricasComercio,
  getMetricasKioskos,
} from '../controllers/dashboard.controller.js';
import { verifyToken }   from '../middlewares/auth.middleware.js';
import { verifyAdmin }   from '../middlewares/admin.middleware.js';

const router = Router();

// Todas las rutas del dashboard requieren token + rol admin
router.use(verifyToken, verifyAdmin);

// GET /api/dashboard/usuarios?filtro=semana|mes|total
router.get('/usuarios',   getMetricasUsuarios);

// GET /api/dashboard/campanas?filtro=semana|mes|total
router.get('/campanas',   getMetricasCampanas);

// GET /api/dashboard/comercios?filtro=semana|mes|total
router.get('/comercios',  getMetricasComercio);

// GET /api/dashboard/kioskos?filtro=semana|mes|total
router.get('/kioskos',    getMetricasKioskos);

export default router;