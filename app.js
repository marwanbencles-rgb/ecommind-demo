// ===============================
// ECOMMIND AGENCY – DEMO INTERACTIVE
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // --- Apparition fluide des sections ---
  const elements = document.querySelectorAll("[data-animate]");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  elements.forEach(el => observer.observe(el));

  // --- Références DOM ---
  const ctaJoin       = document.getElementById("cta-join");
  const ctaEnterDemo  = document.getElementById("cta-enter-demo");
  const ctaActivateIA = document.getElementById("cta-activate-ia");
  const micBtn        = document.getElementById("mic-btn");
  const demoInput     = document.getElementById("demo-input");
  const speechBubble  = document.querySelector(".speech-bubble");
  const heroSection   = document.querySelector(".hero-section");
  const demoSection   = document.querySelector(".demo-section");
  const orbInner      = document.querySelector(".orb-inner");

  // --- Fonctions utilitaires ---
  const scrollToSection = (section) => {
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pulseOrb = () => {
    if (!orbInner) return;
    orbInner.style.boxShadow = "0 0 50px rgba(0,191,255,0.9)";
    setTimeout(() => {
      orbInner.style.boxShadow = "0 0 40px rgba(0,191,255,0.8)";
    }, 600);
  };

  const setBubbleText = (text) => {
    if (!speechBubble) return;
    speechBubble.textContent = text;
  };

  // --- CTA : Rejoindre Ecommind ---
  if (ctaJoin) {
    ctaJoin.addEventListener("click", () => {
      console.log("[Ecommind] Bouton 'Rejoindre Ecommind' cliqué");
      scrollToSection(heroSection);
    });
  }

  // --- CTA : Entrer dans la démo ---
  if (ctaEnterDemo) {
    ctaEnterDemo.addEventListener("click", () => {
      console.log("[Ecommind] Bouton 'Entrer dans la démo' cliqué");
      scrollToSection(demoSection);
      setBubbleText("Bienvenue dans la démo. Dites-moi quel est votre domaine : restaurant, garage, boutique...");
      pulseOrb();
    });
  }

  // --- Fonction IA simulée ---
  const runDemoScenario = () => {
    const value = demoInput.value.trim();
    if (!value) {
      setBubbleText("Commencez par me dire votre type d’activité pour que je personnalise la démo.");
      pulseOrb();
      return;
    }

    const response = [
      `Intéressant... Vous dirigez un ${value}.`,
      "Regardez comment l’IA Ecommind peut vous faire gagner du temps et des clients.",
      "Automatisation des appels, gestion des commandes et analyse en temps réel... prête à l’emploi."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setBubbleText(response[i]);
      pulseOrb();
      i++;
      if (i >= response.length) clearInterval(interval);
    }, 2500);
  };

  // --- Bouton : Activer l'IA ---
  if (ctaActivateIA) {
    ctaActivateIA.addEventListener("click", runDemoScenario);
  }

  // --- Entrée clavier : touche Entrée ---
  if (demoInput) {
    demoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runDemoScenario();
      }
    });
  }

  // --- Micro : simulation d’activation ---
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      console.log("[Ecommind] Micro activé");
      setBubbleText("Micro activé... dites-moi votre business.");
      pulseOrb();
      // Ici tu pourras plus tard brancher ton vrai flux vocal (Web Speech / ElevenLabs)
    });
  }

  // --- Message console (diagnostic) ---
  console.log("%cEcommind Agency – Demo IA active ✅", "color:#C9A55E;font-weight:bold;");
});
