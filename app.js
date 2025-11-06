/* =========================================================
   Ecommind – Demo IA (Front minimal, propre et robuste)
   - Soumission du formulaire
   - Affichage historique
   - Appel au backend (proxy Netlify → Webhook n8n)
   - Lecture audio TTS si fourni
   - Accessibilité (aria-live) + états visuels
   ========================================================= */

(() => {
  // ------- Sélecteurs ----------
  const form = document.getElementById("form-chat");
  const input = document.getElementById("champ-message");
  const chatLog = document.getElementById("chat-log");
  const srStatus = document.querySelector(".sr-status"); // aria-live polite
  const btnEnvoyer = document.getElementById("btn-envoyer");
  const btnParler = document.getElementById("btn-parler");
  const lecteurAudio = document.getElementById("lecteur-audio");
  const etatN8n = document.getElementById("etat-n8n");
  const etatTTS = document.getElementById("etat-tts");
  const etatAdapt = document.getElementById("etat-adapt");

  // ------- Config ----------
  // IMPORTANT : /api/demo est redirigé par netlify.toml → Webhook n8n
  const API_PATH = "/api/demo";

  // ------- Utilitaires ----------
  function setBusy(isBusy) {
    btnEnvoyer.disabled = isBusy;
    btnParler.disabled = isBusy;
    input.disabled = isBusy;

    if (isBusy) {
      btnEnvoyer.dataset.prevText = btnEnvoyer.textContent;
      btnEnvoyer.textContent = "Envoi…";
    } else {
      btnEnvoyer.textContent = btnEnvoyer.dataset.prevText || "Envoyer";
    }
  }

  function announce(message) {
    if (!srStatus) return;
    srStatus.hidden = false;
    srStatus.textContent = message;
  }

  function scrollToBottom() {
    const histo = document.getElementById("historique");
    if (histo) histo.scrollTop = histo.scrollHeight;
  }

  function sanitize(str) {
    // Protection basique contre l’injection HTML
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function addMessage(role, text) {
    const li = document.createElement("li");
    li.innerHTML = `<b>${role} :</b> ${sanitize(text)}`;
    chatLog.appendChild(li);
    scrollToBottom();
  }

  function setEtat(key, value) {
    const map = {
      n8n: etatN8n,
      tts: etatTTS,
      adapt: etatAdapt,
    };
    if (map[key]) map[key].textContent = value;
  }

  async function playAudio(url) {
    if (!url) return;
    try {
      lecteurAudio.src = url;
      await lecteurAudio.play();
      return true;
    } catch (e) {
      // Certains navigateurs bloquent l’autoplay sans interaction
      console.warn("Lecture auto refusée, tentative via contrôle natif.", e);
      return false;
    }
  }

  // ------- Ping de santé (facultatif) ----------
  // On vérifie rapidement si le proxy Netlify / n8n répond
  (async function healthCheck() {
    try {
      // Convention: le Webhook peut répondre 405/200 selon la config sur GET; on n’en fait pas une erreur bloquante
      const res = await fetch(API_PATH, { method: "OPTIONS" });
      setEtat("n8n", res.ok ? "connecté" : "en attente");
    } catch {
      setEtat("n8n", "hors ligne");
    }
  })();

  // ------- Soumission du formulaire ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    // 1) Affichage local du message utilisateur
    addMessage("Vous", message);
    announce("Message envoyé. Réponse en cours…");
    setBusy(true);

    // 2) Prépare la charge utile (adaptation future : type de business, ton, etc.)
    const payload = {
      message,                 // requis
      business_type: null,     // à remplir plus tard depuis l’UI si tu veux
      emotion: null,           // idem (ex: "pressé", "calme", "sceptique")
      meta: {
        locale: "fr-FR",
        source: "ecommind-demo-web",
      },
    };

    try {
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Gestion d’erreurs réseau/API
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur API (${res.status}) ${txt}`);
      }

      const data = await res.json();

      // 3) Affiche la réponse texte
      const botText =
        (data && (data.text || data.reply || data.message)) ||
        "Je n’ai pas pu générer de réponse pour l’instant.";
      addMessage("Ecommind", botText);
      announce("Réponse reçue.");

      // 4) Lecture audio si disponible
      const audioUrl = data && (data.audio_url || data.audioUrl || data.audio);
      const played = await playAudio(audioUrl);
      setEtat("tts", audioUrl ? (played ? "actif" : "en attente (autoplay)") : "désactivé");

      // 5) État adaptation si fourni
      if (data && data.adaptation) {
        setEtat("adapt", data.adaptation);
      } else {
        // Valeur par défaut, jusqu’à l’intégration du prompt dynamique
        setEtat("adapt", "basique");
      }
    } catch (err) {
      console.error(err);
      addMessage("Système", "Impossible de contacter le serveur. Réessaie dans un instant.");
      announce("Erreur de connexion avec le serveur.");
      setEtat("n8n", "hors ligne");
    } finally {
      // 6) Reset UI
      input.value = "";
      input.focus();
      setBusy(false);
    }
  });

  // ------- Bouton “Parler” (hook futur) ----------
  // On n’active pas le micro ici : on attendra l’étape “Voix côté front” plus tard.
  btnParler.addEventListener("click", () => {
    const pressed = btnParler.getAttribute("aria-pressed") === "true";
    btnParler.setAttribute("aria-pressed", String(!pressed));
    // Placeholder UI — à remplacer quand on ajoutera le micro
    if (!pressed) {
      addMessage("Système", "Mode Parler (préparation). Le micro sera activé à l’étape Voix.");
    } else {
      addMessage("Système", "Mode Parler désactivé.");
    }
  });

  // ------- Confort : Enter pour envoyer ----------
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      btnEnvoyer.click();
    }
  });

  // ------- Affichage de l’année courante ----------
  (function setYear() {
    const y = document.getElementById("annee-courante");
    if (y) {
      const now = new Date();
      y.setAttribute("datetime", String(now.getFullYear()));
      y.textContent = String(now.getFullYear());
    }
  })();
})();
