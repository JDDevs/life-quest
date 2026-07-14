import { useStore } from '../../store'
import { Icon, Overlay, useC } from '../../ui'
import { PomoSessionRow } from '../PomoSessionRow'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function humanDate(key: string) {
  const [, m, dd] = key.split('-').map(Number)
  return dd + ' de ' + MONTHS[m - 1] + '.'
}

/** Full focus history across every day. The Pomodoro view shows only today; this
 *  modal is opened from its "Historial" button. */
export function PomoHistoryModal({ onClose }: { onClose: () => void }) {
  const C = useC()
  const sessions = useStore((st) => st.data.pomoSessions)

  const byDate: Record<string, typeof sessions> = {}
  sessions.forEach((sn) => {
    ;(byDate[sn.date] = byDate[sn.date] || []).push(sn)
  })
  const dates = Object.keys(byDate).sort().reverse()

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>Historial de enfoque</h3>
        <button onClick={onClose} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      {dates.length === 0 ? (
        <div style={{ color: C.faint, fontWeight: 600, fontSize: '13px', padding: '10px 0' }}>Aún no hay sesiones registradas.</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {dates.map((date) => (
            <div key={date}>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: C.muted, marginBottom: '8px' }}>{humanDate(date)}</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {byDate[date].map((sn) => (
                  <PomoSessionRow key={sn.id} sn={sn} bg={C.card2} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Overlay>
  )
}
