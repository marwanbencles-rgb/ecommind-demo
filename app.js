// public/app.js
// 🚀 Initialisation complète de la démo Ecommind
// - Branding (variables CSS), thème auto (light/dark), badge statut
// - Health-check des endpoints + indicateurs
// - Sélecteur de langue persisté (localStorage) + sync avec voice.js
// - Tests rapides (TTS, STT, LLM)
// - Raccourcis clavier & protections de base

(() => {
  // ---------- CONSTANTES UI ----------
  const IDS = {
    badge: "status-badge",      // <span id="status-badge"></span>
    lang: "lang-select",        // <select id="lang-select"> (déjà utilisé par voice.js)
    ttsTest: "test-tts",        // <button id="test-tts">
    sttTest: "test-stt",        // <button id="test-stt">
    llmTest: "test-llm",        // <button id="test-llm">
    toast: "toast",             // <div id="toast"></div>
    chatInput: "chat-input",    // utilisé par chat.js
    chatSend: "chat-send",
    chatMic: "chat-mic",
  };

  const API = {
    health: "/api/health",
    lang: "/api/lang",
    tts: "/api/tts",
    stt: "/api/stt",
    llm: "/api/llm",
  };

  // ---------- HELPERS ----------
  const $ = (id) => document.getElementById(id);

  function toast(msg, type = "info", timeout = 2500) {
    let el = $(IDS.toast);
    if (!el) {
      el = document.createElement("div");
      el.id = IDS.toast;
      document.body.appendChild(el);
      Object.assign(el.style, {
        position: "fixed",
        bottom: "18px",
        right: "18px",
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "10px",
        fontFamily: "Inter,system-ui,Arial",
        zIndex: "9999",
        boxShadow: "0 6px 32px rgba(0,0,0,0.35)",
        maxWidth: "60vw",
        lineHeight: "1.35",
      });
    }
    el.textContent = msg;
    el.style.background = type === "error" ? "#8B0000" : type === "success" ? "#0D5726" : "rgba(0,0,0,0.8)";
    el.style.opacity = "1";
    setTimeout(() => (el.style.opacity = "0"), timeout);
  }

  function setBadge(state, detail = "") {
    const el = $(IDS.badge);
    if (!el) return;
    el.dataset.state = state; // "ok" | "warn" | "err" | "loading"
    let label =
      state === "ok" ? "Système : OK" :
      state === "warn" ? "Système : partiel" :
      state === "err" ? "Système : erreur" :
      "Vérification…";
    if (detail) label += ` — ${detail}`;
    el.textContent = label;
  }

  // ---------- BRANDING & THÈME ----------
  function applyBrandingVars() {
    const r = document.documentElement;
    r.style.setProperty("--ec-gold", "#C9A55E");
    r.style.setProperty("--ec-blue", "#00BFFF");
    r.style.setProperty("--ec-black", "#000000");
    r.style.setProperty("--ec-deep", "#0D1B2A");
    r.style.setProperty("--ec-white", "#FFFFFF");
  }

  function applyThemeAuto() {
    const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }

  // ---------- LANGUE (persist & sync) ----------
  function loadLangPref() {
    return localStorage.getItem("ecommind.lang") || "auto";
  }
  function saveLangPref(v) {
    localStorage.setItem("ecommind.lang", v);
  }
  function syncLangSelect() {
    const sel = $(IDS.lang);
    if (sel) {
      sel.value = loadLangPref();
      sel.addEventListener("change", () => {
        saveLangPref(sel.value);
        toast(`Langue : ${sel.value.toUpperCase()}`, "info", 1200);
      });
    }
  }

  // ---------- HEALTH CHECK ----------
  async function healthCheck() {
    try {
      setBadge("loading", "scan");
      const r = await fetch(API.health, { method: "GET", cache: "no-store" });
      if (!r.ok) {
        setBadge("err", "health 4xx/5xx");
        toast("Health-check indisponible.", "error");
        return { ok: false };
      }
      const data = await r.json().catch(() => ({}));
      const hasOpenAI = !!data?.env?.OPENAI_API_KEY;
      const has11 = !!data?.env?.ELEVENLABS_API_KEY;

      // Détermine l’état global minimal
      let state = "ok";
      let missing = [];
      if (!hasOpenAI) { state = "warn"; missing.push("OPENAI_API_KEY"); }
      if (!has11)     { state = "warn"; missing.push("ELEVENLABS_API_KEY"); }

      // Si endpoints down déclarés
      const f = data?.functions || {};
      const endpoints = [API.tts, API.stt, API.lang, API.llm];
      const downs = endpoints.filter((e) => {
        const key = e.replace("/api", "/api"); // stable
        const status = f[e] || f[key];
        return status && !String(status).includes("OK");
      });

      if (downs.length) {
        state = "err";
        missing.push(`Endpoints: ${downs.join(", ")}`);
      }

      setBadge(state, missing.join(" / "));
      if (state === "ok") toast("Système prêt ✅", "success", 1500);
      if (state === "warn") toast("Clés manquantes ou partielles ⚠️", "info", 2000);
      if (state === "err") toast("Fonctions injoignables ❌", "error", 2500);

      return data;
    } catch (e) {
      setBadge("err", "exception");
      toast(`Health exception: ${e.message}`, "error");
      return { ok: false, error: e.message };
    }
  }

  // ---------- TESTS RAPIDES ----------
  async function testTTS() {
    const lang = loadLangPref();
    const sample =
      lang === "fr" ? "Bienvenue chez Ecommind, l’automatisation de prestige." :
      lang === "ar" ? "مرحبًا بك في إيكومايند." :
      "Welcome to Ecommind, premium automation.";
    try {
      if (!window.EcommindTTS?.speak) throw new Error("EcommindTTS non initialisé");
      await window.EcommindTTS.speak(sample, lang);
      toast("TTS OK 🔊", "success", 1200);
    } catch (e) {
      toast(`TTS KO: ${e.message}`, "error");
    }
  }

  async function testSTT() {
    try {
      // Petit enregistrement 2s puis transcription
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "test.webm");
        const r = await fetch(API.stt, { method: "POST", body: fd });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        toast(`STT OK 📝: ${data.text?.slice(0, 60) || "—"}`, "success", 1800);
      };
      rec.start();
      setTimeout(() => rec.stop(), 2000);
    } catch (e) {
      toast(`STT KO: ${e.message}`, "error");
    }
  }

  async function testLLM() {
    try {
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es l'assistant premium d'Ecommind." },
          { role: "user", content: "En une phrase, pourquoi Ecommind ?" }
        ],
      };
      const r = await fetch(API.llm, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      toast(`LLM OK 💬: ${data.text?.slice(0, 60) || "—"}`, "success", 1800);
    } catch (e) {
      toast(`LLM KO: ${e.message}`, "error");
    }
  }

  // ---------- RACCOURCIS ----------
  function registerHotkeys() {
    window.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Enter : envoyer le message
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const btn = $(IDS.chatSend);
        btn?.click();
      }
      // Alt + M : micro
      if (e.altKey && (e.key === "m" || e.key === "M")) {
        const btn = $(IDS.chatMic);
        btn?.click();
      }
      // Alt + T : TTS test
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        testTTS();
      }
    });
  }

  // ---------- PROTECTIONS ----------
  function preventAccidentalUnload() {
    window.addEventListener("beforeunload", (e) => {
      // Si tu veux empêcher la fermeture pendant l’enregistrement/lecture, active :
      // e.preventDefault();
      // e.returnValue = "";
    });
  }

  // ---------- BOUTONS TEST ----------
  function wireTestButtons() {
    const bTTS = $(IDS.ttsTest);
    const bSTT = $(IDS.sttTest);
    const bLLM = $(IDS.llmTest);
    bTTS?.addEventListener("click", testTTS);
    bSTT?.addEventListener("click", testSTT);
    bLLM?.addEventListener("click", testLLM);
  }

  // ---------- INIT ----------
  function init() {
    applyBrandingVars();
    applyThemeAuto();
    syncLangSelect();
    registerHotkeys();
    preventAccidentalUnload();
    wireTestButtons();
    healthCheck(); // lance le check initial
  }

  // Lancement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
