export const validarCompletarKiosko = (req, res, next) => {
  const { usuario_id, kiosko_id } = req.query;

  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id es requerido.' });
  }
  if (!kiosko_id) {
    return res.status(400).json({ error: 'kiosko_id es requerido.' });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(usuario_id)) {
    return res.status(400).json({ error: 'usuario_id no es un UUID válido.' });
  }
  if (!uuidRegex.test(kiosko_id)) {
    return res.status(400).json({ error: 'kiosko_id no es un UUID válido.' });
  }

  next();
};