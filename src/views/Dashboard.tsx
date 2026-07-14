import { AREAS } from '../constants'
import { todayIdx, parseKey } from '../lib/date'
import { goalUnits } from '../lib/goals'
import { activeGoalStreaks, activeHabitStreaks } from '../lib/streaks'
import { useStore } from '../store'
import type { Stats } from '../types'
import { Avatar } from '../components/Avatar'
import { StreakChip } from '../components/StreakChip'
import { WeekReminder } from '../components/WeekReminder'
import { Card, Icon, SectionTitle, StatTile, inp, useC } from '../ui'

function col2(narrow: boolean, wide: string) {
  return narrow ? '1fr' : wide
}

export function Dashboard({ s }: { s: Stats }) {
  const C = useC()
  const narrow = useStore((st) => st.narrow)
  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <WeekReminder />
      <AvatarHero s={s} />
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '14px' }}>
        <StatTile icon="bolt" label="XP ganado" val={s.earnedXP.toLocaleString('es')} fg={C.primary} bg={C.primarySoft} sub="No baja nunca" />
        <StatTile icon="paid" label="Monedas" val={s.coins.toLocaleString('es')} fg={C.goldText} bg={C.goldSoft} sub="Para gastar" />
        <StatTile icon="local_fire_department" label="Racha" val={s.streak + ' días'} fg={C.danger} bg={C.dangerSoft} sub={'Mejor: ' + s.bestStreak + 'd'} />
        <StatTile icon="check_circle" label="Cumplimiento" val={s.curPct + '%'} fg={C.greenText} bg={C.greenSoft} sub="Esta semana" />
      </div>

      {s.curRiskXP > 0 && todayIdx() >= 5 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: C.dangerSoft,
            border: '1px solid ' + C.danger + '44',
            borderRadius: '16px',
            padding: '14px 18px',
          }}
        >
          <Icon name="warning" size={22} color={C.danger} fill />
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: C.danger }}>
            <b style={{ fontFamily: '"Space Grotesk"' }}>−{s.curRiskXP} ♥ de vida en riesgo</b>
            {' — metas principales sin completar esta semana. Tu avatar recibirá ese daño al cerrar la semana si no las cumples (las secundarias nunca dañan).'}
          </div>
        </div>
      ) : null}

      <StreaksCard />

      <div style={{ display: 'grid', gridTemplateColumns: col2(narrow, '1.35fr 1fr'), gap: '18px' }}>
        <FocusCard />
        <MoodCard />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: col2(narrow, '1.1fr 1fr'), gap: '18px' }}>
        <Card>
          <SectionTitle title="Tu personaje" sub="Atributos por área — crecen con cada acción" />
          <Radar s={s} />
        </Card>
        <Card>
          <SectionTitle title="Áreas de vida" />
          <div style={{ display: 'grid', gap: '11px' }}>
            {AREAS.map((a) => {
              const li = s.areaLvl[a.id]
              const p = Math.round((li.into / li.need) * 100)
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: a.color + '1F',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={a.icon} size={18} color={a.color} fill />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '3px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
                      <span style={{ color: a.color, fontFamily: '"Space Grotesk"', fontWeight: 700 }}>Nv {li.level}</span>
                    </div>
                    <div style={{ height: '7px', borderRadius: '5px', background: C.line, overflow: 'hidden' }}>
                      <div style={{ width: p + '%', height: '100%', background: a.color, borderRadius: '5px', transition: 'width .5s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Evolución semanal" sub="XP ganado por semana" />
        <WeekChart s={s} />
      </Card>
    </div>
  )
}

function StreaksCard() {
  const C = useC()
  const data = useStore((st) => st.data)
  const goals = activeGoalStreaks(data)
  const habits = activeHabitStreaks(data)
  if (!goals.length && !habits.length) return null
  return (
    <Card>
      <SectionTitle title="Rachas activas" sub="Constancia acumulada — no la rompas" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
        {goals.map(({ goal, streak, best, unit }) => {
          const a = AREAS.find((x) => x.id === goal.areaId)
          const color = a?.color || C.primary
          return (
            <div
              key={goal.id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '12px', background: C.card2, border: '1px solid ' + C.line }}
            >
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</span>
              <StreakChip streak={streak} best={best} unitLabel={unit === 'week' ? 'sem' : 'd'} title={`Racha: ${streak} ${unit === 'week' ? 'semanas' : 'días'} · récord ${best}`} />
            </div>
          )
        })}
        {habits.map(({ habit, streak, best }) => (
          <div
            key={habit.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '12px', background: C.card2, border: '1px solid ' + C.line }}
          >
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: C.danger, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</span>
            <StreakChip streak={streak} best={best} unitLabel="d" title={`${streak} días sin caer · récord ${best}`} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function AvatarHero({ s }: { s: Stats }) {
  const C = useC()
  const narrow = useStore((st) => st.narrow)
  const setView = useStore((st) => st.setView)
  const setShopTab = useStore((st) => st.setShopTab)
  const setAvatarModal = useStore((st) => st.setAvatarModal)
  const pctLvl = Math.round((s.into / s.need) * 100)
  const hpColor = s.hpPct < 25 ? '#FF6B6B' : s.hpPct < 50 ? '#FFC64B' : '#8BE8B8'
  return (
    <div
      style={{
        background: 'linear-gradient(150deg,' + C.primary + ',#7C5CFF 55%,#8B5CF6)',
        borderRadius: '20px',
        padding: narrow ? '20px' : '24px',
        color: '#fff',
        boxShadow: '0 16px 40px ' + C.primaryGlow,
        display: 'grid',
        gridTemplateColumns: col2(narrow, 'auto 1fr'),
        gap: narrow ? '16px' : '26px',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setAvatarModal(true)}
          title="Ver todas las etapas"
          style={{ background: 'rgba(255,255,255,.14)', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer', position: 'relative' }}
        >
          <Avatar s={s} size={narrow ? 118 : 148} />
          <span
            style={{
              position: 'absolute',
              right: '2px',
              bottom: '6px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#fff',
              color: C.primaryD,
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,.2)',
            }}
          >
            <Icon name="visibility" size={18} color={C.primaryD} fill />
          </span>
        </button>
        <div style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '16px' }}>{s.avatar.name}</div>
        <button
          onClick={() => setAvatarModal(true)}
          style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', opacity: 0.82, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          NIVEL {s.level} · {s.rank.toUpperCase()}
        </button>
      </div>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <Icon name="favorite" size={18} color="#FFB3B3" fill />
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Vida</span>
          <span style={{ marginLeft: 'auto', fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '14px' }}>
            {s.hp} / {s.maxHP}
          </span>
        </div>
        <div style={{ height: '15px', borderRadius: '8px', background: 'rgba(0,0,0,.22)', overflow: 'hidden', marginBottom: '15px' }}>
          <div style={{ width: s.hpPct + '%', height: '100%', background: hpColor, borderRadius: '8px', transition: 'width .5s' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <Icon name="bolt" size={18} color="#FFE08A" fill />
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Experiencia</span>
          <span style={{ marginLeft: 'auto', fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '14px' }}>
            {s.into} / {s.need}
          </span>
        </div>
        <div style={{ height: '12px', borderRadius: '7px', background: 'rgba(0,0,0,.22)', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ width: pctLvl + '%', height: '100%', background: 'linear-gradient(90deg,#FFE7A8,#FFC64B)', borderRadius: '7px', transition: 'width .5s' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.16)', padding: '8px 14px', borderRadius: '12px', flexShrink: 0, maxWidth: '100%' }}>
            <Icon name="paid" size={20} color="#FFE08A" fill />
            <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '18px', whiteSpace: 'nowrap' }}>{s.coins.toLocaleString('es')}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap' }}>monedas</span>
          </div>
          <button
            onClick={() => {
              setView('tienda')
              setShopTab('potions')
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fff',
              color: C.primaryD,
              fontWeight: 700,
              fontSize: '13px',
              padding: '10px 15px',
              borderRadius: '12px',
            }}
          >
            <Icon name="healing" size={18} color={C.primaryD} />
            Curar
          </button>
        </div>
      </div>
    </div>
  )
}

function FocusCard() {
  const C = useC()
  const d = useStore((st) => st.data)
  const curGoals = useStore((st) => st.curGoals)
  const clearFocus = useStore((st) => st.clearFocus)
  const today = new Date()
  const todayKey =
    today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  const goals = curGoals()
  const fg = d.focus && d.focus.date === todayKey ? goals.find((g) => g.id === d.focus!.goalId) : null
  return (
    <Card extra={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="center_focus_strong" size={20} color={C.primary} fill />
          <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '16px' }}>Foco de hoy</h3>
        </div>
        {fg ? (
          <button onClick={() => clearFocus()} style={{ fontSize: '12px', fontWeight: 700, color: C.faint }}>
            Cambiar
          </button>
        ) : null}
      </div>
      {fg ? <FocusGoal goalId={fg.id} /> : <FocusPicker />}
    </Card>
  )
}

function FocusGoal({ goalId }: { goalId: string }) {
  const C = useC()
  const curGoals = useStore((st) => st.curGoals)
  const toggleDay = useStore((st) => st.toggleDay)
  const incCount = useStore((st) => st.incCount)
  const incDayCount = useStore((st) => st.incDayCount)
  const toggleWeekly = useStore((st) => st.toggleWeekly)
  const g = curGoals().find((x) => x.id === goalId)
  if (!g) return null
  const a = AREAS.find((x) => x.id === g.areaId)!
  const ti = todayIdx()
  let doneToday: boolean
  let label: string
  let act: () => void
  if (g.type === 'daily') {
    doneToday = !!(g.checks || [])[ti]
    label = doneToday ? '¡Hecho hoy!' : 'Marcar hecho hoy'
    act = () => {
      if (!doneToday) toggleDay(g.id, ti)
    }
  } else if (g.type === 'dailyCount') {
    const dt = g.dailyTarget || 1
    const today = (g.counts || [])[ti] || 0
    doneToday = false
    label = 'Sumar hoy (' + today + '/' + dt + ')'
    act = () => incDayCount(g.id, ti, 1)
  } else if (g.type === 'count') {
    const u = goalUnits(g)
    doneToday = false
    label = 'Sumar una vez (' + u.done + '/' + u.total + ')'
    act = () => incCount(g.id, 1)
  } else {
    doneToday = !!g.done
    label = doneToday ? '¡Completada!' : 'Marcar completada'
    act = () => {
      if (!doneToday) toggleWeekly(g.id)
    }
  }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: a.color + '1F', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={a.icon} size={18} color={a.color} fill />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: a.color, textTransform: 'uppercase', letterSpacing: '.4px' }}>{a.name}</span>
      </div>
      <div style={{ fontFamily: '"Space Grotesk"', fontSize: '19px', fontWeight: 700, lineHeight: 1.2, marginBottom: '14px', flex: 1 }}>{g.title}</div>
      <button
        onClick={act}
        disabled={doneToday}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '13px',
          borderRadius: '13px',
          fontWeight: 700,
          fontSize: '14.5px',
          color: '#fff',
          cursor: doneToday ? 'default' : 'pointer',
          background: doneToday ? C.green : 'linear-gradient(135deg,' + a.color + ',' + a.color + 'cc)',
          opacity: doneToday ? 0.9 : 1,
          boxShadow: doneToday ? 'none' : '0 6px 16px ' + a.color + '40',
        }}
      >
        <Icon name={doneToday ? 'check_circle' : 'bolt'} size={20} color="#fff" fill />
        {label}
      </button>
    </div>
  )
}

function FocusPicker() {
  const C = useC()
  const curGoals = useStore((st) => st.curGoals)
  const setFocus = useStore((st) => st.setFocus)
  const goals = curGoals()
  if (!goals.length)
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: C.faint, fontWeight: 600, fontSize: '13px', textAlign: 'center', padding: '10px' }}>
        Crea metas para elegir tu foco del día.
      </div>
    )
  return (
    <div style={{ flex: 1 }}>
      <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: C.muted, fontWeight: 600 }}>Elige UNA meta como prioridad para hoy:</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', maxHeight: '150px', overflowY: 'auto' }}>
        {goals.map((g) => {
          const a = AREAS.find((x) => x.id === g.areaId)!
          return (
            <button
              key={g.id}
              onClick={() => setFocus(g.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 11px',
                borderRadius: '10px',
                border: '1px solid ' + C.line2,
                background: C.card2,
                fontWeight: 600,
                fontSize: '12.5px',
                color: C.text,
                maxWidth: '100%',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>{g.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const MOODS: [string, string, string][] = [
  ['sentiment_very_dissatisfied', '#E5615F', 'Mal'],
  ['sentiment_dissatisfied', '#EE9A3B', 'Bajo'],
  ['sentiment_neutral', '#C9A227', 'Normal'],
  ['sentiment_satisfied', '#5AA95F', 'Bien'],
  ['sentiment_very_satisfied', '#1DA574', 'Genial'],
]

function MoodCard() {
  const C = useC()
  const d = useStore((st) => st.data)
  const setMood = useStore((st) => st.setMood)
  const setNote = useStore((st) => st.setNote)
  const today = new Date()
  const k = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  const dn = d.dailyNotes[k] || {}
  return (
    <Card extra={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Icon name="mood" size={20} color={C.primary} fill />
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '16px' }}>¿Cómo va tu día?</h3>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginBottom: '12px' }}>
        {MOODS.map(([ic, col, lb]) => {
          const on = dn.mood === ic
          return (
            <button
              key={ic}
              onClick={() => setMood(ic)}
              title={lb}
              style={{
                flex: 1,
                aspectRatio: '1',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                border: '2px solid ' + (on ? col : C.line2),
                background: on ? col + '22' : C.card2,
                transition: '.15s',
              }}
            >
              <Icon name={ic} size={26} color={on ? col : C.faint} fill={on} />
            </button>
          )
        })}
      </div>
      <textarea
        rows={2}
        value={dn.note || ''}
        placeholder="Una nota rápida de hoy (opcional)..."
        onChange={(e) => setNote(e.target.value)}
        style={{ ...inp(C), width: '100%' }}
      />
    </Card>
  )
}

function Radar({ s }: { s: Stats }) {
  const C = useC()
  const cx = 155
  const cy = 150
  const R = 112
  const N = 8
  const maxLvl = Math.max(3, s.maxAreaLvl)
  const pt = (i: number, r: number): [number, number] => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]
  }
  const data = AREAS.map((a, i) => pt(i, R * Math.min(1, s.areaLvl[a.id].level / maxLvl)))
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 310 300" style={{ overflow: 'visible', width: '100%', maxWidth: '300px', height: 'auto' }}>
        {[0.34, 0.67, 1].map((f, ri) => (
          <polygon
            key={'r' + ri}
            points={AREAS.map((_, i) => pt(i, R * f).join(',')).join(' ')}
            fill="none"
            stroke={C.line2}
            strokeWidth={1}
          />
        ))}
        {AREAS.map((_, i) => {
          const [x, y] = pt(i, R)
          return <line key={'a' + i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line2} strokeWidth={1} />
        })}
        <polygon points={data.map((p) => p.join(',')).join(' ')} fill={C.primary + '2E'} stroke={C.primary} strokeWidth={2.5} strokeLinejoin="round" />
        {data.map((p, i) => (
          <circle key={'d' + i} cx={p[0]} cy={p[1]} r={3.5} fill={AREAS[i].color} />
        ))}
        {AREAS.map((a, i) => {
          const [x, y] = pt(i, R + 18)
          return <circle key={'l' + i} cx={x} cy={y} r={11} fill={a.color + '22'} stroke={a.color} strokeWidth={1.5} />
        })}
        {AREAS.map((a, i) => {
          const [x, y] = pt(i, R + 18)
          return (
            <foreignObject key={'li' + i} x={x - 9} y={y - 9} width={18} height={18}>
              <div style={{ display: 'grid', placeItems: 'center', width: '18px', height: '18px' }}>
                <Icon name={a.icon} size={13} color={a.color} fill />
              </div>
            </foreignObject>
          )
        })}
      </svg>
    </div>
  )
}

function WeekChart({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const wks = Object.keys(d.goals).sort().slice(-8)
  const max = Math.max(1, ...wks.map((w) => s.weekXP[w] || 0))
  if (!wks.length || max <= 1)
    return (
      <div style={{ color: C.faint, fontSize: '13px', fontWeight: 600, padding: '20px 0', textAlign: 'center' }}>
        Aún no hay datos. ¡Completa metas para ver tu evolución!
      </div>
    )
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', padding: '8px 0' }}>
      {wks.map((w) => {
        const v = s.weekXP[w] || 0
        const hh = Math.max(4, Math.round((v / max) * 130))
        const cur = w === d.currentWeek
        return (
          <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontFamily: '"Space Grotesk"', fontSize: '12px', fontWeight: 700, color: cur ? C.primary : C.muted }}>{v}</div>
            <div
              style={{
                width: '100%',
                maxWidth: '46px',
                height: hh + 'px',
                borderRadius: '8px 8px 4px 4px',
                background: cur ? 'linear-gradient(180deg,' + C.primary + ',#8B5CF6)' : C.primarySoft,
                transition: 'height .5s',
              }}
            />
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: C.faint }}>
              {parseKey(w).getDate()}/{parseKey(w).getMonth() + 1}
            </div>
          </div>
        )
      })}
    </div>
  )
}
