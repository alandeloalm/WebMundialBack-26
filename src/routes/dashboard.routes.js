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

router.use(verifyToken, verifyAdmin);
router.get('/usuarios',   getMetricasUsuarios);
router.get('/campanas',   getMetricasCampanas);
router.get('/comercios',  getMetricasComercio);
router.get('/kioskos',    getMetricasKioskos);

export default router;