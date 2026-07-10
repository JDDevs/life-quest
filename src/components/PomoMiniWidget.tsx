import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore, pomoRemainingOf, pomoElapsedOf } from '../store'
import { isPipSupported, openPipWindow } from '../lib/pip'
import { PomoWidgetContents } from './PomoWidgetContents'
import { useC } from '../ui'

function fmt(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

/** Floating pomodoro widget. Shows a compact pill whenever a session is active
 *  and you're not on the Pomodoro view; expands on hover; can pop out into an
 *  always-on-top Document PiP window (Chrome/Edge). */
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

  const remaining = pomoRemainingOf(run)
  const elapsed = pomoElapsedOf(run)
  const active =
    run.running ||
    run.loggedSec > 0 ||
    (run.mode === 'pomo' ? remaining < settings.workMin * 60 : elapsed > 0)

  // Close the PiP window if the session ends or the component unmounts.
  useEffect(() => {
    if (!active && pipWin) {
      pipWin.close()
      setPipWin(null)
    }
  }, [active, pipWin])
  useEffect(() => () => pipWin?.close(), [pipWin])

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

  // While popped out into PiP, the in-app pill is hidden — the widget lives in
  // the floating window instead.
  if (pipWin) {
    return createPortal(<PomoWidgetContents onClose={closePip} closeIcon="close_fullscreen" />, pipWin.document.body)
  }

  if (!active || view === 'pomodoro') return null

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
    <div
      style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 9000 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {expanded ? (
        <PomoWidgetContents
          onGoToPomodoro={() => {
            setPinned(false)
            setView('pomodoro')
          }}
          onPopOut={isPipSupported() ? openPip : undefined}
          onClose={() => {
            setPinned(false)
            setHover(false)
          }}
          closeIcon="close_fullscreen"
        />
      ) : (
        <button
          onClick={() => setPinned(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            padding: '7px 15px 7px 7px',
            borderRadius: '999px',
            background: C.card,
            border: '1px solid ' + C.line2,
            boxShadow: '0 14px 34px rgba(0,0,0,.26)',
            animation: run.running ? undefined : 'none',
          }}
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
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: '9px',
                fontWeight: 800,
                color: ringColor,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              {run.running ? '' : '❚❚'}
            </div>
          </div>
          <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '15px', color: C.text, letterSpacing: '-.2px' }}>{fmt(displaySec)}</span>
        </button>
      )}
    </div>
  )
}
