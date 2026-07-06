import { useStore } from '../../store'
import { Field, Icon, Overlay, ghostBtn, inp, primaryBtn, useC } from '../../ui'

export function RewardModal() {
  const C = useC()
  const f = useStore((s) => s.rewardForm)
  const setRewardForm = useStore((s) => s.setRewardForm)
  const saveReward = useStore((s) => s.saveReward)
  const deleteReward = useStore((s) => s.deleteReward)
  if (!f) return null
  const set = (k: string, v: unknown) => setRewardForm({ ...f, [k]: v })
  const pot = f.kind === 'potion'
  const icons = pot
    ? ['local_drink', 'science', 'auto_awesome', 'healing', 'medication', 'water_drop', 'spa', 'bolt']
    : ['redeem', 'cake', 'sports_esports', 'movie', 'restaurant', 'menu_book', 'shopping_bag', 'coffee', 'icecream', 'celebration', 'spa', 'music_note', 'flight', 'sports_soccer']
  const valid = f.name.trim().length > 0

  return (
    <Overlay onClose={() => setRewardForm(null)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>{(f.id ? 'Editar ' : 'Nuevo ') + (pot ? 'brebaje' : 'recompensa')}</h3>
        <button onClick={() => setRewardForm(null)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: '15px' }}>
        <Field label={pot ? 'Nombre del brebaje' : '¿Qué gusto te darás?'}>
          <input value={f.name} autoFocus placeholder={pot ? 'Ej: Poción revitalizante' : 'Ej: Comer un helado'} onChange={(e) => set('name', e.target.value)} style={inp(C)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Costo en monedas">
            <input type="number" min={0} value={f.cost} onChange={(e) => set('cost', e.target.value)} style={inp(C)} />
          </Field>
          {pot ? (
            <Field label="Vida que cura">
              <input type="number" min={1} value={f.heal} onChange={(e) => set('heal', e.target.value)} style={{ ...inp(C), borderColor: C.green + '55' }} />
            </Field>
          ) : (
            <Field label="Nivel para desbloquear">
              <input type="number" min={1} value={f.minLevel} onChange={(e) => set('minLevel', e.target.value)} style={inp(C)} />
            </Field>
          )}
        </div>
        <Field label="Ícono">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {icons.map((ic) => {
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
                    border: '2px solid ' + (on ? (pot ? C.green : C.gold) : C.line2),
                    background: on ? (pot ? C.greenSoft : C.goldSoft) : C.card,
                  }}
                >
                  <Icon name={ic} size={20} color={on ? (pot ? C.green : C.gold) : C.muted} fill={on} />
                </button>
              )
            })}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          {f.id ? (
            <button onClick={() => deleteReward(f.id!)} style={{ ...ghostBtn(C), color: C.danger, borderColor: C.dangerSoft }}>
              <Icon name="delete" size={18} color={C.danger} />
              Eliminar
            </button>
          ) : null}
          <button onClick={() => valid && saveReward(f)} disabled={!valid} style={{ ...primaryBtn(C), flex: 1, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
            <Icon name="check" size={19} color="#fff" />
            {f.id ? 'Guardar' : pot ? 'Crear brebaje' : 'Crear recompensa'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
