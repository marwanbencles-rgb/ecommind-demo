// ====== CONFIG ======
const WHATSAPP_URL = "https://wa.me/212600000000?text=Je%20veux%20l%27automatisation%20Ecommind%20pour%20mon%20garage";
document.addEventListener('DOMContentLoaded', () => {
  const cta = document.getElementById("cta-pay");
  if (cta) cta.href = WHATSAPP_URL;
});

const chatEl = document.getElementById("chat");
const langEl = document.getElementById("lang");
const orb = document.getElementById("orb");
const btnPlay = document.getElementById("btnPlay");
const btnStop = document.getElementById("btnStop");

let synth = window.speechSynthesis;

// KPI animation simple
const stepCount = (el, to)=> {
  const start = Number(el.textContent.replace('+',''))||0;
  const diff = to - start; const steps = 24; let i=0;
  const tick = ()=>{ i++; el.textContent = `+${Math.round(start + (diff*(i/steps)))}`; if(i<steps) requestAnimationFrame(tick); }
  tick();
};
stepCount(document.getElementById("kpi-appts"), 17);
stepCount(document.getElementById("kpi-replies"), 43);
stepCount(document.getElementById("kpi-quotes"), 12);

// Helpers
function addMsg(role, text){
  const item = document.createElement('div');
  item.className = `msg ${role}`;
  item.innerHTML = `<div class="role">${role === 'user' ? 'Vous' : 'Ecommind'}</div><div class="bubble">${text}</div>`;
  chatEl.appendChild(item);
  chatEl.scrollTop = chatEl.scrollHeight;
}

let __playingAudio = null;

function stopSpeaking() {
  try { if (__playingAudio) { __playingAudio.pause(); __playingAudio.currentTime = 0; } } catch(e){}
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

async function speak(text, opts = {}) {
  const voice = opts.voice || "alloy"; // "verse" dispo aussi
  stopSpeaking();

  try {
    const res = await fetch("/.netlify/functions/tts-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice })
    });

    if (!res.ok) throw new Error(await res.text());

    const b64 = await res.text();
    const url = `data:audio/mpeg;base64,${b64}`;
    __playingAudio = new Audio(url);
    await __playingAudio.play();
  } catch (e) {
    console.warn("TTS premium failed, fallback Web Speech:", e);
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = (window.__LOCALE__ === 'en' ? 'en-US' : 'fr-FR');
    u.rate  = 1.03;
    u.pitch = 1.05;
    speechSynthesis.speak(u);
  }
}

function systemPrompt(locale){
  const tone = "prestige, clair, orienté conversion, concis, autorité bienveillante";

  const sector = "garage automobile";
  return `Tu es l'IA d'Ecommind Agency. Langue: ${locale}.
Rôle: démontrer en 90-120 secondes comment tu automatise un ${sector}:
- capter/qualifier les leads (téléphone, WhatsApp, Facebook, email),
- proposer des créneaux, fixer le RDV, envoyer rappel SMS,
- générer un devis simple et relance si pas de réponse,
- taguer dans CRM et produire un mini reporting quotidien.
Objectif: impressionner et pousser à cliquer sur "Je veux cette automatisation".
Style: ${tone}. Ne parle pas de prix. Termine par une question fermée qui incite à agir.`;
}

async function askChatGPT(messages){
  const res = await fetch('/.netlify/functions/chatgpt-proxy', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ messages })
  });
  if(!res.ok){ throw new Error('API error'); }
  return await res.json(); // { reply }
}

async function runDemo(){
  btnPlay.disabled = true;
  const locale = langEl.value || 'fr-FR';

  addMsg('user', 'Lancer la démo');

  const messages = [
    { role:'system', content: systemPrompt(locale) },
    { role:'user', content: "Fais une démonstration parlée, rythmée, avec des phrases courtes. Intègre 2-3 exemples concrets pour un garage." }
  ];

  try{
    const { reply } = await askChatGPT(messages);
    addMsg('assistant', reply);
    speak(reply, locale);
  } catch(e){
    addMsg('assistant', "Impossible de joindre l’IA. Vérifie la clé API et Netlify.");
    console.error(e);
  } finally {
    btnPlay.disabled = false;
  }
}

// Boutons
btnPlay.addEventListener('click', runDemo);
btnStop.addEventListener('click', ()=> speechSynthesis.cancel());

// Glow pendant la parole
const style = document.createElement('style');
style.textContent = `.talk{animation:pulse 0.6s ease-in-out infinite; box-shadow:0 0 40px rgba(0,191,255,.9),0 0 140px rgba(0,191,255,.35)}`;
document.head.appendChild(style);
