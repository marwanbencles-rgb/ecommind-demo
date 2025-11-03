// public/voice-controller.js
// 🎙️ Contrôleur Vocal — Ecommind (base64 STT → LLM → TTS)
// UI minimale: #voice-btn + #voice-status + #chat-output (optionnel)

(() => {
  const API = {
    STT: "/api/stt",
    LLM: "/api/llm",
    LANG: "/api/lang",
  };

  const btn    = document.getElementById("voice-btn")    || createBtn();
  const status = document.getElementById("voice-status") || createStatus();
  const chat   = document.getElementById("chat-output");
  const TTS    = window.EcommindTTS || null;

  // Helpers UI
  function createBtn() {
    const b = document.createElement("button");
    b.id = "voice-btn";
    b.textContent = "🎤";
    Object.assign(b.style, {
      background: "#C9A55E", color: "#121212", border: "none",
      borderRadius: "999px", width: "52px", height: "52px",
      fontSize: "22px", cursor: "pointer",
      boxShadow: "0 8px 30px rgba(201,165,94,.25)"
    });
    document.body.appendChild(b);
    return b;
  }
  function createStatus() {
    const s = document.createElement("div");
    s.id = "voice-status";
    s.textContent = "Prêt";
    Object.assign(s.style, { color: "#8ea0b5", marginTop: "6px", textAlign: "center" });
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

  // Recorder → base64
  let stream, recorder, chunks = [], recording = false;
  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  async function toggleRecord() {
    if (recording) {
      recorder.stop();
      recording = false;
      btn.textContent = "🎤";
      status.textContent = "Transcription…";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = onStop;

      recorder.start();
      recording = true;
      btn.textContent = "⏹️";
      status.textContent = "Enregistrement…";
      print("🎤 Parlez…", "system");

      setTimeout(() => recording && recorder.stop(), 6000);
    } catch (e) {
      status.textContent = "Erreur micro";
      print("⚠️ Micro: " + e.message, "error");
    }
  }

  async function onStop() {
    try {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const dataUrl = await blobToDataURL(blob);

      const r = await fetch(API.STT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: dataUrl })
      });
      const out = await r.json().catch(() => ({}));

      const text = (out.text || "").trim();
      if (!text) {
        status.textContent = "Aucune parole détectée";
        print("❌ Aucune parole détectée.", "error");
        return;
      }
      print(text, "user");
      status.textContent = "Analyse…";

      const lang = await detectLang(text);
      const reply = await askLLM(text, lang);

      print(reply, "assistant");
      status.textContent = "Lecture…";

      if (TTS && !document.getElementById("mute-toggle")?.checked) {
        await TTS.speak(reply, lang);
      }
      status.textContent = "Prêt";
    } catch (e) {
      status.textContent = "Erreur";
      print("⚠️ STT/LLM: " + e.message, "error");
    } finally {
      try { stream?.getTracks().forEach(t => t.stop()); } catch {}
      btn.textContent = "🎤";
      recording = false;
    }
  }

  async function detectLang(text) {
    try {
      const r = await fetch(API.LANG, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const { lang } = await r.json();
      return lang || "en";
    } catch {
      return "en";
    }
  }

  async function askLLM(prompt, lang = "en") {
    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant vocal d'Ecommind Agency.
          Style Harvey Specter — calme, confiant, classe. Réponds en ${lang}.`
        },
        { role: "user", content: prompt }
      ]
    };
    const r = await fetch(API.LLM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return data.text?.trim() || "…";
  }

  // Bind
  btn.addEventListener("click", toggleRecord);
  print("🎙️ Assistant vocal prêt. Cliquez pour parler.", "system");
})();
