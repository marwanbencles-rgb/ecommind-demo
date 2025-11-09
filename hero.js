// ECOMMIND – HERO INTERACTIF
document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("hero-bubble");
  const input  = document.getElementById("hero-input");
  const mic    = document.getElementById("hero-mic");
  const cta    = document.getElementById("hero-cta");

  const setBubble = (text) => {
    if (bubble) bubble.textContent = text;
  };

  const runScenario = () => {
    const value = (input?.value || "").trim();

    if (!value) {
      setBubble("Commencez par m’écrire une phrase sur votre business.");
      return;
    }

    const lines = [
      `Vous dirigez : « ${value} ».`,
      "Très bien. Je repère où l’IA peut prendre le relais sur vos tâches répétitives.",
      "Regardez maintenant comment Ecommind peut capter, qualifier et convertir vos demandes automatiquement."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setBubble(lines[i]);
      i += 1;
      if (i >= lines.length) clearInterval(interval);
    }, 2600);
  };

  if (mic) {
    mic.addEventListener("click", () => {
      setBubble("Micro activé. Dites-moi ce que vous voulez automatiser.");
      console.log("[Hero] Micro simulé – plus tard, tu branches la vraie voix ici.");
    });
  }

  if (cta) cta.addEventListener("click", runScenario);
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runScenario();
      }
    });
  }
});
