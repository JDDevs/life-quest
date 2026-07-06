import { AVATAR_STAGES } from '../../constants'
import { xpToReachLevel } from '../../lib/goals'
import { useStore } from '../../store'
import type { Stats } from '../../types'
import { Icon, Overlay, useC } from '../../ui'
import { Avatar } from '../Avatar'

function fakeStats(idx: number): Stats {
  return { hpPct: 100, avatar: { ...AVATAR_STAGES[idx], idx } } as Stats
}

export function AvatarModal() {
  const C = useC()
  const open = useStore((s) => s.avatarModal)
  const setOpen = useStore((s) => s.setAvatarModal)
  const stats = useStore((s) => s.stats)
  if (!open) return null
  const s = stats()
  const toNext = Math.max(0, s.need - s.into)
  const pct = Math.round((s.into / s.need) * 100)

  return (
    <Overlay onClose={() => setOpen(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>El camino del samurái</h3>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: C.muted, fontWeight: 600 }}>
            Tu avatar evoluciona a medida que ganas XP
          </p>
        </div>
        <button onClick={() => setOpen(false)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>

      {/* estado actual */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'linear-gradient(150deg,' + C.primary + ',#8B5CF6)',
          borderRadius: '16px',
          padding: '14px 16px',
          color: '#fff',
          marginBottom: '18px',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,.14)', borderRadius: '50%', padding: '4px', flexShrink: 0 }}>
          <Avatar s={s} size={64} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '16px' }}>
            {s.avatar.name} · Nivel {s.level}
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: 700, opacity: 0.85, marginBottom: '6px' }}>
            {s.rank.toUpperCase()} · {s.earnedXP.toLocaleString('es')} XP TOTAL
          </div>
          <div style={{ height: '9px', borderRadius: '6px', background: 'rgba(0,0,0,.22)', overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg,#FFE7A8,#FFC64B)', borderRadius: '6px' }} />
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: 700, opacity: 0.9, marginTop: '5px' }}>
            {s.into} / {s.need} · faltan {toNext.toLocaleString('es')} XP para Nivel {s.level + 1}
          </div>
        </div>
      </div>

      {/* todas las etapas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(122px,1fr))', gap: '12px' }}>
        {AVATAR_STAGES.map((st, i) => {
          const locked = s.level < st.min
          const current = s.avatar.idx === i
          const xpNeed = xpToReachLevel(st.min)
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                background: current ? C.primarySoft : C.card2,
                border: '2px solid ' + (current ? C.primary : C.line),
                borderRadius: '15px',
                padding: '12px 8px 10px',
                textAlign: 'center',
                opacity: locked ? 0.9 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', filter: locked ? 'grayscale(.7) opacity(.6)' : 'none' }}>
                <Avatar s={fakeStats(i)} size={78} />
              </div>
              {locked ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: C.card,
                    border: '1px solid ' + C.line2,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name="lock" size={13} color={C.faint} />
                </span>
              ) : current ? (
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#fff',
                    background: C.primary,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    letterSpacing: '.4px',
                  }}
                >
                  ACTUAL
                </span>
              ) : null}
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '6px', color: locked ? C.muted : C.text }}>{st.name}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: current ? C.primaryD : C.faint, letterSpacing: '.3px' }}>NIVEL {st.min}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: C.gold, marginTop: '3px' }}>
                <Icon name="bolt" size={12} color={C.gold} fill />
                {xpNeed.toLocaleString('es')} XP
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ margin: '16px 2px 0', fontSize: '12px', color: C.faint, fontWeight: 600, lineHeight: 1.45 }}>
        La XP mostrada es el total acumulado para alcanzar ese nivel. Subir de nivel cuesta cada vez más — cada evolución
        es un logro. Tu XP nunca baja.
      </p>
    </Overlay>
  )
}
