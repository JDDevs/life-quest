import { useStore } from '../../store'
import type { AchMetric } from '../../types'
import { Field, Icon, Overlay, ghostBtn, inp, primaryBtn, useC } from '../../ui'

const ICONS = ['star', 'military_tech', 'emoji_events', 'local_fire_department', 'menu_book', 'fitness_center', 'self_improvement', 'chess', 'savings', 'bolt', 'verified', 'diamond']
const METRICS: [AchMetric, string][] = [
  ['goal', 'Completar una meta X veces'],
  ['streak', 'Días de racha (récord)'],
  ['level', 'Nivel alcanzado'],
  ['xp', 'XP total ganado'],
  ['chess', 'Partidas de ajedrez'],
]
const UNIT: Record<AchMetric, string> = { goal: 'veces', streak: 'días', level: 'nivel', xp: 'XP', chess: 'partidas' }

export function AchModal() {
  const C = useC()
  const f = useStore((s) => s.achForm)
  const d = useStore((s) => s.data)
  const setAchForm = useStore((s) => s.setAchForm)
  const saveCustomAch = useStore((s) => s.saveCustomAch)
  const deleteCustomAch = useStore((s) => s.deleteCustomAch)
  if (!f) return null
  const set = (k: string, v: unknown) => setAchForm({ ...f, [k]: v })
  const titles = [...new Set(Object.values(d.goals).flat().map((g) => (g.title || '').trim()).filter(Boolean))]
  const valid = f.name.trim().length > 0 && (f.metric !== 'goal' || (f.goalTitle || '').trim().length > 0)
  const unit = UNIT[f.metric]

  return (
    <Overlay onClose={() => setAchForm(null)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>{f.id ? 'Editar logro' : 'Nuevo logro'}</h3>
        <button onClick={() => setAchForm(null)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: '15px' }}>
        <Field label="Nombre del logro">
          <input value={f.name} autoFocus placeholder="Ej: 100 páginas leídas" onChange={(e) => set('name', e.target.value)} style={inp(C)} />
        </Field>
        <Field label="¿Qué debe medir?">
          <select value={f.metric} onChange={(e) => set('metric', e.target.value)} style={inp(C)}>
            {METRICS.map(([v, lb]) => (
              <option key={v} value={v}>
                {lb}
              </option>
            ))}
          </select>
        </Field>
        {f.metric === 'goal' ? (
          <Field label="¿Cuál meta?">
            {titles.length ? (
              <select value={f.goalTitle} onChange={(e) => set('goalTitle', e.target.value)} style={inp(C)}>
                <option value="">Elige una meta...</option>
                {titles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <input value={f.goalTitle} placeholder="Escribe el nombre exacto de la meta" onChange={(e) => set('goalTitle', e.target.value)} style={inp(C)} />
            )}
          </Field>
        ) : null}
        <Field label={'Meta a alcanzar (' + unit + ')'}>
          <input type="number" min={1} value={f.target} onChange={(e) => set('target', e.target.value)} style={inp(C)} />
        </Field>
        <Field label="Ícono">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {ICONS.map((ic) => {
              const on = f.icon === ic
              return (
                <button
                  key={ic}
                  onClick={() => set('icon', ic)}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '11px',
                    display: 'grid',
                    placeItems: 'center',
                    border: '2px solid ' + (on ? C.gold : C.line2),
                    background: on ? C.goldSoft : C.card,
                  }}
                >
                  <Icon name={ic} size={20} color={on ? C.gold : C.muted} fill={on} />
                </button>
              )
            })}
          </div>
        </Field>
        <div style={{ fontSize: '12px', color: C.faint, fontWeight: 600, lineHeight: 1.4 }}>
          Se desbloqueará solo cuando alcances la cifra. Las metas se cuentan por sus casillas/veces completadas sumando todas las semanas.
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          {f.id ? (
            <button onClick={() => deleteCustomAch(f.id!)} style={{ ...ghostBtn(C), color: C.danger, borderColor: C.dangerSoft }}>
              <Icon name="delete" size={18} color={C.danger} />
              Eliminar
            </button>
          ) : null}
          <button onClick={() => valid && saveCustomAch(f)} disabled={!valid} style={{ ...primaryBtn(C), flex: 1, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
            <Icon name="check" size={19} color="#fff" />
            {f.id ? 'Guardar' : 'Crear logro'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
