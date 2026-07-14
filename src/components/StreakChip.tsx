import { useC } from '../ui'

/** A little flame. Warm gradient when burning, cold ("frozen") gradient when the
 *  streak is on ice. Same silhouette both ways so the metaphor reads instantly. */
function Flame({ frozen, size = 13 }: { frozen?: boolean; size?: number }) {
  const id = frozen ? 'lqFlameIce' : 'lqFlameFire'
  const stops = frozen ? ['#DCEBFF', '#7CC0FF', '#3B82F6'] : ['#FFD36A', '#FF922B', '#E5453D']
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="12" y1="1" x2="12" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </linearGradient>
      </defs>
      <path
        d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"
        fill={`url(#${id})`}
      />
    </svg>
  )
}

/** Minimal streak indicator: a number (+ optional unit) with a burning flame
 *  when the streak is live, or the frozen record with an iced flame when it
 *  isn't. Renders nothing when there's no history. */
export function StreakChip({ streak, best, unitLabel, title }: { streak: number; best: number; unitLabel?: string; title?: string }) {
  const C = useC()
  const active = streak > 0
  const n = active ? streak : best
  if (n <= 0) return null
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '11.5px',
        fontWeight: 800,
        fontFamily: '"Space Grotesk"',
        color: active ? C.goldText : C.blue,
        background: active ? C.goldSoft : C.blueSoft,
        padding: '2px 7px',
        borderRadius: '7px',
      }}
    >
      <Flame frozen={!active} />
      {n}
      {unitLabel ? <span style={{ fontSize: '9.5px', fontWeight: 700, marginLeft: '1px', opacity: 0.85 }}>{unitLabel}</span> : null}
    </span>
  )
}
