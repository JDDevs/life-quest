// Document Picture-in-Picture: opens a real always-on-top OS window we can
// render React into (via createPortal). Chromium 116+ only (Chrome/Edge).
// The API isn't in the default TS lib, so we declare the slice we use.

interface DocumentPictureInPictureOptions {
  width?: number
  height?: number
}
interface DocumentPictureInPictureApi {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>
  readonly window: Window | null
}
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureApi
  }
}

export function isPipSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window
}

/** Clone every stylesheet/<style> (and font <link>) into the PiP document so
 *  the portalled React tree looks identical to the main window. */
function copyStyles(pip: Window): void {
  const doc = pip.document
  document.querySelectorAll('link[rel="stylesheet"], style, link[rel="preconnect"]').forEach((node) => {
    doc.head.appendChild(node.cloneNode(true))
  })
  doc.body.style.margin = '0'
  doc.body.style.overflow = 'hidden'
}

/** Must be called from a user gesture. Returns the PiP window, or null when
 *  unsupported / the user dismisses the picker. */
export async function openPipWindow(width: number, height: number): Promise<Window | null> {
  const dpip = window.documentPictureInPicture
  if (!dpip) return null
  try {
    const pip = await dpip.requestWindow({ width, height })
    copyStyles(pip)
    return pip
  } catch {
    return null
  }
}
