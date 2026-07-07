// Vercel serverless function — issues a short-lived presigned PUT URL for
// Cloudflare R2 so the browser can upload an image directly. The R2 keys live
// ONLY here (server side). Gated by VITE_SYNC_ID, same as the other endpoints.
//
// Env required on the server:
//   R2_ACCOUNT_ID          — Cloudflare account id
//   R2_ACCESS_KEY_ID       — R2 API token access key id
//   R2_SECRET_ACCESS_KEY   — R2 API token secret access key
//   R2_BUCKET              — bucket name
//   R2_PUBLIC_URL          — public base URL of the bucket (r2.dev or custom domain)
//   VITE_SYNC_ID           — (optional) shared secret; callers must send the same id
import { AwsClient } from 'aws4fetch'

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

    const secret = process.env.VITE_SYNC_ID
    if (secret && body.id !== secret) {
      res.status(401).json({ error: 'unauthorized' })
      return
    }

    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
    const bucket = process.env.R2_BUCKET
    const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
    const missing = [
      ['R2_ACCOUNT_ID', accountId],
      ['R2_ACCESS_KEY_ID', accessKeyId],
      ['R2_SECRET_ACCESS_KEY', secretAccessKey],
      ['R2_BUCKET', bucket],
      ['R2_PUBLIC_URL', publicBase],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k)
    if (missing.length) {
      res.status(500).json({ error: 'Faltan variables de R2 en el servidor (o falta redeploy): ' + missing.join(', ') })
      return
    }

    const ext = String(body.ext || 'png')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 5) || 'png'
    const rand = Math.random().toString(36).slice(2, 10)
    const key = `tasks/${Date.now()}-${rand}.${ext}`

    const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}?X-Amz-Expires=600`
    const signed = await client.sign(endpoint, { method: 'PUT', aws: { signQuery: true } })

    res.status(200).json({ uploadUrl: signed.url, publicUrl: `${publicBase}/${key}` })
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) })
  }
}
