/* ============================================================
   ECOMMIND AGENCY — app.js (version finale)
   ============================================================ */

/* -------------------------------
   Apparition progressive au scroll
--------------------------------*/
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.3 });

document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));

/* -------------------------------
   Animation du titre mot à mot
--------------------------------*/
(function revealIntroTitle() {
  const title = document.getElementById("introTitle");
  if (!title) return;

  const text = title.textContent.trim().replace(/\s+/g, " ");
  const words = text.split(" ");
  title.textContent = "";

  words.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.style.transitionDelay = `${i * 0.05}s`;
    span.textContent = (i ? " " : "") + w;
    title.appendChild(span);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        title.classList.add("is-revealed");
        io.disconnect();
      }
    });
  }, { threshold: 0.5 });
  io.observe(title);
})();

/* -------------------------------
   Saturne — effet d’anneaux tournants + halo pulsé
--------------------------------*/
const saturn = document.querySelector(".saturn__planet");
const rings = document.querySelectorAll(".saturn__rings .ring");

function pulseRings() {
  rings.forEach((ring, i) => {
    ring.animate(
      [
        { transform: `rotate(${i * 20}deg) scale(1)` },
        { transform: `rotate(${i * 20 + 360}deg) scale(1.1)` },
        { transform: `rotate(${i * 20 + 720}deg) scale(1)` },
      ],
      {
        duration: 6000 + i * 1000,
        iterations: Infinity,
        easing: "linear",
      }
    );
  });
}
pulseRings();

/* -------------------------------
   Bouton vocal — état actif/inactif
--------------------------------*/
const voiceBtn = document.getElementById("voiceToggle");
if (voiceBtn && saturn) {
  let active = false;

  voiceBtn.addEventListener("click", () => {
    active = !active;
    voiceBtn.setAttribute("aria-pressed", active);
    voiceBtn.textContent = active ? "⏹" : "🎤";
    voiceBtn.classList.toggle("btn--active", active);
    saturn.classList.toggle("speaking", active);

    if (active) addBotMessage("🎙️ L’assistant écoute votre demande...");
    else addBotMessage("✅ Analyse terminée. Vous pouvez continuer sur WhatsApp.");
  });
}

/* -------------------------------
   Chat Ecommind (messages automatiques)
--------------------------------*/
const chatForm = document.getElementById("chatForm");
const chatFeed = document.getElementById("chatFeed");
const chatInput = document.getElementById("chatText");

function addBotMessage(text) {
  const msg = document.createElement("div");
  msg.className = "msg bot";
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  chatFeed.appendChild(msg);
  chatFeed.scrollTo({ top: chatFeed.scrollHeight, behavior: "smooth" });
}

function addUserMessage(text) {
  const msg = document.createElement("div");
  msg.className = "msg user";
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  chatFeed.appendChild(msg);
  chatFeed.scrollTo({ top: chatFeed.scrollHeight, behavior: "smooth" });
}

if (chatForm && chatFeed && chatInput) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = "";

    setTimeout(() => {
      addBotMessage(
        "💡 Bonne question ! L’IA capte votre besoin, qualifie et envoie un devis clair avec 3 créneaux proposés automatiquement."
      );
    }, 1200);
  });
}

/* -------------------------------
   Carrousel d’avis (reviews)
--------------------------------*/
const reviews = document.querySelectorAll(".review");
let activeReview = 0;

function showReview(index) {
  reviews.forEach((r, i) => {
    r.classList.toggle("is-active", i === index);
  });
}

document.querySelector("[data-action='reviews-prev']")?.addEventListener("click", () => {
  activeReview = (activeReview - 1 + reviews.length) % reviews.length;
  showReview(activeReview);
});

document.querySelector("[data-action='reviews-next']")?.addEventListener("click", () => {
  activeReview = (activeReview + 1) % reviews.length;
  showReview(activeReview);
});

/* -------------------------------
   Réduction du chat (toggle)
--------------------------------*/
const toggleBtn = document.querySelector("[data-action='toggle-chat']");
const chat = document.querySelector(".chat");
if (toggleBtn && chat) {
  toggleBtn.addEventListener("click", () => {
    chat.classList.toggle("is-collapsed");
    toggleBtn.textContent = chat.classList.contains("is-collapsed") ? "+" : "−";
  });
}

/* -------------------------------
   Glow dynamique sur “pilotée”
--------------------------------*/
(function glowAccent() {
  const word = document.querySelector(".accent");
  if (!word) return;

  window.addEventListener("scroll", () => {
    const rect = word.getBoundingClientRect();
    const visible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (visible) {
      word.style.textShadow = `0 0 10px ${getGlowColor()}`;
    } else {
      word.style.textShadow = "none";
    }
  });

  function getGlowColor() {
    const colors = [ "#00bfff", "#0099cc", "#33ccff", "#66e0ff" ];
    return colors[Math.floor(Date.now() / 200) % colors.length];
  }
})();

/* -------------------------------
   Petite intro de crédibilité
--------------------------------*/
console.log("%cEcommind Agency", "color:#00BFFF; font-size:24px; font-weight:bold;");
console.log("✨ Interface IA de prestige — Conçue pour captiver, déclencher et convertir.");
