import { useStore, pomoRemainingOf, pomoElapsedOf } from '../store'
import { Icon, useC } from '../ui'

function fmt(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

/** Self-contained timer card: the ring, the time and the pause/stop controls.
 *  Reused by the in-app floating pill (expanded state) and by the Document PiP
 *  window (rendered there via createPortal, so store subscriptions still work). */
export function PomoWidgetContents({
  onGoToPomodoro,
  onPopOut,
  onClose,
  closeIcon = 'close',
}: {
  onGoToPomodoro?: () => void
  onPopOut?: () => void
  onClose?: () => void
  closeIcon?: string
}) {
  const C = useC()
  const d = useStore((st) => st.data)
  useStore((st) => st.tick) // re-render each tick
  const pomoStart = useStore((st) => st.pomoStart)
  const pomoPause = useStore((st) => st.pomoPause)
  const pomoStopLog = useStore((st) => st.pomoStopLog)

  const run = d.pomoRun
  const settings = d.pomoSettings
  const mode = run.mode
  const phase = run.phase
  const running = run.running
  const remaining = pomoRemainingOf(run)
  const elapsed = pomoElapsedOf(run)
  const phaseTarget = phase === 'work' ? settings.workMin * 60 : (run.cycle > 0 && run.cycle % settings.longEvery === 0 ? settings.longBreakMin : settings.breakMin) * 60
  const displaySec = mode === 'pomo' ? remaining : elapsed
  const progress = mode === 'pomo' ? 1 - remaining / phaseTarget : (elapsed % (settings.workMin * 60)) / (settings.workMin * 60)
  const midRun = mode === 'pomo' ? remaining < phaseTarget : elapsed > 0
  const ringColor = phase === 'break' ? C.green : C.primary
  const label = mode === 'stopwatch' ? 'CRONÓMETRO' : phase === 'work' ? 'ENFOQUE' : 'DESCANSO'
  const task = d.tasks.find((t) => t.id === run.taskId)

  const R = 30
  const CIRC = 2 * Math.PI * R
  const iconBtn = (bg: string, brd: string): React.CSSProperties => ({
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '1px solid ' + brd,
    background: bg,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  })

  return (
    <div
      style={{
        background: C.card,
        border: '1px solid ' + C.line2,
        borderRadius: '18px',
        padding: '14px',
        width: '250px',
        boxShadow: '0 18px 44px rgba(0,0,0,.28)',
        fontFamily: 'Manrope, sans-serif',
        color: C.text,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', width: '76px', height: '76px', flexShrink: 0 }}>
          <svg width={76} height={76} viewBox="0 0 76 76">
            <circle cx={38} cy={38} r={R} fill="none" stroke={C.line} strokeWidth={6} />
            <circle
              cx={38}
              cy={38}
              r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - Math.min(1, Math.max(0, progress)))}
              transform="rotate(-90 38 38)"
              style={{ transition: 'stroke-dashoffset .3s linear' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              color: C.text,
            }}
          >
            {fmt(displaySec)}
          </div>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.6px', color: phase === 'break' ? C.green : C.muted }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
            {task ? task.title : 'Enfoque libre'}
          </div>
        </div>
        {onClose ? (
          <button onClick={onClose} title="Cerrar" style={{ color: C.faint, alignSelf: 'flex-start' }}>
            <Icon name={closeIcon} size={18} color={C.faint} />
          </button>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
        {!running ? (
          <button
            onClick={pomoStart}
            style={{ ...iconBtn('linear-gradient(135deg,' + C.primary + ',#8B5CF6)', 'transparent'), width: 'auto', padding: '0 16px', gap: '6px', display: 'inline-flex', alignItems: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flex: 1 }}
          >
            <Icon name="play_arrow" size={18} color="#fff" fill />
            {midRun ? 'Reanudar' : 'Comenzar'}
          </button>
        ) : (
          <button
            onClick={pomoPause}
            style={{ ...iconBtn(C.card2, C.line2), width: 'auto', padding: '0 16px', gap: '6px', display: 'inline-flex', alignItems: 'center', color: C.text, fontWeight: 700, fontSize: '13px', flex: 1 }}
          >
            <Icon name="pause" size={18} color={C.text} />
            Pausar
          </button>
        )}
        <button onClick={pomoStopLog} title="Terminar y registrar" style={iconBtn(C.card2, C.line2)}>
          <Icon name="stop" size={19} color={C.green} fill />
        </button>
        {onPopOut ? (
          <button onClick={onPopOut} title="Ventana flotante" style={iconBtn(C.card2, C.line2)}>
            <Icon name="picture_in_picture_alt" size={18} color={C.muted} />
          </button>
        ) : null}
        {onGoToPomodoro ? (
          <button onClick={onGoToPomodoro} title="Abrir Pomodoro" style={iconBtn(C.card2, C.line2)}>
            <Icon name="open_in_full" size={17} color={C.muted} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
