export async function handler(event) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const { text } = JSON.parse(event.body || "{}");
    const userText = (text || "").slice(0, 2000);
    if (!userText) return { statusCode: 200, body: JSON.stringify({ lang: "en" }) };

    const system = `Réponds UNIQUEMENT {"lang":"xx"} (fr,en,ar,es,de,it). Si doute: "en".`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText }
        ]
      })
    });

    if (!r.ok) return { statusCode: r.status, body: await r.text() };
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    let lang = "en";
    try { lang = JSON.parse(raw)?.lang || "en"; }
    catch { lang = /"lang"\s*:\s*"([a-z]{2})"/i.test(raw) ? RegExp.$1 : "en"; }
    if (!["fr","en","ar","es","de","it"].includes(lang)) lang = "en";
    return { statusCode: 200, body: JSON.stringify({ lang }) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
