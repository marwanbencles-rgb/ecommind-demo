// ECOMMIND – HERO INTERACTIF
document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("hero-bubble");
  const input  = document.getElementById("hero-input");
  const mic    = document.getElementById("hero-mic");
  const cta    = document.getElementById("hero-cta");
  const orb    = document.querySelector(".orb-inner");

  const setBubble = (text) => {
    if (!bubble) return;
    bubble.textContent = text;
  };

  const pulseOrb = () => {
    if (!orb) return;
    orb.style.boxShadow =
      "0 0 60px rgba(0,191,255,1), 0 0 140px rgba(0,191,255,0.95)";
    setTimeout(() => {
      orb.style.boxShadow =
        "0 0 38px rgba(0,191,255,0.95), 0 0 110px rgba(0,191,255,0.7)";
    }, 500);
  };

  // Micro simulé
  if (mic) {
    mic.addEventListener("click", () => {
      setBubble("Micro activé. Dites-moi ce que vous voulez automatiser.");
      pulseOrb();
      console.log("[Hero] Micro simulé – plus tard, branchement voix.");
    });
  }

  // CTA : scénario de démo
  const runScenario = () => {
    const value = (input?.value || "").trim();

    if (!value) {
      setBubble("Commencez par m’écrire une phrase sur votre business.");
      pulseOrb();
      return;
    }

    const lines = [
      `Vous dirigez : « ${value} ».`,
      "Très bien. Je vais analyser vos points de friction et où l’IA peut prendre le relais.",
      "Regardez maintenant comment Ecommind peut capter, qualifier et convertir vos demandes automatiquement."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setBubble(lines[i]);
      pulseOrb();
      i += 1;
      if (i >= lines.length) clearInterval(interval);
    }, 2600);
  };

  if (cta) {
    cta.addEventListener("click", runScenario);
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runScenario();
      }
    });
  }

  console.log("%cEcommind – Hero IA chargé ✅", "color:#C9A55E;font-weight:bold;");
});
