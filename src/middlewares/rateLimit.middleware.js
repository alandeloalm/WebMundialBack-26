import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 2,
    skipFailedRequests: true,
    message: { error: "Demasiados intentos de registro. Intenta de nuevo en 1 hora." },
    standardHeaders: true,
    legacyHeaders: false,
});