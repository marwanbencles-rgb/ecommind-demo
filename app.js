document.addEventListener("DOMContentLoaded", () => {
  /* Reveal on scroll */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target;
      if(el.children && el.children.length>1){
        [...el.children].forEach((c,i)=>{
          c.style.transitionDelay = `${i*60}ms`;
          c.classList.add("is-visible");
        });
      }
      el.classList.add("is-visible");
      io.unobserve(el);
    });
  },{threshold:.25});
  document.querySelectorAll("[data-animate]").forEach(el=>io.observe(el));

  /* WhatsApp links (message prérempli) */
  const WA_TEXT = encodeURIComponent("Bonjour 👋 Je viens de voir la démo Ecommind. Montrez-moi la prise de RDV auto + 3 créneaux.");
  const wa = (num="") => num ? `https://wa.me/${num}?text=${WA_TEXT}` : `https://wa.me/?text=${WA_TEXT}`;
  ["waHero","waMid","waBottom"].forEach(id=>{ const a=document.getElementById(id); if(a) a.href=wa(); });

  /* Chat minimal */
  const feed = document.getElementById("chatFeed");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatText");
  const add = (t,who="bot")=>{
    if(!feed) return;
    const d=document.createElement("div");
    d.className=`msg ${who}`;
    d.innerHTML=`<div class="bubble">${t}</div>`;
    feed.appendChild(d);
    feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"});
  };
  form?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const v=input.value.trim(); if(!v) return;
    add(v,"user"); input.value="";
    const s=v.toLowerCase();
    let r="💡 L’IA capte l’intention, propose 3 créneaux, confirme par WhatsApp. Simple et mesurable.";
    if(s.includes("prix")||s.includes("tarif")) r="💼 Mise en place + abo mensuel. Ciblé ROI : impact visible en 1–2 semaines.";
    if(s.includes("rdv")||s.includes("créneau")) r="🗓️ Lecture planning + 3 créneaux instantanés. Le client valide, on confirme.";
    if(s.includes("erreur")||s.includes("saisie")) r="✅ Zéro erreur : les champs clés sont reformulés et validés avant envoi.";
    setTimeout(()=>add(r,"bot"), 800);
  });

  /* Toggle chat */
  document.querySelector("[data-action='toggle-chat']")?.addEventListener("click",(ev)=>{
    const chat=ev.target.closest(".chat");
    const pane=chat.querySelector(".chat__feed");
    const open=!chat.classList.toggle("is-collapsed");
    pane.style.maxHeight=open? "":"0px";
    ev.target.textContent=open ? "−" : "+";
    ev.target.setAttribute("aria-expanded", open);
  });

  /* Saturne — halo canvas propre */
  const canvas=document.getElementById("viz");
  const planet=document.getElementById("planet");
  if(canvas && planet){
    const ctx=canvas.getContext("2d");
    const DPR=Math.max(1,window.devicePixelRatio||1);
    const resize=()=>{
      const r=canvas.getBoundingClientRect();
      canvas.width = r.width*DPR; canvas.height = r.height*DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
    };
    resize(); window.addEventListener("resize", resize);

    let t=0;
    (function loop(){
      const r=canvas.getBoundingClientRect();
      ctx.clearRect(0,0,r.width,r.height);
      const cx=r.width/2 + Math.sin(t/80)*3;
      const cy=r.height/2 + Math.cos(t/95)*3;
      const g=ctx.createRadialGradient(cx,cy,8,cx,cy,Math.max(r.width,r.height)*.55);
      g.addColorStop(0,"rgba(0,191,255,.42)");
      g.addColorStop(.28,"rgba(0,191,255,.16)");
      g.addColorStop(.6,"rgba(0,191,255,.05)");
      g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.globalCompositeOperation="lighter";
      ctx.fillStyle=g; ctx.beginPath();
      ctx.arc(cx,cy,Math.max(r.width,r.height)*.58,0,Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation="source-over";
      t++; requestAnimationFrame(loop);
    })();
  }

  /* Bouton voix = boost anneaux, pas d’ellipse folle */
  const voice=document.getElementById("voiceToggle");
  if(voice && planet){
    let on=false;
    const rings=document.querySelectorAll(".saturn__rings .ring");
    const setLabel=()=>{ voice.textContent = on? "⏹":"🎤"; voice.setAttribute("aria-pressed", String(on)); }
    setLabel();
    voice.addEventListener("click",()=>{
      on=!on; setLabel();
      rings.forEach(r=> r.style.animationDuration = on? "7s" : "");
      if(on) {
        add("🎙️ L’assistant écoute votre demande…","bot");
        setTimeout(()=>{ on=false; setLabel(); rings.forEach(r=>r.style.animationDuration=""); add("⏹️ Fin d’écoute. Résumé dans le chat.","bot"); }, 20000);
      }
    });
  }

  /* Avis (simple next/prev) */
  const items=[...document.querySelectorAll(".review")]; let i=items.findIndex(x=>x.classList.contains("is-active")); if(i<0)i=0;
  const show=k=>items.forEach((el,idx)=>el.classList.toggle("is-active", idx===k));
  document.querySelector("[data-action='reviews-prev']")?.addEventListener("click",()=>{i=(i-1+items.length)%items.length;show(i);});
  document.querySelector("[data-action='reviews-next']")?.addEventListener("click",()=>{i=(i+1)%items.length;show(i);});
});
