// === APP.JS – Démo vocale Ecommind ===

// Sélectionne les éléments principaux
const pulse = document.querySelector('.pulse'); // ton cercle bleu
const button = document.querySelector('#launchDemoBtn');

// Effet de pulsation pendant la lecture
function startPulse() {
  if (!pulse) return;
  pulse.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.15)', opacity: 0.7 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    {
      duration: 1500,
      iterations: Infinity,
      easing: 'ease-in-out',
    }
  );
}

function stopPulse() {
  if (!pulse) return;
  pulse.getAnimations().forEach((anim) => anim.cancel());
  pulse.style.transform = 'scale(1)';
  pulse.style.opacity = 1;
}

// ==========================
// 🔊 Fonction ElevenLabs TTS
// ==========================
async function speakWithElevenLabs(text, options = {}) {
  try {
    const res = await fetch('/.netlify/functions/tts-eleven', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options.voice || 'Rachel', // Change "Rachel" par "Bella" ou "Antoni" si tu veux
        modelId: options.modelId || 'eleven_turbo_v2'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Erreur TTS :', data);
      alert('Erreur vocale : Impossible de joindre ElevenLabs.');
      stopPulse();
      return;
    }

    const audioUrl = `data:${data.mime};base64,${data.audio}`;
    const audio = new Audio(audioUrl);

    // Quand la voix commence
    audio.onplay = () => startPulse();
    // Quand la voix se termine
    audio.onended = () => stopPulse();

    await audio.play();
  } catch (e) {
    console.error('Erreur de lecture :', e);
    stopPulse();
  }
}

// ==========================
// 💬 Script de démonstration
// ==========================

// Liste de phrases que l'IA prononce, avec pauses
const demoScript = [
  "Bienvenue chez Ecommind.",
  "Pendant que d'autres prospectent, vous automatisez.",
  "Pendant qu'ils dorment, votre système attire.",
  "Pendant que vous vivez, votre business tourne.",
  "Ecommind ne vend pas un service, mais une machine à succès.",
  "2490 euros pour entrer dans la nouvelle ère.",
  "Et 490 euros par mois pour ne plus jamais revenir en arrière.",
  "Bienvenue dans l'automatisation intelligente."
];

// Fonction pour lire chaque phrase une par une
async function playDemo() {
  for (const line of demoScript) {
    await speakWithElevenLabs(line);
    await new Promise((r) => setTimeout(r, 800)); // petite pause entre les phrases
  }
}

// ==========================
// 🖱️ Bouton de lancement
// ==========================
if (button) {
  button.addEventListener('click', async () => {
    stopPulse();
    button.disabled = true;
    button.innerText = "🔊 Démonstration en cours...";
    await playDemo();
    button.innerText = "🎯 Relancer la démo";
    button.disabled = false;
  });
}

// ==========================
// 🌀 Effet d'accueil
// ==========================
window.addEventListener('load', () => {
  if (pulse) {
    pulse.style.transition = '0.8s ease';
    pulse.style.transform = 'scale(1.05)';
    setTimeout(() => (pulse.style.transform = 'scale(1)'), 1200);
  }
});
/* ===========================================================
   LEVIER BOOSTER : Urgence douce + Exit-Intent + Capture
   =========================================================== */

// -- Compte à rebours 48h : persistant (localStorage)
function getDeadline48h() {
  const key = "ecommind_deadline";
  const saved = localStorage.getItem(key);
  if (saved) return new Date(saved);
  const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
  localStorage.setItem(key, d.toISOString());
  return d;
}

function fmt(n){ return String(n).padStart(2, "0"); }

function updateCountdown() {
  const end = getDeadline48h().getTime();
  const now = Date.now();
  const left = Math.max(0, end - now);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const txt = `${fmt(h)}:${fmt(m)}:${fmt(s)}`;
  const sticky = document.getElementById("stickyCountdown");
  const modal  = document.getElementById("modalCountdown");
  if (sticky) sticky.textContent = txt;
  if (modal)  modal.textContent  = txt;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// -- Preuve sociale (ticker soft)
(function proofTicker(){
  const el = document.getElementById("proofTicker");
  if(!el) return;
  let base = Number(el.textContent || 37);
  setInterval(() => {
    base += Math.random() < 0.6 ? 1 : 0; // incrément doux
    el.textContent = base;
  }, 5000);
})();

// -- Scroll & CTA
const stickyCta   = document.getElementById("stickyCta");
const sectionCta  = document.getElementById("sectionCta");

function goBooking(){
  document.getElementById("booking")?.scrollIntoView({behavior:"smooth", block:"start"});
}
stickyCta?.addEventListener("click", goBooking);
sectionCta?.addEventListener("click", goBooking);

// -- Exit-Intent : déclenche 1 seule fois
let exitShown = sessionStorage.getItem("exit_shown") === "1";
const exitModal    = document.getElementById("exitModal");
const exitBackdrop = document.getElementById("exitBackdrop");
const exitClose    = document.getElementById("exitClose");

function openExit(){
  if(exitShown) return;
  exitShown = true;
  sessionStorage.setItem("exit_shown", "1");
  exitModal?.classList.add("show");
}
function closeExit(){
  exitModal?.classList.remove("show");
}
exitBackdrop?.addEventListener("click", closeExit);
exitClose?.addEventListener("click", closeExit);

// Détection sortie curseur (haut de l’écran) desktop
document.addEventListener("mouseout", (e)=>{
  if (!e.relatedTarget && e.clientY <= 8) openExit();
});

// -- Capture email (Exit modal)
const exitForm  = document.getElementById("exitForm");
const exitEmail = document.getElementById("exitEmail");
exitForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = (exitEmail?.value || "").trim();
  if(!email) return;
  // TODO: brancher ta Netlify Function / webhook pour envoyer l’email vers Gmail/Notion/Sheet
  // await fetch('/.netlify/functions/notify', { method:'POST', body: JSON.stringify({ email, source:'exit-intent' }) });
  closeExit();
  alert("Merci ! On vous envoie votre créneau sous 10 minutes.");
});

// -- Form booking (prise de contact rapide)
const bookingForm = document.getElementById("bookingForm");
bookingForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name  = document.getElementById("bName")?.value?.trim();
  const email = document.getElementById("bEmail")?.value?.trim();
  const phone = document.getElementById("bPhone")?.value?.trim();

  if(!name || !email) return alert("Renseignez au moins nom + email.");

  // TODO: branche réelle (Gmail API / webhook Netlify / Make / n8n)
  // await fetch('/.netlify/functions/notify', { method:'POST', body: JSON.stringify({ name, email, phone, source:'booking' }) });

  // Feedback instantané + scroll haut
  bookingForm.reset();
  window.scrollTo({top: 0, behavior: "smooth"});
  alert("Créneau reçu ✅ Nous revenons vers vous très vite (moins de 10 min).");
});
