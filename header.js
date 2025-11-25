// header.js – Logique simple du header (menu mobile + nav active + CTA)

document.addEventListener("DOMContentLoaded", () => {
  const mobileToggle = document.querySelector(".header-mobile-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const cta = document.querySelector(".btn-primary");

  // ===== MENU MOBILE =====
  if (mobileToggle && nav) {
    mobileToggle.addEventListener("click", (e) => {
      e.preventDefault();
      nav.classList.toggle("nav--open");
    });
  }

  // ===== NAV ACTIVE =====
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // état visuel actif
      navLinks.forEach((l) => l.classList.remove("nav-link--active"));
      link.classList.add("nav-link--active");

      // plus tard : brancher ici le scroll vers les sections
      // ex:
      // const targetId = link.dataset.target; // si tu ajoutes data-target
      // document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });

      // ferme le menu sur mobile après clic
      if (nav.classList.contains("nav--open")) {
        nav.classList.remove("nav--open");
      }
    });
  });

  // ===== CTA "Essayer la démo" =====
  if (cta) {
    cta.addEventListener("click", (e) => {
      e.preventDefault();

      // 👉 Remplace par l’URL de ta démo Netlify ou autre
      const DEMO_URL = ""; // ex: "https://ecommind-demo.netlify.app"

      if (DEMO_URL && DEMO_URL.trim() !== "") {
        window.open(DEMO_URL, "_blank", "noopener");
      } else {
        // Fallback : léger scroll vers le haut (ou futur hero)
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    });
  }
});
