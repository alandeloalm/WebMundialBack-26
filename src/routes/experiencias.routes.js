import express from 'express';
import { obtenerQR, completarKiosko, obtenerVideos } from '../controllers/experiencias.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyKioskoSecret } from '../middlewares/kioskos.middleware.js';
import { validarCompletarKiosko } from '../middlewares/experiencias.validator.js';
import { upload } from '../middlewares/upload.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

router.get('/qr', verifyToken, obtenerQR);
router.get('/videos', verifyToken, obtenerVideos);
router.post('/completar', verifyKioskoSecret, upload.single('video'), validarCompletarKiosko, completarKiosko, rateLimit);

export default router;