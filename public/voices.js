// public/voice.js
// ✅ Client TTS robuste pour la démo Ecommind
// - Détection langue (auto + serveur si dispo)
// - Appel proxy Netlify /api/tts
// - File d’attente audio (pas de chevauchement)
// - Fallback Web Speech API si TTS serveur indispo
// - Hooks UI optionnels (badges/états)

(() => {
  // ---------- CONFIG ----------
  // ⚠️ Remplace par TES vrais Voice IDs ElevenLabs
  const VOICES = {
    fr: "FRENCH_VOICE_ID",
    en: "ENGLISH_VOICE_ID",
    ar: "ARABIC_VOICE_ID",
  };

  // IDs d’éléments UI (optionnels)
  const SEL_LANG_ID = "lang-select";      // <select id="lang-select">
  const AUDIO_ID    = "tts-audio";        // <audio id="tts-audio">
  const BADGE_ID    = "tts-badge";        // <span id="tts-badge">Prêt</span>
  const MUTE_ID     = "mute-toggle";      // <input type="checkbox" id="mute-toggle">

  // ---------- UTIL ----------
  const $ = (id) => document.getElementById(id);
  const audioEl = $(AUDIO_ID) || createAudio();
  function createAudio() {
    const a = document.createElement("audio");
    a.id = AUDIO_ID;
    a.preload = "auto";
    document.body.appendChild(a);
    return a;
  }

  function setBadge(state, msg) {
    // states: "ready" | "working" | "error"
    const el = $(BADGE_ID);
    if (!el) return;
    el.textContent = msg || (
      state === "ready"   ? "Prêt" :
      state === "working" ? "Lecture…" :
      state === "error"   ? "TTS : erreur" : ""
    );
    el.dataset.state = state;
  }

  // ---------- DÉTECTION LANG ----------
  function detectLangLocal(text = "") {
    if (/[\u0600-\u06FF]/.test(text)) return "ar";      // arabe
    if (/[àâäçéèêëîïôöùûüÿœæ]/i.test(text)) return "fr"; // accents FR
    return "en";
  }

  async function detectLang(text, pref = "auto") {
    if (pref && pref !== "auto") return pref;
    // Essai serveur (si /api/lang existe), sinon local
    try {
      const r = await fetch("/api/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (r.ok) {
        const { lang } = await r.json();
        return lang || detectLangLocal(text);
      }
    } catch {}
    return detectLangLocal(text);
  }

  // ---------- FILE D’ATTENTE AUDIO ----------
  let queue = [];
  let playing = false;

  function isMuted() {
    const m = $(MUTE_ID);
    return !!(m && m.checked);
  }

  async function playBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      audioEl.src = url;
      audioEl.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audioEl.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      audioEl.play().catch(reject);
    });
  }

  async function enqueue(blob) {
    queue.push(blob);
    if (playing) return;
    playing = true;
    setBadge("working");
    try {
      while (queue.length) {
        const b = queue.shift();
        await playBlob(b);
      }
      setBadge("ready");
    } catch (e) {
      console.warn("Audio playback failed", e);
      setBadge("error", "Lecture audio bloquée");
    } finally {
      playing = false;
    }
  }

  // Arrêt manuel
  function stopAll() {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch {}
    queue = [];
    setBadge("ready");
  }

  // ---------- FALLBACK WEB SPEECH ----------
  function speakWeb(text, lang) {
    if (!("speechSynthesis" in window)) return false;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US";
      speechSynthesis.speak(u);
      return true;
    } catch { return false; }
  }

  // ---------- APPEL TTS PROXY ----------
  async function ttsRequest({ text, lang, voiceId, modelId }) {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, voiceId, modelId }),
    });
    if (!r.ok) {
      const err = await r.text().catch(() => "");
      throw new Error(err || `TTS HTTP ${r.status}`);
    }
    return r.blob();
  }

  // ---------- API PUBLIQUE ----------
  async function speak(text, langPref = "auto", opts = {}) {
    try {
      if (!text || !text.trim()) return;
      if (isMuted()) { console.info("[TTS] muet"); return; }

      setBadge("working", "Génération audio…");

      const lang   = await detectLang(text, langPref);
      const voice  = VOICES[lang] || VOICES.en;
      const model  = opts.modelId || (lang === "ar" ? "eleven_multilingual_v2" : "eleven_turbo_v2");

      // Appel proxy
      const blob = await ttsRequest({ text, lang, voiceId: voice, modelId: model });
      await enqueue(blob);
    } catch (e) {
      console.warn("[TTS] proxy failed, fallback Web Speech", e);
      setBadge("error", "TTS indisponible");
      if (!speakWeb(text, langPref === "auto" ? detectLangLocal(text) : langPref)) {
        console.error("[TTS] Aucun fallback dispo");
      } else {
        setBadge("ready");
      }
    }
  }

  // ---------- HOOKS UI ----------
  // Sélecteur langue manuel (si présent)
  const langSelect = $(SEL_LANG_ID);
  function getSelectedLang() {
    return langSelect ? langSelect.value : "auto";
  }

  // Expose global (pour LLM → TTS)
  window.EcommindTTS = {
    speak,       // EcommindTTS.speak("Texte", "auto"|"fr"|"en"|"ar")
    stop: stopAll
  };

  // Marqueur prêt
  setBadge("ready", "Prêt");
})();
