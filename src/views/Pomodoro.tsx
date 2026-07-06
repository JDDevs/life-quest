import { useStore, pomoRemainingOf, pomoElapsedOf } from '../store'
import type { Stats } from '../types'
import { Card, Icon, SectionTitle, StatTile, useC } from '../ui'

function fmt(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function humanDate(key: string) {
  const [, m, dd] = key.split('-').map(Number)
  return dd + ' de ' + MONTHS[m - 1] + '.'
}
function hhmm(ts: number) {
  const d = new Date(ts)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

export function Pomodoro({ s }: { s: Stats }) {
  const C = useC()
  const narrow = useStore((st) => st.narrow)
  const d = useStore((st) => st.data)
  const run = useStore((st) => st.pomoRun)
  useStore((st) => st.tick) // re-render each timer tick
  const setMode = useStore((st) => st.setPomoMode)
  const setPomoTask = useStore((st) => st.setPomoTask)
  const updateSettings = useStore((st) => st.updatePomoSettings)
  const pomoStart = useStore((st) => st.pomoStart)
  const pomoPause = useStore((st) => st.pomoPause)
  const pomoStopLog = useStore((st) => st.pomoStopLog)
  const pomoReset = useStore((st) => st.pomoReset)
  const settings = d.pomoSettings

  const mode = run.mode
  const phase = run.phase
  const running = run.running
  const remaining = pomoRemainingOf(run)
  const elapsed = pomoElapsedOf(run)
  const phaseTarget = phase === 'work' ? settings.workMin * 60 : (run.cycle > 0 && run.cycle % settings.longEvery === 0 ? settings.longBreakMin : settings.breakMin) * 60

  const displaySec = mode === 'pomo' ? remaining : elapsed
  const progress = mode === 'pomo' ? 1 - remaining / phaseTarget : (elapsed % (settings.workMin * 60)) / (settings.workMin * 60)
  const R = 130
  const CIRC = 2 * Math.PI * R
  const ringColor = phase === 'break' ? C.green : C.primary
  // "Comenzar" vs "Reanudar": mid-run if we're not at the fresh start value
  const midRun = mode === 'pomo' ? remaining < phaseTarget : elapsed > 0

  const byDate: Record<string, typeof d.pomoSessions> = {}
  d.pomoSessions.forEach((sn) => {
    ;(byDate[sn.date] = byDate[sn.date] || []).push(sn)
  })
  const dates = Object.keys(byDate).sort().reverse()

  return (
    <div>
      <SectionTitle title="Pomodoro" sub="Enfócate en bloques de tiempo y registra tu concentración" />
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.25fr 1fr', gap: '18px', marginTop: '14px' }}>
        <Card extra={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', padding: '4px', background: C.card2, border: '1px solid ' + C.line, borderRadius: '12px', marginBottom: '18px' }}>
            {(['pomo', 'stopwatch'] as const).map((m) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={running}
                  style={{ padding: '8px 20px', borderRadius: '9px', fontWeight: 700, fontSize: '13.5px', color: on ? '#fff' : C.muted, background: on ? C.primary : 'transparent', cursor: running ? 'not-allowed' : 'pointer', opacity: running && !on ? 0.5 : 1 }}
                >
                  {m === 'pomo' ? 'Pomo' : 'Cronómetro'}
                </button>
              )
            })}
          </div>

          <select
            value={run.taskId || ''}
            onChange={(e) => setPomoTask(e.target.value || null)}
            style={{ border: 'none', background: 'transparent', color: C.muted, fontWeight: 700, fontSize: '14px', textAlign: 'center', marginBottom: '10px', outline: 'none', maxWidth: '100%' }}
          >
            <option value="">Enfoque libre (sin tarea)</option>
            {d.tasks.filter((t) => !t.done).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <svg width={300} height={300} viewBox="0 0 300 300" style={{ maxWidth: '100%', height: 'auto' }}>
            <circle cx={150} cy={150} r={R} fill="none" stroke={C.line} strokeWidth={10} />
            <circle
              cx={150}
              cy={150}
              r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - Math.min(1, Math.max(0, progress)))}
              transform="rotate(-90 150 150)"
              style={{ transition: 'stroke-dashoffset .3s linear' }}
            />
            <text x={150} y={148} textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize={54} fontWeight={700} fill={C.text}>
              {fmt(displaySec)}
            </text>
            <text x={150} y={182} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize={14} fontWeight={700} fill={phase === 'break' ? C.green : C.muted} letterSpacing="1">
              {mode === 'stopwatch' ? 'CRONÓMETRO' : phase === 'work' ? 'ENFOQUE' : 'DESCANSO'}
            </text>
          </svg>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {!running ? (
              <button onClick={pomoStart} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 30px', borderRadius: '30px', background: 'linear-gradient(135deg,' + C.primary + ',#8B5CF6)', color: '#fff', fontWeight: 700, fontSize: '15px', boxShadow: '0 8px 20px ' + C.primaryGlow }}>
                <Icon name="play_arrow" size={20} color="#fff" fill />
                {midRun ? 'Reanudar' : 'Comenzar'}
              </button>
            ) : (
              <button onClick={pomoPause} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 30px', borderRadius: '30px', border: '2px solid ' + C.line2, color: C.text, fontWeight: 700, fontSize: '15px' }}>
                <Icon name="pause" size={20} color={C.text} />
                Pausar
              </button>
            )}
            <button onClick={pomoStopLog} title="Terminar y registrar" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid ' + C.line2, color: C.green, display: 'grid', placeItems: 'center' }}>
              <Icon name="stop" size={22} color={C.green} fill />
            </button>
            <button onClick={pomoReset} title="Reiniciar" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid ' + C.line2, color: C.muted, display: 'grid', placeItems: 'center' }}>
              <Icon name="restart_alt" size={22} color={C.muted} />
            </button>
          </div>

          {mode === 'pomo' ? (
            <div style={{ display: 'flex', gap: '16px', marginTop: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(
                [
                  ['Enfoque', 'workMin'],
                  ['Descanso', 'breakMin'],
                  ['Descanso largo', 'longBreakMin'],
                ] as const
              ).map(([lb, key]) => (
                <label key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.3px' }}>{lb}</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={settings[key]}
                    disabled={running}
                    onChange={(e) => updateSettings({ [key]: Math.min(180, Math.max(1, +e.target.value || 1)) })}
                    style={{ width: '64px', textAlign: 'center', padding: '7px', borderRadius: '9px', border: '1px solid ' + C.line2, background: C.card2, color: C.text, fontWeight: 700, outline: 'none' }}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </Card>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <StatTile icon="timer" label="Pomos de hoy" val={s.pomosToday} fg={C.primary} bg={C.primarySoft} />
            <StatTile icon="hourglass_bottom" label="Enfoque hoy" val={s.focusMinToday + ' m'} fg={C.green} bg={C.greenSoft} />
            <StatTile icon="workspace_premium" label="Total pomodoros" val={s.pomosTotal} fg={C.goldText} bg={C.goldSoft} />
            <StatTile icon="schedule" label="Enfoque total" val={Math.floor(s.focusMinTotal / 60) + 'h ' + (s.focusMinTotal % 60) + 'm'} fg={C.blue} bg={C.blueSoft} />
          </div>
          <SectionTitle title="Registro de enfoque" />
          {dates.length === 0 ? (
            <div style={{ color: C.faint, fontWeight: 600, fontSize: '13px', padding: '10px 0' }}>Aún no hay sesiones. ¡Empieza tu primer Pomodoro!</div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {dates.slice(0, 8).map((date) => (
                <div key={date}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: C.muted, marginBottom: '8px' }}>{humanDate(date)}</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {byDate[date].map((sn) => (
                      <div key={sn.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', background: C.card, border: '1px solid ' + C.line, borderRadius: '11px', padding: '10px 13px' }}>
                        <Icon name={sn.mode === 'pomo' ? 'timer' : 'timelapse'} size={18} color={C.primary} fill />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', color: C.faint, fontWeight: 600 }}>
                            {hhmm(sn.start)} – {hhmm(sn.end)}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sn.taskTitle || 'Enfoque libre'}</div>
                        </div>
                        <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '13px', color: C.muted }}>{sn.minutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
