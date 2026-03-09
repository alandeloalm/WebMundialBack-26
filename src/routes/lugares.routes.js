import express from 'express';
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

const router = express.Router();

router.get('/', verifyToken, obtenerLugares);
router.get('/admin', verifyToken, verifyAdmin, obtenerTodosLugares);
router.post('/', verifyToken, verifyAdmin, crearLugar, validarLugar);
router.put('/:id', verifyToken, verifyAdmin, validarIdLugar, validarLugar, editarLugar);
router.patch('/:id/desactivar', verifyToken, verifyAdmin, validarIdLugar, desactivarLugar);
router.patch('/:id/activar', verifyToken, verifyAdmin, validarIdLugar, activarLugar);

export default router;