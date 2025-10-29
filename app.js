// app.js — Ecommind Agency demo server
// Lancer : npm start
// .env requis : OPENAI_API_KEY, ELEVEN_API_KEY
// Optionnels   : OPENAI_MODEL, ELEVEN_VOICE_DEFAULT, ELEVEN_VOICE_FR/EN/ES/DE/IT/AR, PORT

const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---------- Static (sert index.html à la racine du projet) ----------
const WEB_DIR = __dirname;
app.use(express.static(WEB_DIR));
app.get("/", (_, res) => res.sendFile(path.join(WEB_DIR, "index.html")));

// ---------- ENV ----------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"; // ex: "gpt-5.1" si dispo
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const PORT = process.env.PORT || 3001;

if (!OPENAI_API_KEY || !ELEVEN_API_KEY) {
  console.error("❌ .env manquant : OPENAI_API_KEY et/ou ELEVEN_API_KEY");
  process.exit(1);
}

// ---------- Voices mapping ----------
const VOICE_MAP = {
  fr: process.env.ELEVEN_VOICE_FR || "",
  en: process.env.ELEVEN_VOICE_EN || "",
  es: process.env.ELEVEN_VOICE_ES || "",
  de: process.env.ELEVEN_VOICE_DE || "",
  it: process.env.ELEVEN_VOICE_IT || "",
  ar: process.env.ELEVEN_VOICE_AR || "",
};
const ELEVEN_VOICE_DEFAULT =
  process.env.ELEVEN_VOICE_DEFAULT || "21m00Tcm4TlvDq8ikWAM"; // ex: Rachel

function pickVoiceFor(langCode) {
  const lc = (langCode || "en").slice(0, 2).toLowerCase();
  return VOICE_MAP[lc] || ELEVEN_VOICE_DEFAULT;
}

// ---------- Upload (audio) ----------
const upload = multer({ storage: multer.memoryStorage() });

// ---------- Health ----------
app.get("/health", (_, res) => res.send("OK"));

// ---------- Expose voices (frontend peut lire le mapping, pas la clé) ----------
app.get("/api/voices", (_, res) => {
  res.json({
    fr: VOICE_MAP.fr,
    en: VOICE_MAP.en,
    es: VOICE_MAP.es,
    de: VOICE_MAP.de,
    it: VOICE_MAP.it,
    ar: VOICE_MAP.ar,
    default: ELEVEN_VOICE_DEFAULT,
  });
});

// ---------- Lang detection (texte) ----------
app.post("/api/lang-detect", async (req, res) => {
  try {
    const { text } = req.body || {};
    const userText = (text || "").slice(0, 2000);
    if (!userText) return res.json({ lang: "en" });

    const system = `Tu es un détecteur de langue. 
Réponds uniquement en JSON strict {"lang":"xx"} avec une langue parmi: fr,en,ar,es,de,it.
Si doute, renvoie {"lang":"en"}.`;

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

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });

    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    let lang = "en";
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.lang) lang = String(parsed.lang).toLowerCase();
    } catch {
      const m = raw.match(/"lang"\s*:\s*"([a-z]{2})"/i);
      if (m) lang = m[1].toLowerCase();
    }
    if (!["fr", "en", "ar", "es", "de", "it"].includes(lang)) lang = "en";
    res.json({ lang });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- STT (audio -> texte + langue) ----------
app.post("/api/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: "Aucun audio reçu" });

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

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });

    const data = await r.json();
    res.json({
      text: data.text || "",
      language: data.language || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Chat (LLM) ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { userText, langHint } = req.body || {};

    const systemPrompt = `
Tu es l'assistant d'Ecommind Agency.
Langue cible: ${langHint || "auto"} — réponds EXCLUSIVEMENT dans cette langue (phrases courtes).
Ton: premium, clair, orienté conversion (Harvey Specter x CAC40).
Pas de blabla, pas de listes lourdes, oriente vers une next-step.`;

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

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- TTS (texte -> audio/mpeg) ----------
app.post("/api/tts", async (req, res) => {
  try {
    const { text, lang, settings, voiceId } = req.body || {};
    const vid = voiceId || pickVoiceFor(lang || "en");

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: text || "",
        model_id: "eleven_multilingual_v2",
        voice_settings: Object.assign(
          {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
          settings || {}
        ),
      }),
    });

    if (!r.ok) return res.status(r.status).json({ error: await r.text() });

    const arrayBuf = await r.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store"); // évite les caches/anciennes voix
    return res.send(Buffer.from(arrayBuf));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ Ecommind server running on http://localhost:${PORT}`);
});
