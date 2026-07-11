import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore, pomoRemainingOf, pomoElapsedOf } from '../store'
import { isPipSupported, openPipWindow } from '../lib/pip'
import { isTauri, showPomoWidget } from '../lib/tauri'
import { listen } from '@tauri-apps/api/event'
import { PomoWidgetContents } from './PomoWidgetContents'
import { useC } from '../ui'

function fmt(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

/** Floating pomodoro indicator: a small pill pinned to the bottom-right corner,
 *  shown only when a session is active and you're NOT on the Pomodoro view
 *  (there the full timer is already visible). Hover to expand (pause/stop/pop
 *  out). Pop-out opens the on-demand widget: a native always-on-top window under
 *  Tauri, or Document PiP in the browser. */
export function PomoMiniWidget() {
  const C = useC()
  const run = useStore((st) => st.data.pomoRun)
  const settings = useStore((st) => st.data.pomoSettings)
  const view = useStore((st) => st.view)
  const setView = useStore((st) => st.setView)
  useStore((st) => st.tick) // re-render each tick

  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pipWin, setPipWin] = useState<Window | null>(null)
  const [nativeOpen, setNativeOpen] = useState(false)

  const remaining = pomoRemainingOf(run)
  const elapsed = pomoElapsedOf(run)
  const active = run.running || run.loggedSec > 0 || (run.mode === 'pomo' ? remaining < settings.workMin * 60 : elapsed > 0)

  useEffect(() => {
    if (!active && pipWin) {
      pipWin.close()
      setPipWin(null)
    }
  }, [active, pipWin])
  useEffect(() => () => pipWin?.close(), [pipWin])

  // Under Tauri, the native floating widget replaces the in-app pill while open
  // — no matter where it was opened from (pill or the Pomodoro view button).
  useEffect(() => {
    if (!isTauri()) return
    const uns: Array<() => void> = []
    listen('widget:shown', () => setNativeOpen(true)).then((u) => uns.push(u))
    listen('widget:closed', () => setNativeOpen(false)).then((u) => uns.push(u))
    return () => uns.forEach((u) => u())
  }, [])

  const openPip = async () => {
    const w = await openPipWindow(288, 184)
    if (!w) return
    w.document.body.style.background = C.bg
    w.document.body.style.display = 'grid'
    w.document.body.style.placeItems = 'center'
    const onHide = () => setPipWin(null)
    w.addEventListener('pagehide', onHide)
    setPipWin(w)
  }
  const closePip = () => {
    pipWin?.close()
    setPipWin(null)
  }
  const openNativeWidget = () => {
    void showPomoWidget() // emits 'widget:shown' → the listener hides this pill
  }

  // Popped out into a PiP window — render the widget there, hide the in-app pill.
  if (pipWin) {
    return createPortal(<PomoWidgetContents variant="pip" onClose={closePip} closeIcon="close_fullscreen" />, pipWin.document.body)
  }

  // Only in a corner, when active, off the Pomodoro view, and not popped out.
  if (!active || view === 'pomodoro' || nativeOpen) return null

  const expanded = hover || pinned
  const phase = run.phase
  const mode = run.mode
  const phaseTarget = phase === 'work' ? settings.workMin * 60 : (run.cycle > 0 && run.cycle % settings.longEvery === 0 ? settings.longBreakMin : settings.breakMin) * 60
  const displaySec = mode === 'pomo' ? remaining : elapsed
  const progress = mode === 'pomo' ? 1 - remaining / phaseTarget : (elapsed % (settings.workMin * 60)) / (settings.workMin * 60)
  const ringColor = phase === 'break' ? C.green : C.primary
  const R = 15
  const CIRC = 2 * Math.PI * R

  return (
    <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 9000 }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {expanded ? (
        <PomoWidgetContents
          onGoToPomodoro={() => {
            setPinned(false)
            setView('pomodoro')
          }}
          onPopOut={isTauri() ? openNativeWidget : isPipSupported() ? openPip : undefined}
          onClose={() => {
            setPinned(false)
            setHover(false)
          }}
          closeIcon="close_fullscreen"
        />
      ) : (
        <button
          onClick={() => setPinned(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '7px 15px 7px 7px', borderRadius: '999px', background: C.card, border: '1px solid ' + C.line2, boxShadow: '0 14px 34px rgba(0,0,0,.26)' }}
        >
          <div style={{ position: 'relative', width: '38px', height: '38px' }}>
            <svg width={38} height={38} viewBox="0 0 38 38">
              <circle cx={19} cy={19} r={R} fill="none" stroke={C.line} strokeWidth={4} />
              <circle
                cx={19}
                cy={19}
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - Math.min(1, Math.max(0, progress)))}
                transform="rotate(-90 19 19)"
                style={{ transition: 'stroke-dashoffset .3s linear' }}
              />
            </svg>
            {!run.running ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '9px', fontWeight: 800, color: ringColor }}>❚❚</div> : null}
          </div>
          <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '15px', color: C.text, letterSpacing: '-.2px' }}>{fmt(displaySec)}</span>
        </button>
      )}
    </div>
  )
}
