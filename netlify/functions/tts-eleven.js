// netlify/functions/tts-eleven.js

export async function handler(event, context) {
  try {
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM", modelId = "eleven_multilingual_v2" } = JSON.parse(event.body);

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Texte manquant." }),
      };
    }

    // Appel à l’API ElevenLabs
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY, // 🔐 clé cachée
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.45,
          use_speaker_boost: true,
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erreur ElevenLabs", details: errText }),
      };
    }

    // Conversion du flux audio en base64
    const audioBuffer = await resp.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        audio: base64Audio,
        mime: "audio/mpeg",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
