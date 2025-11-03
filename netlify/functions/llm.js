// netlify/functions/llm.js
// ✅ Fonction serveur OpenAI LLM pour Ecommind
// - Sécurisée (clé cachée côté serveur)
// - Compatible Netlify (Node 18+)
// - Gère prompt business, messages, erreurs & CORS
// - Format JSON standardisé pour le front

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event) {
  try {
    // Préflight CORS
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: CORS, body: "OK" };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
    }

    // Vérification clé API
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return {
        statusCode: 500,
        headers: CORS,
        body: "Missing OPENAI_API_KEY"
      };
    }

    // Lecture du body
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, headers: CORS, body: "Invalid JSON" };
    }

    const { messages = [], model = "gpt-4o-mini", temperature = 0.6 } = body;
    if (!messages.length) {
      return { statusCode: 400, headers: CORS, body: "Missing messages array" };
    }

    // Appel OpenAI complet
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 400
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: res.status,
        headers: CORS,
        body: `OpenAI error (${res.status}): ${errText}`
      };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        text,
        model,
        usage: data?.usage || {}
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: `Server error: ${e.message}`
    };
  }
}
