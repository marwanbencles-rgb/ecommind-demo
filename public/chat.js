// public/chat.js
// ✅ Chat Ecommind — pipeline complet (STT base64 → LLM → TTS)
// - Détection de langue serveur
// - Envoi audio en base64 vers /api/stt (JSON)
// - TTS via window.EcommindTTS.speak(reply, lang)
// - UI minimale: #chat-input, #chat-output, #chat-send, #chat-mic

(() => {
  // ---------- CONFIG ----------
  const API = {
    LLM: "/api/llm",
    STT: "/api/stt",
    LANG: "/api/lang",
  };

  // ---------- HELPERS ----------
  const $ = (id) => document.getElementById(id);

  const input   = $("chat-input");
  const output  = $("chat-output");
  const sendBtn = $("chat-send");
  const micBtn  = $("chat-mic");

  const TTS = window.EcommindTTS || null;

  function print(msg, role = "system") {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = msg;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  function startLoading() {
    const div = document.createElement("div");
    div.className = "loading";
    div.innerHTML = "<span class='dot'></span><span class='dot'></span><span class='dot'></span>";
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  function stopLoading() {
    const loader = output.querySelector(".loading");
    if (loader) loader.remove();
  }

  async function detectLangServer(text) {
    try {
      const r = await fetch(API.LANG, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) return "en";
      const { lang } = await r.json();
      return lang || "en";
    } catch {
      return "en";
    }
  }

  // ---------- LLM ----------
  async function queryLLM(prompt, lang = "en") {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant premium d'Ecommind Agency. 
          Style Harvey Specter: direct, classe, orienté business. Réponds en ${lang}.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    };

    const res = await fetch(API.LLM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.text?.trim() || "";
  }

  // ---------- STT: Recorder → base64 → JSON ----------
  let recStream, mediaRecorder, chunks = [], recording = false;

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  async function recordToggle() {
    if (recording) {
      mediaRecorder.stop();
      recording = false;
      micBtn.textContent = "🎤";
      return;
    }
    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(recStream);
      chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = onRecordStop;

      mediaRecorder.start();
      recording = true;
      micBtn.textContent = "⏹️";
      print("🎤 Parlez…", "system");

      // auto-stop après 6s
      setTimeout(() => recording && mediaRecorder.stop(), 6000);
    } catch (e) {
      print("⚠️ Micro bloqué : " + e.message, "error");
    }
  }

  async function onRecordStop() {
    try {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const dataUrl = await blobToDataURL(blob);

      startLoading();
      const r = await fetch(API.STT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: dataUrl }),
      });
      const data = await r.json().catch(() => ({}));
      stopLoading();

      const text = (data.text || "").trim();
      if (!text) return print("❌ Aucun texte détecté.", "error");

      input.value = text;
      handleSend();
    } catch (e) {
      stopLoading();
      print("⚠️ STT erreur : " + e.message, "error");
    } finally {
      try { recStream?.getTracks().forEach(t => t.stop()); } catch {}
    }
  }

  // ---------- PIPELINE SEND ----------
  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    print(text, "user");
    input.value = "";
    startLoading();

    try {
      const lang = await detectLangServer(text);
      const reply = await queryLLM(text, lang);
      stopLoading();
      print(reply, "assistant");

      if (TTS && !document.getElementById("mute-toggle")?.checked) {
        await TTS.speak(reply, lang);
      }
    } catch (e) {
      stopLoading();
      print("⚠️ Erreur : " + e.message, "error");
    }
  }

  // ---------- EVENTS ----------
  sendBtn?.addEventListener("click", handleSend);
  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSend();
  });
  micBtn?.addEventListener("click", recordToggle);

  // ---------- INIT ----------
  print("👋 Bienvenue chez Ecommind — tapez ou parlez pour lancer la démo.", "system");
})();
