import { Router } from 'express';
import { registro, login, googleLogin, completarPerfil } from '../controllers/auth.controller.js';
import { validarRegistro } from '../middlewares/auth.validator.js';
import { loginLimiter } from '../middlewares/rateLimit.middleware.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/registro', validarRegistro, registro);
router.post('/login', loginLimiter, login);
router.post('/google', googleLogin);
router.put('/completar-perfil', verifyToken, completarPerfil);

export default router;