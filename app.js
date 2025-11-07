/* ============================================================
   ECOMMIND — app.js (Full Luxe CAC40 × Harvey)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------------
     1) Révélations au scroll (stagger)
  ----------------------------------*/
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      // Stagger si le conteneur possède plusieurs enfants cartes
      if (el.dataset.animate && el.children && el.children.length > 1) {
        [...el.children].forEach((child, i) => {
          child.style.transitionDelay = `${i * 70}ms`;
          requestAnimationFrame(() => child.classList.add("is-visible"));
        });
      }
      el.classList.add("is-visible");
      io.unobserve(el);
    });
  }, { threshold: 0.25 });

  document.querySelectorAll("[data-animate]").forEach(el => io.observe(el));

  /* -------------------------------
     2) Titre mot à mot
  ----------------------------------*/
  (function animateIntroTitle() {
    const title = document.getElementById("introTitle");
    if (!title) return;
    // conserver le <em>accent</em> intact
    const pieces = [];
    title.childNodes.forEach(n => {
      if (n.nodeType === 3) { // texte
        pieces.push(...n.textContent.split(/(\s+)/));
      } else {
        pieces.push(n.outerHTML);
      }
    });
    const html = pieces.map(tok => {
      if (tok.match(/^<em/i)) return tok;
      if (tok.trim() === "") return tok; // espaces
      return `<span class="word">${tok}</span>`;
    }).join("");
    title.innerHTML = html;

    const ioTitle = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        title.classList.add("is-revealed");
        ioTitle.disconnect();
      }
    }, { threshold: 0.6 });
    ioTitle.observe(title);
  })();

  /* -------------------------------
     3) WhatsApp — liens préremplis
  ----------------------------------*/
  const WA_TEXT = encodeURIComponent(
    "Bonjour 👋 Je viens de voir la démo Ecommind. Pouvez-vous me montrer la prise de RDV auto + 3 créneaux ?"
  );
  const buildWa = (phone = "") =>
    phone
      ? `https://wa.me/${phone}?text=${WA_TEXT}`
      : `https://wa.me/?text=${WA_TEXT}`;

  ["waHero","waMid","waBottom"].forEach(id => {
    const a = document.getElementById(id);
    if (a) a.href = buildWa(); // Remplace par buildWa('33600000000') si tu veux un numéro fixe
  });

  /* -------------------------------
     4) Chat (trace + réponses simples)
  ----------------------------------*/
  const feed = document.getElementById("chatFeed");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatText");

  const scrollFeed = () => feed?.scrollTo({ top: feed.scrollHeight, behavior: "smooth" });

  function addMsg(text, who = "bot") {
    if (!feed) return;
    const wrap = document.createElement("div");
    wrap.className = `msg ${who}`;
    wrap.innerHTML = `<div class="bubble">${text}</div>`;
    feed.appendChild(wrap);
    scrollFeed();
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    addMsg(v, "user");
    input.value = "";

    // Réponses clés minimalistes (pitch qui close)
    const s = v.toLowerCase();
    let reply =
      "💡 L’IA capte l’intention, propose 3 créneaux, confirme par WhatsApp. Vous gardez le contrôle, sans frictions.";
    if (s.includes("prix") || s.includes("tarif")) {
      reply = "📦 Mise en place + calibrage, puis un abonnement mensuel. L’objectif : ROI visible dès 1–2 semaines.";
    } else if (s.includes("rdv") || s.includes("créneau")) {
      reply = "🗓️ L’IA lit votre planning et propose 3 créneaux. Le client valide, on confirme automatiquement.";
    } else if (s.includes("erreur") || s.includes("saisie")) {
      reply = "✅ Zéro erreur de saisie : les champs clés sont vérifiés et reformulés avant envoi/stockage.";
    }
    setTimeout(() => addMsg(reply, "bot"), 900);
  });

  // Toggle chat (réduction de la zone)
  document.querySelector("[data-action='toggle-chat']")?.addEventListener("click", (ev) => {
    const chat = ev.target.closest(".chat");
    const feed = chat.querySelector(".chat__feed");
    chat.classList.toggle("is-collapsed");
    if (chat.classList.contains("is-collapsed")) {
      feed.style.maxHeight = "0px";
      ev.target.textContent = "+";
      ev.target.setAttribute("aria-expanded", "false");
    } else {
      feed.style.maxHeight = "";
      ev.target.textContent = "−";
      ev.target.setAttribute("aria-expanded", "true");
      scrollFeed();
    }
  });

  /* -------------------------------
     5) Avis — carrousel
  ----------------------------------*/
  const reviews = [...document.querySelectorAll(".review")];
  let idx = reviews.findIndex(r => r.classList.contains("is-active"));
  if (idx < 0) idx = 0;

  const showReview = (i) => {
    reviews.forEach((r, k) => r.classList.toggle("is-active", k === i));
  };
  document.querySelector("[data-action='reviews-prev']")?.addEventListener("click", () => {
    idx = (idx - 1 + reviews.length) % reviews.length;
    showReview(idx);
  });
  document.querySelector("[data-action='reviews-next']")?.addEventListener("click", () => {
    idx = (idx + 1) % reviews.length;
    showReview(idx);
  });

  /* -------------------------------
     6) Saturne — halo canvas animé
  ----------------------------------*/
  const planet = document.getElementById("planet");
  const canvas = document.getElementById("viz");
  if (canvas && planet) {
    const ctx = canvas.getContext("2d");
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    function resizeCanvas() {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let t = 0;
    (function loop() {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      // Halo pulsatil + légère dérive pour effet vivant
      const cx = width / 2 + Math.sin(t / 70) * 4;
      const cy = height / 2 + Math.cos(t / 90) * 3;

      const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.55);
      grd.addColorStop(0, "rgba(0,191,255,0.45)");
      grd.addColorStop(0.25, "rgba(0,191,255,0.18)");
      grd.addColorStop(0.55, "rgba(0,191,255,0.06)");
      grd.addColorStop(1, "rgba(0,0,0,0)");

      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(width, height) * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
      t += 1;
      requestAnimationFrame(loop);
    })();
  }

  /* -------------------------------
     7) Bouton vocal — speaking mode
  ----------------------------------*/
  const voiceBtn = document.getElementById("voiceToggle");
  if (voiceBtn && planet) {
    let active = false;
    const setLabel = () => {
      voiceBtn.textContent = active ? "⏹" : "🎤";
      voiceBtn.setAttribute("aria-pressed", String(active));
    };
    setLabel();

    voiceBtn.addEventListener("click", () => {
      active = !active;
      planet.classList.toggle("speaking", active);
      setLabel();
      addMsg(active ? "🎙️ L’assistant écoute votre demande…" : "✅ Capture terminée. Vous pouvez poursuivre sur WhatsApp.", "bot");
      // Petit “boost” visuel temporaire des anneaux
      const rings = document.querySelectorAll(".saturn__rings .ring");
      rings.forEach(r => {
        r.style.animationDuration = active ? "7s" : "";
        r.style.borderColor = active ? "rgba(180,220,255,.45)" : "";
      });
      // Auto-stop soft après 25s (démo)
      if (active) {
        setTimeout(() => {
          if (!active) return;
          active = false; setLabel();
          planet.classList.remove("speaking");
          rings.forEach(r => { r.style.animationDuration = ""; r.style.borderColor=""; });
          addMsg("⏹️ Fin d’écoute. Résumé envoyé dans le chat.", "bot");
        }, 25000);
      }
    });
  }

  /* -------------------------------
     8) Accent “pilotée” — glow subtil à l’écran
  ----------------------------------*/
  (function accentGlow() {
    const word = document.querySelector(".accent");
    if (!word) return;
    const watch = () => {
      const r = word.getBoundingClientRect();
      const visible = r.top < window.innerHeight && r.bottom > 0;
      word.style.textShadow = visible ? "0 0 24px rgba(0,191,255,0.7)" : "";
    };
    watch();
    window.addEventListener("scroll", watch, { passive: true });
  })();

  // Signature console
  console.log("%cEcommind Agency", "color:#00BFFF; font-size:22px; font-weight:700");
  console.log("✨ Démo premium : captiver • déclencher • convertir.");
});
