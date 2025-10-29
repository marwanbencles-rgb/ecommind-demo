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
