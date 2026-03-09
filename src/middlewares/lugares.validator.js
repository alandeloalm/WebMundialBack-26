const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validarLugar = (req, res, next) => {
  const { nombre, categoria, latitud, longitud } = req.body;
  const categoriasValidas = ['kiosko', 'restaurant', 'attraction', 'museum', 'transport'];

  if (!nombre?.trim())
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (nombre.trim().length < 3)
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres.' });
  if (!categoriasValidas.includes(categoria))
    return res.status(400).json({ error: 'Categoría inválida.' });
  if (isNaN(parseFloat(latitud)) || isNaN(parseFloat(longitud)))
    return res.status(400).json({ error: 'Latitud y longitud deben ser números.' });
  if (parseFloat(latitud) < -90 || parseFloat(latitud) > 90)
    return res.status(400).json({ error: 'Latitud fuera de rango.' });
  if (parseFloat(longitud) < -180 || parseFloat(longitud) > 180)
    return res.status(400).json({ error: 'Longitud fuera de rango.' });

  next();
};

export const validarIdLugar = (req, res, next) => {
  if (!uuidRegex.test(req.params.id))
    return res.status(400).json({ error: 'ID inválido.' });
  next();
};