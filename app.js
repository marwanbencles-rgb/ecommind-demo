document.addEventListener("DOMContentLoaded", () => {
  /* Reveal au scroll (stagger auto) */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target;
      if(el.children && el.children.length>1){
        [...el.children].forEach((c,i)=>{
          c.style.transitionDelay=`${i*60}ms`;
          c.classList.add("is-visible");
        });
      }
      el.classList.add("is-visible");
      io.unobserve(el);
    });
  },{threshold:.25});
  document.querySelectorAll("[data-animate]").forEach(n=>io.observe(n));

  /* WhatsApp – texte prérempli */
  const WA_TEXT = encodeURIComponent("Bonjour 👋 Je viens de voir la démo Ecommind. Montrez-moi la prise de RDV auto + 3 créneaux.");
  const wa = (num="") => num ? `https://wa.me/${num}?text=${WA_TEXT}` : `https://wa.me/?text=${WA_TEXT}`;
  ["waHero","waMid","waBottom"].forEach(id=>{
    const a=document.getElementById(id); if(a) a.href=wa();
  });

  /* Chat simple (trace) */
  const feed = document.getElementById("chatFeed");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatText");
  const add = (txt,who="bot")=>{
    if(!feed) return;
    const wrap=document.createElement("div");
    wrap.className=`msg ${who}`;
    wrap.innerHTML=`<div class="bubble">${txt}</div>`;
    feed.appendChild(wrap);
    feed.scrollTo({top:feed.scrollHeight,behavior:"smooth"});
  };
  form?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const v=input.value.trim(); if(!v) return;
    add(v,"user"); input.value="";
    let r="💡 L’IA capte l’intention, propose 3 créneaux, confirme par WhatsApp. Vous gardez le contrôle.";
    const s=v.toLowerCase();
    if(s.includes("prix")||s.includes("tarif")) r="📦 Mise en place rapide + abonnement mensuel. Objectif : ROI visible en 1–2 semaines.";
    if(s.includes("rdv")||s.includes("créneau")) r="🗓️ Planning lu automatiquement, 3 créneaux proposés, validation en un clic.";
    if(s.includes("erreur")||s.includes("saisie")) r="✅ Zéro erreur de saisie : contrôle et reformulation avant envoi.";
    setTimeout(()=>add(r,"bot"),800);
  });

  /* Chat collapse */
  document.querySelector("[data-action='toggle-chat']")?.addEventListener("click",(e)=>{
    const chat=e.target.closest(".chat"); const feed=chat.querySelector(".chat__feed");
    chat.classList.toggle("is-collapsed");
    const open=!chat.classList.contains("is-collapsed");
    e.target.textContent=open?"−":"+";
    e.target.setAttribute("aria-expanded",String(open));
    feed.style.maxHeight=open?"":"0px";
  });

  /* Avis – carrousel */
  const items=[...document.querySelectorAll(".review")]; let i=items.findIndex(x=>x.classList.contains("is-active")); if(i<0) i=0;
  const show=k=>items.forEach((el,idx)=>el.classList.toggle("is-active",idx===k));
  document.querySelector("[data-action='reviews-prev']")?.addEventListener("click",()=>{i=(i-1+items.length)%items.length;show(i);});
  document.querySelector("[data-action='reviews-next']")?.addEventListener("click",()=>{i=(i+1)%items.length;show(i);});

  /* Saturne – canvas halo, taille carrée robuste */
  const planet=document.getElementById("planet");
  const canvas=document.getElementById("viz");
  const saturnWrap=document.querySelector(".saturn");
  function ensureSquare(){
    if(!planet) return;
    // grâce à aspect-ratio en CSS, c'est déjà carré; on force juste le canvas.
    const r=planet.getBoundingClientRect();
    if(canvas){canvas.width=r.width*devicePixelRatio;canvas.height=r.height*devicePixelRatio;canvas.style.width=r.width+"px";canvas.style.height=r.height+"px";}
  }
  ensureSquare(); window.addEventListener("resize",ensureSquare);

  if(canvas){
    const ctx=canvas.getContext("2d");
    let t=0; (function loop(){
      const w=canvas.width/devicePixelRatio,h=canvas.height/devicePixelRatio;
      ctx.clearRect(0,0,w,h);
      const cx=w/2+Math.sin(t/70)*3, cy=h/2+Math.cos(t/90)*2;
      const g=ctx.createRadialGradient(cx,cy,12,cx,cy,Math.max(w,h)*.55);
      g.addColorStop(0,"rgba(0,191,255,.42)");
      g.addColorStop(.25,"rgba(0,191,255,.16)");
      g.addColorStop(.55,"rgba(0,191,255,.05)");
      g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.globalCompositeOperation="lighter";
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,Math.max(w,h)*.6,0,Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation="source-over";
      t++; requestAnimationFrame(loop);
    })();
  }

  /* Micro “Parler” : toggle + boost anneaux (zéro audio pour la démo) */
  const voice=document.getElementById("voiceToggle");
  if(voice && saturnWrap){
    let on=false;
    const label=()=>{voice.textContent=on?"⏹":"🎤";voice.setAttribute("aria-pressed",String(on));}
    label();
    voice.addEventListener("click",()=>{
      on=!on; label();
      saturnWrap.classList.toggle("speaking",on);
      add(on?"🎙️ L’assistant écoute votre demande…":"⏹️ Fin d’écoute. Résumé envoyé dans le chat.","bot");
      if(on){setTimeout(()=>{if(!on)return; on=false;label();saturnWrap.classList.remove("speaking");add("✅ Capture terminée. Continuez sur WhatsApp pour finaliser.","bot")},24000)}
    });
  }

  console.log("%cEcommind • cockpit IA optimisé","color:#00BFFF;font-weight:700;font-size:16px");
});
