import { useState } from 'react'
import { TASK_PRIORITIES } from '../../constants'
import { useStore } from '../../store'
import type { TaskPriority } from '../../types'
import { Field, Icon, Overlay, ghostBtn, inp, primaryBtn, useC } from '../../ui'

export function TaskModal() {
  const C = useC()
  const f = useStore((s) => s.taskForm)
  const d = useStore((s) => s.data)
  const setTaskForm = useStore((s) => s.setTaskForm)
  const saveTask = useStore((s) => s.saveTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const [tagDraft, setTagDraft] = useState('')
  const [subDraft, setSubDraft] = useState('')
  if (!f) return null
  const set = (k: string, v: unknown) => setTaskForm({ ...f, [k]: v })
  const valid = f.title.trim().length > 0

  const addTag = () => {
    const t = tagDraft.trim()
    if (t && !f.tags.includes(t)) set('tags', [...f.tags, t])
    setTagDraft('')
  }
  const addSub = () => {
    const t = subDraft.trim()
    if (t) set('subtasks', [...f.subtasks, { id: 's' + Date.now() + Math.random().toString(36).slice(2, 4), title: t, done: false }])
    setSubDraft('')
  }

  return (
    <Overlay onClose={() => setTaskForm(null)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>{f.id ? 'Editar tarea' : 'Nueva tarea'}</h3>
        <button onClick={() => setTaskForm(null)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: '15px' }}>
        <Field label="Título">
          <input value={f.title} autoFocus placeholder="¿Qué hay que hacer?" onChange={(e) => set('title', e.target.value)} style={inp(C)} />
        </Field>
        <Field label="Notas (opcional)">
          <textarea rows={2} value={f.notes} placeholder="Detalles, contexto…" onChange={(e) => set('notes', e.target.value)} style={inp(C)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Lista">
            <select value={f.listId} onChange={(e) => set('listId', e.target.value)} style={inp(C)}>
              {d.lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha límite (opcional)">
            <input type="date" value={f.due || ''} onChange={(e) => set('due', e.target.value || null)} style={inp(C)} />
          </Field>
        </div>
        <Field label="Prioridad">
          <div style={{ display: 'flex', gap: '7px' }}>
            {TASK_PRIORITIES.map((p) => {
              const on = f.priority === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => set('priority', p.id as TaskPriority)}
                  style={{
                    flex: 1,
                    padding: '9px 4px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: '2px solid ' + (on ? p.color : C.line2),
                    background: on ? p.color + '1E' : C.card,
                    color: on ? p.color : C.muted,
                  }}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Pomodoros estimados">
          <input type="number" min={0} value={f.estPomos} onChange={(e) => set('estPomos', e.target.value)} style={inp(C)} />
        </Field>
        <Field label="Etiquetas">
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: f.tags.length ? '8px' : 0 }}>
              {f.tags.map((tag) => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: C.primaryD, background: C.primarySoft, padding: '4px 8px', borderRadius: '7px' }}>
                  {tag}
                  <button onClick={() => set('tags', f.tags.filter((x) => x !== tag))} style={{ color: C.primaryD, display: 'grid', placeItems: 'center' }}>
                    <Icon name="close" size={13} color={C.primaryD} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Añadir etiqueta…"
                style={inp(C)}
              />
              <button onClick={addTag} style={{ ...ghostBtn(C), padding: '0 14px' }}>
                <Icon name="add" size={18} color={C.primary} />
              </button>
            </div>
          </div>
        </Field>
        <Field label="Subtareas">
          <div>
            <div style={{ display: 'grid', gap: '6px', marginBottom: f.subtasks.length ? '8px' : 0 }}>
              {f.subtasks.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
                  <button
                    onClick={() => set('subtasks', f.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
                    style={{ width: '18px', height: '18px', borderRadius: '6px', border: '2px solid ' + (s.done ? C.green : C.line2), background: s.done ? C.green : 'transparent', display: 'grid', placeItems: 'center' }}
                  >
                    {s.done ? <Icon name="check" size={12} color="#fff" fill /> : null}
                  </button>
                  <span style={{ flex: 1, textDecoration: s.done ? 'line-through' : 'none', color: s.done ? C.faint : C.text }}>{s.title}</span>
                  <button onClick={() => set('subtasks', f.subtasks.filter((x) => x.id !== s.id))} style={{ color: C.faint }}>
                    <Icon name="close" size={15} color={C.faint} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <input
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSub()
                  }
                }}
                placeholder="Añadir subtarea…"
                style={inp(C)}
              />
              <button onClick={addSub} style={{ ...ghostBtn(C), padding: '0 14px' }}>
                <Icon name="add" size={18} color={C.primary} />
              </button>
            </div>
          </div>
        </Field>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          {f.id ? (
            <button onClick={() => deleteTask(f.id!)} style={{ ...ghostBtn(C), color: C.danger, borderColor: C.dangerSoft }}>
              <Icon name="delete" size={18} color={C.danger} />
              Eliminar
            </button>
          ) : null}
          <button onClick={() => valid && saveTask(f)} disabled={!valid} style={{ ...primaryBtn(C), flex: 1, justifyContent: 'center', opacity: valid ? 1 : 0.5 }}>
            <Icon name="check" size={19} color="#fff" />
            {f.id ? 'Guardar' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
