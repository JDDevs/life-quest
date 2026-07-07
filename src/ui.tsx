import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { useStore } from './store'
import { palette } from './theme'
import type { Palette } from './types'

export function useC(): Palette {
  const theme = useStore((s) => s.data.theme)
  return palette(theme)
}

export function Icon({
  name,
  size = 20,
  color,
  fill,
  style,
}: {
  name: string
  size?: number
  color?: string
  fill?: boolean
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: '"Material Symbols Outlined"',
        fontSize: size + 'px',
        lineHeight: 1,
        color: color || 'inherit',
        userSelect: 'none',
        fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        flexShrink: 0,
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export function Card({ children, extra }: { children: ReactNode; extra?: CSSProperties }) {
  const C = useC()
  return (
    <div
      style={{
        background: C.card,
        border: '1px solid ' + C.line,
        borderRadius: '18px',
        padding: '20px',
        ...extra,
      }}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  const C = useC()
  return (
    <div style={{ marginBottom: '14px' }}>
      <h2
        style={{
          margin: 0,
          fontFamily: '"Space Grotesk"',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-.3px',
        }}
      >
        {title}
      </h2>
      {sub ? (
        <p style={{ margin: '3px 0 0', color: C.muted, fontSize: '13.5px', fontWeight: 500 }}>{sub}</p>
      ) : null}
    </div>
  )
}

export function StatTile({
  icon,
  label,
  val,
  fg,
  bg,
  sub,
}: {
  icon: string
  label: string
  val: string | number
  fg: string
  bg: string
  sub?: string
}) {
  const C = useC()
  return (
    <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: '16px', padding: '15px 16px' }}>
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: bg,
          display: 'grid',
          placeItems: 'center',
          marginBottom: '9px',
        }}
      >
        <Icon name={icon} size={19} color={fg} fill />
      </div>
      <div style={{ fontFamily: '"Space Grotesk"', fontSize: '25px', fontWeight: 700, lineHeight: 1, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {val}
      </div>
      <div
        style={{
          fontSize: '11.5px',
          fontWeight: 700,
          color: C.muted,
          marginTop: '4px',
          textTransform: 'uppercase',
          letterSpacing: '.4px',
        }}
      >
        {label}
      </div>
      {sub ? (
        <div style={{ fontSize: '11.5px', color: C.faint, fontWeight: 600, marginTop: '1px' }}>{sub}</div>
      ) : null}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const C = useC()
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 700,
          color: C.muted,
          marginBottom: '6px',
          letterSpacing: '.2px',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

export function inp(C: Palette): CSSProperties {
  return {
    width: '100%',
    padding: '11px 13px',
    borderRadius: '11px',
    border: '1px solid ' + C.line2,
    background: C.card2,
    fontSize: '14px',
    fontWeight: 600,
    outline: 'none',
    color: C.text,
  }
}

export function primaryBtn(C: Palette): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '11px 17px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg,' + C.primary + ',#8B5CF6)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13.5px',
    boxShadow: '0 6px 18px ' + C.primaryGlow,
  }
}

export function ghostBtn(C: Palette): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '11px 15px',
    borderRadius: '12px',
    background: C.card,
    border: '1px solid ' + C.line2,
    color: C.text,
    fontWeight: 700,
    fontSize: '13.5px',
  }
}

export function stepBtn(C: Palette, dis?: boolean, bg?: string): CSSProperties {
  return {
    width: '42px',
    height: '42px',
    borderRadius: '11px',
    display: 'grid',
    placeItems: 'center',
    border: '1px solid ' + (bg ? bg : C.line2),
    background: bg || C.card,
    flexShrink: 0,
    opacity: dis ? 0.5 : 1,
  }
}

export interface CtxItem {
  label: string
  icon: string
  onClick: () => void
  danger?: boolean
}

/** Right-click context menu anchored at (x, y). Closes on outside click,
 *  right-click, scroll, resize or Escape. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: CtxItem[]; onClose: () => void }) {
  const C = useC()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onScroll = () => onClose()
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [onClose])

  const menuW = 220
  const menuH = items.length * 40 + 12
  const left = Math.max(8, Math.min(x, window.innerWidth - menuW - 8))
  const top = Math.max(8, Math.min(y, window.innerHeight - menuH - 8))

  return (
    <>
      <div
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault()
          onClose()
        }}
        style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
      />
      <div
        style={{
          position: 'fixed',
          left,
          top,
          zIndex: 9998,
          minWidth: menuW,
          background: C.card,
          border: '1px solid ' + C.line2,
          borderRadius: '12px',
          boxShadow: '0 12px 34px rgba(0,0,0,.28)',
          padding: '6px',
          animation: 'popin .12s ease',
        }}
      >
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => {
              it.onClick()
              onClose()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              textAlign: 'left',
              padding: '9px 10px',
              borderRadius: '9px',
              fontSize: '13.5px',
              fontWeight: 600,
              color: it.danger ? C.danger : C.text,
            }}
          >
            <Icon name={it.icon} size={17} color={it.danger ? C.danger : C.muted} />
            {it.label}
          </button>
        ))}
      </div>
    </>
  )
}

export function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const C = useC()
  // Clicking the backdrop no longer closes the modal (avoids losing work by a
  // stray click). Escape still closes it so you're never trapped.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30,27,51,.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        animation: 'fadein .15s ease',
      }}
    >
      <div
        style={{
          background: C.card,
          borderRadius: '22px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,.3)',
          animation: 'popin .2s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}
