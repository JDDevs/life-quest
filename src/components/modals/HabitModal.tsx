import { useStore } from '../../store'
import { Field, Icon, Overlay, ghostBtn, inp, primaryBtn, useC } from '../../ui'

const ICONS = ['block', 'money_off', 'no_food', 'bedtime_off', 'hourglass_disabled', 'mobile_off', 'smoking_rooms', 'sentiment_stressed', 'local_bar', 'fastfood']

export function HabitModal() {
  const C = useC()
  const f = useStore((s) => s.habitForm)
  const setHabitForm = useStore((s) => s.setHabitForm)
  const saveHabit = useStore((s) => s.saveHabit)
  const deleteHabit = useStore((s) => s.deleteHabit)
  if (!f) return null
  const set = (k: string, v: unknown) => setHabitForm({ ...f, [k]: v })
  const valid = f.name.trim().length > 0

  return (
    <Overlay onClose={() => setHabitForm(null)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>{f.id ? 'Editar hábito' : 'Hábito a evitar'}</h3>
        <button onClick={() => setHabitForm(null)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: '15px' }}>
        <Field label="¿Qué quieres evitar?">
          <input value={f.name} autoFocus placeholder="Ej: Comer azúcar de noche" onChange={(e) => set('name', e.target.value)} style={inp(C)} />
        </Field>
        <Field label="Vida que roba cada vez que lo haces">
          <input type="number" min={0} value={f.damage} onChange={(e) => set('damage', e.target.value)} style={{ ...inp(C), borderColor: C.danger + '55' }} />
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
                    border: '2px solid ' + (on ? C.danger : C.line2),
                    background: on ? C.dangerSoft : C.card,
                  }}
                >
                  <Icon name={ic} size={20} color={on ? C.danger : C.muted} fill={on} />
                </button>
              )
            })}
          </div>
        </Field>
        <div style={{ fontSize: '12px', color: C.faint, fontWeight: 600, lineHeight: 1.4 }}>
          No da culpa: solo registra con honestidad. Cuando caigas, tu avatar pierde algo de vida; puedes recuperarla cumpliendo metas y con brebajes.
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          {f.id ? (
            <button onClick={() => deleteHabit(f.id!)} style={{ ...ghostBtn(C), color: C.danger, borderColor: C.dangerSoft }}>
              <Icon name="delete" size={18} color={C.danger} />
              Eliminar
            </button>
          ) : null}
          <button onClick={() => valid && saveHabit(f)} disabled={!valid} style={{ ...primaryBtn(C), flex: 1, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
            <Icon name="check" size={19} color="#fff" />
            {f.id ? 'Guardar' : 'Crear hábito'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
