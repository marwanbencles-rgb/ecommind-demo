// netlify/functions/stt.js
// ✅ Proxy STT (Speech-To-Text) via Whisper (OpenAI)
// - Reçoit un fichier audio depuis le front (multipart/form-data)
// - Retourne le texte + langue détectée
// - Compatible Netlify Functions (Node 18+)

import { fileFromPath } from "formdata-node/file-from-path";
import { FormData } from "formdata-node";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event) {
  try {
    // Autorise CORS
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: CORS_HEADERS, body: "OK" };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: "Missing OPENAI_API_KEY",
      };
    }

    // ⚙️ Vérification que l’audio a bien été envoyé
    const contentType = event.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: "Expected multipart/form-data (audio file)",
      };
    }

    // 🧩 Conversion du body binaire reçu (base64)
    const boundary = contentType.split("boundary=")[1];
    const buffer = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");

    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");

    // 🎙️ Appel API Whisper
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: res.status,
        headers: CORS_HEADERS,
        body: `STT error (${res.status}): ${errText}`,
      };
    }

    const data = await res.json();
    const text = data?.text || "";
    const language = detectLangLocal(text);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: `Server error: ${e.message}`,
    };
  }
}

// 🔤 Détection simple locale (fallback)
function detectLangLocal(text = "") {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[àâäçéèêëîïôöùûüÿœæ]/i.test(text)) return "fr";
  return "en";
}
