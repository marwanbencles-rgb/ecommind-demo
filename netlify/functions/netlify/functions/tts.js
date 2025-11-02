// netlify/functions/tts.js
// --- TTS ElevenLabs, robuste + CORS + multi-lang ---
// Exige les variables d'env suivantes sur Netlify:
//   ELEVENLABS_API_KEY               (clé ElevenLabs)
//   ELEVEN_MODEL_ID                  (ex: "eleven_multilingual_v2") (optionnel, défaut ci-dessous)
//   ELEVEN_VOICE_DEFAULT             (ID voix fallback)
//   ELEVEN_VOICE_FR / EN / ES / DE / IT / AR  (optionnels)
// NB: AUCUNE clé n’est codée en dur (évite l'échec "secrets scanning").

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

exports.handler = async (event) => {
  // Préflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...CORS }, body: '' };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { ...JSON_HEADERS, ...CORS },
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Sécurité: empêche tailles gigantesques
    if (!event.body || event.body.length > 50_000) {
      return {
        statusCode: 400,
        headers: { ...JSON_HEADERS, ...CORS },
        body: JSON.stringify({ error: 'Requête invalide ou trop volumineuse.' }),
      };
    }

    const { text, lang } = JSON.parse(event.body || '{}');

    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        statusCode: 400,
        headers: { ...JSON_HEADERS, ...CORS },
        body: JSON.stringify({ error: 'Texte manquant.' }),
      };
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { ...JSON_HEADERS, ...CORS },
        body: JSON.stringify({ error: 'ELEVENLABS_API_KEY absent des variables Netlify.' }),
      };
    }

    const modelId = process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2';

    // Mapping des voix par langue (ID voix à définir dans Netlify)
    const voiceMap = {
      fr: process.env.ELEVEN_VOICE_FR,
      en: process.env.ELEVEN_VOICE_EN,
      es: process.env.ELEVEN_VOICE_ES,
      de: process.env.ELEVEN_VOICE_DE,
      it: process.env.ELEVEN_VOICE_IT,
      ar: process.env.ELEVEN_VOICE_AR,
    };

    const langNorm = (lang || '').toString().slice(0, 2).toLowerCase();
    let voiceId =
      voiceMap[langNorm] ||
      process.env.ELEVEN_VOICE_DEFAULT ||
      voiceMap['fr'] ||
      voiceMap['en'];

    if (!voiceId) {
      return {
        statusCode: 500,
        headers: { ...JSON_HEADERS, ...CORS },
        body: JSON.stringify({
          error:
            "Aucune voix n'est configurée. Ajoutez ELEVEN_VOICE_DEFAULT ou ELEVEN_VOICE_FR/EN/... dans les variables d'environnement Netlify.",
        }),
      };
    }

    // Appel ElevenLabs Text-to-Speech
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const payload = {
      model_id: modelId,
      text: text.trim(),
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.7,
      },
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errTxt = await r.text().catch(() => '');
      return {
        statusCode: 502,
        headers: { ...JSON_HEADERS, ...CORS },
        body: JSON.stringify({
          error: 'Échec ElevenLabs',
          status: r.status,
          body: errTxt.slice(0, 800),
        }),
      };
    }

    const buf = Buffer.from(await r.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        ...CORS,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...JSON_HEADERS, ...CORS },
      body: JSON.stringify({
        error: 'Erreur interne TTS',
        detail: err?.message || String(err),
      }),
    };
  }
};
