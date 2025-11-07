/* ============================================================
   ECOMMIND — APP LOGIC (Intro • Saturne + Chat • Finale)
   ============================================================ */

/* ---------- Helpers ---------- */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ---------- WhatsApp links ---------- */
(function setupWhatsApp(){
  const msg = "Bonjour Ecommind 👋 Je viens de la démo. Montrez-moi comment vous captez, qualifiez et proposez des créneaux automatiquement.";
  ["#waHero", "#waMid", "#waBottom"].forEach(id=>{
    const a = $(id);
    if (a) a.setAttribute("href", "https://wa.me/?text="+encodeURIComponent(msg));
  });
})();

/* ---------- Intersection animations (reveal) ---------- */
(function setupReveal(){
  const els = $$("[data-animate]");
  if (!('IntersectionObserver' in window) || !els.length){
    els.forEach(el=>el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, {threshold: .12});
  els.forEach(el=>io.observe(el));
})();

/* ---------- Parallax (space background) ---------- */
(function setupParallax(){
  const bgs = $$(".space-bg");
  if (!bgs.length) return;
  const damp = 14;
  window.addEventListener("mousemove", (e)=>{
    const x = (e.clientX / window.innerWidth - 0.5) * damp;
    const y = (e.clientY / window.innerHeight - 0.5) * damp;
    bgs.forEach(bg=>{
      bg.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    });
  }, {passive:true});
})();

/* ---------- Saturne (voice toggle + halo canvas) ---------- */
(function setupSaturn(){
  const planet     = $("#planet");
  const ringsWrap  = $(".saturn__rings", planet);
  const vizCanvas  = $("#viz");
  const voiceBtn   = $("#voiceToggle");

  if (!planet || !vizCanvas || !voiceBtn) return;

  // Canvas halo
  const ctx = vizCanvas.getContext("2d");
  let raf = null, active = false, t = 0;

  function resizeCanvas(){
    const dpr = window.devicePixelRatio || 1;
    const w = vizCanvas.clientWidth, h = vizCanvas.clientHeight;
    vizCanvas.width  = Math.floor(w*dpr);
    vizCanvas.height = Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function draw(){
    raf = requestAnimationFrame(draw);
    t += 0.015;
    const w = vizCanvas.clientWidth, h = vizCanvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    const cx = w/2, cy = h/2, baseR = Math.min(w,h)*0.30;

    // Halo principal
    const amp = active ? 14 + Math.sin(t*3)*6 : 10;
    const g1 = ctx.createRadialGradient(cx,cy,baseR*0.6,cx,cy,baseR*1.3+amp);
    g1.addColorStop(0,"rgba(0,191,255,.15)");
    g1.addColorStop(1,"rgba(0,191,255,0)");
    ctx.fillStyle = g1;
    ctx.beginPath(); ctx.arc(cx,cy,baseR*1.35+amp,0,Math.PI*2); ctx.fill();

    // Liserés elliptiques subtils
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(Math.PI/180 * 15);
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.ellipse(0,0, baseR*1.05+i*10, baseR*0.6+i*6, 0, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(0,191,255,${active?0.18:0.10})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  resizeCanvas(); draw();
  window.addEventListener("resize", resizeCanvas);

  // Voice toggle (Parler ↔ Arrêter)
  voiceBtn.addEventListener("click", ()=>{
    const pressed = voiceBtn.getAttribute("aria-pressed") === "true";
    const next = !pressed;
    voiceBtn.setAttribute("aria-pressed", String(next));

    active = next;
    planet.classList.toggle("speaking", next); // accélère les anneaux via CSS

    // Micro animation tactile
    voiceBtn.style.transform = "scale(1.05)";
    setTimeout(()=>voiceBtn.style.transform="", 120);
  }, {passive:false});
})();

/* ---------- Chat (seed + reply + collapse) ---------- */
(function setupChat(){
  const feed = $("#chatFeed");
  const form = $("#chatForm");
  const input= $("#chatText");
  const toggleBtn = $('[data-action="toggle-chat"]');
  if (!feed || !form || !input) return;

  function addMsg(text, who="user"){
    const wrap = document.createElement("div");
    wrap.className = `msg ${who}`;
    wrap.innerHTML = `<div class="bubble">${text}</div>`;
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
  }

  // Simple canned responses
  const canned = [
    "Compris. Je vous propose 3 créneaux dans un instant.",
    "Parfait. Cliquez WhatsApp pour finaliser rapidement.",
    "Noté. Je vous envoie la confirmation et le lien d’acompte."
  ];

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    addMsg(q, "user");
    input.value = "";
    addMsg(canned[Math.floor(Math.random()*canned.length)], "bot");
  });

  // Collapse
  toggleBtn?.addEventListener("click", ()=>{
    const chat = $(".chat");
    if (!chat) return;
    const collapsed = chat.getAttribute("data-collapsed")==="1";
    if (collapsed){
      chat.removeAttribute("data-collapsed");
      chat.style.height = "560px";
      toggleBtn.textContent = "−";
      toggleBtn.setAttribute("aria-expanded","true");
    }else{
      chat.setAttribute("data-collapsed","1");
      chat.style.height = "56px";
      toggleBtn.textContent = "+";
      toggleBtn.setAttribute("aria-expanded","false");
    }
  });
})();

/* ---------- Reviews carousel ---------- */
(function setupReviews(){
  const track = $(".reviews__track");
  if (!track) return;
  const slides = $$(".review", track);
  if (slides.length <= 1) return;

  let idx = 0;
  function show(i){
    slides.forEach((s, k)=> s.classList.toggle("is-active", k===i));
  }
  show(idx);

  const prev = $('[data-action="reviews-prev"]');
  const next = $('[data-action="reviews-next"]');
  prev?.addEventListener("click", ()=>{
    idx = (idx - 1 + slides.length) % slides.length;
    show(idx);
  });
  next?.addEventListener("click", ()=>{
    idx = (idx + 1) % slides.length;
    show(idx);
  });
})();

/* ---------- Smooth scroll (optionnel, UX +) ---------- */
(function setupSmoothScroll(){
  const links = $$('a[href^="#"]:not([href="#"])');
  links.forEach(a=>{
    a.addEventListener("click", (e)=>{
      const id = a.getAttribute("href");
      const target = id && $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });
})();
