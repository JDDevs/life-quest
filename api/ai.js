// Vercel serverless function — thin proxy to Google Gemini.
// The Gemini API key lives ONLY here (server side), never in the browser.
// The browser POSTs { id, system?, messages, schema?, temperature? } and we
// return { text }. `id` must match VITE_SYNC_ID (same shared secret used for
// cloud sync) so the endpoint isn't an open, free Gemini relay for strangers.
//
// Env required on the server:
//   GEMINI_API_KEY  — get one free at https://aistudio.google.com/apikey
//   VITE_SYNC_ID    — (optional) if set, callers must send the same id

const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' })
      return
    }

    let body = req.body
    if (typeof body === 'string') body = JSON.parse(body || '{}')
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'invalid body' })
      return
    }

    // Gate with the sync secret when one is configured (mirrors /api/state).
    const secret = process.env.VITE_SYNC_ID
    if (secret && body.id !== secret) {
      res.status(401).json({ error: 'unauthorized' })
      return
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      res.status(500).json({ error: 'GEMINI_API_KEY not set on the server' })
      return
    }

    const messages = Array.isArray(body.messages) ? body.messages : []
    if (!messages.length) {
      res.status(400).json({ error: 'no messages' })
      return
    }

    const contents = messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.text || '') }],
    }))

    const generationConfig = {
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      maxOutputTokens: 2048,
    }
    // Structured output: force valid JSON matching the caller-provided schema.
    if (body.schema && typeof body.schema === 'object') {
      generationConfig.responseMimeType = 'application/json'
      generationConfig.responseSchema = body.schema
    }

    const payload = { contents, generationConfig }
    if (body.system) {
      payload.systemInstruction = { parts: [{ text: String(body.system) }] }
    }

    const r = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      res.status(502).json({ error: 'gemini error ' + r.status, detail: detail.slice(0, 500) })
      return
    }

    const data = await r.json()
    const blocked = data?.promptFeedback?.blockReason
    if (blocked) {
      res.status(200).json({ text: '', blocked })
      return
    }
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ?? ''
    res.status(200).json({ text })
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) })
  }
}
