// ============================================
// FONCTION SERVERLESS : TTS (Text To Speech)
// ============================================
// Ce code est exécuté côté serveur (Netlify Function)
// Il convertit du texte en audio MP3 avec la voix premium OpenAI (gpt-4o-mini ou tts-1)

export async function handler(event) {
  // Vérifie la méthode HTTP
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Récupération de la clé API depuis les variables d'environnement Netlify
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
    };
  }

  try {
    // Lecture du texte et des options envoyées depuis le front-end
    const { text, voice = "alloy", format = "mp3" } = JSON.parse(event.body || "{}");

    // Vérifie qu’un texte est bien fourni
    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing text" }),
      };
    }

    // Requête vers l’API OpenAI (modèle TTS)
    const resp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",         // Modèle stable : voix premium (alloy, verse, aria…)
        voice,                  // Type de voix
        input: text,            // Texte à lire
        format,                 // Format audio (mp3, wav, etc.)
      }),
    });

    // Vérifie que la réponse est correcte
    if (!resp.ok) {
      const err = await resp.text();
      return {
        statusCode: resp.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "TTS error", raw: err }),
      };
    }

    // Récupère le flux audio et le renvoie en base64
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
    // Gestion des erreurs
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e.message }),
    };
  }
}
