import pool from '../config/db.js';

export async function promoverUsuario(req, res) {
  const { rol } = req.body;
  if (!['admin', 'user'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET rol = $1 WHERE id = $2 RETURNING id, nombre, correo, rol`,
      [rol, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el rol.' });
  }
}