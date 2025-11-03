export async function handler(event) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const { audioBase64 } = JSON.parse(event.body || "{}");
    if (!audioBase64) return { statusCode: 400, body: "audioBase64 manquant" };

    // Recrée un Blob à partir du base64
    const bytes = Buffer.from(audioBase64, "base64");
    const blob = new Blob([bytes], { type: "audio/webm" });
    const form = new FormData();
    form.append("file", blob, "audio.webm");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form
    });

    if (!r.ok) return { statusCode: r.status, body: await r.text() };
    const data = await r.json();
    return { statusCode: 200, body: JSON.stringify({
      text: data.text || "", language: data.language || null
    })};
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
