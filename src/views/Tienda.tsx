import { useStore } from '../store'
import type { ShopTab, Stats } from '../types'
import { Icon, SectionTitle, primaryBtn, useC } from '../ui'

export function Tienda({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const tab = useStore((st) => st.shopTab)
  const setShopTab = useStore((st) => st.setShopTab)
  const openRewardForm = useStore((st) => st.openRewardForm)

  const tabBtn = (id: ShopTab, label: string, ic: string) => {
    const on = tab === id
    return (
      <button
        key={id}
        onClick={() => setShopTab(id)}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          padding: '11px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '13.5px',
          color: on ? '#fff' : C.muted,
          background: on ? C.primary : 'transparent',
          boxShadow: on ? '0 5px 14px ' + C.primaryGlow : 'none',
        }}
      >
        <Icon name={ic} size={18} color={on ? '#fff' : C.faint} fill={on} />
        {label}
      </button>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <SectionTitle title="Tienda" sub="Gasta tus monedas en gustos y en curar a tu avatar" />
        <button onClick={() => openRewardForm(null, tab === 'potions' ? 'potion' : 'reward')} style={primaryBtn(C)}>
          <Icon name="add" size={19} color="#fff" />
          {tab === 'potions' ? 'Nuevo brebaje' : 'Nueva recompensa'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.goldSoft, border: '1px solid ' + C.gold + '44', borderRadius: '14px', padding: '13px 17px', marginBottom: '16px' }}>
        <Icon name="paid" size={22} color={C.goldText} fill />
        <span style={{ fontWeight: 700, color: C.goldText }}>Tienes </span>
        <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '20px', color: C.goldText }}>{s.coins.toLocaleString('es')}</span>
        <span style={{ fontWeight: 700, color: C.goldText }}> monedas</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '4px', background: C.card, border: '1px solid ' + C.line, borderRadius: '14px', marginBottom: '20px' }}>
        {tabBtn('rewards', 'Recompensas', 'storefront')}
        {tabBtn('potions', 'Botica de brebajes', 'local_pharmacy')}
      </div>
      {tab === 'potions' ? <Potions s={s} /> : <Rewards s={s} />}
      {d.claims && d.claims.length ? (
        <div style={{ marginTop: '26px' }}>
          <SectionTitle title="Historial de gastos" />
          <div style={{ display: 'grid', gap: '8px' }}>
            {d.claims
              .slice()
              .reverse()
              .slice(0, 12)
              .map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '11px', background: C.card, border: '1px solid ' + C.line, borderRadius: '12px', padding: '11px 15px' }}>
                  <Icon name={c.type === 'potion' ? 'local_drink' : 'redeem'} size={18} color={c.type === 'potion' ? C.green : C.gold} fill />
                  <span style={{ fontWeight: 600, fontSize: '13.5px', flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: '12px', color: C.faint, fontWeight: 600 }}>{c.date}</span>
                  <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, color: C.danger, fontSize: '13px' }}>−{c.cost}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Rewards({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const openRewardForm = useStore((st) => st.openRewardForm)
  const claimReward = useStore((st) => st.claimReward)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
      {d.rewards.map((r) => {
        const ml = r.minLevel || 1
        const locked = s.level < ml
        const can = !locked && s.coins >= r.cost
        return (
          <div key={r.id} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: '17px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', opacity: locked ? 0.7 : 1 }}>
            <button onClick={() => openRewardForm(r, 'reward')} style={{ position: 'absolute', right: '12px', top: '12px', color: C.faint }}>
              <Icon name="edit" size={17} color={C.faint} />
            </button>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: C.goldSoft, display: 'grid', placeItems: 'center' }}>
              <Icon name={r.icon || 'redeem'} size={26} color={C.gold} fill />
            </div>
            <div style={{ fontWeight: 700, fontSize: '15.5px', lineHeight: 1.25 }}>{r.name}</div>
            {ml > 1 ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: locked ? C.danger : C.muted }}>
                <Icon name={locked ? 'lock' : 'lock_open'} size={14} color={locked ? C.danger : C.muted} />
                {'Nivel ' + ml + (locked ? ' para desbloquear' : '')}
              </div>
            ) : null}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '18px', color: C.goldText }}>
                <Icon name="paid" size={18} color={C.gold} fill />
                {r.cost}
              </span>
              <button
                onClick={() => claimReward(r)}
                disabled={!can}
                style={{
                  padding: '9px 15px',
                  borderRadius: '11px',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: can ? '#fff' : C.faint,
                  background: can ? 'linear-gradient(135deg,' + C.gold + ',#F5B93D)' : C.line,
                  cursor: can ? 'pointer' : 'not-allowed',
                }}
              >
                {locked ? 'Bloqueado' : can ? 'Reclamar' : 'Faltan monedas'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Potions({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const openRewardForm = useStore((st) => st.openRewardForm)
  const buyPotion = useStore((st) => st.buyPotion)
  const full = s.hp >= s.maxHP
  return (
    <div>
      {full ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.greenSoft, border: '1px solid ' + C.green + '44', borderRadius: '13px', padding: '12px 16px', marginBottom: '16px' }}>
          <Icon name="favorite" size={20} color={C.green} fill />
          <span style={{ fontWeight: 600, fontSize: '13.5px', color: C.greenText }}>
            Tu avatar está con la vida al máximo ({s.hp}/{s.maxHP}). No necesitas brebajes por ahora.
          </span>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '14px' }}>
        {(d.potions || []).map((p) => {
          const can = !full && s.coins >= p.cost
          return (
            <div key={p.id} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: '17px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              <button onClick={() => openRewardForm(p, 'potion')} style={{ position: 'absolute', right: '12px', top: '12px', color: C.faint }}>
                <Icon name="edit" size={17} color={C.faint} />
              </button>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: C.greenSoft, display: 'grid', placeItems: 'center' }}>
                <Icon name={p.icon || 'local_drink'} size={26} color={C.green} fill />
              </div>
              <div style={{ fontWeight: 700, fontSize: '15.5px', lineHeight: 1.25 }}>{p.name}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 700, color: C.green }}>
                <Icon name="favorite" size={15} color={C.green} fill />
                {p.heal >= 9999 ? 'Cura total' : '+' + p.heal + ' de vida'}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '18px', color: C.goldText }}>
                  <Icon name="paid" size={18} color={C.gold} fill />
                  {p.cost}
                </span>
                <button
                  onClick={() => buyPotion(p)}
                  disabled={!can}
                  style={{
                    padding: '9px 15px',
                    borderRadius: '11px',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: can ? '#fff' : C.faint,
                    background: can ? 'linear-gradient(135deg,' + C.green + ',#3FC28E)' : C.line,
                    cursor: can ? 'pointer' : 'not-allowed',
                  }}
                >
                  {full ? 'Vida llena' : can ? 'Curar' : 'Faltan monedas'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
