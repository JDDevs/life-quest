import { useState } from 'react'
import { addDays, todayIdx } from '../lib/date'
import { useStore } from '../store'
import type { Stats } from '../types'
import { Card, Field, Icon, SectionTitle, inp, primaryBtn, useC } from '../ui'
import { AjedrezTutor } from './AjedrezTutor'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const RESULTS: [string, string][] = [
  ['', '—'],
  ['win', 'Victoria'],
  ['draw', 'Tablas'],
  ['loss', 'Derrota'],
]
const RESULT_LABEL: Record<string, string> = { win: 'Victoria', draw: 'Tablas', loss: 'Derrota' }

export function Ajedrez({ s }: { s: Stats }) {
  const C = useC()
  const [tab, setTab] = useState<'registro' | 'tutor'>('registro')
  const d = useStore((st) => st.data)
  const narrow = useStore((st) => st.narrow)
  const cd = useStore((st) => st.chessDraft)
  const setChessDraft = useStore((st) => st.setChessDraft)
  const setPlan = useStore((st) => st.setPlan)
  const addChessLog = useStore((st) => st.addChessLog)
  const delChessLog = useStore((st) => st.delChessLog)
  const ti = todayIdx()
  const wkStart = d.currentWeek
  const inWeek = (dt: string) => dt >= wkStart && dt <= addDays(wkStart, 6)
  const weekMin = (d.chess.logs || []).filter((l) => inWeek(l.date)).reduce((a, l) => a + (+l.minutes || 0), 0)
  const weekGames = (d.chess.logs || []).filter((l) => inWeek(l.date)).reduce((a, l) => a + (+l.games || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: '7px', marginBottom: '18px' }}>
        {(
          [
            ['registro', 'Registro', 'edit_calendar'],
            ['tutor', 'Tutor IA', 'school'],
          ] as const
        ).map(([v, lb, ic]) => {
          const on = tab === v
          return (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 15px',
                borderRadius: '11px',
                fontWeight: 700,
                fontSize: '13px',
                border: '2px solid ' + (on ? C.primary : C.line2),
                background: on ? C.primarySoft : C.card,
                color: on ? C.primaryD : C.muted,
              }}
            >
              <Icon name={ic} size={17} color={on ? C.primary : C.faint} fill={on} />
              {lb}
            </button>
          )
        })}
      </div>
      {tab === 'tutor' ? (
        <AjedrezTutor />
      ) : (
        <>
      <SectionTitle title="Estudio de ajedrez" sub="Plan semanal y registro diario de partidas" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', margin: '16px 0' }}>
        <StatMini icon="sports_esports" label="Partidas totales" val={s.chessGames} fg={C.blue} bg={C.blueSoft} sub="Registradas" />
        <StatMini icon="timer" label="Estudio total" val={Math.floor(s.chessMin / 60) + 'h ' + (s.chessMin % 60) + 'm'} fg={C.primary} bg={C.primarySoft} sub="Acumulado" />
        <StatMini icon="calendar_today" label="Esta semana" val={weekGames + ' part.'} fg={C.green} bg={C.greenSoft} sub={weekMin + ' min'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.1fr 1fr', gap: '18px' }}>
        <Card>
          <SectionTitle title="Plan semanal" sub="Toca para editar cada tema" />
          <div style={{ display: 'grid', gap: '8px' }}>
            {DAYS.map((dn, i) => {
              const today = i === ti
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '9px 11px',
                    borderRadius: '11px',
                    background: today ? C.primarySoft : 'transparent',
                    border: '1px solid ' + (today ? C.primary + '44' : 'transparent'),
                  }}
                >
                  <span style={{ width: '86px', fontWeight: 700, fontSize: '13px', color: today ? C.primaryD : C.muted }}>{dn}</span>
                  <input
                    value={d.chessPlan[i] || ''}
                    onChange={(e) => setPlan(i, e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 600, color: C.text, outline: 'none', borderBottom: '1px solid ' + C.line, padding: '3px 2px' }}
                  />
                  {today ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: C.primary, background: '#fff', padding: '3px 7px', borderRadius: '6px' }}>HOY</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Registrar hoy" sub={DAYS[ti] + ' · ' + (d.chessPlan[ti] || '')} />
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Partidas jugadas">
                <input type="number" min={0} value={cd.games} onChange={(e) => setChessDraft({ ...cd, games: e.target.value })} style={inp(C)} />
              </Field>
              <Field label="Minutos de estudio">
                <input type="number" min={0} value={cd.minutes} onChange={(e) => setChessDraft({ ...cd, minutes: e.target.value })} style={inp(C)} />
              </Field>
            </div>
            <Field label="Resultado (opcional)">
              <div style={{ display: 'flex', gap: '7px' }}>
                {RESULTS.map(([v, lb]) => {
                  const on = cd.result === v
                  return (
                    <button
                      key={v}
                      onClick={() => setChessDraft({ ...cd, result: v })}
                      style={{
                        flex: 1,
                        padding: '9px 4px',
                        borderRadius: '9px',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        border: '1px solid ' + (on ? C.primary : C.line2),
                        background: on ? C.primarySoft : C.card,
                        color: on ? C.primaryD : C.muted,
                      }}
                    >
                      {lb}
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="Notas / análisis (opcional)">
              <textarea rows={2} value={cd.notes} placeholder="Qué aprendí, errores..." onChange={(e) => setChessDraft({ ...cd, notes: e.target.value })} style={inp(C)} />
            </Field>
            <button onClick={() => addChessLog()} style={{ ...primaryBtn(C), justifyContent: 'center', width: '100%' }}>
              <Icon name="add" size={19} color="#fff" />
              Guardar registro (+XP)
            </button>
          </div>
        </Card>
      </div>
      {d.chess.logs && d.chess.logs.length ? (
        <div style={{ marginTop: '22px' }}>
          <SectionTitle title="Historial de partidas" />
          <div style={{ display: 'grid', gap: '8px' }}>
            {d.chess.logs.slice(0, 20).map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: C.card, border: '1px solid ' + C.line, borderRadius: '12px', padding: '11px 15px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.primarySoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="chess" size={18} color={C.primary} fill />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{l.theme || 'Ajedrez'}</div>
                  <div style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>
                    {l.date + ' · ' + (l.games || 0) + ' part. · ' + (l.minutes || 0) + ' min' + (l.result ? ' · ' + (RESULT_LABEL[l.result] || '') : '')}
                  </div>
                  {l.notes ? <div style={{ fontSize: '12px', color: C.faint, fontWeight: 500, marginTop: '2px', fontStyle: 'italic' }}>{l.notes}</div> : null}
                </div>
                <button onClick={() => delChessLog(l.id)} style={{ color: C.faint }}>
                  <Icon name="delete" size={17} color={C.faint} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
        </>
      )}
    </div>
  )
}

function StatMini({ icon, label, val, fg, bg, sub }: { icon: string; label: string; val: string | number; fg: string; bg: string; sub: string }) {
  const C = useC()
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: '16px', padding: '15px 16px' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: bg, display: 'grid', placeItems: 'center', marginBottom: '9px' }}>
        <Icon name={icon} size={19} color={fg} fill />
      </div>
      <div style={{ fontFamily: '"Space Grotesk"', fontSize: '25px', fontWeight: 700, lineHeight: 1, color: C.text }}>{val}</div>
      <div style={{ fontSize: '11.5px', fontWeight: 700, color: C.muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: '11.5px', color: C.faint, fontWeight: 600, marginTop: '1px' }}>{sub}</div>
    </div>
  )
}
