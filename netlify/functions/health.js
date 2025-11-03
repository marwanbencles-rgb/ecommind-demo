// netlify/functions/health.js
export async function handler() {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      OPENAI: !!process.env.OPENAI_API_KEY,
      ELEVENLABS: !!process.env.ELEVENLABS_API_KEY,
      node: process.version,
      now: new Date().toISOString()
    })
  };
}
