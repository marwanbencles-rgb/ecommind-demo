export async function handler() {
  const openai = process.env.OPENAI_API_KEY ? "✅" : "❌";
  const eleven = process.env.ELEVENLABS_API_KEY ? "✅" : "❌";

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "OK",
      OPENAI: openai,
      ELEVENLABS: eleven,
      time: new Date().toISOString(),
    }),
  };
}
