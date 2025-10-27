export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
    };
  }

  try {
    const { text, voice = "alloy", format = "mp3" } = JSON.parse(event.body || "{}");
    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing text" }),
      };
    }

const resp = await fetch("https://api.openai.com/v1/audio/speech", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    // modèle TTS très compatible
    model: "tts-1",          // <- important
    voice,                   // "alloy", "verse", "aria"...
    input: text,
    format: "mp3",
  }),
});


    if (!resp.ok) {
      const err = await resp.text();
      return {
        statusCode: resp.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "TTS error", raw: err }),
      };
    }

    const arrayBuf = await resp.arrayBuffer();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
      body: Buffer.from(arrayBuf).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e.message }),
    };
  }
}
