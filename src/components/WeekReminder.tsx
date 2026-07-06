import { useStore } from '../store'
import { mondayKey, parseKey, weekLabel } from '../lib/date'
import { Icon, ghostBtn, primaryBtn, useC } from '../ui'

export function WeekReminder() {
  const C = useC()
  const d = useStore((s) => s.data)
  const startNewWeek = useStore((s) => s.startNewWeek)
  if (parseKey(mondayKey(new Date())) <= parseKey(d.currentWeek)) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '13px',
        background: C.primarySoft,
        border: '1px solid ' + C.primary + '44',
        borderRadius: '16px',
        padding: '14px 18px',
        flexWrap: 'wrap',
      }}
    >
      <Icon name="calendar_month" size={24} color={C.primary} fill />
      <div style={{ flex: 1, minWidth: '170px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: C.primaryD }}>Empezó una nueva semana</div>
        <div style={{ fontSize: '12.5px', color: C.muted, fontWeight: 600 }}>
          Tu semana activa sigue siendo {weekLabel(d.currentWeek)}. Inicia la nueva para no perder el ritmo.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => startNewWeek(true)} style={ghostBtn(C)}>
          <Icon name="content_copy" size={17} color={C.primary} />
          Repetir metas
        </button>
        <button onClick={() => startNewWeek(false)} style={primaryBtn(C)}>
          <Icon name="add" size={18} color="#fff" />
          Nueva semana
        </button>
      </div>
    </div>
  )
}
