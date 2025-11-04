// =======================================================
// Ecommind Closer – App.js (version Netlify ready)
// =======================================================
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ----------- NAVIGATION ENTRE SECTIONS -----------
  $$('.nav-btn, .hero-cta [data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.section;
      $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === id));
      $$('.section').forEach(s => s.classList.toggle('show', s.id === id));
      if (id === 'chat') $('#chatInput')?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ----------- HEADER ACTIONS -----------
  $('#logoutBtn')?.addEventListener('click', () => alert('Déconnexion simulée (stub).'));
  $('#modeToggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('force-light');
    document.documentElement.classList.toggle('force-dark');
  });

  // ----------- GSAP : PETITES ENTRÉES DYNAMIQUES -----------
  if (window.gsap) {
    gsap.from('.kpi-num', { y: 8, opacity: 0, stagger: .08, duration: .6, ease: "power2.out" });
    gsap.from('.card', { opacity: 0, y: 15, stagger: 0.06, duration: .7, ease: "power2.out" });
  }

  // ----------- CHART LIGNE SIMPLE -----------
  const ctx = $('#chartLine')?.getContext('2d');
  if (ctx) {
    const W = $('#chartLine').width = $('#chartLine').clientWidth;
    const H = $('#chartLine').height;
    const data = Array.from({ length: 20 }, (_, i) => 25 + Math.sin(i / 2) * 10 + Math.random() * 5);
    const max = Math.max(...data) + 10, min = Math.min(...data) - 10;

    ctx.strokeStyle = getCSS('--blue');
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = getCSS('--blue');
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----------- GRAPHIQUE BARRES ORIGINE LEADS -----------
  const barsRoot = $('#bars');
  if (barsRoot) {
    const sources = ['Ads', 'Mail', 'WhatsApp', 'Instagram', 'Site', 'Phone'];
    sources.forEach(src => {
      const h = 30 + Math.round(Math.random() * 70);
      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('div');
      fill.className = 'fill';
      fill.style.height = h + '%';
      bar.appendChild(fill);
      barsRoot.appendChild(bar);
    });
  }

  // ----------- CHAT IA SIMULÉ (ready pour connexion LLM) -----------
  const chatStream = $('#chatStream');
  const chatForm = $('#chatForm');
  const chatInput = $('#chatInput');
  const autoScroll = $('#autoScroll');
  const punchList = $('#punchList');

  const punchlines = [
    "On signe aujourd’hui ou demain ?",
    "On installe, vous encaissez.",
    "2 490 € d’entrée, 490 €/mois pour ne plus revenir en arrière.",
    "Moins d’effort, plus de marge : c’est le deal."
  ];
  punchlines.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    punchList.appendChild(li);
  });

  function addMsg(role, text) {
    const row = document.createElement('div');
    row.className = 'msg ' + role;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = new Date().toLocaleTimeString();
    row.appendChild(bubble);
    row.appendChild(time);
    chatStream.appendChild(row);
    if (autoScroll.checked) chatStream.scrollTop = chatStream.scrollHeight;
  }

  $('#clearChat')?.addEventListener('click', () => { chatStream.innerHTML = ''; });

  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (chatInput.value || '').trim();
    if (!text) return;
    addMsg('user', text);
    chatInput.value = '';
    const reply = synthCloser(text);
    await typeStream(reply);
  });

  function synthCloser(q) {
    const s = q.toLowerCase();
    if (s.includes('prix') || s.includes('combien')) {
      return "On démarre à 2 490 € pour un système autonome, plus 490 €/mois pour la maintenance IA et la cybersécurité. Vous préférez qu’on démarre aujourd’hui ou demain ?";
    }
    if (s.includes('roi') || s.includes('rentabil')) {
      return "Nos clients constatent +18 % de leads traités et +2,4 pts de conversion en 30 jours. On vous montre comment dès la démo.";
    }
    if (s.includes('garantie')) {
      return "Garantie d’accompagnement totale : on optimise jusqu’à votre premier succès mesurable. Zéro risque, que du résultat.";
    }
    return "Dites-moi votre secteur. Je vous montre comment l’IA close pendant que vous vivez — sans stress, sans pause, sans erreur.";
  }

  async function typeStream(text) {
    const parts = text.split(' ');
    let out = '';
    for (let i = 0; i < parts.length; i++) {
      out += (i ? ' ' : '') + parts[i];
      if (i === 0) addMsg('ai', out);
      else {
        const last = chatStream.lastElementChild?.querySelector('.bubble');
        if (last) last.textContent = out;
      }
      await new Promise(r => setTimeout(r, 25));
    }
  }

  // ----------- VOIX : MICRO + VISUEL AUDIO -----------
  const micBtn = $('#micBtn');
  const stopBtn = $('#stopBtn');
  const micDot = $('#micDot');
  const micLabel = $('#micLabel');
  const voiceCanvas = $('#voiceCanvas');
  const vctx = voiceCanvas?.getContext('2d');

  let mediaStream, audioCtx, analyser, rafId;
  let listening = false;

  micBtn?.addEventListener('click', async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    } catch (err) {
      alert('⚠️ Accès au micro refusé ou non disponible.');
    }
  });

  stopBtn?.addEventListener('click', stopMic);

  function stopMic() {
    if (!listening) return;
    listening = false;
    micDot.style.background = getCSS('--muted');
    micLabel.textContent = 'Micro inactif';
    if (rafId) cancelAnimationFrame(rafId);
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    if (audioCtx) audioCtx.close();
    logVoice('⏹️ Micro coupé.');
  }

  function drawWave() {
    const W = voiceCanvas.width = voiceCanvas.clientWidth;
    const H = voiceCanvas.height;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteTimeDomainData(buffer);
      vctx.clearRect(0, 0, W, H);
      vctx.lineWidth = 2;
      vctx.strokeStyle = getCSS('--blue');
      vctx.beginPath();
      for (let i = 0; i < buffer.length; i++) {
        const x = (i / (buffer.length - 1)) * W;
        const y = (buffer[i] / 128.0) * H / 2;
        i ? vctx.lineTo(x, y) : vctx.moveTo(x, y);
      }
      vctx.stroke();
      if (listening) rafId = requestAnimationFrame(draw);
    };
    draw();
  }

  function logVoice(text) {
    const el = document.createElement('div');
    el.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    $('#voiceLog').appendChild(el);
    $('#voiceLog').scrollTop = $('#voiceLog').scrollHeight;
  }

  // ----------- TOGGLE FX + HISTORY -----------

  $('#pulseToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('fx-off');
    $('#statusPill').textContent = document.body.classList.contains('fx-off')
      ? 'Actif • Effets coupés'
      : 'Actif • En écoute';
  });

  const hist = [
    { from: 'Marc – Garage', sum: 'Demande ROI + objection prix → closing J+1' },
    { from: 'Nadia – Restaurant', sum: 'Commande auto → démo live fixée' },
    { from: 'Alex – E-commerce', sum: 'Migration + IA SAV → devis envoyé' }
  ];
  const list = $('#historyList');
  hist.forEach(h => {
    const li = document.createElement('li');
    li.textContent = `${h.from} — ${h.sum}`;
    list.appendChild(li);
  });

  // ----------- UTILITAIRES -----------
  function getCSS(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  // ----------- ACCESSIBILITÉ -----------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === document.body && $('#chat').classList.contains('show')) {
      $('#chatInput')?.focus();
    }
  });
})();
