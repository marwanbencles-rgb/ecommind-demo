// ===============================
// ECOMMIND – CTA ABONNEMENT
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // 1. Apparition douce au chargement
  // ===============================
  const section = document.querySelector("[data-animate]");
  if (section) {
    requestAnimationFrame(() => {
      section.classList.add("visible");
    });
  }

  // ===============================
  // 2. Effet 3D "tilt" sur les feature-card
  // ===============================
  const cards = document.querySelectorAll(".feature-card");
  const tiltStrength = 10; // Intensité de l'inclinaison 3D

  cards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0 → 1
      const y = (e.clientY - rect.top) / rect.height;  // 0 → 1

      const rotateX = (0.5 - y) * tiltStrength;   // Inclinaison haut/bas
      const rotateY = (x - 0.5) * tiltStrength;   // Inclinaison gauche/droite

      card.style.transform =
        `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "translateY(0) rotateX(0) rotateY(0)";
    });
  });

  // ===============================
  // 3. CTA principal (clic bouton)
  // ===============================

  const cta = document.getElementById("cta-subscribe");

  if (cta) {
    cta.addEventListener("click", () => {
      console.log("[Ecommind CTA] → Clic sur Sécuriser mon business avec Ecommind");

      // ⚠️ Ici tu mettras l'action finale (redirection, modal, call, Stripe…)
      alert("Ici tu ouvriras le formulaire d'inscription, un audit, un call ou l'espace client.");
    });
  }

});
