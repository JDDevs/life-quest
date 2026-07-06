import { REVIEW_QS } from '../constants'
import { AREAS } from '../constants'
import { weekLabel } from '../lib/date'
import { goalUnits } from '../lib/goals'
import { useStore } from '../store'
import type { Stats } from '../types'
import { Card, Icon, SectionTitle, ghostBtn, primaryBtn, StatTile, useC } from '../ui'

export function Historial({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const histWeek = useStore((st) => st.histWeek)
  const setHistWeek = useStore((st) => st.setHistWeek)
  const startNewWeek = useStore((st) => st.startNewWeek)

  if (histWeek) return <WeekDetail wk={histWeek} s={s} />

  const wks = Object.keys(d.goals).sort().reverse()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <SectionTitle title="Historial semanal" sub="Revisa y compara tu progreso" />
        <div style={{ display: 'flex', gap: '9px' }}>
          <button onClick={() => startNewWeek(true)} style={ghostBtn(C)}>
            <Icon name="content_copy" size={18} color={C.primary} />
            Repetir metas
          </button>
          <button onClick={() => startNewWeek(false)} style={primaryBtn(C)}>
            <Icon name="add" size={19} color="#fff" />
            Nueva semana
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: '11px' }}>
        {wks.map((wk) => {
          const cur = wk === d.currentWeek
          const pct = s.weekPct[wk] || 0
          const xp = s.weekXP[wk] || 0
          const goals = d.goals[wk] || []
          const rev = d.reviews[wk] && d.reviews[wk].done
          return (
            <div
              key={wk}
              onClick={() => setHistWeek(wk)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                background: C.card,
                border: '1px solid ' + (cur ? C.primary + '55' : C.line),
                borderRadius: '15px',
                padding: '15px 18px',
                cursor: 'pointer',
                transition: '.15s',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'conic-gradient(' + C.primary + ' ' + pct * 3.6 + 'deg,' + C.line + ' 0)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: C.card, display: 'grid', placeItems: 'center', fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '13px', color: C.primaryD }}>
                  {pct}%
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '14.5px' }}>{weekLabel(wk)}</span>
                  {cur ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', background: C.primary, padding: '2px 7px', borderRadius: '6px' }}>ACTUAL</span>
                  ) : null}
                  {rev ? <Icon name="auto_stories" size={16} color={C.green} fill /> : null}
                </div>
                <div style={{ fontSize: '12.5px', color: C.muted, fontWeight: 600, marginTop: '2px' }}>{goals.length} metas · {xp} XP ganado</div>
              </div>
              <Icon name="chevron_right" size={22} color={C.faint} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekDetail({ wk, s }: { wk: string; s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const setHistWeek = useStore((st) => st.setHistWeek)
  const gotoWeek = useStore((st) => st.gotoWeek)
  const goals = d.goals[wk] || []
  const cur = wk === d.currentWeek
  const rev = d.reviews[wk]
  let lost = 0
  goals.forEach((g) => {
    const u = goalUnits(g)
    if (g.priority === 'main' && !u.complete) lost += g.penalty || 0
  })
  return (
    <div>
      <button onClick={() => setHistWeek(null)} style={{ ...ghostBtn(C), marginBottom: '16px' }}>
        <Icon name="arrow_back" size={18} color={C.primary} />
        Volver
      </button>
      <SectionTitle title={'Semana ' + weekLabel(wk)} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px', margin: '14px 0' }}>
        <StatTile icon="check_circle" label="Cumplimiento" val={(s.weekPct[wk] || 0) + '%'} fg={C.greenText} bg={C.greenSoft} />
        <StatTile icon="bolt" label="XP ganado" val={s.weekXP[wk] || 0} fg={C.primary} bg={C.primarySoft} />
        <StatTile icon="trending_down" label={cur ? 'XP en riesgo' : 'XP perdido'} val={'−' + lost} fg={C.danger} bg={C.dangerSoft} sub={cur ? 'Aún recuperable' : 'Metas principales'} />
      </div>
      {cur ? (
        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <button onClick={() => gotoWeek(wk)} style={primaryBtn(C)}>
            <Icon name="edit" size={18} color="#fff" />
            Editar esta semana
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '18px' }}>
          <button onClick={() => gotoWeek(wk)} style={ghostBtn(C)}>
            <Icon name="open_in_full" size={18} color={C.primary} />
            Abrir esta semana
          </button>
        </div>
      )}
      {goals.length ? (
        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
          {goals.map((g) => {
            const u = goalUnits(g)
            const a = AREAS.find((x) => x.id === g.areaId)!
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', background: C.card, border: '1px solid ' + C.line, borderRadius: '12px', padding: '11px 15px' }}>
                <Icon name={u.complete ? 'check_circle' : 'radio_button_unchecked'} size={19} color={u.complete ? a.color : C.faint} fill={u.complete} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: '13.5px', color: u.complete ? C.text : C.muted }}>{g.title}</span>
                <span style={{ fontSize: '12px', color: C.faint, fontWeight: 700 }}>
                  {g.type === 'daily' || g.type === 'dailyCount' ? u.done + '/' + u.total + 'd' : g.type === 'count' ? u.done + '/' + u.total : '—'}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ color: C.faint, fontWeight: 600 }}>Sin metas esta semana.</p>
      )}
      {rev && rev.done ? (
        <Card>
          <SectionTitle title="Reflexión de la semana" />
          <div style={{ display: 'grid', gap: '12px' }}>
            {REVIEW_QS.filter((q) => ((rev[q.k] as string) || '').trim()).map((q) => (
              <div key={q.k}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: C.primaryD, marginBottom: '3px' }}>{q.q}</div>
                <div style={{ fontSize: '13.5px', color: C.text, fontWeight: 500, lineHeight: 1.45 }}>{rev[q.k] as string}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
