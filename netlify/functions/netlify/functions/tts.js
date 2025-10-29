// ============================================================================
//  ECOMMIND AGENCY - TTS FUNCTION
//  Objectif : convertir le texte en audio premium via ElevenLabs.
//  Version Netlify-compatible : streaming désactivé, renvoie base64 propre.
// ============================================================================

export async function handler(event) {
  try {
    const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
    if (!ELEVEN_API_KEY) {
      return { statusCode: 500, body: "Clé ElevenLabs manquante." };
    }

    const { text, lang } = JSON.parse(event.body || "{}");
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: "Aucun texte fourni." }) };
    }

    // ============================================================
    // 1️⃣  Sélection dynamique de la voix selon la langue
    // ============================================================
    const voiceMap = {
      fr: process.env.ELEVEN_VOICE_FR || process.env.ELEVEN_VOICE_DEFAULT || "21m00Tcm4TlvDq8ikWAM",
      en: process.env.ELEVEN_VOICE_EN || "21m00Tcm4TlvDq8ikWAM",
      es: process.env.ELEVEN_VOICE_ES || "EXAVITQu4vr4xnSDxMaL",
      ar: process.env.ELEVEN_VOICE_AR || "21m00Tcm4TlvDq8ikWAM",
    };

    const voiceId = voiceMap[lang] || process.env.ELEVEN_VOICE_DEFAULT || "21m00Tcm4TlvDq8ikWAM";

    // ============================================================
    // 2️⃣  Préparation du texte (sécurité)
    // ============================================================
    const cleanText = text.replace(/\s+/g, " ").trim().slice(0, 500);

    // ============================================================
    // 3️⃣  Requête vers ElevenLabs API
    // ============================================================
    const ttsResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!ttsResp.ok) {
      const errText = await ttsResp.text();
      console.error("TTS Error:", errText);
      return {
        statusCode: ttsResp.status,
        body: JSON.stringify({ error: "Erreur TTS", raw: errText }),
      };
    }

    // ============================================================
    // 4️⃣  Conversion du flux audio en base64
    // ============================================================
    const audioBuffer = await ttsResp.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // ============================================================
    // 5️⃣  Réponse finale
    // ============================================================
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        audioBase64: base64Audio,
        contentType: "audio/mpeg",
        voiceUsed: voiceId,
      }),
    };

  } catch (err) {
    console.error("Erreur serveur TTS:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
