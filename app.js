// ===============================
// ECOMMIND AGENCY – DEMO INTERACTIVE
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // --------- ANIMATION AU SCROLL ---------
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

  // --------- CANVAS DE FOND (effet jeu / ciné) ---------
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let width, height, dpr;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  let t = 0;
  function renderBackground() {
    t += 0.003;
    ctx.clearRect(0, 0, width, height);

    // Gradient principal (halo offshore)
    const cx = width / 2;
    const cy = height * 0.4;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, height * 0.9);
    grd.addColorStop(0, "rgba(0,191,255,0.35)");
    grd.addColorStop(0.4, "rgba(0,20,40,1)");
    grd.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    // Lueur basse mouvante
    const cy2 = height * 0.85;
    const offset = Math.sin(t) * width * 0.08;
    const grd2 = ctx.createRadialGradient(cx + offset, cy2, 0, cx, cy2, width * 0.9);
    grd2.addColorStop(0, "rgba(0,191,255,0.45)");
    grd2.addColorStop(0.5, "rgba(0,20,40,0.9)");
    grd2.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = grd2;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // Particules discrètes
    const count = 40;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < count; i++) {
      const px = (i * 97 + t * 800) % width;
      const py = (i * 51 + t * 600) % height;
      const r = (Math.sin(t * 3 + i) + 1.5) * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(renderBackground);
  }
  renderBackground();

  // --------- PARALLAX LÉGER HERO + ORBE ---------
  const heroCircle = document.getElementById("hero-parallax");
  const orbWrapper = document.getElementById("orb-parallax");

  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 à 1
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    if (heroCircle) {
      heroCircle.style.transform =
        `translate(calc(-50% + ${x * 12}px), calc(-52% + ${y * 8}px))`;
    }
    if (orbWrapper) {
      orbWrapper.style.transform = `translate(${x * 10}px, ${y * 6}px)`;
    }
  });

  // --------- DOM & UTILS ---------
  const ctaJoin       = document.getElementById("cta-join");
  const ctaEnterDemo  = document.getElementById("cta-enter-demo");
  const ctaActivateIA = document.getElementById("cta-activate-ia");
  const micBtn        = document.getElementById("mic-btn");
  const demoInput     = document.getElementById("demo-input");
  const speechBubble  = document.querySelector(".speech-bubble");
  const heroSection   = document.querySelector(".hero-section");
  const demoSection   = document.querySelector(".demo-section");
  const orbInner      = document.querySelector(".orb-inner");

  const scrollToSection = (section) => {
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pulseOrb = () => {
    if (!orbInner) return;
    orbInner.style.boxShadow = "0 0 50px rgba(0,191,255,1), 0 0 110px rgba(0,191,255,0.9)";
    setTimeout(() => {
      orbInner.style.boxShadow = "0 0 32px rgba(0,191,255,0.9), 0 0 80px rgba(0,191,255,0.7)";
    }, 550);
  };

  const setBubbleText = (text) => {
    if (!speechBubble) return;
    speechBubble.textContent = text;
  };

  // --------- CTA SECTION 1 ---------
  if (ctaJoin) {
    ctaJoin.addEventListener("click", () => {
      console.log("[Ecommind] CTA Rejoindre cliqué");
      scrollToSection(heroSection);
    });
  }

  // --------- CTA HERO ---------
  if (ctaEnterDemo) {
    ctaEnterDemo.addEventListener("click", () => {
      console.log("[Ecommind] CTA Entrer dans la démo cliqué");
      scrollToSection(demoSection);
      setBubbleText("Bienvenue dans la démo. Dites-moi quel type de business vous avez.");
      pulseOrb();
    });
  }

  // --------- SCÉNARIO DEMO IA ---------
  const runDemoScenario = () => {
    if (!demoInput) return;
    const value = demoInput.value.trim();

    if (!value) {
      setBubbleText("Commencez par me dire votre activité : restaurant, garage, boutique…");
      pulseOrb();
      return;
    }

    const domain = value;
    const lines = [
      `Très bien, vous gérez un ${domain}.`,
      "Je vais vous montrer comment Ecommind automatise vos appels, vos demandes clients et vos prises de rendez-vous.",
      "Imaginez : moins de tâches répétitives, plus de temps pour ce qui génère du chiffre."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setBubbleText(lines[i]);
      pulseOrb();
      i += 1;
      if (i >= lines.length) clearInterval(interval);
    }, 2600);
  };

  if (ctaActivateIA) {
    ctaActivateIA.addEventListener("click", runDemoScenario);
  }

  if (demoInput) {
    demoInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runDemoScenario();
      }
    });
  }

  // --------- MICRO (SIMULATION) ---------
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      console.log("[Ecommind] Micro simulé");
      setBubbleText("Micro activé… dites-moi votre business et je construis un scénario.");
      pulseOrb();
      // Ici tu pluggeras plus tard Web Speech / ElevenLabs / backend
    });
  }

  console.log("%cEcommind Agency – Demo IA (canvas + parallax) prête ✅", "color:#C9A55E;font-weight:bold;");
});
