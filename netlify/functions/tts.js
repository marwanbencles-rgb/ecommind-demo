// Si ton package.json a "type": "module"
export async function handler() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, ts: Date.now(), note: 'smoke-test tts' })
  };
}
