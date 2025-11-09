document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector("[data-animate]");
  if (section) {
    // Apparition simple
    requestAnimationFrame(() => section.classList.add("visible"));
  }

  const cta = document.getElementById("cta-join");
  if (cta) {
    cta.addEventListener("click", () => {
      console.log("[Header Ecommind] CTA Rejoindre cliqué");
      alert("Ici tu redirigeras vers la page HERO ou la page de vente de tes packs.");
    });
  }
});
