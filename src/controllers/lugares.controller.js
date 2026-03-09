import pool from '../config/db.js';
import busboy from 'busboy';
import cloudinary from '../config/cloudinary.js';

const parsearFormConImagen = (req) => {
  return new Promise((resolve, reject) => {
    const campos = {};
    let uploadPromise = null;

    const bb = busboy({ headers: req.headers });

    bb.on('field', (name, value) => {
      campos[name] = value;
    });

    bb.on('file', (fieldname, stream) => {
      uploadPromise = new Promise((res, rej) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'lugares', transformation: [{ width: 800, height: 600, crop: 'fill' }] },
          (error, result) => error ? rej(error) : res(result.secure_url)
        );
        stream.pipe(uploadStream);
      });
    });

    bb.on('finish', async () => {
        try {
            const lat = parseFloat(campos.latitud);
            const lng = parseFloat(campos.longitud);
            if (isNaN(lat) || isNaN(lng)) return reject(new Error('COORDENADAS_INVALIDAS'));
            if (lat < -90 || lat > 90) return reject(new Error('LATITUD_INVALIDA'));
            if (lng < -180 || lng > 180) return reject(new Error('LONGITUD_INVALIDA'));
            if (!campos.nombre?.trim()) return reject(new Error('NOMBRE_REQUERIDO'));
            const categoriasValidas = ['kiosko', 'restaurant', 'attraction', 'museum', 'transport'];
            if (!categoriasValidas.includes(campos.categoria)) return reject(new Error('CATEGORIA_INVALIDA'));

            campos.imagen_url = uploadPromise ? await uploadPromise : campos.imagen_url ?? '';
            resolve(campos);
        } catch (err) {
            reject(err);
        }
    });

    bb.on('error', reject);
    req.pipe(bb);
  });
};

export const obtenerLugares = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, categoria, latitud, longitud, imagen_url
       FROM lugares WHERE activo = true ORDER BY nombre ASC`
    );
    res.json({ lugares: rows });
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const obtenerTodosLugares = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, categoria, latitud, longitud, imagen_url, activo
       FROM lugares ORDER BY nombre ASC`
    );
    res.json({ lugares: rows });
  } catch (error) {
    console.error('Error al obtener todos los lugares:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const manejarErrorLugar = (error, res) => {
  const errores = {
    COORDENADAS_INVALIDAS: 'Latitud y longitud deben ser números.',
    LATITUD_INVALIDA:      'Latitud debe estar entre -90 y 90.',
    LONGITUD_INVALIDA:     'Longitud debe estar entre -180 y 180.',
    NOMBRE_REQUERIDO:      'El nombre es obligatorio.',
    CATEGORIA_INVALIDA:    'Categoría inválida.',
  };
  const mensaje = errores[error.message];
  if (mensaje) return res.status(400).json({ error: mensaje });
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
};

export const crearLugar = async (req, res) => {
  try {
    const { nombre, descripcion, categoria, latitud, longitud, imagen_url } = await parsearFormConImagen(req);
    const { rows } = await pool.query(
      `INSERT INTO lugares (nombre, descripcion, categoria, latitud, longitud, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, descripcion, categoria, latitud, longitud, imagen_url]
    );
    res.status(201).json({ lugar: rows[0] });
  } catch (error) {
    manejarErrorLugar(error, res);
  }
};

export const editarLugar = async (req, res) => {
  const { id } = req.params;
  try {
    const { nombre, descripcion, categoria, latitud, longitud, imagen_url } = await parsearFormConImagen(req);
    const { rows } = await pool.query(
      `UPDATE lugares SET nombre=$1, descripcion=$2, categoria=$3, latitud=$4, longitud=$5, imagen_url=$6
       WHERE id=$7 RETURNING *`,
      [nombre, descripcion, categoria, latitud, longitud, imagen_url, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Lugar no encontrado.' });
    res.json({ lugar: rows[0] });
  } catch (error) {
    manejarErrorLugar(error, res);
  }
};

export const desactivarLugar = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE lugares SET activo=false WHERE id=$1 RETURNING id`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Lugar no encontrado.' });
    res.json({ mensaje: 'Lugar desactivado correctamente.' });
  } catch (error) {
    console.error('Error al desactivar lugar:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const activarLugar = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE lugares SET activo=true WHERE id=$1 RETURNING id`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Lugar no encontrado.' });
    res.json({ mensaje: 'Lugar activado correctamente.' });
  } catch (error) {
    console.error('Error al activar lugar:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};