/* ======================================================
   ECOMMIND — PLANET DEMO (Parole & Visual)
   - Planet pulse (speaking)
   - GSAP glow
   - Canvas ring visualizer
   - WhatsApp CTA minimal
   ====================================================== */

const hasGSAP = typeof gsap !== "undefined";

/* Elements */
const planet   = document.getElementById("planet");
const voiceBtn = document.querySelector('[data-action="voice-toggle"]');
const chatBtn  = document.querySelector('[data-action="open-chat"]');
const waBtn    = document.getElementById("waBtn");
const viz      = document.getElementById("pdViz");

/* --------- WhatsApp message (personnalise si tu veux) ---------- */
(function initWhatsApp(){
  const msg = "Je souhaite parler avec Ecommind Agency au sujet de la démo IA (planet demo).";
  // garde la cible si tu as un numéro: ex: https://wa.me/2126XXXXXXX?text=...
  waBtn?.setAttribute("href", "https://wa.me/?text=" + encodeURIComponent(msg));
})();

/* --------- Canvas Visualizer (anneaux dynamiques) ---------- */
let animId = null;
function drawVisualizer(active){
  if (!viz) return;
  const ctx = viz.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = viz.clientWidth, h = viz.clientHeight;
  viz.width = Math.floor(w * dpr);
  viz.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cx = w/2, cy = h/2;
  const baseR = Math.min(w, h) * 0.28;

  let t = 0;
  cancelAnimationFrame(animId);
  (function loop(){
    animId = requestAnimationFrame(loop);
    t += 0.015;

    ctx.clearRect(0,0,w,h);

    // anneaux subtils
    for(let i=0;i<6;i++){
      const k = i/6;
      const amp = active ? (Math.sin(t*2 + i)*8 + 10) : 6;
      const r = baseR + k*30 + amp;

      ctx.beginPath();
      const alpha = active ? 0.25 - k*0.03 : 0.14 - k*0.02;
      ctx.strokeStyle = `rgba(0,191,255,${Math.max(alpha,0)})`;
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.stroke();
    }

    // halo doré
    const goldR = baseR + (active ? 24 + Math.sin(t*3)*10 : 16);
    const grad = ctx.createRadialGradient(cx, cy, goldR*0.6, cx, cy, goldR*1.15);
    grad.addColorStop(0, "rgba(201,165,94,0.20)");
    grad.addColorStop(1, "rgba(201,165,94,0.00)");
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, goldR*1.15, 0, Math.PI*2);
    ctx.fill();
  })();
}

/* --------- Speaking pulse (GSAP) ---------- */
let pulseTl = null;
function startPulse(){
  planet?.classList.add("speaking");
  drawVisualizer(true);

  if (!hasGSAP || !planet) return;
  if (pulseTl) pulseTl.kill();
  pulseTl = gsap.timeline({ repeat: -1, yoyo: true });
  pulseTl.to(planet, {
    duration: 0.7,
    scale: 1.03,
    boxShadow: "0 0 90px rgba(0,191,255,.40), 0 0 120px rgba(201,165,94,.28)",
    ease: "sine.inOut"
  });
}

function stopPulse(){
  planet?.classList.remove("speaking");
  drawVisualizer(false);

  if (!hasGSAP || !planet) return;
  if (pulseTl) pulseTl.kill();
  gsap.to(planet, {
    duration: 0.5,
    scale: 1,
    boxShadow: "0 0 55px rgba(0,191,255,.22), 0 0 45px rgba(201,165,94,.16)",
    ease: "power2.out"
  });
}

/* --------- Voice Toggle ---------- */
let speaking = false;
voiceBtn?.addEventListener("click", () => {
  speaking = !speaking;
  if (speaking) {
    startPulse();
  } else {
    stopPulse();
  }

  if (hasGSAP) {
    gsap.fromTo(voiceBtn, { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 });
  }
});

/* --------- Chat minimal ---------- */
chatBtn?.addEventListener("click", () => {
  if (hasGSAP) gsap.fromTo(chatBtn, { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1 });
  alert("Chat démo — branchement IA/LLM à venir. (Focus vocal + WhatsApp pour le closing)");
});

/* --------- Parallaxe fond ---------- */
document.addEventListener("mousemove", (e) => {
  const bg = document.querySelector(".pd-hero-bg");
  if (!bg || !hasGSAP) return;
  const x = (e.clientX / window.innerWidth - 0.5) * 16;
  const y = (e.clientY / window.innerHeight - 0.5) * 16;
  gsap.to(bg, { duration: 1.6, ease: "sine.out", backgroundPosition: `${50 + x}% ${50 + y}%` });
});

/* --------- Init ---------- */
window.addEventListener("load", () => {
  drawVisualizer(false);
  if (hasGSAP) {
    gsap.from(".pd-logo-lg", { opacity: 0, y: -18, duration: 0.6, ease: "power2.out" });
    gsap.from(".pd-planet", { opacity: 0, scale: 0.94, duration: 0.9, ease: "power2.out", delay: .05 });
    gsap.from(".pd-cta .btn", { opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: .2 });
    gsap.from(".pd-tagline", { opacity: 0, y: 14, duration: 0.6, ease: "power2.out", delay: .25 });
  }
});

/* --------- Resize canvas ---------- */
window.addEventListener("resize", () => drawVisualizer(planet?.classList.contains("speaking")));
