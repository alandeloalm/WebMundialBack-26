import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  obtenerLugares,
  obtenerTodosLugares,
  crearLugar,
  editarLugar,
  desactivarLugar,
  activarLugar
} from '../controllers/lugares.controller.js';
import { validarLugar, validarIdLugar } from '../middlewares/lugares.validator.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';

const limiterPublico = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas solicitudes. Intenta en un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.get('/', limiterPublico, obtenerLugares);
router.get('/admin', verifyToken, verifyAdmin, obtenerTodosLugares);
router.post('/', verifyToken, verifyAdmin, crearLugar, validarLugar);
router.put('/:id', verifyToken, verifyAdmin, validarIdLugar, validarLugar, editarLugar);
router.patch('/:id/desactivar', verifyToken, verifyAdmin, validarIdLugar, desactivarLugar);
router.patch('/:id/activar', verifyToken, verifyAdmin, validarIdLugar, activarLugar);

export default router;