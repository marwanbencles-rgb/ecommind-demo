export async function handler() {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      ok: true,
      ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    })
  };
}
