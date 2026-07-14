import { useState } from 'react'
import { useStore } from '../store'
import type { PomoSession } from '../types'
import { Icon, useC } from '../ui'

function hhmm(ts: number) {
  const d = new Date(ts)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

/** A single focus-session block. The task can be reassigned inline in case a
 *  block was logged under the wrong task. Used by the Pomodoro view ("Registro
 *  de hoy") and the full history modal. */
export function PomoSessionRow({ sn, bg }: { sn: PomoSession; bg: string }) {
  const C = useC()
  const tasks = useStore((st) => st.data.tasks)
  const reassign = useStore((st) => st.reassignPomoSession)
  const [editing, setEditing] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '11px', background: bg, border: '1px solid ' + C.line, borderRadius: '11px', padding: '10px 13px' }}>
      <Icon name={sn.mode === 'pomo' ? 'timer' : 'timelapse'} size={18} color={C.primary} fill />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', color: C.faint, fontWeight: 600 }}>
          {hhmm(sn.start)} – {hhmm(sn.end)}
        </div>
        {editing ? (
          <select
            autoFocus
            value={sn.taskId || ''}
            onChange={(e) => {
              reassign(sn.id, e.target.value || null)
              setEditing(false)
            }}
            onBlur={() => setEditing(false)}
            style={{ marginTop: '3px', width: '100%', border: '1px solid ' + C.line2, background: C.card2, color: C.text, fontWeight: 700, fontSize: '13px', borderRadius: '7px', padding: '5px 7px', outline: 'none' }}
          >
            <option value="">Enfoque libre (sin tarea)</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.done ? '✓ ' : ''}
                {t.title}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sn.taskTitle || 'Enfoque libre'}</div>
        )}
      </div>
      {!editing ? (
        <button onClick={() => setEditing(true)} title="Reasignar tarea" style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', borderRadius: '7px', color: C.faint }}>
          <Icon name="edit" size={15} color={C.faint} />
        </button>
      ) : null}
      <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: '13px', color: C.muted }}>{sn.minutes}m</span>
    </div>
  )
}
