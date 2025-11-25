// header.js – Logique du header Ecommind (CTA + nav + mobile)

document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // CONFIG
  // ==========================
  // Mets ici l’URL de ta démo (Netlify / autre).
  // Si tu laisses vide, le CTA scrolle juste en haut de page.
  const DEMO_URL = ""; // ex: "https://ecommind-demo.netlify.app"

  const header = document.querySelector(".header");
  const primaryCta = document.querySelector(".btn-primary");
  const navLinks = document.querySelectorAll(".nav-link");
  const mobileToggle = document.querySelector(".header-mobile-toggle");
  const nav = document.querySelector(".nav");

  // ==========================
  // CTA "Lancer la démo"
  // ==========================
  function handleDemoClick(event) {
    event.preventDefault();

    if (DEMO_URL && DEMO_URL.trim() !== "") {
      window.open(DEMO_URL, "_blank", "noopener");
      return;
    }

    // Fallback : remonte en haut de page (ou plus tard, scroll vers le hero)
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Petit effet visuel possible plus tard (GSAP, etc.)
  }

  if (primaryCta) {
    primaryCta.addEventListener("click", handleDemoClick);
  }

  // ==========================
  // NAV ACTIVE (desktop)
  // ==========================
  function setActiveLink(clickedLink) {
    navLinks.forEach((link) => {
      link.classList.remove("nav-link--active");
    });
    if (clickedLink) {
      clickedLink.classList.add("nav-link--active");
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveLink(link);

      const label = link.textContent?.trim().toLowerCase();

      // Ici tu pourras brancher un scroll vers des sections :
      // ex: if (label.includes("tarifs")) { document.querySelector("#tarifs").scrollIntoView(...) }
      // Pour l’instant, ça ne fait que gérer l’état visuel.
    });
  });

  // ==========================
  // MENU MOBILE
  // ==========================
  function toggleMobileMenu() {
    if (!nav || !mobileToggle) return;

    const isOpen = nav.classList.toggle("nav--open");
    document.body.classList.toggle("menu-open", isOpen);

    mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  if (mobileToggle) {
    mobileToggle.addEventListener("click", (event) => {
      event.preventDefault();
      toggleMobileMenu();
    });
  }

  // Fermer le menu mobile quand on clique sur un lien
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("nav--open")) {
        nav.classList.remove("nav--open");
        document.body.classList.remove("menu-open");
        if (mobileToggle) {
          mobileToggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  // ==========================
  // EFFET SCROLL SUR LE HEADER
  // ==========================
  function handleScroll() {
    if (!header) return;

    const scrolled = window.scrollY > 10;
    header.classList.toggle("header--scrolled", scrolled);
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // état initial
});
