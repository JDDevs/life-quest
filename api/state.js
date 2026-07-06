// Vercel serverless function — cloud sync backed by Neon (Postgres).
// The Neon connection string lives ONLY here (server side), never in the browser.
// The browser calls /api/state?id=<VITE_SYNC_ID> to load (GET) and save (POST).
import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  try {
    const id = req.query.id
    if (!id) {
      res.status(400).json({ error: 'missing id' })
      return
    }
    const url = process.env.DATABASE_URL
    if (!url) {
      res.status(500).json({ error: 'DATABASE_URL not set on the server' })
      return
    }
    const sql = neon(url)
    // create the table on first use so no manual SQL is required
    await sql`create table if not exists app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )`

    if (req.method === 'GET') {
      const rows = await sql`select data, updated_at from app_state where id = ${id}`
      if (!rows.length) {
        res.status(200).json(null)
        return
      }
      res.status(200).json({ data: rows[0].data, updatedAt: rows[0].updated_at })
      return
    }

    if (req.method === 'POST') {
      let body = req.body
      if (typeof body === 'string') body = JSON.parse(body || '{}')
      if (!body || typeof body !== 'object') {
        res.status(400).json({ error: 'invalid body' })
        return
      }
      await sql`insert into app_state (id, data, updated_at)
        values (${id}, ${JSON.stringify(body)}::jsonb, now())
        on conflict (id) do update set data = excluded.data, updated_at = now()`
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) })
  }
}
