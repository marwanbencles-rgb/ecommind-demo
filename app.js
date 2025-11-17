// ==========================
//  Animations d’apparition
// ==========================

window.addEventListener("load", () => {
  // Titre
  gsap.from(".hero-title", {
    y: -20,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  // Sous-titre
  gsap.from(".hero-subtitle", {
    y: -10,
    opacity: 0,
    delay: 0.2,
    duration: 0.8,
    ease: "power3.out",
  });

  // Bulle de chat
  gsap.from(".hero-chat-bubble", {
    y: 20,
    opacity: 0,
    delay: 0.45,
    duration: 0.9,
    ease: "power3.out",
  });

  // Orb (sphère bleue)
  gsap.from(".hero-orb-wrapper", {
    scale: 0.7,
    opacity: 0,
    delay: 0.7,
    duration: 1.2,
    ease: "power4.out",
  });

  // Barre de saisie
  gsap.from(".hero-input-bar", {
    y: 40,
    opacity: 0,
    delay: 1.1,
    duration: 0.9,
    ease: "power3.out",
  });

  // Animation dynamique : halo du micro lorsqu'il est pressé
  const mic = document.querySelector(".hero-input-mic");
  if (mic) {
    mic.addEventListener("click", () => {
      gsap.fromTo(
        mic,
        { boxShadow: "0 0 0px rgba(201,165,94,1)" },
        {
          boxShadow:
            "0 0 26px rgba(201,165,94,1), 0 0 0 1px rgba(201,165,94,0.9)",
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
    });
  }

  // Autofocus sur le champ texte après entrée cinématique
  const input = document.querySelector(".hero-input-field");
  if (input) {
    setTimeout(() => {
      input.focus();
    }, 1400);
  }
});
