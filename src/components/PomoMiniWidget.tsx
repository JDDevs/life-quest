import { useEffect, useRef, useState } from 'react'
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

type Dock = 'left' | 'right' | null
interface WPos {
  dock: Dock
  x: number
  y: number
}

const POS_KEY = 'lq_pomo_widget_pos'
const PILL_W = 112
const PILL_H = 52
const PANEL_W = 250
const PANEL_H = 158
const EDGE = 64 // how close to a side edge (px) counts as "dock here"

function loadPos(): WPos {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && typeof p.x === 'number' && typeof p.y === 'number') return p
    }
  } catch {
    /* ignore */
  }
  const x = typeof window !== 'undefined' ? window.innerWidth - PILL_W - 20 : 20
  const y = typeof window !== 'undefined' ? window.innerHeight - PILL_H - 20 : 20
  return { dock: null, x, y }
}

/** Floating pomodoro widget: a draggable pill that shows the ring + time; drag it
 *  against a side edge and it collapses to a thin tab (TickTick-style) that
 *  expands on hover. Can also pop out to an always-on-top Document PiP window. */
export function PomoMiniWidget() {
  const C = useC()
  const run = useStore((st) => st.data.pomoRun)
  const settings = useStore((st) => st.data.pomoSettings)
  const view = useStore((st) => st.view)
  const setView = useStore((st) => st.setView)
  useStore((st) => st.tick) // re-render each tick

  const [pos, setPos] = useState<WPos>(loadPos)
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pipWin, setPipWin] = useState<Window | null>(null)
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)

  const remaining = pomoRemainingOf(run)
  const elapsed = pomoElapsedOf(run)
  const active = run.running || run.loggedSec > 0 || (run.mode === 'pomo' ? remaining < settings.workMin * 60 : elapsed > 0)

  useEffect(() => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos))
    } catch {
      /* ignore */
    }
  }, [pos])

  useEffect(() => {
    if (!active && pipWin) {
      pipWin.close()
      setPipWin(null)
    }
  }, [active, pipWin])
  useEffect(() => () => pipWin?.close(), [pipWin])

  const openPip = async () => {
    const w = await openPipWindow(300, 172)
    if (!w) return
    w.document.body.style.background = C.card
    w.document.body.style.margin = '0'
    const onHide = () => setPipWin(null)
    w.addEventListener('pagehide', onHide)
    setPipWin(w)
  }
  const closePip = () => {
    pipWin?.close()
    setPipWin(null)
  }

  // Popped out into a PiP window — render the widget there, hide the in-app pill.
  if (pipWin) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0 }}>
        <PomoWidgetContents variant="pip" onClose={closePip} closeIcon="close_fullscreen" />
      </div>,
      pipWin.document.body,
    )
  }

  if (!active) return null

  const expanded = (hover || pinned) && !dragging

  // ---- drag (only from the collapsed pill / docked tab) ----
  const resolveX = () => (pos.dock === 'left' ? 0 : pos.dock === 'right' ? window.innerWidth - PILL_W : pos.x)
  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: resolveX(), oy: pos.y, moved: false }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const dr = drag.current
    if (!dr) return
    const ddx = e.clientX - dr.sx
    const ddy = e.clientY - dr.sy
    if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) dr.moved = true
    const nx = Math.max(0, Math.min(window.innerWidth - PILL_W, dr.ox + ddx))
    const ny = Math.max(0, Math.min(window.innerHeight - PILL_H, dr.oy + ddy))
    setPos({ dock: null, x: nx, y: ny })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    const moved = drag.current?.moved
    drag.current = null
    setDragging(false)
    if (!moved) {
      setPinned((v) => !v) // a tap toggles the expanded view
      return
    }
    setPos((p) => {
      let dock: Dock = null
      if (p.x <= EDGE) dock = 'left'
      else if (p.x + PILL_W >= window.innerWidth - EDGE) dock = 'right'
      return { ...p, dock }
    })
  }

  // ---- positioning ----
  const clampY = (h: number) => Math.max(8, Math.min(pos.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - h - 8))
  const wrap: React.CSSProperties = { position: 'fixed', zIndex: 9000, touchAction: 'none' }
  if (expanded) {
    wrap.top = clampY(PANEL_H)
    // when docked, keep the panel flush to the edge so the cursor stays inside
    // it after expanding (otherwise hover flickers open/closed)
    if (pos.dock === 'left') wrap.left = 0
    else if (pos.dock === 'right') wrap.right = 0
    else wrap.left = Math.max(8, Math.min(pos.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - PANEL_W - 8))
  } else {
    wrap.top = clampY(PILL_H)
    if (pos.dock === 'left') wrap.left = 0
    else if (pos.dock === 'right') wrap.right = 0
    else wrap.left = pos.x
  }

  const phase = run.phase
  const mode = run.mode
  const phaseTarget = phase === 'work' ? settings.workMin * 60 : (run.cycle > 0 && run.cycle % settings.longEvery === 0 ? settings.longBreakMin : settings.breakMin) * 60
  const displaySec = mode === 'pomo' ? remaining : elapsed
  const progress = mode === 'pomo' ? 1 - remaining / phaseTarget : (elapsed % (settings.workMin * 60)) / (settings.workMin * 60)
  const ringColor = phase === 'break' ? C.green : C.primary
  const R = 15
  const CIRC = 2 * Math.PI * R

  const dragProps = { onPointerDown, onPointerMove, onPointerUp }

  return (
    <div style={wrap} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {expanded ? (
        <PomoWidgetContents
          onGoToPomodoro={
            view === 'pomodoro'
              ? undefined
              : () => {
                  setPinned(false)
                  setView('pomodoro')
                }
          }
          onPopOut={isPipSupported() ? openPip : undefined}
          onClose={() => {
            setPinned(false)
            setHover(false)
          }}
          closeIcon="close_fullscreen"
        />
      ) : pos.dock ? (
        // collapsed against an edge → a thin draggable tab
        <div
          {...dragProps}
          title="Cronómetro en curso — pasa el mouse para abrir, arrastra para mover"
          style={{
            width: '11px',
            height: '62px',
            borderRadius: pos.dock === 'left' ? '0 10px 10px 0' : '10px 0 0 10px',
            background: 'linear-gradient(160deg,' + ringColor + ',#8B5CF6)',
            boxShadow: '0 8px 22px rgba(0,0,0,.3)',
            cursor: dragging ? 'grabbing' : 'grab',
          }}
        />
      ) : (
        // free-floating pill (the collapsed look)
        <div
          {...dragProps}
          title="Arrástrame a un borde para replegar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            padding: '7px 15px 7px 7px',
            borderRadius: '999px',
            background: C.card,
            border: '1px solid ' + C.line2,
            boxShadow: '0 14px 34px rgba(0,0,0,.26)',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
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
            {!run.running ? (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '9px', fontWeight: 800, color: ringColor }}>❚❚</div>
            ) : null}
          </div>
          <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '15px', color: C.text, letterSpacing: '-.2px' }}>{fmt(displaySec)}</span>
        </div>
      )}
    </div>
  )
}
