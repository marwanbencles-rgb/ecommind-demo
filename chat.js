// public/chat.js
// ✅ Chat intelligent Ecommind (STT → LLM → TTS)
// - Détection auto de la langue
// - Pipeline complet : voix → texte → réponse IA → audio
// - Fallbacks stables pour chaque étape
// - Design prêt pour intégration front Ecommind

(() => {
  // ---------- CONFIG ----------
  const INPUT_ID   = "chat-input";
  const OUTPUT_ID  = "chat-output";
  const SEND_ID    = "chat-send";
  const MIC_ID     = "chat-mic";

  const API_LLM  = "/api/llm";
  const API_STT  = "/api/stt";
  const TTS      = window.EcommindTTS; // depuis voice.js

  let recording = false;
  let mediaRecorder;
  let chunks = [];

  const $ = (id) => document.getElementById(id);

  const input  = $(INPUT_ID);
  const output = $(OUTPUT_ID);
  const sendBtn = $(SEND_ID);
  const micBtn = $(MIC_ID);

  // ---------- HELPERS ----------
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
      const r = await fetch("/api/lang", {
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

  // ---------- STT ----------
  async function recordAndTranscribe() {
    try {
      if (recording) {
        // stop
        mediaRecorder.stop();
        recording = false;
        micBtn.textContent = "🎤";
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "voice.webm");

        const r = await fetch(API_STT, { method: "POST", body: formData });
        const data = await r.json();

        const text = data.text?.trim();
        if (!text) return print("❌ Aucun texte détecté.", "error");

        input.value = text;
        handleSend();
      };

      mediaRecorder.start();
      recording = true;
      micBtn.textContent = "⏹️";
    } catch (e) {
      print("Erreur micro : " + e.message, "error");
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
          Style Harvey Specter, ton direct, classe, orienté business et automatisation.`,
        },
        { role: "user", content: prompt },
      ],
    };

    const res = await fetch(API_LLM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const data = await res.json();
    return data.text?.trim() || "";
  }

  // ---------- PIPELINE COMPLET ----------
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

      if (TTS && reply) {
        await TTS.speak(reply, lang);
      }
    } catch (e) {
      stopLoading();
      print("⚠️ Erreur : " + e.message, "error");
    }
  }

  // ---------- UI EVENTS ----------
  sendBtn?.addEventListener("click", handleSend);
  micBtn?.addEventListener("click", recordAndTranscribe);
  input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSend();
  });

  // ---------- INIT ----------
  print("👋 Bienvenue chez Ecommind — dites quelque chose ou tapez votre message.", "system");
})();
