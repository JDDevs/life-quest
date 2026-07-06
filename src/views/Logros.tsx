import { ACH, METRIC_LABELS } from '../constants'
import { customValue, useStore } from '../store'
import type { CustomAch, Stats } from '../types'
import { Icon, SectionTitle, primaryBtn, useC } from '../ui'
import type { Palette } from '../types'

function AchCard({
  C,
  icon,
  name,
  desc,
  on,
  cur,
  tgt,
  onEdit,
}: {
  C: Palette
  icon: string
  name: string
  desc: string
  on: boolean
  cur: number
  tgt: number
  onEdit?: () => void
}) {
  const pct = Math.round((Math.min(cur, tgt) / tgt) * 100)
  return (
    <div
      style={{
        position: 'relative',
        background: on ? C.goldSoft : C.card,
        border: '1px solid ' + (on ? C.gold + '55' : C.line),
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        gap: '13px',
        opacity: on ? 1 : 0.92,
      }}
    >
      {onEdit ? (
        <button onClick={onEdit} style={{ position: 'absolute', right: '10px', top: '10px', color: C.faint }}>
          <Icon name="edit" size={15} color={C.faint} />
        </button>
      ) : null}
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '13px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: on ? 'linear-gradient(135deg,' + C.gold + ',#F5B93D)' : C.line,
          boxShadow: on ? '0 6px 16px rgba(233,153,10,.35)' : 'none',
        }}
      >
        <Icon name={on ? icon : 'lock'} size={24} color={on ? '#fff' : C.faint} fill />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14.5px', color: on ? C.goldText : C.text, paddingRight: onEdit ? '18px' : 0 }}>{name}</div>
        <div style={{ fontSize: '12px', color: C.muted, fontWeight: 500, marginBottom: '7px', lineHeight: 1.35 }}>{desc}</div>
        {on ? (
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.gold, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="check" size={14} color={C.gold} />
            Desbloqueado
          </div>
        ) : (
          <div>
            <div style={{ height: '6px', borderRadius: '4px', background: C.line, overflow: 'hidden' }}>
              <div style={{ width: pct + '%', height: '100%', background: C.faint, borderRadius: '4px' }} />
            </div>
            <div style={{ fontSize: '11px', color: C.faint, fontWeight: 700, marginTop: '4px' }}>
              {cur} / {tgt}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Logros({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const openAchForm = useStore((st) => st.openAchForm)
  const custom = d.customAch || []
  const unlocked = ACH.filter((a) => d.achievements[a.id]).length + custom.filter((c) => c.unlocked).length
  const total = ACH.length + custom.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <SectionTitle title="Logros" sub={unlocked + ' de ' + total + ' desbloqueados'} />
        <button onClick={() => openAchForm()} style={primaryBtn(C)}>
          <Icon name="add" size={19} color="#fff" />
          Nuevo logro
        </button>
      </div>
      <div style={{ height: '9px', borderRadius: '6px', background: C.line, overflow: 'hidden', margin: '6px 0 22px' }}>
        <div style={{ width: Math.round((unlocked / total) * 100) + '%', height: '100%', background: 'linear-gradient(90deg,' + C.gold + ',#F5B93D)', borderRadius: '6px', transition: 'width .5s' }} />
      </div>

      {custom.length ? (
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '12px' }}>
            Tus logros personalizados
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '13px' }}>
            {custom.map((c: CustomAch) => {
              const cur = customValue(c, s)
              return (
                <AchCard
                  key={c.id}
                  C={C}
                  icon={c.icon}
                  name={c.name}
                  desc={METRIC_LABELS[c.metric] + (c.metric === 'goal' ? ' · ' + c.goalTitle : '')}
                  on={!!c.unlocked}
                  cur={cur}
                  tgt={c.target}
                  onEdit={() => openAchForm(c)}
                />
              )
            })}
          </div>
        </div>
      ) : null}

      {custom.length ? (
        <div style={{ fontSize: '12px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '12px' }}>
          Logros del sistema
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '13px' }}>
        {ACH.map((a) => {
          const on = !!d.achievements[a.id]
          return <AchCard key={a.id} C={C} icon={a.icon} name={a.name} desc={a.desc} on={on} cur={Math.min(a.tgt(s), a.cur(s))} tgt={a.tgt(s)} />
        })}
      </div>
    </div>
  )
}
