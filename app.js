// Ecommind Closer – App logic (front-only, Netlify static)
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Nav routing (no refresh)
  $$('.nav-btn, .hero-cta [data-section]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.section;
      $$('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.section===id));
      $$('.section').forEach(s=>s.classList.toggle('show', s.id===id));
      if (id==='chat') $('#chatInput')?.focus();
    });
  });

  // Header controls
  $('#logoutBtn')?.addEventListener('click', ()=>alert('Déconnexion (stub).'));
  $('#modeToggle')?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('force-light');
    document.documentElement.classList.toggle('force-dark');
  });

  // KPI micro-animations (GSAP optionnel)
  const kpis = ['#kpiLeads','#kpiConv','#kpiRt','#kpiSat'].map(id => $(id));
  if (window.gsap) {
    gsap.from(kpis, {y:8, opacity:0, stagger:.08, duration:.6, ease:"power2.out"});
  }

  // Line chart (vanilla canvas)
  const ctx = $('#chartLine').getContext('2d');
  const W = $('#chartLine').width = $('#chartLine').clientWidth;
  const H = $('#chartLine').height;
  const data = Array.from({length:24}, (_,i)=> 20 + Math.sin(i/3)*12 + Math.random()*6);
  const max = Math.max(...data)+10, min = Math.min(...data)-10;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim();
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x = (i/(data.length-1))*W;
    const y = H - ((v - min)/(max - min))*H;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  });
  ctx.stroke();
  // dots
  ctx.fillStyle = '#001421';
  data.forEach((v,i)=>{
    const x = (i/(data.length-1))*W;
    const y = H - ((v - min)/(max - min))*H;
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });

  // Bars simple
  const barsRoot = $('#bars');
  const sources = ['Ads','Mail','WhatsApp','Instagram','Site','Phone'];
  sources.forEach(src=>{
    const h = 30 + Math.round(Math.random()*70);
    const card = document.createElement('div');
    card.className = 'bar'; card.setAttribute('role','img'); card.setAttribute('aria-label',`${src} ${h}%`);
    const fill = document.createElement('div'); fill.className='fill'; fill.style.height = h+'%';
    card.appendChild(fill); barsRoot.appendChild(card);
  });

  // CHAT (front only, simulation; branchement API à faire)
  const chatStream = $('#chatStream');
  const chatForm = $('#chatForm');
  const chatInput = $('#chatInput');
  const autoScroll = $('#autoScroll');
  const punchList = $('#punchList');
  const punchlines = [
    "On signe aujourd’hui ou demain ?",
    "On installe, vous encaissez.",
    "2 490€ d’entrée, 490€/mois pour ne plus revenir en arrière.",
    "Moins d’effort, plus de marge : c’est le deal."
  ];
  punchlines.forEach(p=>{ const li=document.createElement('li'); li.textContent=p; punchList.appendChild(li); });

  const addMsg = (role, text) => {
    const row = document.createElement('div'); row.className = 'msg '+role;
    const bubble = document.createElement('div'); bubble.className='bubble'; bubble.textContent = text;
    const time = document.createElement('div'); time.className='time'; time.textContent = new Date().toLocaleTimeString();
    row.appendChild(bubble); row.appendChild(time); chatStream.appendChild(row);
    if (autoScroll.checked) chatStream.scrollTop = chatStream.scrollHeight;
  };

  $('#clearChat')?.addEventListener('click', ()=>{ chatStream.innerHTML=''; });

  chatForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const text = (chatInput.value || '').trim();
    if (!text) return;
    addMsg('user', text);
    chatInput.value = '';

    // Stub de réponse "closer" (à remplacer par un fetch() vers ton endpoint LLM)
    const reply = synthCloser(text);
    await typeStream(reply);
  });

  function synthCloser(q){
    // Petites règles de démo orientées closing
    const s = q.toLowerCase();
    if (s.includes('prix') || s.includes('combien')) {
      return "On entre à 2 490€ pour installer un système qui travaille 24/7. Puis 490€/mois pour la maintenance, la cybersécurité et les mises à jour IA. On démarre aujourd’hui ou demain ?";
    }
    if (s.includes('roi') || s.includes('rentabil')) {
      return "Sur nos cas récents : +18% de leads traités et +2.4 pts sur le taux de conversion en 30 jours. Si on n’améliore pas, on pivote jusqu’à impact mesurable.";
    }
    if (s.includes('garantie')) {
      return "Garantie d’accompagnement : itérations illimitées sur la phase de mise en place jusqu’au premier cas de succès. Vous n’êtes pas seul.";
    }
    return "Dites-moi votre secteur et votre process actuel. Je vous montre en 60 secondes comment l’IA gère l’entrée, qualifie, et close l’offre — pendant que vous restez focalisé sur l’essentiel.";
  }

  async function typeStream(text){
    const parts = text.split(' ');
    let out = '';
    for (let i=0;i<parts.length;i++){
      out += (i? ' ':'') + parts[i];
      // affichage progressif
      if (i===0){
        addMsg('ai', out);
      } else {
        const last = chatStream.lastElementChild?.querySelector('.bubble');
        if (last) last.textContent = out;
      }
      await new Promise(r=>setTimeout(r, 30));
    }
  }

  // VOICE (WebAudio visual uniquement + transcript simulé)
  const micBtn = $('#micBtn');
  const stopBtn = $('#stopBtn');
  const micDot = $('#micDot');
  const micLabel = $('#micLabel');
  const voiceCanvas = $('#voiceCanvas');
  const vctx = voiceCanvas.getContext('2d');
  let mediaStream, audioCtx, analyser, rafId;
  let listening = false;

  micBtn?.addEventListener('click', async ()=>{
    try{
      mediaStream = await navigator.mediaDevices.getUserMedia({audio:true});
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(mediaStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      listening = true;
      micDot.style.background = getCSS('--blue');
      micLabel.textContent = 'En écoute';
      drawWave();
      logVoice('🎤 Micro activé. Parlez…');
      // Ici: appel à ton endpoint STT temps-réel si besoin.
    }catch(err){
      alert('Micro non autorisé ou indisponible.');
    }
  });

  stopBtn?.addEventListener('click', stopMic);

  function stopMic(){
    if (!listening) return;
    listening = false;
    micDot.style.background = getCSS('--muted');
    micLabel.textContent = 'Micro inactif';
    if (rafId) cancelAnimationFrame(rafId);
    if (mediaStream) mediaStream.getTracks().forEach(t=>t.stop());
    if (audioCtx) audioCtx.close();
    logVoice('⏹️ Micro coupé.');
  }

  function drawWave(){
    const W = voiceCanvas.width = voiceCanvas.clientWidth;
    const H = voiceCanvas.height;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const draw = ()=>{
      analyser.getByteTimeDomainData(buffer);
      vctx.clearRect(0,0,W,H);
      vctx.lineWidth = 2;
      vctx.strokeStyle = getCSS('--blue');
      vctx.beginPath();
      for (let i=0;i<buffer.length;i++){
        const x = (i/(buffer.length-1))*W;
        const y = (buffer[i]/128.0)*H/2;
        i ? vctx.lineTo(x,y) : vctx.moveTo(x,y);
      }
      vctx.stroke();
      if (listening) rafId = requestAnimationFrame(draw);
    };
    draw();
  }

  function logVoice(text){
    const el = document.createElement('div');
    el.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    $('#voiceLog').appendChild(el);
    $('#voiceLog').scrollTop = $('#voiceLog').scrollHeight;
  }

  // Pulse FX toggle
  $('#pulseToggle')?.addEventListener('click', ()=>{
    document.body.classList.toggle('fx-off');
    $('#statusPill').textContent = document.body.classList.contains('fx-off') ? 'Actif • Effets coupés' : 'Actif • En écoute';
  });

  // History stub
  const hist = [
    {from:'Marc – Garage', sum:'Demande ROI + objections prix → closing J+1'},
    {from:'Nadia – Restaurant', sum:'Besoin prise de commande auto → démo live fixée'},
    {from:'Alex – E-commerce', sum:'Migration + IA SAV → devis envoyé'}
  ];
  const list = $('#historyList');
  hist.forEach(h=>{
    const li = document.createElement('li');
    li.textContent = `${h.from} — ${h.sum}`;
    list.appendChild(li);
  });

  // Helpers
  function getCSS(varName){ return getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); }

  // Accessibility / Keyboard
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' && document.activeElement === document.body && $('#chat').classList.contains('show')) {
      $('#chatInput')?.focus();
    }
  });

})();
