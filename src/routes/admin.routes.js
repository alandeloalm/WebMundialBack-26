import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { promoverUsuario } from '../controllers/admin.controller.js';

const router = express.Router();

router.patch('/usuarios/:id/rol', verifyToken, requireAdmin, promoverUsuario);

export default router;