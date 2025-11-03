// netlify/functions/lang.js
// ✅ Détection de langue serveur ultra-rapide (fr/en/ar) + CORS
// - Heuristiques robustes (alphabet arabe, accents FR, mots-clés)
// - Peut servir de "source de vérité" pour le front quand lang="auto"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: CORS, body: "OK" };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, headers: CORS, body: "Invalid JSON body" };
    }
    const text = (body?.text || "").trim();

    // Raccourcis : si vide, renvoyer en par défaut
    if (!text) {
      return json({ lang: "en", confidence: 0.1 });
    }

    // ---- Heuristiques principales ----
    // 1) Alphabet arabe
    if (/[\u0600-\u06FF]/.test(text)) {
      return json({ lang: "ar", confidence: 0.99 });
    }

    // 2) Accents / graphèmes FR
    if (/[àâäæçéèêëîïôœöùûüÿ]/i.test(text)) {
      return json({ lang: "fr", confidence: 0.9 });
    }

    // 3) Mots-clés (renforce la décision)
    const t = text.toLowerCase();
    const score = { fr: 0, en: 0, ar: 0 };

    // FR
    if (/\b(bonjour|merci|s'il te plaît|s'il vous plaît|ecommind|automatisation|site|agence)\b/.test(t)) score.fr += 2;
    if (/[a-zàâäçéèêëîïôùûüÿœæ'-]+/i.test(t)) score.fr += 0.2;

    // EN
    if (/\b(hello|thanks|please|automation|agency|site|demo)\b/.test(t)) score.en += 2;
    if (/[a-z'-]+/i.test(t)) score.en += 0.2;

    // AR (mots ASCII translittérés)
    if (/\b(salam|marhaban|shukran)\b/.test(t)) score.ar += 1.5;

    // Décision par score si aucun signal fort
    const entries = Object.entries(score).sort((a, b) => b[1] - a[1]);
    const [topLang, topScore] = entries[0];

    // Si égalité/score faible → EN par défaut
    if (!topScore || (entries[0][1] - (entries[1]?.[1] || 0)) < 0.5) {
      return json({ lang: "en", confidence: 0.55 });
    }
    return json({ lang: topLang, confidence: Math.min(0.85, 0.55 + topScore / 3) });

  } catch (e) {
    return { statusCode: 500, headers: CORS, body: `Server error: ${e.message}` };
  }

  function json(payload) {
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify(payload),
    };
  }
}
