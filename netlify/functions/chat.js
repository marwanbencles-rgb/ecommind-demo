// Ecommind - Chat function robuste (Netlify)
import OpenAI from "openai";

export async function handler(event) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "MISSING_OPENAI_KEY", message: "OPENAI_API_KEY absente sur Netlify." })
      };
    }

    const { userText = "", langHint = "fr" } = JSON.parse(event.body || "{}");
    if (!userText.trim()) {
      return { statusCode: 400, body: JSON.stringify({ code: "EMPTY_INPUT", message: "Texte vide." }) };
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const system = `
Tu es l'assistant commercial premium d'Ecommind Agency.
Réponds dans la langue du client (${langHint.slice(0,2)}), ton bref, confiant, orienté décision.
Pas de blabla technique inutile.
    `.trim();

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.6,
      max_tokens: 220,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userText }
      ]
    });

    const reply = resp?.choices?.[0]?.message?.content?.trim() || "Pouvez-vous préciser votre demande ?";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    // Log côté Netlify (visible dans Functions logs)
    console.error("CHAT_FUNCTION_ERROR:", err?.response?.data || err?.message || err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "CHAT_RUNTIME_ERROR",
        message: err?.response?.data?.error?.message || err?.message || "Erreur serveur."
      })
    };
  }
}
