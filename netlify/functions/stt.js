// netlify/functions/stt.js
// Attend: { audioBase64: "data:audio/webm;base64,AAA..." }
export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS")
      return { statusCode: 200, headers: cors(), body: "OK" };
    if (event.httpMethod !== "POST")
      return { statusCode: 405, headers: cors(), body: "Method Not Allowed" };

    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");

    const { audioBase64 } = JSON.parse(event.body || "{}");
    if (!audioBase64) return { statusCode: 400, headers: cors(), body: "Missing 'audioBase64'" };

    // Convertir dataURL -> Buffer
    const base64 = audioBase64.split(",").pop();
    const audioBuffer = Buffer.from(base64, "base64");
    const blob = new Blob([audioBuffer], { type: "audio/webm" });

    // Construire FormData natif Node 18
    const fd = new FormData();
    fd.append("file", blob, "recording.webm");
    fd.append("model", "whisper-1");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { statusCode: r.status, headers: cors(), body: `STT error: ${t}` };
    }

    const data = await r.json();
    const text = data?.text || "";
    const language = detectLangLocal(text);

    return {
      statusCode: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
      body: JSON.stringify({ text, language })
    };
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: `Server error: ${e.message}` };
  }
}
function detectLangLocal(t = "") {
  if (/[\u0600-\u06FF]/.test(t)) return "ar";
  if (/[àâäæçéèêëîïôœöùûüÿ]/i.test(t)) return "fr";
  return "en";
}
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
