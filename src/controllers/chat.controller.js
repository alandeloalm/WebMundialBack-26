// src/controllers/chat.controller.js
import { chatConGemini, elegirAvatar, AVATARES }                   from '../services/gemini.service.js';
import { getLugaresCercanos, buscarLugares, getLugaresPorCategoria } from '../services/lugares.service.js';
import { getProximosPartidos, getPartidosPorEquipo, getPartidosHoy, getPartidosMonterrey } from '../services/partidos.service.js';
import { getContextoEmergencias }                                   from '../services/emergencias.service.js';

// Historial + avatar por sesión
const sesiones = new Map();

/**
 * POST /api/chat
 * Body: { mensaje, sessionId, lat?, lng? }
 */
export async function procesarMensaje(req, res) {
  try {
    const { mensaje, sessionId = 'default', lat, lng } = req.body;

    if (!mensaje?.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // Crear sesión si no existe — elige avatar al azar UNA vez por sesión
    if (!sesiones.has(sessionId)) {
      sesiones.set(sessionId, { historial: [], avatar: elegirAvatar() });
    }
    const sesion = sesiones.get(sessionId);

    const contexto = await obtenerContexto(mensaje, lat, lng);
    const respuesta = await chatConGemini(mensaje, contexto, sesion.historial, sesion.avatar);

    sesion.historial.push({ role: 'user',  text: mensaje  });
    sesion.historial.push({ role: 'model', text: respuesta });
    if (sesion.historial.length > 20) sesion.historial.splice(0, 2);

    return res.json({
      respuesta,
      avatar:   sesion.avatar,                  // 'chicharron' | 'macarron'
      avatarInfo: AVATARES[sesion.avatar],       // { nombre, emoji, imagen }
      lugares:  contexto.lugares  || [],
      partidos: contexto.partidos || []
    });

  } catch (error) {
    console.error('Error en chat.controller:', error);
    return res.status(500).json({ error: 'Ocurrió un error, intenta de nuevo' });
  }
}

async function obtenerContexto(mensaje, lat, lng) {
  const msg = mensaje.toLowerCase();
  const contexto = {};

  // ── EMERGENCIAS ──────────────────────────────────────────
  if (/emergencia|policia|policía|ambulancia|bombero|hospital|accidente|robo|911|auxilio|herido|urgencia/.test(msg)) {
    contexto.emergencias = getContextoEmergencias();
  }

  // ── PARTIDOS ─────────────────────────────────────────────
  if (/partido|juego|juega|juegan|mundial|horario|cuando|cuándo|seleccion|selección|equipo|fase|grupo|octavo|cuarto|semifinal|final|fixture/.test(msg)) {
    const equipos = [
      'argentina', 'brasil', 'mexico', 'méxico', 'españa', 'espana',
      'alemania', 'francia', 'portugal', 'belgica', 'bélgica',
      'croacia', 'marruecos', 'japon', 'japón', 'australia', 'holanda',
      'países bajos', 'inglaterra', 'colombia', 'uruguay', 'ecuador',
      'estados unidos', 'canada', 'canadá', 'corea', 'tunez', 'túnez',
      'sudafrica', 'sudáfrica', 'senegal', 'noruega', 'suiza', 'polonia',
      'ucrania', 'austria', 'dinamarca'
    ];

    if (/monterrey|bbva|sede local/.test(msg)) {
      contexto.partidos = await getPartidosMonterrey();
    } else if (/hoy/.test(msg)) {
      contexto.partidos = await getPartidosHoy();
    } else {
      const equipoEncontrado = equipos.find(e => msg.includes(e));
      contexto.partidos = equipoEncontrado
        ? await getPartidosPorEquipo(equipoEncontrado)
        : await getProximosPartidos(5);
    }
  }

  // ── LUGARES ──────────────────────────────────────────────
  if (/restaurante|comer|comida|kiosco|quiosco|atraccion|atracción|lugar|cerca|visitar|donde|dónde|recomiend|museo|parque|transporte|metro|como llegar/.test(msg)) {
    let categoria = null;
    if (/restaurante|comer|comida|taco|cabrito|mariscos/.test(msg)) categoria = 'restaurant';
    else if (/kiosco|quiosco/.test(msg))                            categoria = 'kiosko';
    else if (/museo/.test(msg))                                     categoria = 'museum';
    else if (/parque|atraccion|atracción|visitar/.test(msg))        categoria = 'attraction';
    else if (/metro|transporte|estacion|estación/.test(msg))        categoria = 'transport';

    if (lat && lng) {
      contexto.lugares = await getLugaresCercanos({ lat, lng, categoria, limite: 5 });
    } else if (categoria) {
      contexto.lugares = await getLugaresPorCategoria(categoria, 5);
    } else {
      const termino = extraerTermino(msg);
      if (termino) contexto.lugares = await buscarLugares({ texto: termino, limite: 5 });
    }
  }

  return contexto;
}

function extraerTermino(mensaje) {
  const stopwords = ['donde', 'dónde', 'hay', 'está', 'están', 'puedo', 'ir', 'me', 'un', 'una',
    'el', 'la', 'los', 'las', 'de', 'en', 'a', 'que', 'recomiendas', 'cerca', 'quiero', 'como'];
  return mensaje.split(/\s+/)
    .filter(p => !stopwords.includes(p) && p.length > 2)
    .slice(0, 3).join(' ');
}

export function limpiarSesion(req, res) {
  sesiones.delete(req.params.sessionId);
  res.json({ ok: true });
}