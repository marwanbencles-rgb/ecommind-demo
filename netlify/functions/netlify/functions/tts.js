// Netlify Function – TTS (ElevenLabs)
// POST JSON: { text: string, lang?: "fr"|"en"|"es"|"de"|"it", voice?: "VOICE_ID" }
//
// Renvoyé: audio/mpeg (base64) — prêt à être joué dans le front.
// Ajoute des en-têtes CORS + no-store pour éviter les caches bizarres.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

const toJSON = (status, data) => ({
  statusCode: status,
  headers: { ...CORS, "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export async function handler(event) {
  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return toJSON(405, { error: "Method Not Allowed" });
  }

  // ---- Env checks
  const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
  if (!ELEVEN_API_KEY) {
    return toJSON(500, { error: "Missing ELEVEN_API_KEY in environment." });
  }

  const MODEL = process.env.ELEVEN_MODEL_ID || "eleven_multilingual_v2";

  // mapping des voix par langue (priorité: param `voice` > mapping langue > défaut)
  const VOICE_DEFAULT = process.env.ELEVEN_VOICE_DEFAULT || "";
  const VOICES = {
    fr: process.env.ELEVEN_VOICE_FR || "",
    en: process.env.ELEVEN_VOICE_EN || "",
    es: process.env.ELEVEN_VOICE_ES || "",
    de: process.env.ELEVEN_VOICE_DE || "",
    it: process.env.ELEVEN_VOICE_IT || "",
  };

  // ---- Parse payload
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return toJSON(400, { error: "Invalid JSON body." });
  }

  let { text = "", lang = "", voice = "" } = payload;

  if (typeof text !== "string" || !text.trim()) {
    return toJSON(400, { error: "Field `text` is required." });
  }

  text = text.trim();
  // garde-fou pour éviter des facturations surprises
  const MAX = 800; // tokens ~ rapide, à ajuster si besoin
  if (text.length > MAX) text = text.slice(0, MAX) + "…";

  // sélection de voix
  const voiceByLang = (lang && VOICES[lang]) ? VOICES[lang] : "";
  const voiceId = String(voice || voiceByLang || VOICE_DEFAULT).trim();

  if (!voiceId) {
    return toJSON(400, {
      error: "No voice configured.",
      hint: "Set ELEVEN_VOICE_DEFAULT or ELEVEN_VOICE_<LANG> in Netlify env, or pass {voice} in body."
    });
  }

  // ---- Appel ElevenLabs (stream)
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3`;

  const body = {
    text,
    model_id: MODEL,
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.35,
      use_speaker_boost: true,
    },
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      // essaie d’obtenir un message d’erreur exploitable
      let errTxt = "";
      try { errTxt = await r.text(); } catch {}
      return toJSON(r.status, {
        error: "ElevenLabs TTS error",
        status: r.status,
        details: errTxt?.slice(0, 2000) || "(no details)"
      });
    }

    // binaire -> base64 pour Netlify
    const arrayBuf = await r.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        ...CORS,
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buf.length)
      },
      body: buf.toString("base64"),
    };

  } catch (err) {
    // erreur réseau / fetch
    return toJSON(500, {
      error: "TTS request failed",
      message: err?.message || String(err)
    });
  }
}
