// Optional cloud sync. The browser talks to our own serverless endpoint
// (/api/state, backed by Neon Postgres on Vercel) — the DB connection string
// stays on the server. When VITE_SYNC_ID is unset the app is 100% local.
import type { AppData } from '../types'
import { migrate } from './storage'

const SYNC_ID = (import.meta.env.VITE_SYNC_ID as string | undefined) || ''
const API = '/api/state'

export function cloudEnabled(): boolean {
  return !!SYNC_ID
}

export interface CloudState {
  data: AppData
  updatedAt: string
}

/** Load the remote state, or null if none exists yet. Throws on error. */
export async function pullState(): Promise<CloudState | null> {
  if (!cloudEnabled()) return null
  const res = await fetch(`${API}?id=${encodeURIComponent(SYNC_ID)}`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error('pull failed: ' + res.status)
  const json = (await res.json()) as { data: AppData; updatedAt: string } | null
  if (!json) return null
  return { data: migrate(json.data), updatedAt: json.updatedAt }
}

/** Save the full state to the cloud. Throws on error. */
export async function pushState(data: AppData): Promise<void> {
  if (!cloudEnabled()) return
  const res = await fetch(`${API}?id=${encodeURIComponent(SYNC_ID)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('push failed: ' + res.status)
}
