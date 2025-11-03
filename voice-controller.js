// public/voice-controller.js
// 🎙️ Contrôleur vocal Ecommind – pipeline complet
// - Enregistre l'audio utilisateur (STT)
// - Détecte la langue (auto ou manuelle)
// - Interroge l'IA (LLM)
// - Lit la réponse à voix haute (TTS)
// - Affiche la conversation en temps réel

(() => {
  // ---------- CONFIG ----------
  const STT_API = "/api/stt";
  const LLM_API = "/api/llm";
  const LANG_API = "/api/lang";

  const RECORD_TIME = 6_000; // 6 secondes max d'enregistrement

  const btn = document.getElementById("voice-btn") || createVoiceButton();
  const status = document.getElementById("voice-status") || createStatusLabel();
  const chat = document.getElementById("chat-output");

  const TTS = window.EcommindTTS || null; // depuis voice.js
  let recording = false;
  let recorder;
  let chunks = [];

  // ---------- UI CREATION ----------
  function createVoiceButton() {
    const b = document.createElement("button");
    b.id = "voice-btn";
    b.textContent = "🎤";
    Object.assign(b.style, {
      background: "#C9A55E",
      border: "none",
      borderRadius: "50%",
      width: "55px",
      height: "55px",
      fontSize: "24px",
      cursor: "pointer",
      boxShadow: "0 0 10px rgba(0,0,0,0.4)",
      transition: "all 0.3s ease"
    });
    b.onmouseenter = () => (b.style.transform = "scale(1.1)");
    b.onmouseleave = () => (b.style.transform = "scale(1)");
    document.body.appendChild(b);
    return b;
  }

  function createStatusLabel() {
    const s = document.createElement("div");
    s.id = "voice-status";
    s.textContent = "Prêt";
    Object.assign(s.style, {
      color: "#00BFFF",
      fontFamily: "Inter, sans-serif",
      textAlign: "center",
      marginTop: "8px",
    });
    document.body.appendChild(s);
    return s;
  }

  function print(msg, role = "system") {
    if (!chat) return console.log(`[${role}]`, msg);
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // ---------- ENREGISTREMENT ----------
  async function startRecording() {
    if (recording) return stopRecording();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = handleRecordingStop;

      recorder.start();
      recording = true;
      btn.textContent = "⏹️";
      status.textContent = "Enregistrement… 🎙️";
      print("🎤 Parlez maintenant…", "system");

      // auto-stop après RECORD_TIME
      setTimeout(() => {
        if (recording) stopRecording();
      }, RECORD_TIME);
    } catch (e) {
      print("⚠️ Micro inaccessible : " + e.message, "error");
      status.textContent = "Erreur micro";
    }
  }

  function stopRecording() {
    if (!recording) return;
    recording = false;
    btn.textContent = "🎤";
    status.textContent = "Transcription en cours… ⏳";
    recorder.stop();
  }

  // ---------- TRANSCRIPTION (STT) ----------
  async function handleRecordingStop() {
    try {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");

      const res = await fetch(STT_API, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const text = (data.text || "").trim();
      if (!text) {
        status.textContent = "Aucune parole détectée.";
        print("❌ Aucune parole détectée.", "error");
        return;
      }

      print(text, "user");
      status.textContent = "Analyse IA… 🤖";

      const lang = await detectLang(text);
      const reply = await askLLM(text, lang);

      print(reply, "assistant");
      status.textContent = "Réponse lue 🔊";

      if (TTS && reply) await TTS.speak(reply, lang);
      status.textContent = "Prêt 🎤";
    } catch (e) {
      print("⚠️ Erreur STT : " + e.message, "error");
      status.textContent = "Erreur transcription";
    }
  }

  // ---------- DETECTION LANG ----------
  async function detectLang(text) {
    try {
      const res = await fetch(LANG_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const { lang } = await res.json();
      return lang || "en";
    } catch {
      return "en";
    }
  }

  // ---------- LLM ----------
  async function askLLM(prompt, lang = "en") {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant vocal d'Ecommind Agency. 
          Style Harvey Specter : calme, confiant, classe. 
          Réponds dans la langue détectée (${lang}).`
        },
        { role: "user", content: prompt }
      ]
    };

    const res = await fetch(LLM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.text?.trim() || "…";
  }

  // ---------- INIT ----------
  function init() {
    btn.addEventListener("click", startRecording);
    print("🎙️ Assistant vocal prêt. Cliquez pour parler.", "system");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
