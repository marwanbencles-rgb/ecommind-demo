/* ======================================================
   ECOMMIND — DEMO SATURNE (Transcript + Rings control)
   ====================================================== */
const hasGSAP = typeof gsap !== "undefined";

/* Elements */
const planet    = document.getElementById("planet");
const viz       = document.getElementById("pdViz");
const voiceBtn  = document.querySelector('[data-action="voice-toggle"]');
const chatFeed  = document.getElementById("chatFeed");
const chatForm  = document.getElementById("chatForm");
const chatInput = document.getElementById("chatText");
const chatTgl   = document.querySelector('[data-action="toggle-chat"]');
const waTop     = document.getElementById("waBtnTop");
const waBtn     = document.getElementById("waBtn");
const waBottom  = document.getElementById("waBtnBottom");

/* WhatsApp links (préremplis) */
const waMsg = "Bonjour Ecommind 👋 Je viens de la démo Saturne. Montrez-moi comment vous captez, qualifiez et proposez des créneaux automatiquement.";
[waTop, waBtn, waBottom].forEach(a => a && a.setAttribute("href", "https://wa.me/?text=" + encodeURIComponent(waMsg)));

/* Parallaxe fond (intro + scène) */
document.addEventListener("mousemove", (e) => {
  if (!hasGSAP) return;
  document.querySelectorAll(".pd-hero-bg").forEach(bg => {
    const x = (e.clientX / window.innerWidth - 0.5) * 14;
    const y = (e.clientY / window.innerHeight - 0.5) * 14;
    gsap.to(bg, { duration: 1.3, ease: "sine.out", backgroundPosition: `${50 + x}% ${50 + y}%` });
  });
});

/* Canvas visualizer (halo dynamique autour de Saturne) */
let rafId = null;
function drawVisualizer(active){
  if (!viz) return;
  const ctx = viz.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = viz.clientWidth, h = viz.clientHeight;
  viz.width = Math.floor(w*dpr); viz.height = Math.floor(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const cx=w/2, cy=h/2, baseR=Math.min(w,h)*0.30;
  let t=0; cancelAnimationFrame(rafId);
  (function loop(){
    rafId = requestAnimationFrame(loop);
    t += 0.015; ctx.clearRect(0,0,w,h);

    // halo cyan pulsant
    const amp = active ? 14 + Math.sin(t*3)*6 : 10;
    const grad = ctx.createRadialGradient(cx,cy,baseR*0.6,cx,cy,baseR*1.3+amp);
    grad.addColorStop(0, "rgba(0,191,255,.15)");
    grad.addColorStop(1, "rgba(0,191,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx,cy,baseR*1.35+amp,0,Math.PI*2); ctx.fill();

    // liserés elliptiques subtils
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
  })();
}

/* Chat helpers */
function appendMsg(text, who="user"){
  if (!chatFeed) return;
  const el = document.createElement("div");
  el.className = `msg ${who}`;
  el.innerHTML = `<div class="bubble">${text}</div>`;
  chatFeed.appendChild(el);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}
const addBot = (t)=>appendMsg(t,"bot");
const addUser = (t)=>appendMsg(t,"user");

/* Script “IA parle” (orienté close) */
const voiceScript = [
  "Je capte votre besoin en 60–120 s, sans friction.",
  "Je qualifie et traite les objections clés.",
  "Je propose 3 créneaux, vous choisissez en un clic.",
  "Confirmation e-mail + WhatsApp, acompte sécurisé.",
  "On bascule sur WhatsApp pour finaliser."
];

/* Speaking pulse + sync transcript */
let pulseTl=null, speaking=false, scriptTimer=null, scriptIdx=0;
function startPulse(){
  planet?.classList.add("speaking"); drawVisualizer(true);
  if (hasGSAP && planet){
    if (pulseTl) pulseTl.kill();
    // micro-rotation lente de Saturne
    gsap.to(planet, { rotation: "+=6", duration: 18, ease: "none", repeat: -1 });
    // respiration glow
    pulseTl = gsap.timeline({repeat:-1,yoyo:true})
      .to(planet,{duration:.7,scale:1.03,boxShadow:"0 0 110px rgba(0,191,255,.42), 0 0 130px rgba(201,165,94,.18)",ease:"sine.inOut"});
  }
  // script + trace chat
  scriptIdx = 0;
  scriptTimer = setInterval(()=>{
    if (scriptIdx >= voiceScript.length){ clearInterval(scriptTimer); return; }
    addBot(voiceScript[scriptIdx++]);
  }, 1200);
}
function stopPulse(){
  planet?.classList.remove("speaking"); drawVisualizer(false);
  if (pulseTl) pulseTl.kill();
  if (hasGSAP && planet){
    gsap.to(planet,{duration:.45,scale:1,boxShadow:"0 0 55px rgba(0,191,255,.22), 0 0 45px rgba(201,165,94,.16)",ease:"power2.out"});
  }
  if (scriptTimer){ clearInterval(scriptTimer); scriptTimer=null; }
}

voiceBtn?.addEventListener("click", ()=>{
  speaking = !speaking;
  speaking ? startPulse() : stopPulse();
  if (hasGSAP) gsap.fromTo(voiceBtn,{scale:1},{scale:1.08,yoyo:true,repeat:1,duration:.15});
});

/* Chat form */
chatForm?.addEventListener("submit",(e)=>{
  e.preventDefault();
  const q = (chatInput?.value||"").trim(); if (!q) return;
  addUser(q); chatInput.value="";
  const canned = [
    "Compris. Je vous propose 3 créneaux dans un instant.",
    "Parfait. Cliquez WhatsApp pour finaliser rapidement.",
    "Noté. Je vous envoie la confirmation et le lien d’acompte."
  ];
  addBot(canned[Math.floor(Math.random()*canned.length)]);
});

/* Collapse chat */
chatTgl?.addEventListener("click", ()=>{
  const chat = document.querySelector(".pd-chat"); if (!chat) return;
  const collapsed = chat.getAttribute("data-collapsed")==="1";
  if (collapsed){ chat.removeAttribute("data-collapsed"); chat.style.height="560px"; chatTgl.textContent="−"; }
  else { chat.setAttribute("data-collapsed","1"); chat.style.height="56px"; chatTgl.textContent="+"; }
});

/* Entrées animées */
window.addEventListener("load", ()=>{
  drawVisualizer(false);
  if (hasGSAP){
    gsap.from(".pd-logo-lg",{opacity:0,y:-18,duration:.6,ease:"power2.out"});
    gsap.from(".pd-hero-inner > *",{opacity:0,y:18,stagger:.08,duration:.55,ease:"power2.out"});
    gsap.from(".pd-planet",{opacity:0,scale:.94,duration:.9,ease:"power2.out",delay:.05});
    gsap.from(".pd-cta .btn",{opacity:0,y:14,stagger:.06,duration:.45,delay:.2});
    gsap.from(".pd-chat",{opacity:0,x:24,duration:.7,delay:.15,ease:"power2.out"});
  }
});

/* Resize → garder le canvas net */
window.addEventListener("resize", ()=>{
  drawVisualizer(planet?.classList.contains("speaking"));
});
