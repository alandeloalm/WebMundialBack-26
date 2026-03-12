import pool from '../config/db.js';

export async function getLugaresCercanos({ lat, lng, categoria, limite = 5 }) {
  let whereClause = '';
  const params = [lat, lng, lat];

  if (categoria) {
    whereClause = `AND LOWER(categoria) = LOWER($4)`;
    params.push(categoria);
  }

  const query = `
    SELECT
      id, nombre, descripcion, categoria,
      latitud, longitud, imagen_url,
      (
        6371000 * acos(
          cos(radians($1)) * cos(radians(latitud)) *
          cos(radians(longitud) - radians($2)) +
          sin(radians($3)) * sin(radians(latitud))
        )
      )::INT AS distancia_metros
    FROM lugares
    WHERE activo = true
      AND latitud IS NOT NULL
      AND longitud IS NOT NULL
      ${whereClause}
    ORDER BY distancia_metros ASC
    LIMIT ${limite};
  `;

  const { rows } = await pool.query(query, params);
  return rows.map(r => ({
    ...r,
    distancia_texto: formatearDistancia(r.distancia_metros),
    maps_url: `https://www.google.com/maps/dir/?api=1&destination=${r.latitud},${r.longitud}`
  }));
}

export async function buscarLugares({ texto, limite = 5 }) {
  const query = `
    SELECT id, nombre, descripcion, categoria, latitud, longitud, imagen_url
    FROM lugares
    WHERE activo = true
      AND (
        nombre      ILIKE $1 OR
        descripcion ILIKE $1 OR
        categoria   ILIKE $1
      )
    LIMIT $2;
  `;
  const { rows } = await pool.query(query, [`%${texto}%`, limite]);
  return rows.map(r => ({
    ...r,
    maps_url: `https://www.google.com/maps/dir/?api=1&destination=${r.latitud},${r.longitud}`
  }));
}

export async function getLugaresPorCategoria(categoria, limite = 5) {
  const query = `
    SELECT id, nombre, descripcion, categoria, latitud, longitud, imagen_url
    FROM lugares
    WHERE activo = true
      AND LOWER(categoria) = LOWER($1)
    LIMIT $2;
  `;
  const { rows } = await pool.query(query, [categoria, limite]);
  return rows.map(r => ({
    ...r,
    maps_url: `https://www.google.com/maps/dir/?api=1&destination=${r.latitud},${r.longitud}`
  }));
}

function formatearDistancia(metros) {
  if (metros < 100)  return 'a menos de 100 metros';
  if (metros < 500)  return `a ${metros} metros`;
  if (metros < 1000) return `a ${metros} metros (unos ${Math.round(metros / 80)} min caminando)`;
  const km = (metros / 1000).toFixed(1);
  const min = Math.round(metros / 500);
  return `a ${km} km (aprox. ${min} min en carro)`;
}