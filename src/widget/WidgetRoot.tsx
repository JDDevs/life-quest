import { useEffect, useRef, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWindow, LogicalSize, LogicalPosition, currentMonitor } from '@tauri-apps/api/window'
import { pomoRemainingOf, pomoElapsedOf } from '../store'
import { palette } from '../theme'
import type { PomoRun, PomoSettings } from '../types'

// State pushed from the main window over the Tauri event bus. The main window
// owns the timer/worker/cloud-sync; this widget is a thin view + command sender.
interface WState {
  pomoRun: PomoRun
  pomoSettings: PomoSettings
  taskTitle: string | null
  tasks: { id: string; title: string }[]
  theme: 'light' | 'dark'
}

const MINI_W = 128
const MINI_H = 54
const FULL_W = 300
const FULL_H = 80
const BAR_W = 14
const BAR_H = 64
const SNAP = 28 // px from a screen edge that triggers docking
const ROW_H = 34

type Dock = 'left' | 'right' | null

function fmt(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

function sym(size: number, color: string, fill?: boolean): React.CSSProperties {
  return { fontFamily: '"Material Symbols Outlined"', fontSize: size + 'px', lineHeight: 1, color, userSelect: 'none', fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }
}

/** Floating always-on-top widget window (Tauri only).
 *  - Free: rests as a tiny pill (ring + time); click to expand to full controls.
 *  - Docked (dragged to a screen edge): a thin bar; hover peeks the mini pill
 *    (slides open); click opens the full controls. */
export function WidgetRoot() {
  const [st, setSt] = useState<WState | null>(null)
  const [, force] = useState(0)
  const [picking, setPicking] = useState(false)
  const [dock, setDock] = useState<Dock>(null)
  const [open, setOpen] = useState(false)
  const [peek, setPeek] = useState(false)
  const pickerH = useRef(0)
  const prog = useRef(false)
  const curW = useRef(MINI_W)
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const dockRef = useRef<Dock>(null)
  dockRef.current = dock
  const openRef = useRef(false)
  openRef.current = open
  const peekRef = useRef(false)
  peekRef.current = peek
  const pickingRef = useRef(false)
  pickingRef.current = picking

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.body.style.margin = '0'
    document.body.style.overflow = 'hidden'
    let un: (() => void) | undefined
    listen<WState>('pomo:state', (e) => setSt(e.payload)).then((u) => {
      un = u
    })
    void emit('pomo:req')
    const r1 = setTimeout(() => void emit('pomo:req'), 400)
    const r2 = setTimeout(() => void emit('pomo:req'), 1200)
    const id = setInterval(() => force((n) => (n + 1) % 1_000_000), 500)
    return () => {
      un?.()
      clearTimeout(r1)
      clearTimeout(r2)
      clearInterval(id)
    }
  }, [])

  // Edge snapping after the user stops dragging.
  useEffect(() => {
    let un: (() => void) | undefined
    getCurrentWindow()
      .onMoved(() => {
        if (prog.current) return
        if (moveTimer.current) clearTimeout(moveTimer.current)
        moveTimer.current = setTimeout(() => void checkSnap(), 300)
      })
      .then((u) => {
        un = u
      })
    return () => {
      un?.()
      if (moveTimer.current) clearTimeout(moveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function geom() {
    const win = getCurrentWindow()
    const mon = await currentMonitor()
    const scale = mon?.scaleFactor || (await win.scaleFactor())
    const pos = await win.outerPosition()
    const monLeft = mon ? mon.position.x / scale : 0
    const monTop = mon ? mon.position.y / scale : 0
    const monW = mon ? mon.size.width / scale : 1920
    const monH = mon ? mon.size.height / scale : 1080
    return { x: pos.x / scale, y: pos.y / scale, monLeft, monTop, monH, monRight: monLeft + monW }
  }

  async function setGeom(w: number, h: number, x: number, y: number) {
    const win = getCurrentWindow()
    prog.current = true
    curW.current = w
    try {
      await win.setSize(new LogicalSize(w, h))
      await win.setPosition(new LogicalPosition(Math.round(x), Math.round(y)))
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      prog.current = false
    }, 140)
  }

  const clampY = (y: number, top: number, h: number, monH: number) => Math.max(top + 6, Math.min(y, top + monH - h - 6))
  const clampX = (x: number, w: number, left: number, right: number) => Math.max(left, Math.min(x, right - w))

  // Resize/position for the given open + dock + peek.
  async function applyGeom(o: boolean, dk: Dock, pk: boolean) {
    if (pickingRef.current) return
    const g = await geom()
    if (o) {
      const x = dk === 'left' ? g.monLeft : dk === 'right' ? g.monRight - FULL_W : clampX(g.x, FULL_W, g.monLeft, g.monRight)
      await setGeom(FULL_W, FULL_H, x, clampY(g.y, g.monTop, FULL_H, g.monH))
    } else if (dk && pk) {
      const x = dk === 'left' ? g.monLeft : g.monRight - MINI_W
      await setGeom(MINI_W, MINI_H, x, clampY(g.y, g.monTop, MINI_H, g.monH))
    } else if (dk) {
      const x = dk === 'left' ? g.monLeft : g.monRight - BAR_W
      await setGeom(BAR_W, BAR_H, x, clampY(g.y, g.monTop, BAR_H, g.monH))
    } else {
      await setGeom(MINI_W, MINI_H, clampX(g.x, MINI_W, g.monLeft, g.monRight), clampY(g.y, g.monTop, MINI_H, g.monH))
    }
  }

  async function checkSnap() {
    if (pickingRef.current) return
    const g = await geom()
    let nd: Dock = null
    if (g.x <= g.monLeft + SNAP) nd = 'left'
    else if (g.x + curW.current >= g.monRight - SNAP) nd = 'right'
    if (nd !== dockRef.current) setDock(nd)
    setPeek(false)
    await applyGeom(openRef.current, nd, false)
  }

  // Hover only matters when docked: peek the mini pill out of the bar.
  const onMouseEnter = () => {
    if (pickingRef.current || openRef.current || !dockRef.current) return
    setPeek(true)
    void applyGeom(false, dockRef.current, true)
  }
  const onMouseLeave = () => {
    if (pickingRef.current || openRef.current || !dockRef.current) return
    setPeek(false)
    void applyGeom(false, dockRef.current, false)
  }

  // Manual drag vs click: a tap toggles mini <-> full; a move drags the window.
  const onPointerDown = (e: React.PointerEvent) => {
    if (pickingRef.current) return
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.moved) return
    if (Math.abs(e.clientX - d.x) > 5 || Math.abs(e.clientY - d.y) > 5) {
      d.moved = true
      void getCurrentWindow().startDragging()
    }
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d || d.moved || pickingRef.current) return
    const next = !openRef.current
    setOpen(next)
    const pk = !next && !!dockRef.current // collapsing while docked → keep the peek
    setPeek(pk)
    void applyGeom(next, dockRef.current, pk)
  }

  const openPicker = async (count: number) => {
    const listH = Math.min(count, 6) * ROW_H + 10
    pickerH.current = listH
    const win = getCurrentWindow()
    try {
      const scale = await win.scaleFactor()
      const pos = await win.outerPosition()
      prog.current = true
      await win.setSize(new LogicalSize(FULL_W, FULL_H + listH))
      await win.setPosition(new LogicalPosition(Math.round(pos.x / scale), Math.round(pos.y / scale - listH)))
      setTimeout(() => (prog.current = false), 140)
    } catch {
      /* ignore */
    }
    setPicking(true)
  }
  const closePicker = async () => {
    setPicking(false)
    pickingRef.current = false
    await applyGeom(openRef.current, dockRef.current, peekRef.current)
  }

  const cmd = (action: 'start' | 'pause' | 'stop') => void emit('pomo:cmd', { action })
  const hide = () => {
    void emit('widget:closed')
    void getCurrentWindow().hide()
  }

  if (!st) return <div style={{ width: '100vw', height: '100vh' }} />

  const C = palette(st.theme)
  const run = st.pomoRun
  const settings = st.pomoSettings
  const mode = run.mode
  const phase = run.phase
  const running = run.running
  const remaining = pomoRemainingOf(run)
  const elapsed = pomoElapsedOf(run)
  const phaseTarget = phase === 'work' ? settings.workMin * 60 : (run.cycle > 0 && run.cycle % settings.longEvery === 0 ? settings.longBreakMin : settings.breakMin) * 60
  const displaySec = mode === 'pomo' ? remaining : elapsed
  // pomodoro: fills as the block elapses. stopwatch: fills over 1h then loops.
  const progress = mode === 'pomo' ? 1 - remaining / phaseTarget : (elapsed % 3600) / 3600
  const midRun = mode === 'pomo' ? remaining < phaseTarget : elapsed > 0
  // ring color reflects run state: phase color while running, red while paused
  const ringColor = running ? (phase === 'break' ? C.green : C.primary) : C.danger
  const label = mode === 'stopwatch' ? 'CRONÓMETRO' : phase === 'work' ? 'ENFOQUE' : 'DESCANSO'
  const options: { id: string | null; title: string }[] = [{ id: null, title: 'Enfoque libre' }, ...st.tasks]

  const ring = (size: number, r: number, sw: number, center?: React.ReactNode) => {
    const cx = size / 2
    const circ = 2 * Math.PI * r
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.line} strokeWidth={sw} />
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={ringColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, Math.max(0, progress)))} transform={`rotate(-90 ${cx} ${cx})`} style={{ transition: 'stroke-dashoffset .3s linear' }} />
        </svg>
        {center}
      </div>
    )
  }
  const centerTime = (font: number) => <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: '"Space Grotesk", sans-serif', fontSize: font + 'px', fontWeight: 700, color: C.text }}>{fmt(displaySec)}</div>
  // play/pause control inside the mini pill's ring
  const centerPlayPause = (
    <button data-no-drag onClick={() => cmd(running ? 'pause' : 'start')} title={running ? 'Pausar' : 'Reanudar'} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <span style={sym(16, running ? C.text : C.primary, true)}>{running ? 'pause' : 'play_arrow'}</span>
    </button>
  )
  const roundBtn = (bg: string, brd: string): React.CSSProperties => ({ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid ' + brd, background: bg, display: 'grid', placeItems: 'center', flexShrink: 0 })

  const big = open || picking
  const showBar = dock && !big && !peek

  return (
    <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ width: '100vw', height: '100vh', overflow: 'hidden', cursor: 'grab' }}>
      {showBar ? (
        // Docked + collapsed → a thin vertical progress bar (fills as the timer
        // advances; colored by state). Hover peeks the mini pill.
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'relative', width: '6px', height: '70%', borderRadius: '6px', background: C.line, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(Math.min(1, Math.max(0, progress)) * 100) + '%', background: ringColor, transition: 'height .3s linear' }} />
          </div>
        </div>
      ) : !big ? (
        // Resting free, or docked peek → the minimal pill (ring + time).
        <div
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            background: C.card,
            border: '1px solid ' + C.line2,
            borderRadius: MINI_H / 2 + 'px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '0 14px 0 8px',
            color: C.text,
            animation: dock && peek ? 'widgetopen .17s ease' : undefined,
            transformOrigin: dock === 'right' ? 'right center' : 'left center',
          }}
        >
          {ring(38, 15, 4, centerPlayPause)}
          <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '15px', color: C.text, letterSpacing: '-.2px' }}>{fmt(displaySec)}</span>
        </div>
      ) : (
        // Open → full controls.
        <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', background: C.card, border: '1px solid ' + C.line2, borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: picking ? 'flex-start' : 'center', fontFamily: 'Manrope, sans-serif', color: C.text, overflow: 'hidden' }}>
          {picking && !dock ? (
            <div data-no-drag style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {options.map((opt) => {
                const on = run.taskId === opt.id
                return (
                  <button key={opt.id ?? 'free'} data-no-drag onClick={() => { void emit('pomo:cmd', { action: 'setTask', taskId: opt.id }); void closePicker() }} title={opt.title} style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', padding: '8px 9px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, color: on ? C.primaryD : C.text, background: on ? C.primarySoft : 'transparent', flexShrink: 0 }}>
                    <span style={sym(16, on ? C.primary : C.faint, on)}>{on ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.title}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 9px 0 8px', flexShrink: 0, height: FULL_H + 'px' }}>
            {ring(46, 19, 4, centerTime(12))}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '.5px', color: phase === 'break' ? C.green : C.muted }}>{label}</div>
              <div data-no-drag onClick={dock ? undefined : () => (picking ? void closePicker() : void openPicker(options.length))} title={st.taskTitle || 'Enfoque libre'} style={{ fontWeight: 700, fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px', cursor: dock ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.taskTitle || 'Enfoque libre'}</span>
                {!dock ? <span style={sym(15, C.faint)}>{picking ? 'expand_less' : 'expand_more'}</span> : null}
              </div>
            </div>
            <div data-no-drag style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {!running ? (
                <button onClick={() => cmd('start')} title={midRun ? 'Reanudar' : 'Comenzar'} style={roundBtn('linear-gradient(135deg,' + C.primary + ',#8B5CF6)', 'transparent')}>
                  <span style={sym(18, '#fff', true)}>play_arrow</span>
                </button>
              ) : (
                <button onClick={() => cmd('pause')} title="Pausar" style={roundBtn(C.card2, C.line2)}>
                  <span style={sym(18, C.text)}>pause</span>
                </button>
              )}
              <button onClick={() => cmd('stop')} title="Terminar" style={roundBtn(C.card2, C.line2)}>
                <span style={sym(17, C.green, true)}>stop</span>
              </button>
              <button onClick={hide} title="Ocultar" style={{ padding: '2px' }}>
                <span style={sym(16, C.faint)}>close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
