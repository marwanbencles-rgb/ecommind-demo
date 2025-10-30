// app.js
// Ecommind Agency – Local Dev Server (Express / Node 18+)
// Routes: /api/env-check, /api/voices, /api/lang-detect, /api/chat, /api/tts, /api/stt, /health

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3001;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static('.', { cacheControl: false, maxAge: 0 }));

// ---------- Utils ----------
const ok = (res, data, headers = {}) =>
  res.set({ 'Cache-Control': 'no-store', ...headers }).status(200).send(data);

const j = (res, obj, code = 200) =>
  res.set({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
     .status(code).send(JSON.stringify(obj));

const toBase64 = (ab) => Buffer.from(ab).toString('base64');

// ---------- Health ----------
app.get('/health', (_, res) => j(res, { ok: true, time: new Date().toISOString() }));

// ---------- Env check (ne révèle jamais les valeurs) ----------
app.get('/api/env-check', (_, res) => {
  j(res, {
    ok: true,
    env: {
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      ELEVEN_API_KEY: Boolean(process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY),
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }
  });
});

// ---------- Voices mapping ----------
app.get('/api/voices', (_, res) => {
  const map = {
    fr: process.env.ELEVEN_VOICE_FR || '',
    en: process.env.ELEVEN_VOICE_EN || '',
    es: process.env.ELEVEN_VOICE_ES || '',
    de: process.env.ELEVEN_VOICE_DE || '',
    it: process.env.ELEVEN_VOICE_IT || '',
    ar: process.env.ELEVEN_VOICE_AR || '',
    default: process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM'
  };
  j(res, map);
});

// ---------- Lang detect (OpenAI) ----------
app.post('/api/lang-detect', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return j(res, { error: 'MISSING_OPENAI_KEY' }, 500);
    const text = String(req.body?.text || '').slice(0, 2000);
    if (!text) return j(res, { lang: 'en' });

    const system = 'Réponds UNIQUEMENT {"lang":"xx"} parmi: fr,en,ar,es,de,it. Si doute, "en".';

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text }
        ]
      })
    });

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || '';
    let lang = 'en';
    try { lang = JSON.parse(raw)?.lang || 'en'; }
    catch { lang = /"lang"\s*:\s*"([a-z]{2})"/i.test(raw) ? RegExp.$1 : 'en'; }
    if (!['fr','en','ar','es','de','it'].includes(lang)) lang = 'en';
    j(res, { lang });
  } catch (e) {
    j(res, { error: e.message }, 500);
  }
});

// ---------- Chat (OpenAI) ----------
app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return j(res, { error: 'MISSING_OPENAI_KEY' }, 500);
    const { userText = '', langHint = 'fr' } = req.body || {};
    const text = String(userText || '').trim();
    if (!text) return j(res, { error: 'EMPTY_INPUT' }, 400);

    const system = `
Tu es l'assistant commercial premium d'Ecommind Agency.
Langue: ${langHint.slice(0,2)}. Ton: bref, confiant, orienté décision. Pas de blabla.
`.trim();

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 220,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text }
        ]
      })
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return j(res, { error: 'OPENAI_ERROR', raw: errTxt }, r.status);
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'Pouvez-vous préciser ?';
    j(res, { reply });
  } catch (e) {
    j(res, { error: e.message }, 500);
  }
});

// ---------- TTS (ElevenLabs) ----------
app.post('/api/tts', async (req, res) => {
  try {
    const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!ELEVEN_API_KEY) return j(res, { error: 'MISSING_ELEVEN_KEY' }, 500);

    const { text = '', lang = 'en', voiceId: voiceOverride, settings = {} } = req.body || {};
    const voiceMap = {
      fr: process.env.ELEVEN_VOICE_FR || process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM',
      en: process.env.ELEVEN_VOICE_EN || process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM',
      es: process.env.ELEVEN_VOICE_ES || 'EXAVITQu4vr4xnSDxMaL',
      de: process.env.ELEVEN_VOICE_DE || process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM',
      it: process.env.ELEVEN_VOICE_IT || process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM',
      ar: process.env.ELEVEN_VOICE_AR || process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM',
      default: process.env.ELEVEN_VOICE_DEFAULT || '21m00Tcm4TlvDq8ikWAM'
    };
    const vid = voiceOverride || voiceMap[String(lang || 'en').slice(0,2)] || voiceMap.default;

    const cleanText = String(text).replace(/\s+/g, ' ').trim().slice(0, 600);

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
          ...settings
        }
      })
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return j(res, { error: 'ELEVEN_ERROR', raw: errTxt }, r.status);
    }

    const ab = await r.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(Buffer.from(ab))
    });
    return res.status(200).send(Buffer.from(ab));
  } catch (e) {
    j(res, { error: e.message }, 500);
  }
});

// ---------- STT (OpenAI Whisper) : base64 OU multipart ----------
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return j(res, { error: 'MISSING_OPENAI_KEY' }, 500);

    // 1) Récupère l'audio depuis base64 (JSON) ou multipart (file)
    let bytes;
    if (req.body?.audioBase64) {
      bytes = Buffer.from(String(req.body.audioBase64), 'base64');
    } else if (req.file) {
      bytes = req.file.buffer; // multipart file "audio"
    } else {
      return j(res, { error: 'NO_AUDIO' }, 400);
    }

    // 2) FormData pour /v1/audio/transcriptions
    const blob = new Blob([bytes], { type: 'audio/webm' });
    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return j(res, { error: 'WHISPER_ERROR', raw: errTxt }, r.status);
    }

    const data = await r.json();
    j(res, { text: data.text || '', language: data.language || null });
  } catch (e) {
    j(res, { error: e.message }, 500);
  }
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ Ecommind server running on http://localhost:${PORT}`);
});
