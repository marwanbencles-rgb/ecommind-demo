export async function handler() {
  const map = {
    fr: process.env.ELEVEN_VOICE_FR || "",
    en: process.env.ELEVEN_VOICE_EN || "",
    es: process.env.ELEVEN_VOICE_ES || "",
    de: process.env.ELEVEN_VOICE_DE || "",
    it: process.env.ELEVEN_VOICE_IT || "",
    ar: process.env.ELEVEN_VOICE_AR || "",
    default: process.env.ELEVEN_VOICE_DEFAULT || "21m00Tcm4TlvDq8ikWAM"
  };
  return { statusCode: 200, body: JSON.stringify(map) };
}
