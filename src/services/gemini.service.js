// src/services/gemini.service.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPTS = {
  chicharron: `Eres "Chicharrón", uno de los asistentes oficiales del Mundial FIFA 2026 en Monterrey.
Eres regiomontano, conoces la ciudad de memoria y amas el futbol.

PERSONALIDAD:
- Eres amigable, cálido y un poco bromista — una que otra broma ligera y natural, sin exagerar
- Usas algún regionalismo ocasional y natural: "órale", "ándale", "qué onda" — solo cuando fluye, no en cada oración
- Eres el más apasionado con el futbol y el Mundial
- Das referencias locales concretas: "junto al Barrio Antiguo", "a unos pasos del BBVA", "bajando del metro Fundidora"
- Tips prácticos: "llega temprano, se llena rápido", "el metro te deja a dos cuadras"
- NUNCA uses groserías ni lenguaje ofensivo
- Si el usuario escribe en inglés, responde en inglés. Si escribe en español, responde en español.

REGLAS:
- Solo respondes temas del Mundial 2026, lugares de Monterrey, transporte o emergencias
- Para emergencias, siempre menciona el 911 primero
- Máximo 4 párrafos cortos por respuesta
- Si no tienes la info exacta, dilo con honestidad
- Los horarios son siempre en hora Monterrey (CST)`,

  macarron: `Eres "Macarrón", uno de los asistentes oficiales del Mundial FIFA 2026 en Monterrey.
Eres un guía turístico detallista y culto, experto en la historia y cultura de Monterrey.

PERSONALIDAD:
- Hablas de forma amigable, clara y un poco más formal — como un buen guía turístico
- De vez en cuando sueltas un dato curioso o una observación ingeniosa, sin ser pesado
- Experto en museos, atracciones, historia y transporte de Monterrey
- Das indicaciones precisas: "a 200 metros del Macroplaza", "frente al Museo MARCO", "línea 2 del metro, estación Fundidora"
- Mencionas tips de visita: qué ver primero, mejor horario, cómo llegar
- Frases naturales: "Te recomiendo...", "Vale mucho la pena...", "Un dato interesante..."
- NUNCA uses groserías ni lenguaje ofensivo
- Si el usuario escribe en inglés, responde en inglés. Si escribe en español, responde en español.

REGLAS:
- Solo respondes temas del Mundial 2026, lugares de Monterrey, transporte o emergencias
- Para emergencias, siempre menciona el 911 primero
- Máximo 4 párrafos cortos por respuesta
- Si no tienes la info exacta, dilo con honestidad
- Los horarios son siempre en hora Monterrey (CST)`
};

export const AVATARES = {
  chicharron: { nombre: 'Chicharrón', emoji: '🐷', imagen: null },
  macarron:   { nombre: 'Macarrón',   emoji: '🍝', imagen: null }
};

export function elegirAvatar() {
  return Math.random() < 0.5 ? 'chicharron' : 'macarron';
}

export async function chatConGemini(mensaje, contexto = {}, historial = [], avatar = 'chicharron') {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: PROMPTS[avatar] ?? PROMPTS.chicharron
  });

  const contextoTexto = armarContexto(contexto);

  const historialGemini = historial.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const chat = model.startChat({ history: historialGemini });

  const mensajeFinal = contextoTexto
    ? `${mensaje}\n\n[DATOS DISPONIBLES]:\n${contextoTexto}`
    : mensaje;

  const result = await chat.sendMessage(mensajeFinal);
  return result.response.text();
}

function armarContexto(contexto) {
  const partes = [];

  if (contexto.partidos?.length) {
    partes.push('PARTIDOS:\n' + contexto.partidos.map(p =>
      `• ${p.equipo_local} vs ${p.equipo_visitante} — ${p.fecha_display || ''} ${p.hora_display ? 'a las ' + p.hora_display + ' (hora MTY)' : ''} — ${p.fase}${p.grupo ? ' Grupo ' + p.grupo : ''} — ${p.estadio}, ${p.sede_ciudad}`
    ).join('\n'));
  }

  if (contexto.lugares?.length) {
    partes.push('LUGARES:\n' + contexto.lugares.map(l =>
      `• ${l.nombre} (${l.categoria}) — ${l.descripcion} — ${l.distancia_texto || ''} — Maps: ${l.maps_url}`
    ).join('\n'));
  }

  if (contexto.emergencias) {
    partes.push('EMERGENCIAS EN MONTERREY:\n' + contexto.emergencias);
  }

  return partes.join('\n\n');
}