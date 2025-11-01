// netlify/functions/chat.js
export async function handler(event) {
  try {
    // --- Parse input --------------------------------------------------------
    const { userText = "", langHint = "fr" } =
      (event.body && JSON.parse(event.body)) || {};

    if (!userText.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "EMPTY_INPUT", message: "Texte vide." }),
      };
    }

    // --- Env checks (sans rien exposer) ------------------------------------
    const haveOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!haveOpenAI) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "ENV_MISSING",
          message: "OPENAI_API_KEY manquant côté serveur.",
        }),
      };
    }

    // --- Appel OpenAI (REST, sans SDK) -------------------------------------
    const sys = [
      "Tu es l'assistant de vente d’Ecommind Agency.",
      "Réponds de manière brève, claire et orientée décision.",
      "Langue attendue: " + langHint,
    ].join(" ");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userText },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!openaiRes.ok) {
      const txt = await openaiRes.text().catch(() => "");
      return {
        statusCode: openaiRes.status || 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "OPENAI_ERROR",
          message: "Erreur OpenAI",
          detail: txt?.slice(0, 500),
        }),
      };
    }

    const data = await openaiRes.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Désolé, je n’ai pas pu générer de réponse.";

    // --- Réponse OK ---------------------------------------------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, model, reply }),
    };
  } catch (err) {
    // --- Sécurité: ne pas exposer de secrets --------------------------------
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "SERVER_ERROR",
        message:
          err?.response?.data?.error?.message ||
          err?.message ||
          "Erreur serveur",
      }),
    };
  }
}
