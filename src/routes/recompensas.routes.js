import express from 'express';
import { obtenerRecompensas } from '../controllers/recompensas.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, obtenerRecompensas);

export default router;