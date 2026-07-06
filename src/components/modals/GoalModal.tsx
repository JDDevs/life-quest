import { useState } from 'react'
import { AREAS } from '../../constants'
import { useStore } from '../../store'
import { aiEnabled, suggestGoalPoints } from '../../lib/ai'
import { Field, Icon, Overlay, ghostBtn, inp, primaryBtn, useC } from '../../ui'

export function GoalModal() {
  const C = useC()
  const f = useStore((s) => s.goalForm)
  const setGoalForm = useStore((s) => s.setGoalForm)
  const saveGoal = useStore((s) => s.saveGoal)
  const deleteGoal = useStore((s) => s.deleteGoal)
  const data = useStore((s) => s.data)
  const statsFn = useStore((s) => s.stats)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiWhy, setAiWhy] = useState<string | null>(null)
  if (!f) return null
  const set = (k: string, v: unknown) => setGoalForm({ ...f, [k]: v })
  const valid = f.title.trim().length > 0

  const suggestWithAI = async () => {
    if (!f.title.trim() || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    setAiWhy(null)
    try {
      const sug = await suggestGoalPoints(
        {
          areaId: f.areaId,
          title: f.title,
          type: f.type,
          priority: f.priority,
          targetDays: f.targetDays,
          target: f.target,
          dailyTarget: f.dailyTarget,
        },
        data,
        statsFn(),
      )
      // read the latest form so we don't clobber edits made while awaiting
      const cur = useStore.getState().goalForm
      if (!cur) return
      setGoalForm({
        ...cur,
        xp: sug.xp,
        coins: sug.coins,
        extraXp: sug.extraXp,
        extraCoins: sug.extraCoins,
        penalty: cur.priority === 'main' ? sug.penalty : cur.penalty,
      })
      setAiWhy(sug.rationale)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'No se pudo consultar la IA.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Overlay onClose={() => setGoalForm(null)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>{f.id ? 'Editar meta' : 'Nueva meta'}</h3>
        <button onClick={() => setGoalForm(null)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: '15px' }}>
        <Field label="Área">
          <select value={f.areaId} onChange={(e) => set('areaId', e.target.value)} style={inp(C)}>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción de la meta">
          <input value={f.title} autoFocus placeholder="Ej: Leer 20 páginas al día" onChange={(e) => set('title', e.target.value)} style={inp(C)} />
        </Field>
        <Field label="Tipo de meta">
          <div style={{ display: 'flex', gap: '7px' }}>
            {(
              [
                ['main', 'Principal', 'Resta vida si no la cumples'],
                ['side', 'Secundaria', 'Solo suma, nunca resta'],
              ] as const
            ).map(([v, lb, dsc]) => {
              const on = f.priority === v
              return (
                <button
                  key={v}
                  onClick={() => set('priority', v)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: '11px 13px',
                    borderRadius: '12px',
                    border: '2px solid ' + (on ? (v === 'main' ? C.danger : C.primary) : C.line2),
                    background: on ? (v === 'main' ? C.dangerSoft : C.primarySoft) : C.card,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: on ? (v === 'main' ? C.danger : C.primaryD) : C.text }}>{lb}</div>
                  <div style={{ fontSize: '11px', color: C.muted, fontWeight: 500, marginTop: '1px' }}>{dsc}</div>
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Frecuencia">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
            {(
              [
                ['daily', 'Diaria (sí/no)', 'Marcas cada día. Ej: dormir 10 p.m.'],
                ['dailyCount', 'Diaria (cantidad)', 'Cuentas por día. Ej: 3 capítulos'],
                ['count', 'Por cantidad', 'Total en la semana. Ej: ayunar 3 veces'],
                ['weekly', 'Una vez', 'Una sola vez a la semana'],
              ] as const
            ).map(([v, lb, hint]) => {
              const on = f.type === v
              return (
                <button
                  key={v}
                  onClick={() => set('type', v)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 11px',
                    borderRadius: '11px',
                    border: '2px solid ' + (on ? C.primary : C.line2),
                    background: on ? C.primarySoft : C.card,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '12.5px', color: on ? C.primaryD : C.text }}>{lb}</div>
                  <div style={{ fontSize: '10.5px', color: C.muted, fontWeight: 500, marginTop: '1px', lineHeight: 1.25 }}>{hint}</div>
                </button>
              )
            })}
          </div>
        </Field>
        {f.type === 'daily' ? (
          <Field label="¿Cuántos días a la semana? (meta)">
            <input type="number" min={1} max={7} value={f.targetDays} onChange={(e) => set('targetDays', e.target.value)} style={inp(C)} />
          </Field>
        ) : null}
        {f.type === 'dailyCount' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Veces por día (meta diaria)">
              <input type="number" min={1} value={f.dailyTarget} onChange={(e) => set('dailyTarget', e.target.value)} style={inp(C)} />
            </Field>
            <Field label="Días mínimos a la semana">
              <input type="number" min={1} max={7} value={f.targetDays} onChange={(e) => set('targetDays', e.target.value)} style={inp(C)} />
            </Field>
          </div>
        ) : null}
        {f.type === 'count' ? (
          <Field label="¿Cuántas veces en la semana? (meta)">
            <input type="number" min={1} value={f.target} onChange={(e) => set('target', e.target.value)} style={inp(C)} />
          </Field>
        ) : null}
        {aiEnabled() ? (
          <div>
            <button
              type="button"
              onClick={suggestWithAI}
              disabled={!valid || aiLoading}
              style={{
                ...ghostBtn(C),
                width: '100%',
                justifyContent: 'center',
                borderColor: C.primary + '55',
                color: C.primaryD,
                opacity: !valid || aiLoading ? 0.55 : 1,
              }}
            >
              <Icon name={aiLoading ? 'hourglass_top' : 'auto_awesome'} size={18} color={C.primary} fill />
              {aiLoading ? 'Calculando puntos…' : 'Sugerir XP y monedas con IA'}
            </button>
            {aiWhy ? (
              <div style={{ marginTop: '8px', fontSize: '12px', color: C.muted, fontWeight: 500, lineHeight: 1.4, display: 'flex', gap: '6px' }}>
                <Icon name="tips_and_updates" size={15} color={C.gold} fill />
                <span>{aiWhy}</span>
              </div>
            ) : null}
            {aiError ? (
              <div style={{ marginTop: '8px', fontSize: '12px', color: C.danger, fontWeight: 600 }}>{aiError}</div>
            ) : null}
          </div>
        ) : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label={'XP al completar' + (f.type !== 'weekly' ? ' (por vez)' : '')}>
            <input type="number" min={0} value={f.xp} onChange={(e) => set('xp', e.target.value)} style={{ ...inp(C), borderColor: C.primary + '55' }} />
          </Field>
          <Field label={'Monedas al completar' + (f.type !== 'weekly' ? ' (por vez)' : '')}>
            <input type="number" min={0} value={f.coins} onChange={(e) => set('coins', e.target.value)} style={{ ...inp(C), borderColor: C.gold + '77' }} />
          </Field>
        </div>
        {f.type === 'count' || f.type === 'dailyCount' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label={f.type === 'dailyCount' ? 'XP por cada vez extra (por día)' : 'XP por repetición extra'}>
              <input type="number" min={0} value={f.extraXp} onChange={(e) => set('extraXp', e.target.value)} style={{ ...inp(C), borderColor: C.primary + '55' }} />
            </Field>
            <Field label={f.type === 'dailyCount' ? 'Monedas por cada vez extra' : 'Monedas por repetición extra'}>
              <input type="number" min={0} value={f.extraCoins} onChange={(e) => set('extraCoins', e.target.value)} style={{ ...inp(C), borderColor: C.gold + '77' }} />
            </Field>
          </div>
        ) : null}
        {f.priority === 'main' ? (
          <Field label="Vida en riesgo si no la cumples (penalización)">
            <input type="number" min={0} value={f.penalty} onChange={(e) => set('penalty', e.target.value)} style={{ ...inp(C), borderColor: C.danger + '55' }} />
          </Field>
        ) : null}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          {f.id ? (
            <button onClick={() => deleteGoal(f.id!)} style={{ ...ghostBtn(C), color: C.danger, borderColor: C.dangerSoft }}>
              <Icon name="delete" size={18} color={C.danger} />
              Eliminar
            </button>
          ) : null}
          <button onClick={() => valid && saveGoal(f)} disabled={!valid} style={{ ...primaryBtn(C), flex: 1, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
            <Icon name="check" size={19} color="#fff" />
            {f.id ? 'Guardar cambios' : 'Crear meta'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
