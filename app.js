// app.js
// Frontend minimal pour appeler les fonctions Netlify,
// avec résolution automatique des routes + anti-chevauchement audio.

(() => {
  const els = {
    sendBtn: document.querySelector('[data-send]') || document.getElementById('sendBtn'),
    input: document.querySelector('[data-input]') || document.getElementById('userInput'),
    langBadge: document.getElementById('lang-badge') || document.querySelector('[data-lang]'),
    ttsBadge: document.getElementById('tts-badge') || document.querySelector('[data-tts]'),
    logArea: document.getElementById('debug') || null,
  };

  const state = {
    playingAudio: null,
    isBusy: false,
    currentLang: 'fr',
  };

  // ————————————————————————————————————————————
  // Utils : log UI
  function uiLog(...a) {
    console.log('[UI]', ...a);
    if (els.logArea) {
      els.logArea.value += a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n';
      els.logArea.scrollTop = els.logArea.scrollHeight;
    }
  }

  // ————————————————————————————————————————————
  // Résolution automatique des routes (local, netlify, /api)
  async function postJSON(path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const tries = [
      `/.netlify/functions/${path}`,
      `/netlify/functions/${path}`,
      `/api/${path}`,
    ];
    for (const url of tries) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body || {}),
        });
        if (r.ok) return r;
        // Certaines fonctions renvoient du JSON en erreur utile
        const text = await r.text().catch(() => '');
        uiLog(`Route testée: ${url} → ${r.status}`, text.slice(0, 120));
      } catch (e) {
        uiLog(`Route erreur: ${url}`, e.message);
      }
    }
    throw new Error(`Aucune route valide trouvée pour "${path}"`);
  }

  // ————————————————————————————————————————————
  // Environnement OK ?
  async function checkEnv() {
    try {
      const r = await postJSON('env-check', {});
      const x = await r.json();
      uiLog('ENV', x);
      if (x?.openai === false) uiLog('⚠️ OPENAI_API_KEY manquant côté Netlify');
      if (x?.eleven === false) uiLog('⚠️ ELEVENLABS_API_KEY manquant côté Netlify');
      return x;
    } catch (e) {
      uiLog('ENV-CHECK échec:', e.message);
      return {};
    }
  }

  // ————————————————————————————————————————————
  // Lecture audio sans chevauchement
  function stopAudio() {
    try {
      if (state.playingAudio) {
        state.playingAudio.pause();
        state.playingAudio.src = '';
        state.playingAudio = null;
      }
    } catch (e) {}
  }

  async function playBlobAsAudio(blob) {
    stopAudio();
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    state.playingAudio = a;
    try {
      await a.play();
    } catch (e) {
      uiLog('Lecture audio bloquée (autoplay) :', e.message);
    }
  }

  function setTTSBadge(ok) {
    if (!els.ttsBadge) return;
    els.ttsBadge.textContent = ok ? 'TTS : OK' : 'TTS : erreur';
    els.ttsBadge.style.color = ok ? '#6ee7b7' : '#fca5a5';
  }

  // ————————————————————————————————————————————
  // Détection de langue (si tu as la fonction), sinon on force 'fr'
  async function detectLang(text) {
    try {
      const r = await postJSON('lang-detect', { text });
      const x = await r.json();
      const lang = x?.lang || 'fr';
      state.currentLang = lang;
      if (els.langBadge) els.langBadge.textContent = `Langue : ${lang}`;
      return lang;
    } catch {
      state.currentLang = 'fr';
      if (els.langBadge) els.langBadge.textContent = `Langue : fr`;
      return 'fr';
    }
  }

  // ————————————————————————————————————————————
  // Appel TTS
  async function speak(text, lang = 'fr') {
    try {
      const r = await postJSON('tts', { text, lang });
      const ctype = r.headers.get('Content-Type') || '';
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        uiLog('TTS erreur', r.status, t.slice(0, 200));
        setTTSBadge(false);
        return;
      }
      if (!ctype.includes('audio/mpeg')) {
        const t = await r.text().catch(() => '');
        uiLog('TTS format inattendu', ctype, t.slice(0, 200));
        setTTSBadge(false);
        return;
      }
      const blob = await r.blob();
      setTTSBadge(true);
      await playBlobAsAudio(blob);
    } catch (e) {
      uiLog('TTS exception', e.message);
      setTTSBadge(false);
    }
  }

  // ————————————————————————————————————————————
  // Envoi d’un message (ex : à ta fonction /chat)
  async function sendMessage(userText) {
    if (!userText || state.isBusy) return;
    state.isBusy = true;
    try {
      const lang = await detectLang(userText);
      const r = await postJSON('chat', { userText, langHint: lang });
      const x = await r.json();
      const reply = x?.reply || "Je n'ai pas compris, pouvez-vous reformuler ?";
      // Lecture vocale de la réponse
      await speak(reply, lang);
      uiLog('CHAT ->', reply);
    } catch (e) {
      uiLog('CHAT exception', e.message);
    } finally {
      state.isBusy = false;
    }
  }

  // ————————————————————————————————————————————
  // UI Events
  if (els.sendBtn && els.input) {
    els.sendBtn.addEventListener('click', () => {
      const txt = (els.input.value || '').trim();
      els.input.value = '';
      if (txt) sendMessage(txt);
    });
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        els.sendBtn.click();
      }
    });
  }

  // ————————————————————————————————————————————
  // Boot
  (async () => {
    await checkEnv(); // log d’état
    // Option: message d’accueil parlé
    // await speak("Bienvenue chez Ecommind. Dites-moi votre besoin : site, automatisation, ou prise de rendez-vous ?", 'fr');
  })();
})();
