// src/routes/chat.routes.js
import { Router } from 'express';
import { procesarMensaje, limpiarSesion } from '../controllers/chat.controller.js';

const router = Router();

router.post('/',                    procesarMensaje);
router.delete('/sesion/:sessionId', limpiarSesion);

export default router;