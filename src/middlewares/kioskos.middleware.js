export const verifyKioskoSecret = (req, res, next) => {
    const secret = req.headers['x-kiosko-secret'];
  
    if (!secret || secret !== process.env.KIOSKO_SECRET) {
      return res.status(401).json({ error: 'Acceso denegado. Kiosko no autorizado.' });
    }
  
    next();
  };