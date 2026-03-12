// src/services/partidos.service.js
import pool from '../config/db.js';

/**
 * Próximos partidos (desde hoy en adelante)
 */
export async function getProximosPartidos(limite = 5) {
  const query = `
    SELECT
      numero_partido, equipo_local, equipo_visitante,
      TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha_display,
      TO_CHAR(hora_mty, 'HH24:MI') AS hora_display,
      estadio, sede_ciudad, fase, grupo
    FROM partidos
    WHERE activo = true
      AND fecha >= CURRENT_DATE
    ORDER BY fecha, hora_mty
    LIMIT $1;
  `;
  const { rows } = await pool.query(query, [limite]);
  return rows;
}

/**
 * Partidos de un equipo específico
 */
export async function getPartidosPorEquipo(equipo) {
  const query = `
    SELECT
      numero_partido, equipo_local, equipo_visitante,
      TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha_display,
      TO_CHAR(hora_mty, 'HH24:MI') AS hora_display,
      estadio, sede_ciudad, fase, grupo
    FROM partidos
    WHERE activo = true
      AND (
        LOWER(equipo_local)      ILIKE $1 OR
        LOWER(equipo_visitante)  ILIKE $1
      )
    ORDER BY fecha;
  `;
  const { rows } = await pool.query(query, [`%${equipo.toLowerCase()}%`]);
  return rows;
}

/**
 * Partidos de hoy
 */
export async function getPartidosHoy() {
  const query = `
    SELECT
      numero_partido, equipo_local, equipo_visitante,
      TO_CHAR(hora_mty, 'HH24:MI') AS hora_display,
      estadio, sede_ciudad, fase, grupo
    FROM partidos
    WHERE activo = true
      AND fecha = CURRENT_DATE
    ORDER BY hora_mty;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Partidos en Monterrey
 */
export async function getPartidosMonterrey() {
  const query = `
    SELECT
      numero_partido, equipo_local, equipo_visitante,
      TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha_display,
      TO_CHAR(hora_mty, 'HH24:MI') AS hora_display,
      estadio, sede_ciudad, fase, grupo
    FROM partidos
    WHERE activo = true
      AND sede_ciudad = 'Monterrey'
    ORDER BY fecha;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Partidos por fase
 */
export async function getPartidosPorFase(fase) {
  const query = `
    SELECT
      numero_partido, equipo_local, equipo_visitante,
      TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha_display,
      TO_CHAR(hora_mty, 'HH24:MI') AS hora_display,
      estadio, sede_ciudad, fase, grupo
    FROM partidos
    WHERE activo = true
      AND LOWER(fase) ILIKE $1
    ORDER BY fecha;
  `;
  const { rows } = await pool.query(query, [`%${fase.toLowerCase()}%`]);
  return rows;
}