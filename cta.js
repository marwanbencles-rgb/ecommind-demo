// ===============================
// ECOMMIND – CTA ABONNEMENT
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // Apparition douce au chargement
  const section = document.querySelector("[data-animate]");
  if (section) requestAnimationFrame(() => section.classList.add("visible"));

  // Effet tilt 3D léger sur les cartes (sans lib externe)
  const cards = document.querySelectorAll(".feature-card");

  cards.forEach(card => {
    const strength = 10; // intensité de l’inclinaison

    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0 → 1
      const y = (e.clientY - rect.top) / rect.height;  // 0 → 1

      const rotateX = (0.5 - y) * strength;   // haut/bas
      const rotateY = (x - 0.5) * strength;   // gauche/droite

      card.style.transform =
        `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "translateY(0) rotateX(0) rotateY(0)";
    });
  });

  // CTA principal – pour l’instant simple log + alert
  const cta = document.getElementById("cta-subscribe");
  if (cta) {
    cta.addEventListener("click", () => {
      console.log("[Ecommind CTA] Clic sur Sécuriser mon business");
      alert("Ici tu pourras ouvrir la page d’inscription ou un formulaire de call / audit.");
    });
  }
});
