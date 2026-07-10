// Desktop notifications for the Pomodoro (opt-in). The completion event fires
// even while the tab is in the background, so an OS notification is the only
// reliable way to alert the user — a suspended tab can't play audio.

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Ask for permission. MUST be called from a user gesture (e.g. toggling the
 *  setting on). Resolves to true only when permission ends up granted. */
export async function ensurePomoNotifyPermission(): Promise<boolean> {
  if (!notifySupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const res = await Notification.requestPermission()
    return res === 'granted'
  } catch {
    return false
  }
}

/** Fire the "block finished" notification. No-op unless permission is granted. */
export function notifyPomoDone(endedPhase: 'work' | 'break'): void {
  if (!notifySupported() || Notification.permission !== 'granted') return
  const title = endedPhase === 'work' ? '¡Bloque de enfoque terminado!' : 'Descanso terminado'
  const body = endedPhase === 'work' ? 'Tómate un descanso 🌿' : 'A enfocarte de nuevo 💪'
  try {
    const n = new Notification(title, { body, tag: 'lifequest-pomo', icon: '/favicon.svg' })
    // Bring the app forward if the user clicks the notification.
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* ignore */
  }
}
