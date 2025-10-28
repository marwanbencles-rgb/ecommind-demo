// ===================================================
// ECOMMMIND DEMO - VOIX PERSUASIVE & INTELLIGENTE
// ===================================================
// Auteur : Marwan x Mentor GPT-5
// Objectif : épater le prospect dès la première phrase.
// ===================================================

// ===== VARIABLES GLOBALES =====
let __playingAudio = null;
window.__LOCALE__ = navigator.language.startsWith("fr") ? "fr" : "en";

// ======= STOP LECTURE =======
function stopSpeaking() {
  if (__playingAudio && typeof __playingAudio.stop === 'function') {
    __playingAudio.stop();
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// ======= LECTURE PREMIUM (TTS OPENAI) =======
async function speak(text, opts = {}) {
  const voice = opts.voice || "verse"; // alloy | verse | aria
  stopSpeaking();

  try {
    const res = await fetch("/.netlify/functions/tts-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice })
    });

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg);
    }

    // Lecture en BLOB pour qualité audio maximale
    const blob = await res.blob();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuf = await blob.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);

    const src = ctx.createBufferSource();
    src.buffer = audioBuf;

    const gain = ctx.createGain();
    gain.gain.value = 1.22; // Légère amplification naturelle
    src.connect(gain).connect(ctx.destination);
    src.start(0);

    __playingAudio = { stop: () => { try { src.stop(); ctx.close(); } catch (e) {} } };

  } catch (e) {
    console.warn("TTS premium échoué, fallback local :", e);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (window.__LOCALE__ === "fr") ? "fr-FR" : "en-US";
    u.rate = 1.02;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  }
}

// ======= REFORMULATION VOIX DE VENTE =======
async function rewriteForSpeech(raw, lang = "fr") {
  const system =
    lang === "fr"
      ? "Réécris ce texte pour une voix off persuasive et orale. Ton chaleureux, confiant et naturel. Rythme fluide. Pas de mots techniques. Doit donner envie de dire oui."
      : "Rewrite this text for a persuasive, spoken voice-over. Warm and confident tone. Natural rhythm. No technical jargon. Must sound inspiring.";
  try {
    const res = await fetch("/.netlify/functions/chatgpt-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: raw },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json.reply || raw;
  } catch (e) {
    console.warn("Réécriture IA désactivée :", e);
    return raw;
  }
}

// ======= COMBINE LES DEUX : RÉÉCRIT + PARLE =======
async function speakSales(raw, lang = "fr") {
  const polished = await rewriteForSpeech(raw, lang);
  await speak(polished, { voice: "verse" });
}

// ======= DÉMONSTRATION AUTOMATIQUE =======
async function launchDemo() {
  stopSpeaking();

  const demoTextFR = `
  Bonjour — ici Ecommind.
  Vous avez un commerce, un garage, un restaurant… et vous perdez du temps à gérer les appels ?
  Imaginez une assistante vocale qui parle à vos clients, qui répond à leurs questions,
  et qui cale automatiquement les rendez-vous.
  Pas demain — aujourd’hui.
  On lance la démonstration ?
  `;

  const demoTextEN = `
  Hi there — this is Ecommind.
  Imagine a smart assistant that speaks to your customers,
  answers their questions, and books appointments automatically.
  No delays. Just results.
  Ready for the demo?
  `;

  const text = window.__LOCALE__ === "fr" ? demoTextFR : demoTextEN;
  await speakSales(text, window.__LOCALE__);
}

// ======= EXÉCUTION AUTOMATIQUE AU LANCEMENT =======
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Ecommind IA Demo Loaded ✅");
  // Optionnel : lancement auto après 1s
  setTimeout(launchDemo, 1200);
});

// ======= ÉCOUTE MANUELLE =======
window.speakSales = speakSales;
window.stopSpeaking = stopSpeaking;
window.launchDemo = launchDemo;
