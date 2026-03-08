import pool from '../config/db.js';

export const obtenerRecompensas = async (req, res) => {
  const usuario_id = req.usuario.id;

  try {
    const { rows: kioskosCompletados } = await pool.query(
      `SELECT DISTINCT kiosko_id FROM usuarios_kioskos WHERE usuario_id = $1`,
      [usuario_id]
    );

    const idsKioskos = kioskosCompletados.map(k => k.kiosko_id);

    const { rows: campanas } = await pool.query(
      `SELECT 
        c.id                AS campana_id,
        c.titulo,
        c.descripcion,
        c.tipo_descuento,
        c.valor_descuento,
        c.kiosko_id,
        c.terminos,
        c.inicia_en,
        c.expira_en,
        co.nombre           AS comercio_nombre,
        co.logo_url         AS comercio_logo,
        co.categoria        AS comercio_categoria,
        cu.codigo           AS codigo,
        cu.estado           AS estado_cupon
      FROM campanas_cupones c
      JOIN comercios co ON co.id = c.comercio_id
      LEFT JOIN cupones cu 
        ON cu.campana_id = c.id 
        AND cu.usuario_id = $1
      WHERE c.activo = true
        AND (c.expira_en IS NULL OR c.expira_en > NOW())
      ORDER BY c.kiosko_id, co.nombre ASC`,
      [usuario_id]
    );

    const recompensas = campanas.map(c => {
      const desbloqueado = idsKioskos.includes(c.kiosko_id);
      return {
        campana_id:         c.campana_id,
        titulo:             c.titulo,
        descripcion:        desbloqueado ? c.descripcion : null,
        tipo_descuento:     c.tipo_descuento,
        valor_descuento:    c.valor_descuento,
        kiosko_id:          c.kiosko_id,
        terminos:           desbloqueado ? c.terminos : null,
        inicia_en:          c.inicia_en,
        expira_en:          c.expira_en,
        comercio_nombre:    c.comercio_nombre,
        comercio_logo:      c.comercio_logo,
        comercio_categoria: c.comercio_categoria,
        codigo:             desbloqueado ? c.codigo : null,
        estado_cupon:       desbloqueado ? c.estado_cupon : null,
        desbloqueado,
      };
    });

    res.json({
      total: recompensas.length,
      kioskos_completados: idsKioskos.length,
      recompensas,
    });

  } catch (error) {
    console.error('Error al obtener recompensas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};