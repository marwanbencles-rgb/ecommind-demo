// netlify/functions/env-check.js
export async function handler() {
  const haveOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const have11 = Boolean(process.env.ELEVEN_API_KEY || process.env.ELEVENLABS_API_KEY);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      ok: true,
      env: { OPENAI_API_KEY: haveOpenAI, ELEVEN_API_KEY: have11, OPENAI_MODEL: model }
    })
  };
}
