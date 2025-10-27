// netlify/functions/chatgpt-proxy.js
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
      body: JSON.stringify({ error: "Missing OPENAI_API_KEY_ECOMMIND" }),
    };
  }

  try {
    const { messages = [] } = JSON.parse(event.body || "{}");

    // On convertit les messages "chat" en un seul prompt pour l'API Responses
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",       // modèle rapide & peu coûteux
        input: prompt,              // format 'input' de l'API Responses
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      // On remonte l’erreur réelle pour debug dans la console du site
      return {
        statusCode: resp.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: data?.error?.message || "OpenAI error",
          raw: data,
        }),
      };
    }

    // L’API Responses renvoie un raccourci 'output_text'
    const reply =
      data.output_text ??
      (data.output?.[0]?.content
        ?.map((c) => c?.text?.value || "")
        .join("") || "");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e.message }),
    };
  }
}
