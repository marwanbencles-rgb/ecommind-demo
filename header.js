// header-premium.js
// Effets "Mercedes x Porsche x Apple x OpenAI" pour ton header Ecommind

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header");
  const headerInner = document.querySelector(".header-inner");
  const brandEmblem = document.querySelector(".brand-emblem");

  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav-link");
  const mobileToggle = document.querySelector(".header-mobile-toggle");
  const cta = document.querySelector(".btn-primary");

  // ⚙️ À PERSONNALISER : URL de ta démo
  const DEMO_URL = ""; // ex: "https://ecommind-demo.netlify.app"

  // ==========================
  // 1. Menu mobile
  // ==========================
  if (mobileToggle && nav) {
    mobileToggle.addEventListener("click", (e) => {
      e.preventDefault();
      nav.classList.toggle("nav--open");
    });
  }

  // Fermer le menu après clic sur un lien (mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // état visuel actif
      navLinks.forEach((l) => l.classList.remove("nav-link--active"));
      link.classList.add("nav-link--active");

      // Scroll vers la section si tu ajoutes data-target sur le bouton
      const targetId = link.dataset.target;
      if (targetId) {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      if (nav.classList.contains("nav--open")) {
        nav.classList.remove("nav--open");
      }
    });
  });

  // ==========================
  // 2. CTA "Lancer la démo"
  // ==========================
  if (cta) {
    cta.addEventListener("click", (e) => {
      e.preventDefault();

      if (DEMO_URL && DEMO_URL.trim() !== "") {
        window.open(DEMO_URL, "_blank", "noopener");
      } else {
        // Fallback : scroll vers le hero (si tu ajoutes #hero) ou en haut de page
        const hero = document.getElementById("hero");
        if (hero) {
          hero.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }

      // Petit "pulse" sur l’emblème au clic, façon moteur qui démarre
      if (brandEmblem) {
        brandEmblem.style.transition =
          "transform 0.18s ease-out, box-shadow 0.18s ease-out";
        brandEmblem.style.transform = "scale(1.06)";
        brandEmblem.style.boxShadow =
          "0 0 20px rgba(0,191,255,0.8), 0 0 30px rgba(201,165,94,0.65)";

        setTimeout(() => {
          brandEmblem.style.transform = "";
          brandEmblem.style.boxShadow = "";
        }, 220);
      }
    });
  }

  // ==========================
  // 3. Effet scroll "cockpit"
  // ==========================
  function handleScroll() {
    if (!header || !headerInner) return;

    const y = window.scrollY || window.pageYOffset;

    // Le header se "serre" légèrement quand tu descends
    if (y > 10) {
      header.style.boxShadow = "0 18px 45px rgba(0,0,0,0.8)";
      headerInner.style.padding = "0.6rem 1.5rem";

      if (brandEmblem) {
        brandEmblem.style.boxShadow =
          "0 0 10px rgba(0,191,255,0.55), 0 0 16px rgba(15,23,42,0.95)";
      }
    } else {
      header.style.boxShadow = "none";
      headerInner.style.padding = "0.85rem 1.5rem";

      if (brandEmblem) {
        brandEmblem.style.boxShadow =
          "0 0 12px rgba(0,191,255,0.45), 0 0 18px rgba(15,23,42,0.95)";
      }
    }
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // état initial

  // ==========================
  // 4. Léger "parallax" sur le logo avec la souris
  // ==========================
  if (brandEmblem) {
    const maxOffset = 4; // intensité du mouvement

    header.addEventListener("mousemove", (e) => {
      const rect = header.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 → 1
      const y = (e.clientY - rect.top) / rect.height; // 0 → 1

      const offsetX = (x - 0.5) * maxOffset;
      const offsetY = (y - 0.5) * maxOffset;

      brandEmblem.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });

    header.addEventListener("mouseleave", () => {
      brandEmblem.style.transform = "translate(0, 0)";
    });
  }

  // ==========================
  // 5. Active nav selon le scroll (si sections définies)
  // ==========================
  const sectionMap = []; // [{id: "hero", el: HTMLElement, link: HTMLElement}, ...]

  navLinks.forEach((link) => {
    const targetId = link.dataset.target;
    if (!targetId) return;

    const sectionEl = document.getElementById(targetId);
    if (!sectionEl) return;

    sectionMap.push({ id: targetId, el: sectionEl, link });
  });

  function updateActiveNavOnScroll() {
    if (sectionMap.length === 0) return;

    const scrollPos = window.scrollY || window.pageYOffset;
    const offset = 120; // marge pour le header

    let current = null;

    sectionMap.forEach(({ el, id }) => {
      const top = el.offsetTop - offset;
      if (scrollPos >= top) {
        current = id;
      }
    });

    if (!current) return;

    navLinks.forEach((link) => {
      const targetId = link.dataset.target;
      if (targetId === current) {
        link.classList.add("nav-link--active");
      } else {
        link.classList.remove("nav-link--active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveNavOnScroll);
  updateActiveNavOnScroll();
});
