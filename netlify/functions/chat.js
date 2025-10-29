// ============================================================================
//  ECOMMIND AGENCY - CHAT FUNCTION
//  Objectif : répondre au client dans sa langue, ton premium orienté closing.
//  Utilise GPT-4o-mini (ou modèle précisé dans .env).
// ============================================================================

export async function handler(event) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return { statusCode: 500, body: "Clé OpenAI manquante." };
    }

    const { userText, langHint } = JSON.parse(event.body || "{}");
    if (!userText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Aucun texte reçu." }) };
    }

    // Langue détectée ou par défaut
    const lang = (langHint || "en").slice(0, 2).toLowerCase();

    // Système de personnalité Ecommind
    const systemPrompt = `
Tu es l'assistant de démonstration d'Ecommind Agency, une agence d'automatisation et de création de sites Shopify haut de gamme.
Ton rôle est de répondre dans la langue du client (${lang}) avec un ton :
- Professionnel, confiant, premium (style Harvey Specter / CAC40).
- Phrases courtes, claires et à fort impact émotionnel.
- Objectif : convaincre, rassurer, amener à réserver une démo ou un pack.

Tu ne vends pas directement, tu inspires confiance et donnes envie.
Pas de phrases robotisées, pas de "je suis un modèle d’IA", jamais.
Si on te pose une question technique, explique avec pédagogie et clarté.

Format de réponse : phrases naturelles dans la langue du client uniquement.
    `;

    // Requête API OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.65,
        max_tokens: 200,
        messages: [
          { role: "system", content: systemPrompt.trim() },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, body: errText };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "Je n'ai pas bien compris, peux-tu reformuler ?";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (e) {
    console.error("Erreur Chat:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
