// netlify/functions/chatgpt-proxy.js
// Appelle l'API OpenAI côté serveur (sécurisé).
// Nécessite la variable d'environnement OPENAI_API_KEY sur Netlify.

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing OPENAI_API_KEY' })
      };
    }

    const { messages } = JSON.parse(event.body || '{}');

    const payload = {
      model: 'gpt-4o-mini',       // tu peux changer en gpt-4.1-mini si besoin
      temperature: 0.8,
      messages: (messages || []).map(m => ({ role: m.role, content: m.content }))
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    if (!r.ok) {
      return {
        statusCode: r.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: text })
      };
    }

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content || '…';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
}
