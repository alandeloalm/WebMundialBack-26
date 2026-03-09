import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';
import { promoverUsuario } from '../controllers/admin.controller.js';

const router = express.Router();

router.patch('/usuarios/:id/rol', verifyToken, verifyAdmin, promoverUsuario);

export default router;