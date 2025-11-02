// Netlify Function — Text-to-Speech (ElevenLabs)
// Langues prises en charge : fr, en, ar (détection simple par préfixe)
// Variables d'environnement requises :
// ELEVENLABS_API_KEY
// ELEVEN_VOICE_FR, ELEVEN_VOICE_EN, ELEVEN_VOICE_AR (IDs voix ElevenLabs)
// ELEVEN_VOICE_DEFAULT (optionnelle)
// ELEVEN_MODEL_ID (optionnelle, défaut: "eleven_multilingual_v2")

const ELEVEN_API = 'https://api.elevenlabs.io/v1/text-to-speech/';

function ok(body, headers = {}) {
  return { statusCode: 200, headers, body };
}
function err(status, message) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: false, error: message }),
  };
}

export async function handler(event) {
  // CORS & préflight
  if (event.httpMethod === 'OPTIONS') {
    return ok('', {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }

  if (event.httpMethod !== 'POST') {
    return err(405, 'Use POST');
  }

  // Vérif env
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return err(500, 'Missing ELEVENLABS_API_KEY');

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return err(400, 'Invalid JSON');
  }

  const rawText = (body.text || '').toString().trim();
  if (!rawText) return err(400, 'Text is required');

  // Détermination de la langue → voix
  const langIn = (body.lang || 'fr').toLowerCase();
  const lang =
    langIn.startsWith('fr') ? 'fr' :
    langIn.startsWith('en') ? 'en' :
    langIn.startsWith('ar') ? 'ar' : 'en';

  const voiceMap = {
    fr: process.env.ELEVEN_VOICE_FR,
    en: process.env.ELEVEN_VOICE_EN,
    ar: process.env.ELEVEN_VOICE_AR,
  };

  const voiceId =
    voiceMap[lang] ||
    process.env.ELEVEN_VOICE_DEFAULT ||
    voiceMap.en;

  if (!voiceId) {
    return err(500, 'Missing voice ID env vars (ELEVEN_VOICE_FR/EN/AR or ELEVEN_VOICE_DEFAULT)');
  }

  const modelId = process.env.ELEVEN_MODEL_ID || 'eleven_multilingual_v2';

  try {
    // Requête ElevenLabs (MP3 44.1k / 128 kbps)
    const qs = new URLSearchParams({
      optimize_streaming_latency: '0',
      output_format: 'mp3_44100_128',
    }).toString();

    const res = await fetch(`${ELEVEN_API}${voiceId}?${qs}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: modelId,
        text: rawText,
        // Optionnel : ajustez au besoin
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return err(res.status, `ElevenLabs error ${res.status}: ${txt.slice(0, 200)}`);
    }

    // Binaire → base64 pour Netlify
    const arrayBuf = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString('base64');

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
      body: base64,
    };
  } catch (e) {
    return err(500, `TTS failed: ${e.message || e}`);
  }
}
