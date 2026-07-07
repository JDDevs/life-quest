import { useStore } from '../store'
import type { Stats } from '../types'
import { aiEnabled } from '../lib/ai'
import { Icon, useC } from '../ui'

export function Header({ s }: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const toggleTheme = useStore((st) => st.toggleTheme)
  const toggleMuted = useStore((st) => st.toggleMuted)
  const setSettings = useStore((st) => st.setSettings)
  const setAssistant = useStore((st) => st.setAssistant)

  const chip = (icon: string, label: string, val: string, bg: string, fg: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: bg, padding: '8px 13px', borderRadius: '13px', flexShrink: 0 }}>
      <Icon name={icon} size={19} color={fg} fill />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, minWidth: 0 }}>
        <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '16px', color: fg, whiteSpace: 'nowrap' }}>{val}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: fg, opacity: 0.7, letterSpacing: '.4px', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
    </div>
  )

  const iconBtn = (icon: string, title: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: C.card,
        border: '1px solid ' + C.line2,
        display: 'grid',
        placeItems: 'center',
        color: C.muted,
      }}
    >
      <Icon name={icon} size={20} />
    </button>
  )

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '22px 0 18px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
        <img
          src={import.meta.env.BASE_URL + 'icon.svg'}
          alt="Life Quest"
          width={46}
          height={46}
          style={{ borderRadius: '14px', boxShadow: '0 8px 20px ' + C.primaryGlow, display: 'block', flexShrink: 0 }}
        />
        <div>
          <div style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '19px', letterSpacing: '-.3px' }}>
            Life Quest
          </div>
          <div style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>
            Nivel {s.level} · {s.rank}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
        {chip('paid', 'Monedas', s.coins.toLocaleString('es'), C.goldSoft, C.goldText)}
        {chip('favorite', 'Vida', s.hp + '/' + s.maxHP, C.dangerSoft, C.danger)}
        {aiEnabled()
          ? (
              <button
                onClick={() => setAssistant(true)}
                title="Asistente IA"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg,' + C.primary + ',#8B5CF6)',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 6px 16px ' + C.primaryGlow,
                }}
              >
                <Icon name="auto_awesome" size={20} color="#fff" fill />
              </button>
            )
          : null}
        {iconBtn(d.theme === 'dark' ? 'light_mode' : 'dark_mode', 'Tema', toggleTheme)}
        {iconBtn('settings', 'Ajustes y respaldo', () => setSettings(true))}
        {iconBtn(d.muted ? 'volume_off' : 'volume_up', 'Sonido', toggleMuted)}
      </div>
    </header>
  )
}
