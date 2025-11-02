// ======== app.js — Ecommind Assistant IA ========

// Sélecteurs DOM
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const muteToggle = document.getElementById('mute-toggle');
const preset = document.getElementById('preset-hello');
const ttsAudio = document.getElementById('tts-audio');
const langBadge = document.getElementById('lang-badge');

// États globaux
let currentLang = "fr";
let isMuted = false;
let isSpeaking = false;
let currentAudio = null;

// Fonction utilitaire pour envoyer un événement global
function dispatchEventCustom(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// =============================
// 🔍 1. Détection automatique de langue
// =============================
async function detectLanguage(text) {
  try {
    const res = await fetch('/api/lang-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    const lang = data?.lang || 'fr';
    currentLang = lang;
    langBadge.textContent = 'Langue : ' + lang;
    dispatchEventCustom('detected-language', { lang });
    return lang;
  } catch (e) {
    console.warn('Erreur détection langue:', e);
    return 'fr';
  }
}

// =============================
// 🤖 2. Appel à GPT pour réponse
// =============================
async function getChatResponse(text, lang = "fr") {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, lang })
    });
    const data = await res.json();
    return data?.reply || "Je n'ai pas compris, pouvez-vous reformuler ?";
  } catch (e) {
    console.error("Erreur API Chat:", e);
    return "Erreur côté serveur.";
  }
}

// =============================
// 🗣️ 3. Lecture vocale TTS
// =============================
async function playTTS(text, lang = "fr") {
  if (isMuted) return;

  // Stop toute lecture précédente
  if (isSpeaking && currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    isSpeaking = false;
  }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });

    if (!res.ok) throw new Error(`TTS status ${res.status}`);
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    // Assignation au lecteur audio global (orb)
    currentAudio = ttsAudio;
    currentAudio.src = url;
    isSpeaking = true;
    await currentAudio.play();

    currentAudio.onended = () => {
      isSpeaking = false;
      URL.revokeObjectURL(url);
    };

  } catch (e) {
    console.error("Erreur TTS:", e);
    dispatchEventCustom('tts-error');
  }
}

// =============================
// 🧠 4. Gestion des messages
// =============================
async function handleMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  // 1️⃣ Détecter la langue
  const lang = await detectLanguage(text);

  // 2️⃣ Afficher la question
  appendMessage(text, "user");

  // 3️⃣ Obtenir la réponse GPT
  const reply = await getChatResponse(text, lang);

  // 4️⃣ Afficher la réponse
  appendMessage(reply, "bot");

  // 5️⃣ Lecture audio
  await playTTS(reply, lang);
}

// =============================
// 💬 5. Ajout dynamique des messages
// =============================
function appendMessage(text, role = "bot") {
  const container = document.querySelector(".stack");
  if (!container) return;

  const div = document.createElement("div");
  div.classList.add("item");
  if (role === "user") {
    div.style.background = "rgba(0,191,255,0.08)";
    div.style.border = "1px solid rgba(0,191,255,0.2)";
  }
  div.textContent = text;
  container.appendChild(div);
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

// =============================
// 🔇 6. Mode muet
// =============================
muteToggle.addEventListener("change", (e) => {
  isMuted = e.target.checked;
  dispatchEventCustom('toggle-mute', { muted: isMuted });
});

// =============================
// 📨 7. Bouton “Envoyer” & Entrée
// =============================
sendBtn.addEventListener("click", handleMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleMessage();
  }
});

// =============================
// 🚀 8. Message d’accueil automatique
// =============================
window.addEventListener("load", () => {
  const welcomeText = "Bienvenue dans la démo Ecommind. Dites-moi votre besoin : site, automatisation, ou prise de rendez-vous ?";
  appendMessage(welcomeText, "bot");
  playTTS(welcomeText, "fr");
});
