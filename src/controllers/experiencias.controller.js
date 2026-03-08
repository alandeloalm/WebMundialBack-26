import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';

export const obtenerQR = async (req, res) => {
  const usuario_id = req.usuario.id;
  res.json({ qr_data: usuario_id });
};

export const completarKiosko = async (req, res) => {
  const { usuario_id, kiosko_id } = req.body;

  try {
    const { rows: usuarioRows } = await pool.query(
      `SELECT id FROM usuarios WHERE id = $1`,
      [usuario_id]
    );
    if (usuarioRows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const { rows: kioskosRows } = await pool.query(
      `SELECT id FROM kioskos WHERE id = $1 AND activo = true`,
      [kiosko_id]
    );
    if (kioskosRows.length === 0) {
      return res.status(404).json({ error: 'Kiosko no encontrado.' });
    }

    let video_url = null;

    if (req.file) {
      const resultado = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'webmundial/videos',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      video_url = resultado.secure_url;
    }

    await pool.query(
      `INSERT INTO usuarios_kioskos (usuario_id, kiosko_id, video_url) VALUES ($1, $2, $3)`,
      [usuario_id, kiosko_id, video_url]
    );

    const { rows: visitasRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM usuarios_kioskos
       WHERE usuario_id = $1 AND kiosko_id = $2`,
      [usuario_id, kiosko_id]
    );

    const esPrimeraVez = parseInt(visitasRows[0].total) === 1;

    if (!esPrimeraVez) {
      return res.json({
        mensaje: '¡Video guardado! Los cupones ya fueron asignados anteriormente.',
        cupones_asignados: 0,
      });
    }

    const { rows: campanas } = await pool.query(
      `SELECT id FROM campanas_cupones
       WHERE kiosko_id = $1
         AND activo = true
         AND (expira_en IS NULL OR expira_en > NOW())`,
      [kiosko_id]
    );

    if (campanas.length === 0) {
      return res.json({
        mensaje: '¡Video guardado! No hay campañas para este kiosko.',
        cupones_asignados: 0,
      });
    }

    function generarCodigo() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `${seg()}-${seg()}`;
    }

    let cupones_asignados = 0;

    for (const campana of campanas) {
      let codigo;
      let unico = false;

      while (!unico) {
        codigo = generarCodigo();
        const { rows } = await pool.query(
          `SELECT id FROM cupones WHERE codigo = $1`,
          [codigo]
        );
        if (rows.length === 0) unico = true;
      }

      await pool.query(
        `INSERT INTO cupones (campana_id, usuario_id, codigo, estado, asignado_en)
         VALUES ($1, $2, $3, 'asignado', NOW())`,
        [campana.id, usuario_id, codigo]
      );

      cupones_asignados++;
    }

    res.json({
      mensaje: '¡Kiosko completado! Cupones asignados correctamente.',
      cupones_asignados,
      video_url,
    });

  } catch (error) {
    console.error('Error al completar kiosko:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const obtenerVideos = async (req, res) => {
  const usuario_id = req.usuario.id;

  try {
    const { rows } = await pool.query(
      `SELECT uk.id, uk.video_url, uk.completado_en, k.nombre AS kiosko_nombre, k.ubicacion
       FROM usuarios_kioskos uk
       JOIN kioskos k ON k.id = uk.kiosko_id
       WHERE uk.usuario_id = $1
       ORDER BY uk.completado_en DESC`,
      [usuario_id]
    );

    res.json({ videos: rows });
  } catch (error) {
    console.error('Error al obtener videos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};