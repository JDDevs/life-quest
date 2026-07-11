import { useState } from 'react'
import { createPortal } from 'react-dom'
import { isPipSupported, openPipWindow } from '../lib/pip'
import { isTauri, showPomoWidget } from '../lib/tauri'
import { PomoWidgetContents } from './PomoWidgetContents'
import { Icon, useC } from '../ui'

/** Opens the on-demand floating widget: a native always-on-top window under
 *  Tauri, or a Document PiP window in the browser. Renders nothing where neither
 *  is available (e.g. Safari/Firefox web). Used in the Pomodoro view controls. */
export function PomoPopoutButton() {
  const C = useC()
  const [pipWin, setPipWin] = useState<Window | null>(null)
  const tauri = isTauri()
  const canPip = !tauri && isPipSupported()
  if (!tauri && !canPip) return null

  const openPip = async () => {
    const w = await openPipWindow(288, 184)
    if (!w) return
    w.document.body.style.background = C.bg
    w.document.body.style.display = 'grid'
    w.document.body.style.placeItems = 'center'
    w.addEventListener('pagehide', () => setPipWin(null))
    setPipWin(w)
  }
  const closePip = () => {
    pipWin?.close()
    setPipWin(null)
  }
  const onClick = () => {
    if (tauri) void showPomoWidget()
    else void openPip()
  }

  return (
    <>
      <button
        onClick={onClick}
        title="Abrir widget flotante"
        style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid ' + C.line2, color: C.primary, display: 'grid', placeItems: 'center' }}
      >
        <Icon name="picture_in_picture_alt" size={22} color={C.primary} />
      </button>
      {pipWin ? createPortal(<PomoWidgetContents variant="pip" onClose={closePip} closeIcon="close_fullscreen" />, pipWin.document.body) : null}
    </>
  )
}
