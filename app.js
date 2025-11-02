/* ---------- Utils ---------- */
const $ = (s)=>document.querySelector(s);
const envChip = $('#envChip'), langChip = $('#langChip'), ttsChip = $('#ttsChip');
const langOut = $('#langOut'), ttsOut = $('#ttsOut'), orb = $('#orb');
const input = $('#msg'), sendBtn = $('#send'), muteCk = $('#mute');

/* Orb animation: set --amp [0..1] */
const setAmp = (v)=> orb.style.setProperty('--amp', String(Math.max(0, Math.min(1, v))));

/* Audio chain (auto-play safe) */
let audioCtx, gain, sourcePlaying = null, queue = [];
async function ensureCtx() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  // Unblock on first user interaction
  const resume = () => audioCtx.state === 'suspended' ? audioCtx.resume() : null;
  window.addEventListener('pointerdown', resume, { once:true });
}

/* Play raw ArrayBuffer (mp3/mpeg) */
async function playBuffer(arrBuf) {
  await ensureCtx();
  const data = await audioCtx.decodeAudioData(arrBuf.slice(0));
  const src = audioCtx.createBufferSource();
  src.buffer = data;
  src.connect(gain);
  src.start(0);
  sourcePlaying = src;

  // Orb animation on play
  let raf;
  const analyser = audioCtx.createAnalyser();
  src.disconnect(); src.connect(analyser); analyser.connect(gain);
  analyser.fftSize = 256; const bins = new Uint8Array(analyser.frequencyBinCount);
  const loop = () => {
    analyser.getByteTimeDomainData(bins);
    // amplitude estimate
    let peak = 0;
    for (let i=0;i<bins.length;i++) peak = Math.max(peak, Math.abs(bins[i]-128));
    setAmp(peak/60);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return new Promise(res=>{
    src.onended = ()=>{ cancelAnimationFrame(raf); setAmp(0.0); sourcePlaying=null; res(); };
  });
}

/* Queue to avoid overlap */
async function speak(arrBuf){
  queue.push(arrBuf);
  if (queue.length>1 || muteCk.checked) return;
  while(queue.length){
    const buf = queue[0];
    try { await playBuffer(buf); } catch(e){ console.error('play error',e); }
    queue.shift();
  }
}

/* Endpoint helper: try /.netlify/functions/* then /api/* */
async function postJSON(path, body) {
  const headers = {'Content-Type':'application/json'};
  // First try the “functions” path (works même si pas de _redirects)
  let r = await fetch(`/.netlify/functions/${path}`, { method:'POST', headers, body: JSON.stringify(body||{}) });
  if (!r.ok) {
    // fallback /api/*
    r = await fetch(`/api/${path}`, { method:'POST', headers, body: JSON.stringify(body||{}) });
  }
  return r;
}

/* ---------- App logic ---------- */

(async function init(){
  // 0) Env check
  try {
    const r = await postJSON('env-check', {});
    const jtxt = await r.text();
    let j = {};
    try { j = JSON.parse(jtxt); } catch(e){ /* 404 HTML -> {} */ }
    const ok = !!(j.ok);
    envChip.textContent = ok ? 'OK' : '—';
    envChip.className = ok ? 'mini ok' : 'mini err';
  } catch(e){ envChip.textContent='—'; envChip.className='mini err'; }

  // 1) Salutation auto + détection de langue
  const greeting = "Bienvenue dans la démo Ecommind. Dites-moi votre besoin : site, automatisation, ou prise de rendez-vous ?";
  input.value = greeting;

  const detRes = await postJSON('lang-detect', { text: greeting });
  let det={ ok:false, lang:'fr' };
  try { det = await detRes.json(); } catch(e){}
  langChip.textContent = det.lang || '—';
  langOut.textContent = det.lang || '—';

  // 2) LLM: produire une phrase courte
  const chatRes = await postJSON('chat', { userText: "Fais-moi un résumé en une phrase.", langHint: det.lang||'fr' });
  let chat = { ok:false, reply:"" };
  try { chat = await chatRes.json(); } catch(e){}
  // 3) TTS
  const ttsRes = await postJSON('tts', { text: chat.reply || "Ceci est un test de voix française pour Ecommind.", lang: det.lang || 'fr' });

  if (ttsRes.ok) {
    // mp3 blob → arrayBuffer
    const blob = await ttsRes.blob();
    const buf = await blob.arrayBuffer();
    ttsChip.textContent = 'OK'; ttsChip.className='mini ok';
    ttsOut.textContent = 'lecture…';
    await speak(buf);
    ttsOut.textContent = 'terminé';
  } else {
    ttsChip.textContent = 'erreur'; ttsChip.className='mini err';
    ttsOut.textContent = 'échec TTS';
  }
})();

/* Envoi utilisateur */
sendBtn.addEventListener('click', async()=>{
  const text = input.value.trim();
  if (!text) return;
  sendBtn.disabled = true;

  const det = await postJSON('lang-detect', { text });
  let d={lang:'fr'}; try { d = await det.json(); } catch(e){}
  langChip.textContent = d.lang||'—'; langOut.textContent = d.lang||'—';

  const chatRes = await postJSON('chat', { userText: text, langHint: d.lang||'fr' });
  let chat={reply:""}; try { chat = await chatRes.json(); } catch(e){}

  const ttsRes = await postJSON('tts', { text: chat.reply || text, lang: d.lang||'fr' });
  if (ttsRes.ok) {
    const blob = await ttsRes.blob();
    const buf = await blob.arrayBuffer();
    ttsChip.textContent = 'OK'; ttsChip.className='mini ok';
    ttsOut.textContent = 'lecture…';
    await speak(buf);
    ttsOut.textContent = 'terminé';
  } else {
    ttsChip.textContent = 'erreur'; ttsChip.className='mini err';
    ttsOut.textContent = 'échec TTS';
  }
  sendBtn.disabled = false;
});

/* Env: activer le son après un premier geste si bloqué */
document.addEventListener('keydown', ()=> ensureCtx(), { once:true });
document.addEventListener('pointerdown', ()=> ensureCtx(), { once:true });
