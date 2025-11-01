// =========================================================
//  ECOMMIND – Front IA vocal multilingue
// =========================================================

// === endpoints ===
// Si tu utilises le fichier `_redirects`, tu peux remplacer par `/api`
const FN = (name) => `/.netlify/functions/${name}`;

// === sélecteurs ===
const $ = (sel)=>document.querySelector(sel);
const thread = $("#thread");
const statusEl = $("#status");
const langBadge = $("#langBadge");
const playBadge = $("#playBadge");
const envPill = $("#env-pill");
const llmBadge = $("#llmBadge");
const muteToggle = $("#muteToggle");
const input = $("#msg");
const sendBtn = $("#sendBtn");

// === interface ===
const UI = {
  push(role, text){
    const div = document.createElement("div");
    div.className = "bubble " + (role === "user" ? "me":"ai");
    div.textContent = text;
    thread.appendChild(div);
    thread.scrollTop = thread.scrollHeight;
  },
  setStatus(t){ statusEl.textContent = t; },
  setLang(l){ langBadge.textContent = l || "—"; },
  setPlay(t){ playBadge.textContent = t || "-"; },
  setEnv(ok){
    envPill.innerHTML = ok
      ? `Variables env <b class="ok">OK</b>`
      : `Variables env <b class="bad">manquantes</b>`;
  }
};

// === VOICE CONTROLLER ===
const VC = (() => {
  let currentAudio = null;
  let queue = [];
  let playing = false;
  let muted = false;

  async function speak(text, lang) {
    if (muted) return;
    queue.push({text, lang});
    UI.setPlay(`queue: ${queue.length}`);
    if (!playing) _dequeue();
  }

  async function _dequeue(){
    if (playing) return;
    const item = queue.shift();
    if (!item){ UI.setPlay("-"); return; }
    playing = true;
    UI.setPlay("synthèse…");

    try{
      const res = await fetch(FN('tts'), {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text: item.text, lang: item.lang || 'fr' })
      });

      if (!res.ok){
        console.warn("TTS error", await res.text());
        UI.setPlay("erreur TTS");
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (currentAudio){ currentAudio.pause(); currentAudio.src=''; }
        currentAudio = new Audio(url);
        currentAudio.onended = () => {
          playing = false;
          URL.revokeObjectURL(url);
          _dequeue();
        };
        currentAudio.play().catch(()=>{ playing=false; _dequeue(); });
      }
    }catch(e){
      console.error(e);
      UI.setPlay("erreur TTS");
      playing = false;
    }
  }

  function stopAll(){
    queue = [];
    if (currentAudio){ currentAudio.pause(); currentAudio.src=''; currentAudio=null; }
    playing = false;
    UI.setPlay("-");
  }

  function setMuted(v){
    muted = v;
    if (muted) stopAll();
  }

  return { speak, stopAll, setMuted };
})();

// === API WRAPPERS ===
async function envCheck(){
  try{
    const r = await fetch(FN('env-check'));
    if (!r.ok){ UI.setEnv(false); return; }
    const js = await r.json().catch(()=> ({}));
    const ok = js?.ok && js?.env?.OPENAI_API_KEY && js?.env?.ELEVEN_API_KEY;
    UI.setEnv(!!ok);
    if (js?.env?.OPENAI_MODEL) llmBadge.textContent = js.env.OPENAI_MODEL;
  }catch{ UI.setEnv(false); }
}

async function detectLang(text){
  try{
    const r = await fetch(FN('lang-detect'),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    });
    const js = await r.json().catch(()=> ({}));
    const lang = js?.lang || 'fr';
    UI.setLang(lang);
    return lang;
  }catch(e){
    console.warn(e);
    UI.setLang('fr');
    return 'fr';
  }
}

async function askLLM(userText, langHint){
  try{
    const r = await fetch(FN('chat'),{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userText, langHint })
    });
    const js = await r.json().catch(()=> ({}));
    return js?.reply || "Désolé, je n’ai pas saisi.";
  }catch(e){
    console.warn(e);
    return "Un incident temporaire s’est produit.";
  }
}

// === flux principal ===
async function handleSend(text){
  const clean = (text||"").trim();
  if (!clean) return;

  UI.push('user', clean);
  input.value = "";
  VC.stopAll();

  UI.setStatus("Détection langue…");
  const lang = await detectLang(clean);

  UI.setStatus("Réponse IA…");
  const reply = await askLLM(clean, lang);

  UI.push('ai', reply);
  UI.setStatus("Synthèse vocale…");
  await VC.speak(reply, lang);
  UI.setStatus("Prêt");
}

// === events ===
sendBtn.addEventListener("click", ()=> handleSend(input.value));
input.addEventListener("keydown", (e)=>{
  if (e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    handleSend(input.value);
  }
});
muteToggle.addEventListener("change", e => VC.setMuted(e.target.checked));

// === démarrage ===
(async function boot(){
  UI.setStatus("Initialisation…");
  await envCheck();

  const welcome = "Bienvenue dans la démonstration Ecommind. Dites-moi votre besoin : site, automatisation, ou prise de rendez-vous ?";
  UI.push('ai', welcome);
  await VC.speak(welcome, 'fr');

  UI.setStatus("Prêt");
})();
