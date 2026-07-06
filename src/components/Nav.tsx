import { useStore } from '../store'
import type { View } from '../types'
import { Icon, useC } from '../ui'

const TABS: [View, string, string][] = [
  ['dash', 'Dashboard', 'space_dashboard'],
  ['metas', 'Metas', 'checklist'],
  ['tareas', 'Tareas', 'task_alt'],
  ['pomodoro', 'Pomodoro', 'timer'],
  ['tienda', 'Tienda', 'storefront'],
  ['logros', 'Logros', 'trophy'],
  ['ajedrez', 'Ajedrez', 'chess'],
  ['revision', 'Revisión', 'edit_note'],
  ['historial', 'Historial', 'history'],
]

export function Nav() {
  const C = useC()
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  return (
    <nav
      style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '4px',
        background: C.card,
        borderRadius: '16px',
        border: '1px solid ' + C.line,
        marginBottom: '22px',
        position: 'sticky',
        top: '10px',
        zIndex: 50,
        boxShadow: '0 4px 18px rgba(30,27,51,.05)',
      }}
    >
      {TABS.map(([id, label, ic]) => {
        const on = view === id
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '10px 15px',
              borderRadius: '11px',
              whiteSpace: 'nowrap',
              fontWeight: 700,
              fontSize: '13.5px',
              color: on ? '#fff' : C.muted,
              background: on ? C.primary : 'transparent',
              transition: '.15s',
              boxShadow: on ? '0 6px 16px ' + C.primaryGlow : 'none',
            }}
          >
            <Icon name={ic} size={19} color={on ? '#fff' : C.faint} fill={on} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
