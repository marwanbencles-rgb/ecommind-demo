/* =====================================================
   ECOMMIND – APP.JS  "COCKPIT FULL LUXE STABLE"
   Mercedes × Apple × CAC40 | sans dépendances
   ===================================================== */

// --- Vérif GSAP ---
const hasGSAP = typeof gsap !== "undefined";
if (!hasGSAP) console.warn("⚠️ GSAP non chargé. Vérifie le <script> dans index.html");

/* ------------------------------
   Parallaxe du fond héros
------------------------------ */
document.addEventListener("mousemove", (e) => {
  if (!hasGSAP) return;
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

/* ------------------------------
   Apparition fluide (intro)
------------------------------ */
window.addEventListener("load", () => {
  if (!hasGSAP) return;
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  tl.from("header", { opacity: 0, y: -20, duration: 0.6 })
    .from(".hero-inner > *", {
      opacity: 0,
      y: 40,
      duration: 0.6,
      stagger: 0.1,
    })
    .from(".cockpit", { opacity: 0, y: 60, duration: 0.8 }, "-=0.3")
    .from(".glass", { opacity: 0, y: 40, duration: 0.7, stagger: 0.15 }, "-=0.2");
});

/* ------------------------------
   Orb vocal réactif
------------------------------ */
const voiceOrb = document.getElementById("voiceOrb");
let orbPulse = null;
let orbActive = false;

function startPulse() {
  if (!hasGSAP || !voiceOrb) return;
  if (orbPulse) orbPulse.kill();
  orbPulse = gsap.to(voiceOrb, {
    scale: 1.08,
    repeat: -1,
    yoyo: true,
    duration: 0.6,
    ease: "sine.inOut",
    boxShadow: "0 0 40px rgba(0,191,255,.45), 0 0 90px rgba(201,165,94,.3)",
  });
}

function stopPulse() {
  if (!hasGSAP || !voiceOrb) return;
  if (orbPulse) orbPulse.kill();
  gsap.to(voiceOrb, {
    scale: 1,
    boxShadow: "0 0 40px rgba(0,191,255,.25),0 0 60px rgba(201,165,94,.15)",
    duration: 0.5,
    ease: "power2.out",
  });
}

const voiceButton = document.querySelector('[data-action="voice-toggle"]');
if (voiceButton) {
  voiceButton.addEventListener("click", () => {
    orbActive = !orbActive;
    orbActive ? startPulse() : stopPulse();
    if (hasGSAP) {
      gsap.fromTo(
        voiceButton,
        { scale: 1 },
        { scale: 1.08, yoyo: true, repeat: 1, duration: 0.15, ease: "power1.inOut" }
      );
    }
  });
}

/* ------------------------------
   Hover boutons
------------------------------ */
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    if (!hasGSAP) return;
    gsap.to(btn, {
      scale: 1.04,
      duration: 0.25,
      ease: "power2.out",
      boxShadow: "0 0 25px rgba(201,165,94,.25)",
    });
  });
  btn.addEventListener("mouseleave", () => {
    if (!hasGSAP) return;
    gsap.to(btn, {
      scale: 1,
      duration: 0.25,
      ease: "power2.inOut",
      boxShadow: "none",
    });
  });
});

/* ------------------------------
   KPI hover dynamique
------------------------------ */
document.querySelectorAll(".kpi").forEach((kpi) => {
  kpi.addEventListener("mouseenter", () => {
    if (!hasGSAP) return;
    gsap.to(kpi, {
      borderColor: "rgba(0,191,255,.35)",
      boxShadow: "0 0 35px rgba(0,191,255,.15)",
      duration: 0.4,
      ease: "power2.out",
    });
  });
  kpi.addEventListener("mouseleave", () => {
    if (!hasGSAP) return;
    gsap.to(kpi, {
      borderColor: "rgba(255,255,255,.08)",
      boxShadow: "none",
      duration: 0.4,
      ease: "power2.inOut",
    });
  });
});

/* ------------------------------
   Effet lumière cockpit global
------------------------------ */
if (hasGSAP) {
  gsap.to("body", {
    background: "radial-gradient(ellipse at 50% 50%, rgba(0,191,255,.04), transparent 80%)",
    duration: 5,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
  });
}

/* ------------------------------
   Chat et formulaire
------------------------------ */
const chatBtn = document.querySelector('[data-action="open-chat"]');
if (chatBtn) {
  chatBtn.addEventListener("click", () => {
    if (hasGSAP) {
      gsap.fromTo(chatBtn, { scale: 1 }, { scale: 1.1, yoyo: true, repeat: 1, duration: 0.15 });
    }
    alert("💬 Chat cockpit — connecté à ton IA Ecommind (module à venir).");
  });
}

const quickQuote = document.getElementById("quickQuote");
if (quickQuote) {
  quickQuote.addEventListener("submit", (e) => {
    e.preventDefault();
    const needInput = quickQuote.querySelector("#need");
    const need = needInput ? needInput.value.trim() : "";
    if (need) {
      alert(`✅ Reçu : “${need}”\nNous préparons ton mini-plan personnalisé.`);
      if (hasGSAP) {
        gsap.fromTo(
          quickQuote,
          { scale: 1 },
          { scale: 1.02, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }
        );
      }
    } else {
      alert("Décris ton besoin pour générer un plan clair.");
    }
  });
}
