import express from 'express';
import { obtenerQR, completarKiosko, obtenerVideos } from '../controllers/experiencias.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyKioskoSecret } from '../middlewares/kioskos.middleware.js';
import { validarCompletarKiosko } from '../middlewares/experiencias.validator.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

router.get('/qr', verifyToken, obtenerQR);
router.get('/videos', verifyToken, obtenerVideos);
const limiter = rateLimit({ windowMs: 60_000, max: 10 });
router.post('/completar', limiter, verifyKioskoSecret, validarCompletarKiosko, completarKiosko);

export default router;