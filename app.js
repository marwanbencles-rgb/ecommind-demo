/* ======================================================
   ECOMMIND — PLANET DEMO (Visual + Chat + WhatsApp)
   - Parallaxe fond galaxie (GSAP)
   - Planète parlante (glow + rings + canvas viz)
   - Chat minimal (append + autosroll + toggle)
   - WhatsApp CTA pré-rempli
   ====================================================== */

const hasGSAP = typeof gsap !== "undefined";

/* ------------------ Elements ------------------ */
const planet    = document.getElementById("planet");
const viz       = document.getElementById("pdViz");
const voiceBtn  = document.querySelector('[data-action="voice-toggle"]');
const chatFeed  = document.getElementById("chatFeed");
const chatForm  = document.getElementById("chatForm");
const chatInput = document.getElementById("chatText");
const chatTgl   = document.querySelector('[data-action="toggle-chat"]');
const waBtn     = document.getElementById("waBtn");

/* ------------------ WhatsApp ------------------- */
(function initWhatsApp() {
  const msg = "Bonjour Ecommind 👋 Je viens de la démo planète et je veux voir comment vous closez avec l’IA.";
  if (waBtn) waBtn.setAttribute("href", "https://wa.me/?text=" + encodeURIComponent(msg));
})();

/* --------------- Parallaxe background ---------- */
document.addEventListener("mousemove", (e) => {
  if (!hasGSAP) return;
  const bg = document.querySelector(".pd-hero-bg");
  if (!bg) return;
  const x = (e.clientX / window.innerWidth - 0.5) * 16;
  const y = (e.clientY / window.innerHeight - 0.5) * 16;
  gsap.to(bg, { duration: 1.4, ease: "sine.out", backgroundPosition: `${50 + x}% ${50 + y}%` });
});

/* ----------------- Canvas Visualizer ------------ */
let rafId = null;
function drawVisualizer(active) {
  if (!viz) return;
  const ctx = viz.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = viz.clientWidth, h = viz.clientHeight;
  viz.width = Math.floor(w * dpr);
  viz.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.28;
  let t = 0;

  cancelAnimationFrame(rafId);
  (function loop() {
    rafId = requestAnimationFrame(loop);
    t += 0.015;

    ctx.clearRect(0, 0, w, h);

    // anneaux cyan
    for (let i = 0; i < 6; i++) {
      const k = i / 6;
      const amp = active ? (Math.sin(t * 2 + i) * 8 + 10) : 6;
      const r = baseR + k * 30 + amp;
      ctx.beginPath();
      const alpha = active ? 0.24 - k * 0.03 : 0.14 - k * 0.02;
      ctx.strokeStyle = `rgba(0,191,255,${Math.max(alpha, 0)})`;
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // halo or
    const goldR = baseR + (active ? 24 + Math.sin(t * 3) * 10 : 16);
    const grad = ctx.createRadialGradient(cx, cy, goldR * 0.6, cx, cy, goldR * 1.15);
    grad.addColorStop(0, "rgba(201,165,94,0.20)");
    grad.addColorStop(1, "rgba(201,165,94,0.00)");
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, goldR * 1.15, 0, Math.PI * 2);
    ctx.fill();
  })();
}

/* --------------- Speaking pulse (GSAP) ---------- */
let pulseTl = null;
function startPulse() {
  planet?.classList.add("speaking");
  drawVisualizer(true);
  if (!hasGSAP || !planet) return;
  if (pulseTl) pulseTl.kill();
  pulseTl = gsap.timeline({ repeat: -1, yoyo: true })
    .to(planet, {
      duration: 0.7,
      scale: 1.03,
      boxShadow: "0 0 90px rgba(0,191,255,.40), 0 0 120px rgba(201,165,94,.28)",
      ease: "sine.inOut",
    });
}
function stopPulse() {
  planet?.classList.remove("speaking");
  drawVisualizer(false);
  if (!hasGSAP || !planet) return;
  if (pulseTl) pulseTl.kill();
  gsap.to(planet, {
    duration: 0.5,
    scale: 1,
    boxShadow: "0 0 55px rgba(0,191,255,.22), 0 0 45px rgba(201,165,94,.16)",
    ease: "power2.out",
  });
}

/* ---------------- Voice toggle btn -------------- */
let speaking = false;
voiceBtn?.addEventListener("click", () => {
  speaking = !speaking;
  if (speaking) startPulse(); else stopPulse();
  if (hasGSAP) gsap.fromTo(voiceBtn, { scale: 1 }, { scale: 1.08, yoyo: true, repeat: 1, duration: 0.15 });
});

/* ------------------- Chat minimal --------------- */
function appendMsg(text, who = "user") {
  if (!chatFeed) return;
  const item = document.createElement("div");
  item.className = `msg ${who}`;
  item.innerHTML = `<div class="bubble">${text}</div>`;
  chatFeed.appendChild(item);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

chatForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = (chatInput?.value || "").trim();
  if (!q) return;
  appendMsg(q, "user");
  chatInput.value = "";

  // réponse courte orientée closing
  const canned = [
    "OK. Je vous montre un scénario de prise de RDV en 60 s.",
    "Pendant que je parle, cliquez WhatsApp pour continuer en privé.",
    "Je propose 3 créneaux automatiquement, vous validez, c’est réglé."
  ];
  const pick = canned[Math.floor(Math.random() * canned.length)];
  setTimeout(() => appendMsg(pick, "bot"), 350);
});

chatTgl?.addEventListener("click", () => {
  const chat = document.querySelector(".pd-chat");
  if (!chat) return;
  const collapsed = chat.getAttribute("data-collapsed") === "1";
  if (collapsed) {
    chat.removeAttribute("data-collapsed");
    chat.style.height = "520px";
    chatTgl.textContent = "−";
  } else {
    chat.setAttribute("data-collapsed", "1");
    chat.style.height = "56px";
    chatTgl.textContent = "+";
  }
});

/* ---------------------- Init -------------------- */
window.addEventListener("load", () => {
  drawVisualizer(false);
  if (hasGSAP) {
    gsap.from(".pd-logo-lg", { opacity: 0, y: -18, duration: 0.6, ease: "power2.out" });
    gsap.from(".pd-planet", { opacity: 0, scale: 0.94, duration: 0.9, ease: "power2.out", delay: 0.05 });
    gsap.from(".pd-cta .btn", { opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 });
    gsap.from(".pd-tagline", { opacity: 0, y: 14, duration: 0.6, ease: "power2.out", delay: 0.25 });
    gsap.from(".pd-chat", { opacity: 0, x: 24, duration: 0.7, ease: "power2.out", delay: 0.15 });
  }
});

/* ------------- Resize: keep viz sharp ------------ */
window.addEventListener("resize", () => {
  const active = planet?.classList.contains("speaking");
  drawVisualizer(Boolean(active));
});
