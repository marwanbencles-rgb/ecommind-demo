// netlify/functions/tts.js

// --- ElevenLabs TTS proxy (secure, CORS, no secret leakage) ---
// Attend un POST JSON: { text: string, lang?: 'fr'|'en'|'es'|'de'|'it'|'ar' }
// Utilise les variables d'env suivantes (à définir dans Netlify):
//   ELEVEN_API_KEY        -> (obligatoire)
//   ELEVEN_MODEL_ID       -> ex: 'eleven_turbo_v2_5' (optionnel, valeur par défaut)
//   ELEVEN_VOICE_FR       -> ID voix FR (optionnel)
//   ELEVEN_VOICE_EN       -> ID voix EN (optionnel)
//   ELEVEN_VOICE_ES       -> ID voix ES (optionnel)
//   ELEVEN_VOICE_DE       -> ID voix DE (optionnel)
//   ELEVEN_VOICE_IT       -> ID voix IT (optionnel)
//   ELEVEN_VOICE_AR       -> ID voix AR (optionnel)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handler(event) {
  // Préflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'no-store',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonError(405, 'Method not allowed. Use POST.');
  }

  try {
    // 0) Vérifs env minimales
    const apiKey = process.env.ELEVEN_API_KEY;
    if (!apiKey) return jsonError(500, 'TTS unavailable: missing ELEVEN_API_KEY');

    // 1) Parse body
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return jsonError(400, 'Invalid JSON body');
    }

    const rawText = (payload.text || '').toString().trim();
    const lang = (payload.lang || '').toString().trim().toLowerCase();

    if (!rawText) return jsonError(400, 'EMPTY_INPUT');

    // 2) Choix voix par langue (tout via env)
    const voiceMap = {
      fr: process.env.ELEVEN_VOICE_FR,
      en: process.env.ELEVEN_VOICE_EN,
      es: process.env.ELEVEN_VOICE_ES,
      de: process.env.ELEVEN_VOICE_DE,
      it: process.env.ELEVEN_VOICE_IT,
      ar: process.env.ELEVEN_VOICE_AR,
    };

    // Langue => voix, fallback sur EN si dispo
    const voiceId =
      voiceMap[lang] ||
      process.env.ELEVEN_VOICE_EN ||
      voiceMap.fr || // au cas où tu n’as que FR
      null;

    if (!voiceId) {
      return jsonError(500, 'TTS unavailable: no voice configured for this language');
    }

    // 3) Modèle (optionnel)
    const modelId = process.env.ELEVEN_MODEL_ID || 'eleven_turbo_v2_5';

    // 4) Appel ElevenLabs (audio/mpeg)
    // API: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

    // (Optionnel) limites simples pour éviter abuse
    const text = rawText.slice(0, 800); // coupe à ~800 chars

    const body = {
      model_id: modelId,
      text,
      // Optionnel: ajuster le rendu
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
      // format par défaut = audio/mpeg
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(body),
    });

    // 5) Gestion erreurs côté ElevenLabs
    if (!resp.ok) {
      let errMsg = `TTS upstream error (${resp.status})`;
      try {
        const errJson = await resp.json();
        if (errJson && errJson.detail) {
          errMsg = Array.isArray(errJson.detail)
            ? errJson.detail.map(d => d?.msg || '').join(' | ')
            : (errJson.detail?.msg || errMsg);
        }
      } catch {
        // ignore JSON parse errors, we keep default message
      }
      return jsonError(resp.status, errMsg);
    }

    // 6) Retourne le flux audio mp3
    const audioBuffer = Buffer.from(await resp.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Content-Length': String(audioBuffer.length),
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e) {
    // Ne jamais exposer de secrets, juste un message générique
    return jsonError(500, 'TTS internal error');
  }
}

// Helper: réponse JSON d’erreur (sans fuite d’infos)
function jsonError(status, message) {
  return {
    statusCode: status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ ok: false, error: message }),
  };
}
