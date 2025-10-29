// voice-controller.js — gestion des voix côté front (sans clé)
// Orchestration: choix voix, anti-chevauchement, abort, file d’attente

export class VoiceController {
  constructor({ apiBase = "", audioEl = null, defaultLang = "en" } = {}) {
    this.apiBase = apiBase;
    this.audio = audioEl || new Audio();
    this.currentUrl = null;
    this.abort = null;
    this.token = 0;
    this.queue = [];
    this.busy = false;
    this.lang = defaultLang;
    this.voices = {}; // { fr: "<voiceId>", en: "...", ... }
    this.settings = { // valeurs envoyées au serveur (optionnel si côté serveur)
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.35,
      use_speaker_boost: true
    };

    this.audio.addEventListener("ended", () => this._cleanupUrl());
  }

  async initVoices() {
    // Option: récupérer le mapping depuis le serveur (voir /api/voices plus bas)
    try {
      const r = await fetch(`${this.apiBase}/api/voices`);
      if (r.ok) this.voices = await r.json();
    } catch (_) { /* silent */ }
  }

  setLang(lang) { this.lang = (lang || "en").slice(0,2).toLowerCase(); }
  setVoice(lang, voiceId) { this.voices[lang] = voiceId; }
  setSettings(partial) { Object.assign(this.settings, partial || {}); }

  stop() {
    try { this.audio.pause(); } catch {}
    try { this.audio.currentTime = 0; } catch {}
    this._cleanupUrl();
    if (this.abort) { try { this.abort.abort(); } catch {} }
    this.abort = null;
  }

  async speak(text, lang = this.lang) {
    // file d’attente pour éviter tout chevauchement
    return new Promise((resolve) => {
      this.queue.push({ text, lang, resolve });
      this._drain();
    });
  }

  async _drain() {
    if (this.busy || this.queue.length === 0) return;
    this.busy = true;

    const { text, lang, resolve } = this.queue.shift();
    const myToken = ++this.token;

    this.stop();                 // coupe toute lecture en cours
    this.abort = new AbortController();

    try {
      const r = await fetch(`${this.apiBase}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: this.abort.signal,
        body: JSON.stringify({
          text, lang,
          // on peut envoyer les réglages pour que le serveur les utilise
          settings: this.settings,
          // et, si tu veux, forcer une voice précise:
          voiceId: this.voices[lang] || undefined
        })
      });
      if (!r.ok) throw new Error(await r.text());

      if (myToken !== this.token) return; // un nouveau speak a pris la main

      const buf = await r.arrayBuffer();
      this._cleanupUrl();
      this.currentUrl = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
      this.audio.src = this.currentUrl;
      await this.audio.play().catch(() => {});
      resolve(true);
    } catch (e) {
      resolve(false);
      if (e.name !== "AbortError") console.error("TTS error:", e);
    } finally {
      this.busy = false;
      this._drain();
    }
  }

  _cleanupUrl() {
    if (this.currentUrl) {
      try { URL.revokeObjectURL(this.currentUrl); } catch {}
      this.currentUrl = null;
    }
  }
}
