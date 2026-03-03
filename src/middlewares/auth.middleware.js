import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. No hay token." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        req.usuario = verified; 
        
        next();
    } catch (error) {
        res.status(403).json({ error: "Token inválido o expirado." });
    }
};