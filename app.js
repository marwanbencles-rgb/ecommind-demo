document.addEventListener("DOMContentLoaded", () => {
  // --------- ANIMATION AU SCROLL ---------
  const animated = document.querySelectorAll("[data-animate]");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    animated.forEach(el => observer.observe(el));
  } else {
    // Fallback vieux navigateurs : tout visible
    animated.forEach(el => el.classList.add("visible"));
  }

  const logDemo = (label) => {
    console.log("[Ecommind Demo]", label);
  };

  // --------- RÉFÉRENCES DOM ---------
  const ctaJoin       = document.getElementById("cta-join");
  const ctaEnterDemo  = document.getElementById("cta-enter-demo");
  const ctaActivateIA = document.getElementById("cta-activate-ia");
  const micBtn        = document.getElementById("mic-btn");
  const demoInput     = document.getElementById("demo-input");

  const heroSection   = document.querySelector(".hero-section");
  const demoSection   = document.querySelector(".demo-section");
  const speechBubble  = document.querySelector(".speech-bubble");
  const orbInner      = document.querySelector(".orb-inner");

  // --------- UTIL ---------
  const smoothScrollTo = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setBubbleText = (text) => {
    if (!speechBubble) return;
    speechBubble.textContent = text;
  };

  const pulseOrb = () => {
    if (!orbInner) return;
    orbInner.classList.add("glow-blue");
    setTimeout(() => {
      orbInner.classList.remove("glow-blue");
    }, 700);
  };

  // --------- CTA “REJOINDRE ECOMMIND” (section 1) ---------
  if (ctaJoin) {
    ctaJoin.addEventListener("click", () => {
      logDemo("CTA Rejoindre Ecommind cliqué");
      smoothScrollTo(heroSection);
    });
  }

  // --------- CTA “ENTRER DANS LA DÉMO” (section 2) ---------
  if (ctaEnterDemo) {
    ctaEnterDemo.addEventListener("click", () => {
      logDemo("CTA Entrer dans la démo cliqué");
      smoothScrollTo(demoSection);
      pulseOrb();
      setBubbleText("Bienvenue dans la démo. Dites-moi d’abord quel type de business vous avez.");
    });
  }

  // --------- INPUT + CTA “ACTIVER L’IA ECOMMIND” (section 3) ---------
  const triggerDemoScenario = () => {
    const value = demoInput ? demoInput.value.trim() : "";
    logDemo("Scénario IA déclenché avec : " + (value || "[vide]"));

    if (!value) {
      setBubbleText("Commencez par me dire en une phrase quel est votre business.");
    } else {
      setBubbleText(
        "Très bien, je me mets à votre place : \"" +
        value +
        "\". Laissez-moi vous montrer ce que l’IA Ecommind peut automatiser."
      );
    }
    pulseOrb();
  };

  if (ctaActivateIA) {
    ctaActivateIA.addEventListener("click", () => {
      triggerDemoScenario();
    });
  }

  if (demoInput) {
    demoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerDemoScenario();
      }
    });
  }

  // --------- BOUTON MICRO ---------
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      logDemo("Bouton micro cliqué");
      setBubbleText("Micro prêt. Parlez, je vous écoute.");
      pulseOrb();

      // Ici tu pourras brancher ton vrai flux vocal (WebRTC, ElevenLabs, etc.)
      // Exemple : startRecording() / stopRecording()
    });
  }

  // Tu pourras exposer quelques fonctions globales si besoin pour le backend
  window.EcommindDemo = {
    triggerDemoScenario,
    log: logDemo
  };
});
