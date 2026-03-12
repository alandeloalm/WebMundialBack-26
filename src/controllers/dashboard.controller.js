import pool from '../config/db.js';

const getFiltroFecha = (filtro, campo) => {
  if (filtro === 'semana')  return `AND ${campo} >= NOW() - INTERVAL '7 days'`;
  if (filtro === 'mes')     return `AND ${campo} >= NOW() - INTERVAL '30 days'`;
  return '';
};

export const getMetricasUsuarios = async (req, res) => {
  const { filtro = 'total' } = req.query;
  const filtroCrea  = getFiltroFecha(filtro, 'u.fecha_creacion');

  try {
    const { rows: [{ total }] } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM usuarios u
       WHERE u.rol = 'user' ${filtroCrea}`
    );

    const { rows: actividad } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE u.ultimo_login >= NOW() - INTERVAL '7 days') AS activos,
         COUNT(*) FILTER (WHERE u.ultimo_login <  NOW() - INTERVAL '7 days'
                             OR u.ultimo_login IS NULL)                       AS inactivos
       FROM usuarios u
       WHERE u.rol = 'user' ${filtroCrea}`
    );

    const { rows: nacionalidadRaw } = await pool.query(
      `SELECT
         COALESCE(NULLIF(TRIM(u.nacionalidad), ''), 'No especificado') AS nacionalidad,
         COUNT(*) AS total
       FROM usuarios u
       WHERE u.rol = 'user' ${filtroCrea}
       GROUP BY 1
       ORDER BY total DESC`
    );

    const top4 = nacionalidadRaw.slice(0, 4);
    const otroTotal = nacionalidadRaw.slice(4).reduce((acc, r) => acc + parseInt(r.total), 0);
    const nacionalidades = otroTotal > 0
      ? [...top4, { nacionalidad: 'Otro', total: otroTotal }]
      : top4;

    const { rows: genero } = await pool.query(
      `SELECT
         COALESCE(NULLIF(TRIM(u.genero), ''), 'No especificado') AS genero,
         COUNT(*) AS total
       FROM usuarios u
       WHERE u.rol = 'user' ${filtroCrea}
       GROUP BY 1
       ORDER BY total DESC`
    );

    const filtroCreaPlain = filtroCrea.replace(/u\./g, '');
    const { rows: edad } = await pool.query(
      `SELECT rango, COUNT(*) AS total
       FROM (
         SELECT
           CASE
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 18  THEN 'Menor de 18'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 25  THEN '18-24'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 35  THEN '25-34'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 45  THEN '35-44'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 55  THEN '45-54'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) >= 55 THEN '55+'
             ELSE 'No especificado'
           END AS rango,
           CASE
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 18  THEN 1
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 25  THEN 2
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 35  THEN 3
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 45  THEN 4
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 55  THEN 5
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) >= 55 THEN 6
             ELSE 7
           END AS orden
         FROM usuarios
         WHERE rol = 'user' ${filtroCreaPlain}
       ) sub
       GROUP BY rango, orden
       ORDER BY orden`
    );

    res.json({
      total_usuarios:   parseInt(total),
      activos:          parseInt(actividad[0].activos),
      inactivos:        parseInt(actividad[0].inactivos),
      por_nacionalidad: nacionalidades.map(r => ({
        nacionalidad: r.nacionalidad,
        total: parseInt(r.total)
      })),
      por_genero: genero.map(r => ({
        genero: r.genero,
        total: parseInt(r.total)
      })),
      por_edad: edad.map(r => ({
        rango: r.rango,
        total: parseInt(r.total)
      })),
    });

  } catch (error) {
    console.error('Error en getMetricasUsuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getMetricasCampanas = async (req, res) => {
  const { filtro = 'total' } = req.query;
  const filtroCanje = getFiltroFecha(filtro, 'cu.canjeado_en');
  const filtroAsig  = getFiltroFecha(filtro, 'cu.asignado_en');

  try {
    const { rows: conversion } = await pool.query(
      `SELECT
         cc.id            AS campana_id,
         cc.titulo,
         co.nombre        AS comercio,
         co.categoria,
         COUNT(cu.id)                                                        AS total_emitidos,
         COUNT(cu.id) FILTER (WHERE cu.estado = 'canjeado')                 AS total_canjeados,
         COUNT(cu.id) FILTER (WHERE cu.estado = 'disponible')               AS total_disponibles,
         COUNT(cu.id) FILTER (WHERE cu.estado = 'expirado')                 AS total_expirados,
         ROUND(
           COUNT(cu.id) FILTER (WHERE cu.estado = 'canjeado') * 100.0
           / NULLIF(COUNT(cu.id), 0), 2
         )                                                                   AS tasa_conversion
       FROM campanas_cupones cc
       JOIN comercios co ON co.id = cc.comercio_id
       LEFT JOIN cupones cu ON cu.campana_id = cc.id ${filtroAsig}
       GROUP BY cc.id, cc.titulo, co.nombre, co.categoria
       ORDER BY tasa_conversion DESC NULLS LAST`
    );

    const { rows: porTipo } = await pool.query(
      `SELECT
         cc.tipo_descuento,
         COUNT(cu.id)                                              AS total_emitidos,
         COUNT(cu.id) FILTER (WHERE cu.estado = 'canjeado')       AS total_canjeados,
         ROUND(
           COUNT(cu.id) FILTER (WHERE cu.estado = 'canjeado') * 100.0
           / NULLIF(COUNT(cu.id), 0), 2
         )                                                         AS tasa_conversion,
         ROUND(AVG(cc.valor_descuento), 2)                        AS valor_promedio
       FROM campanas_cupones cc
       LEFT JOIN cupones cu ON cu.campana_id = cc.id ${filtroAsig}
       GROUP BY cc.tipo_descuento
       ORDER BY tasa_conversion DESC NULLS LAST`
    );

    const { rows: [{ total_canjeados }] } = await pool.query(
      `SELECT COUNT(*) AS total_canjeados
       FROM cupones cu
       WHERE cu.estado = 'canjeado' ${filtroCanje}`
    );

    const { rows: cruzado } = await pool.query(
      `SELECT
         COALESCE(NULLIF(TRIM(u.nacionalidad), ''), 'No especificado') AS nacionalidad,
         COALESCE(NULLIF(TRIM(u.genero), ''), 'No especificado')       AS genero,
         sub.rango_edad,
         co.nombre    AS comercio,
         co.categoria,
         COUNT(hc.id) AS canjes
       FROM historial_canjes hc
       JOIN usuarios u ON u.id = hc.usuario_id
       JOIN (
         SELECT id,
           CASE
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 18  THEN 'Menor de 18'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 25  THEN '18-24'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 35  THEN '25-34'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 45  THEN '35-44'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) < 55  THEN '45-54'
             WHEN DATE_PART('year', AGE(fecha_nacimiento)) >= 55 THEN '55+'
             ELSE 'No especificado'
           END AS rango_edad
         FROM usuarios
       ) sub ON sub.id = u.id
       JOIN cupones cu          ON cu.id  = hc.cupon_id
       JOIN campanas_cupones cc ON cc.id  = cu.campana_id
       JOIN comercios co        ON co.id  = cc.comercio_id
       WHERE 1=1 ${getFiltroFecha(filtro, 'hc.canjeado_en')}
       GROUP BY 1, 2, 3, 4, 5
       ORDER BY canjes DESC`
    );

    res.json({
      total_canjeados: parseInt(total_canjeados),
      por_campana: conversion.map(r => ({
        ...r,
        total_emitidos:    parseInt(r.total_emitidos),
        total_canjeados:   parseInt(r.total_canjeados),
        total_disponibles: parseInt(r.total_disponibles),
        total_expirados:   parseInt(r.total_expirados),
        tasa_conversion:   parseFloat(r.tasa_conversion) || 0,
      })),
      por_tipo_descuento: porTipo.map(r => ({
        ...r,
        total_emitidos:  parseInt(r.total_emitidos),
        total_canjeados: parseInt(r.total_canjeados),
        tasa_conversion: parseFloat(r.tasa_conversion) || 0,
        valor_promedio:  parseFloat(r.valor_promedio)  || 0,
      })),
      cruzado: cruzado.map(r => ({
        ...r,
        canjes: parseInt(r.canjes),
      })),
    });

  } catch (error) {
    console.error('Error en getMetricasCampanas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getMetricasComercio = async (req, res) => {
  const { filtro = 'total' } = req.query;
  const filtroCanje = getFiltroFecha(filtro, 'hc.canjeado_en');

  try {
    const { rows: ranking } = await pool.query(
      `SELECT
         co.id,
         co.nombre,
         co.categoria,
         co.logo_url,
         COUNT(hc.id)                     AS total_canjeados,
         COUNT(DISTINCT hc.usuario_id)    AS usuarios_unicos,
         COUNT(cu.id)                     AS total_emitidos,
         ROUND(
           COUNT(hc.id) * 100.0
           / NULLIF(COUNT(cu.id), 0), 2
         )                                AS roi_pct
       FROM comercios co
       LEFT JOIN campanas_cupones cc ON cc.comercio_id = co.id
       LEFT JOIN cupones cu          ON cu.campana_id  = cc.id
       LEFT JOIN historial_canjes hc ON hc.cupon_id    = cu.id ${filtroCanje}
       WHERE co.activo = true
       GROUP BY co.id, co.nombre, co.categoria, co.logo_url
       ORDER BY total_canjeados DESC`
    );

    const { rows: horasPico } = await pool.query(
      `SELECT
         co.nombre                              AS comercio,
         EXTRACT(HOUR FROM hc.canjeado_en)::int AS hora,
         COUNT(hc.id)                           AS canjes
       FROM historial_canjes hc
       JOIN cupones cu          ON cu.id  = hc.cupon_id
       JOIN campanas_cupones cc ON cc.id  = cu.campana_id
       JOIN comercios co        ON co.id  = cc.comercio_id
       WHERE hc.canjeado_en IS NOT NULL ${filtroCanje}
       GROUP BY 1, 2
       ORDER BY co.nombre, hora`
    );

    const { rows: roi } = await pool.query(
      `SELECT
         co.nombre,
         co.categoria,
         ROUND(SUM(cc.valor_descuento) FILTER (WHERE cu.estado = 'canjeado'), 2) AS valor_total_canjeado,
         COUNT(cu.id) FILTER (WHERE cu.estado = 'canjeado')                      AS cupones_canjeados,
         COUNT(cu.id)                                                             AS cupones_emitidos,
         ROUND(
           COUNT(cu.id) FILTER (WHERE cu.estado = 'canjeado') * 100.0
           / NULLIF(COUNT(cu.id), 0), 2
         )                                                                        AS roi_pct
       FROM comercios co
       JOIN campanas_cupones cc ON cc.comercio_id = co.id
       JOIN cupones cu          ON cu.campana_id  = cc.id
       WHERE co.activo = true
       GROUP BY co.nombre, co.categoria
       ORDER BY roi_pct DESC NULLS LAST`
    );

    res.json({
      ranking: ranking.map(r => ({
        ...r,
        total_canjeados: parseInt(r.total_canjeados) || 0,
        usuarios_unicos: parseInt(r.usuarios_unicos) || 0,
        total_emitidos:  parseInt(r.total_emitidos)  || 0,
        roi_pct:         parseFloat(r.roi_pct)       || 0,
      })),
      horas_pico: horasPico.map(r => ({
        ...r,
        hora:   parseInt(r.hora),
        canjes: parseInt(r.canjes),
      })),
      roi: roi.map(r => ({
        ...r,
        valor_total_canjeado: parseFloat(r.valor_total_canjeado) || 0,
        cupones_canjeados:    parseInt(r.cupones_canjeados)      || 0,
        cupones_emitidos:     parseInt(r.cupones_emitidos)       || 0,
        roi_pct:              parseFloat(r.roi_pct)              || 0,
      })),
    });

  } catch (error) {
    console.error('Error en getMetricasComercio:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

export const getMetricasKioskos = async (req, res) => {
  const { filtro = 'total' } = req.query;
  const filtroFecha = getFiltroFecha(filtro, 'uk.completado_en');

  try {
    const { rows: sesiones } = await pool.query(
      `SELECT
         k.id,
         k.nombre,
         k.ubicacion,
         l.nombre                                                             AS lugar,
         COUNT(uk.id)                                                         AS total_interacciones,
         COUNT(uk.id) FILTER (WHERE uk.usuario_id IS NOT NULL)               AS con_sesion,
         COUNT(uk.id) FILTER (WHERE uk.usuario_id IS NULL
                                 OR uk.video_url IS NULL)                    AS sin_sesion,
         ROUND(
           COUNT(uk.id) FILTER (WHERE uk.usuario_id IS NULL
                                    OR uk.video_url IS NULL) * 100.0
           / NULLIF(COUNT(uk.id), 0), 2
         )                                                                    AS pct_sin_sesion,
         COUNT(uk.id) FILTER (WHERE uk.video_url IS NOT NULL)                AS con_video
       FROM kioskos k
       LEFT JOIN lugares l           ON l.id  = k.lugar_id
       LEFT JOIN usuarios_kioskos uk ON uk.kiosko_id = k.id ${filtroFecha}
       WHERE k.activo = true
       GROUP BY k.id, k.nombre, k.ubicacion, l.nombre
       ORDER BY total_interacciones DESC`
    );

    const { rows: qrScans } = await pool.query(
      `SELECT
         k.nombre,
         k.ubicacion,
         COUNT(uk.id) FILTER (
           WHERE uk.usuario_id IS NOT NULL
             AND uk.video_url  IS NOT NULL
         ) AS escaneos_qr,
         COUNT(DISTINCT uk.usuario_id) FILTER (
           WHERE uk.usuario_id IS NOT NULL
         ) AS usuarios_unicos
       FROM kioskos k
       LEFT JOIN usuarios_kioskos uk ON uk.kiosko_id = k.id ${filtroFecha}
       WHERE k.activo = true
       GROUP BY k.nombre, k.ubicacion
       ORDER BY escaneos_qr DESC`
    );

    const { rows: [totales] } = await pool.query(
      `SELECT
         COUNT(uk.id)                                             AS total_interacciones,
         COUNT(uk.id) FILTER (WHERE uk.video_url  IS NOT NULL
                                AND uk.usuario_id IS NOT NULL)   AS completaron_flujo,
         COUNT(uk.id) FILTER (WHERE uk.video_url  IS NULL
                                 OR uk.usuario_id IS NULL)       AS no_completaron,
         ROUND(
           COUNT(uk.id) FILTER (WHERE uk.video_url  IS NOT NULL
                                  AND uk.usuario_id IS NOT NULL) * 100.0
           / NULLIF(COUNT(uk.id), 0), 2
         )                                                       AS pct_completaron
       FROM usuarios_kioskos uk
       WHERE 1=1 ${filtroFecha}`
    );

    res.json({
      totales: {
        total_interacciones: parseInt(totales.total_interacciones) || 0,
        completaron_flujo:   parseInt(totales.completaron_flujo)   || 0,
        no_completaron:      parseInt(totales.no_completaron)      || 0,
        pct_completaron:     parseFloat(totales.pct_completaron)   || 0,
      },
      por_kiosko: sesiones.map(r => ({
        ...r,
        total_interacciones: parseInt(r.total_interacciones) || 0,
        con_sesion:          parseInt(r.con_sesion)          || 0,
        sin_sesion:          parseInt(r.sin_sesion)          || 0,
        pct_sin_sesion:      parseFloat(r.pct_sin_sesion)    || 0,
        con_video:           parseInt(r.con_video)           || 0,
      })),
      qr_scans: qrScans.map(r => ({
        ...r,
        escaneos_qr:     parseInt(r.escaneos_qr)     || 0,
        usuarios_unicos: parseInt(r.usuarios_unicos) || 0,
      })),
    });

  } catch (error) {
    console.error('Error en getMetricasKioskos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};