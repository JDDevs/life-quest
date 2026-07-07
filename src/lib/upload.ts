// Image upload backed by Cloudflare R2. The R2 credentials never touch the
// browser: our serverless function (/api/upload-url) signs a short-lived
// presigned PUT URL, and the browser uploads the file straight to R2. Only the
// resulting public URL is stored (embedded in a task's Markdown description) —
// the image itself lives on R2's CDN, never inside the synced JSON state.
const SYNC_ID = (import.meta.env.VITE_SYNC_ID as string | undefined) || ''
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/** True when uploads are possible (the endpoint is gated by the sync secret). */
export function imagesEnabled(): boolean {
  return !!SYNC_ID
}

/** Upload an image to R2 via a presigned URL and return its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!SYNC_ID) throw new Error('Configura VITE_SYNC_ID para poder subir imágenes.')
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  if (file.size > MAX_BYTES) throw new Error('La imagen supera los 10 MB.')
  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'

  // 1) ask our server for a short-lived presigned PUT URL
  let signRes: Response
  try {
    signRes = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: SYNC_ID, contentType: file.type, ext }),
    })
  } catch {
    throw new Error('No hay conexión con el servidor de subida.')
  }
  if (!signRes.ok) {
    let msg = 'No se pudo preparar la subida (' + signRes.status + ').'
    try {
      const j = (await signRes.json()) as { error?: string }
      if (j?.error) msg = j.error
    } catch {
      /* ignore */
    }
    if (signRes.status === 401) msg = 'No autorizado: revisa VITE_SYNC_ID.'
    throw new Error(msg)
  }
  const { uploadUrl, publicUrl } = (await signRes.json()) as { uploadUrl?: string; publicUrl?: string }
  if (!uploadUrl || !publicUrl) throw new Error('Respuesta inválida del servidor de subida.')

  // 2) upload the bytes directly to R2 with the presigned URL
  let putRes: Response
  try {
    putRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  } catch {
    throw new Error('No se pudo subir la imagen a R2 (revisa el CORS del bucket).')
  }
  if (!putRes.ok) throw new Error('R2 rechazó la subida (' + putRes.status + ').')
  return publicUrl
}
