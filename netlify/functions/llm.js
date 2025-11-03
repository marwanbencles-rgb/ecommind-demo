// netlify/functions/llm.js
export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS")
      return { statusCode: 200, headers: cors(), body: "OK" };
    if (event.httpMethod !== "POST")
      return { statusCode: 405, headers: cors(), body: "Method Not Allowed" };

    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");

    const { messages = [], model = "gpt-4o-mini", temperature = 0.6 } = JSON.parse(event.body || "{}");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: 400 })
    });

    if (!r.ok) return { statusCode: r.status, headers: cors(), body: await r.text() };

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";

    return {
      statusCode: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, text, usage: data?.usage || {} })
    };
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: `Server error: ${e.message}` };
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
