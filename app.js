/* =============================================
   Ecommind Cockpit – Interactions GSAP Premium
   Mercedes × Apple × Velar Edition
   ============================================= */

// Vérifie que GSAP est dispo
if (typeof gsap === "undefined") {
  console.warn("⚠️ GSAP non chargé. Ajoute le CDN avant ce script.");
}

/* -------- Parallaxe du Hero -------- */
document.addEventListener("mousemove", (e) => {
  const heroBg = document.querySelector(".hero-bg");
  if (!heroBg) return;

  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  gsap.to(heroBg, {
    duration: 1.5,
    ease: "power2.out",
    backgroundPosition: `${50 + x}% ${50 + y}%`,
  });
});

/* -------- Apparition fluide du contenu -------- */
window.addEventListener("load", () => {
  gsap.timeline()
    .from("header", { opacity: 0, y: -20, duration: 0.6, ease: "power2.out" })
    .from(".hero-inner > *", {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: 0.1,
      ease: "power2.out",
    })
    .from(".cockpit", { opacity: 0, y: 60, duration: 0.8, ease: "power2.out" }, "-=0.3");
});

/* -------- Voice Orb Animation -------- */
const voiceOrb = document.getElementById("voiceOrb");
if (voiceOrb) {
  let pulse = null;
  let active = false;

  const startPulse = () => {
    if (pulse) pulse.kill();
    pulse = gsap.to(voiceOrb, {
      scale: 1.08,
      repeat: -1,
      yoyo: true,
      duration: 0.6,
      ease: "sine.inOut",
      boxShadow: "0 0 40px rgba(0,191,255,.4), 0 0 70px rgba(201,165,94,.25)"
    });
  };

  const stopPulse = () => {
    if (pulse) pulse.kill();
    gsap.to(voiceOrb, {
      scale: 1,
      boxShadow: "0 0 50px rgba(0,191,255,.25),0 0 80px rgba(201,165,94,.15)",
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const toggleVoice = () => {
    active = !active;
    if (active) {
      startPulse();
    } else {
      stopPulse();
    }
  };

  const btnVoice = document.querySelector('[data-action="voice-toggle"]');
  if (btnVoice) {
    btnVoice.addEventListener("click", toggleVoice);
  }
}

/* -------- Hover Glow sur les KPI -------- */
document.querySelectorAll(".kpi").forEach((kpi) => {
  kpi.addEventListener("mouseenter", () => {
    gsap.to(kpi, {
      duration: 0.4,
      boxShadow: "0 0 30px rgba(0,191,255,.15)",
      borderColor: "rgba(0,191,255,.35)",
      ease: "power2.out",
    });
  });
  kpi.addEventListener("mouseleave", () => {
    gsap.to(kpi, {
      duration: 0.4,
      boxShadow: "none",
      borderColor: "rgba(255,255,255,.08)",
      ease: "power2.inOut",
    });
  });
});

/* -------- Animation des boutons -------- */
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    gsap.to(btn, {
      duration: 0.25,
      scale: 1.03,
      boxShadow: "0 0 25px rgba(201,165,94,.25)",
      ease: "power1.out",
    });
  });
  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, {
      duration: 0.25,
      scale: 1,
      boxShadow: "none",
      ease: "power1.inOut",
    });
  });
});

/* -------- Animation d'entrée du cockpit -------- */
gsap.from(".glass", {
  scrollTrigger: {
    trigger: ".cockpit",
    start: "top 85%",
  },
  opacity: 0,
  y: 40,
  duration: 0.8,
  stagger: 0.15,
  ease: "power2.out",
});

/* -------- Petit effet sonore optionnel (simulé) -------- */
// (à remplacer plus tard par ton TTS ou ton IA vocale)
const btnChat = document.querySelector('[data-action="open-chat"]');
if (btnChat) {
  btnChat.addEventListener("click", () => {
    gsap.to(btnChat, {
      scale: 1.1,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    });
  });
}
