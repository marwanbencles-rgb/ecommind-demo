// netlify/functions/tts.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: "Missing ELEVENLABS_API_KEY" };
    }

    const { text, lang = "en", voiceId } = JSON.parse(event.body || "{}");
    if (!text || !voiceId) {
      return { statusCode: 400, body: "Missing 'text' or 'voiceId'" };
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;
    const payload = {
      text,
      model_id: lang === "ar" ? "eleven_multilingual_v2" : "eleven_turbo_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.8 }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return { statusCode: res.status, body: `TTS error: ${errTxt}` };
    }

    const arrayBuffer = await res.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      },
      body: Buffer.from(arrayBuffer).toString("base64"),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, body: `Server error: ${e.message}` };
  }
}
