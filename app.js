// app.js — Ecommind Server (serve front + STT + Chat + TTS + LangDetect)
// LANCER : npm start  (ou)  node app.js
// Prérequis .env : OPENAI_API_KEY, ELEVEN_API_KEY, (facultatif: OPENAI_MODEL, ELEVEN_VOICE_*)

const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ====== STATIC (sert ton index.html à la racine du projet) ======
const WEB_DIR = __dirname; // car index.html + styles.css sont à la racine
app.use(express.static(WEB_DIR));
app.get("/", (_, res) => res.sendFile(path.join(WEB_DIR, "index.html")));

// ====== ENV ======
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // ex: "gpt-5.1"
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const PORT = process.env.PORT || 3001;

if (!OPENAI_API_KEY || !ELEVEN_API_KEY) {
  console.error("❌ Manque OPENAI_API_KEY ou ELEVEN_API_KEY dans .env");
  process.exit(1);
}

// ====== ElevenLabs — mapping voix par langue ======
const VOICE_MAP = {
  fr: process.env.ELEVEN_VOICE_FR || "",
  en: process.env.ELEVEN_VOICE_EN || "",
  es: process.env.ELEVEN_VOICE_ES || "",
  de: process.env.ELEVEN_VOICE_DE || "",
  it: process.env.ELEVEN_VOICE_IT || "",
  ar: process.env.ELEVEN_VOICE_AR || "",
};
const ELEVEN_VOICE_DEFAULT =
  process.env.ELEVEN_VOICE_DEFAULT || "21m00Tcm4TlvDq8ikWAM"; // voix par défaut

function pickVoiceFor(langCode) {
  const lc = (langCode || "").slice(0, 2).toLowerCase();
  return VOICE_MAP[lc] || ELEVEN_VOICE_DEFAULT;
}

// ====== UPLOAD (audio) ======
const upload = multer({ storage: multer.memoryStorage() });

// ====== HEALTH ======
app.get("/health", (_, res) => res.send("OK"));

/**
 * ====== 1) LANG DETECT (texte) ======
 * Détection robuste (quand l’utilisateur TAPE au clavier).
 * Retour : { lang: "fr" | "en" | "ar" | "es" | "de" | "it" }
 */
app.post("/api/lang-detect", async (req, res) => {
  try {
    const { text } = req.body || {};
    const userText = (text || "").slice(0, 2000); // garde court

    if (!userText) return res.json({ lang: "en" });

    const system = `Tu es un détecteur de langue. 
Réponds UNIQUEMENT en JSON strict avec une clé "lang" (ISO 639-1 en minuscule) parmi : fr,en,ar,es,de,it.
Si ambigu, choisis "en". Aucune explication. Exemple: {"lang":"fr"}.`;

    const body = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userText },
      ],
      temperature: 0,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(400).json({ error: err });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    // essaie de parser le JSON strict
    let lang = "en";
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lang === "string") lang = parsed.lang.toLowerCase();
    } catch {
      // fallback regex
      const m = raw.match(/"lang"\s*:\s*"([a-z]{2})"/i);
      if (m) lang = m[1].toLowerCase();
    }
    if (!["fr", "en", "ar", "es", "de", "it"].includes(lang)) lang = "en";
    return res.json({ lang });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * ====== 2) STT (audio -> texte + langue) via Whisper ======
 * Retour : { text, language } — language est ISO 639-1 (ex: "fr")
 */
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: "Aucun audio reçu" });

    // Node 18+ : Blob & FormData & fetch sont disponibles globalement
    const blob = new Blob([req.file.buffer], { type: "audio/webm" });
    const form = new FormData();
    form.append("file", blob, "audio.webm");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(400).json({ error: err });
    }

    const data = await r.json();
    return res.json({
      text: data.text || "",
      language: data.language || null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * ====== 3) CHAT (LLM) ======
 * Reçoit { userText, langHint } et répond dans la langue cible.
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { userText, langHint } = req.body || {};

    const systemPrompt = `
Tu es l'assistant d'Ecommind Agency.
Langue cible: ${langHint || "auto"} — réponds EXCLUSIVEMENT dans cette langue (phrases courtes).
Ton: premium, clair, orienté conversion (Harvey Specter x CAC40).
Pas de blabla, pas d'emoji, pas de listes longues. Réponds utilement.`;

    const body = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText || "Bonjour" },
      ],
      temperature: 0.5,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(400).json({ error: err });
    }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    return res.json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * ====== 4) TTS (texte -> audio/mpeg) via ElevenLabs ======
 * Reçoit { text, lang }, choisit la voix adaptée.
 */
app.post("/api/tts", async (req, res) => {
  try {
    const { text, lang } = req.body || {};
    const voiceId = pickVoiceFor(lang || "en");

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text || "",
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(400).json({ error: err });
    }

    const arrayBuf = await r.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(Buffer.from(arrayBuf));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`✅ Ecommind server running on http://localhost:${PORT}`);
});
