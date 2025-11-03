// netlify/functions/tts.js
// ✅ Proxy ElevenLabs TTS sécurisé + compatible Netlify Functions
// - Gère CORS (OPTIONS)
// - Cache la clé API
// - Choix auto du modèle selon la langue (ar -> multilingual)
// - Retourne un MP3 en base64 (Content-Type: audio/mpeg)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event) {
  try {
    // 1) Préflight CORS
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: CORS_HEADERS, body: "OK" };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: CORS_HEADERS,
        body: "Method Not Allowed",
      };
    }

    // 2) Sécurité: clé côté serveur uniquement
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: "Missing ELEVENLABS_API_KEY",
      };
    }

    // 3) Payload
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: "Invalid JSON body",
      };
    }

    const { text, lang = "en", voiceId, modelId } = body || {};
    if (!text || !voiceId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: "Missing 'text' or 'voiceId'",
      };
    }

    // 4) Choix modèle (auto) + paramètres stables
    const resolvedModel =
      modelId || (lang === "ar" ? "eleven_multilingual_v2" : "eleven_turbo_v2");

    const payload = {
      text,
      model_id: resolvedModel,
      voice_settings: { stability: 0.6, similarity_boost: 0.8 },
      // Optionnel: latence optimisée (0-4). 0 = plus rapide.
      // optimize_streaming_latency: 0,
      // output_format: "mp3_44100", // format par défaut OK via Accept
    };

    // 5) Appel ElevenLabs (endpoint stream = latence faible)
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(payload),
    });

    // 6) Gestion d'erreurs lisibles
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        statusCode: res.status,
        headers: CORS_HEADERS,
        body: `TTS error (${res.status}): ${errText || "Unknown error"}`,
      };
    }

    // 7) Retour audio (base64)
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
      body: base64,
      isBase64Encoded: true,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: `Server error: ${e.message}`,
    };
  }
}
