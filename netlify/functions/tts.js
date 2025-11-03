// netlify/functions/tts.js
export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS")
      return { statusCode: 200, headers: cors(), body: "OK" };
    if (event.httpMethod !== "POST")
      return { statusCode: 405, headers: cors(), body: "Method Not Allowed" };

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

    const { text, lang = "fr", voiceId, modelId } = JSON.parse(event.body || "{}");
    if (!text || !voiceId)
      return { statusCode: 400, headers: cors(), body: "Missing 'text' or 'voiceId'" };

    const model = modelId || (lang === "ar" ? "eleven_multilingual_v2" : "eleven_turbo_v2");
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.6, similarity_boost: 0.8 }
      })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { statusCode: res.status, headers: cors(), body: `TTS error: ${txt}` };
    }

    const ab = await res.arrayBuffer();
    return {
      statusCode: 200,
      headers: { ...cors(), "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      body: Buffer.from(ab).toString("base64"),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: `Server error: ${e.message}` };
  }
}
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
