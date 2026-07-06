// Optional cloud sync via Supabase's REST (PostgREST) API — no SDK, just fetch.
// Configure with env vars at build time (see .env.example). When unset, the app
// runs purely on localStorage and every cloud call becomes a no-op.
import type { AppData } from '../types'
import { migrate } from './storage'

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') || ''
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ''
const SYNC_ID = (import.meta.env.VITE_SYNC_ID as string | undefined) || 'me'
const TABLE = 'app_state'

export function cloudEnabled(): boolean {
  return !!(URL && ANON)
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: ANON,
    Authorization: 'Bearer ' + ANON,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export interface CloudState {
  data: AppData
  updatedAt: string
}

/** Fetch the remote state, or null if none exists. Throws on network/HTTP error. */
export async function pullState(): Promise<CloudState | null> {
  if (!cloudEnabled()) return null
  const res = await fetch(
    `${URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(SYNC_ID)}&select=data,updated_at`,
    { headers: headers() },
  )
  if (!res.ok) throw new Error('pull failed: ' + res.status)
  const rows = (await res.json()) as { data: AppData; updated_at: string }[]
  if (!rows.length) return null
  return { data: migrate(rows[0].data), updatedAt: rows[0].updated_at }
}

/** Upsert the full state to the cloud. Throws on network/HTTP error. */
export async function pushState(data: AppData): Promise<void> {
  if (!cloudEnabled()) return
  const res = await fetch(`${URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ id: SYNC_ID, data, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error('push failed: ' + res.status)
}
