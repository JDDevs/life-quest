import { useState } from 'react'
import { TASK_PRIORITIES } from '../constants'
import { addDays, dateKey } from '../lib/date'
import { useStore, type TaskView } from '../store'
import type { Task, TaskList } from '../types'
import { Icon, inp, useC } from '../ui'

function isToday(t: Task, today: string) {
  return t.due != null && t.due <= today
}
function inNext7(t: Task, today: string, plus7: string) {
  return t.due != null && t.due >= today && t.due <= plus7
}

function matchesView(t: Task, view: TaskView, today: string, plus7: string): boolean {
  if (view === 'today') return isToday(t, today)
  if (view === 'next7') return inNext7(t, today, plus7)
  if (view === 'inbox') return t.listId === 'inbox'
  if (view === 'all') return true
  return t.listId === view
}

export function Tareas() {
  const C = useC()
  const narrow = useStore((s) => s.narrow)
  const d = useStore((s) => s.data)
  const taskView = useStore((s) => s.taskView)
  const setTaskView = useStore((s) => s.setTaskView)
  const openTaskForm = useStore((s) => s.openTaskForm)
  const quickAddTask = useStore((s) => s.quickAddTask)
  const [quick, setQuick] = useState('')
  const [showDone, setShowDone] = useState(false)

  const today = dateKey(new Date())
  const plus7 = addDays(today, 7)

  const countFor = (view: TaskView) => d.tasks.filter((t) => !t.done && matchesView(t, view, today, plus7)).length

  const visible = d.tasks.filter((t) => matchesView(t, taskView, today, plus7))
  const pending = visible.filter((t) => !t.done)
  const doneTasks = visible.filter((t) => t.done)

  const viewTitle =
    taskView === 'today'
      ? 'Hoy'
      : taskView === 'next7'
        ? 'Próximos 7 días'
        : taskView === 'inbox'
          ? 'Bandeja de entrada'
          : taskView === 'all'
            ? 'Todas'
            : d.lists.find((l) => l.id === taskView)?.name || 'Lista'

  const navItem = (view: TaskView, label: string, icon: string, color?: string) => {
    const on = taskView === view
    const n = countFor(view)
    return (
      <button
        key={String(view)}
        onClick={() => setTaskView(view)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: narrow ? 'auto' : '100%',
          whiteSpace: 'nowrap',
          padding: '9px 12px',
          borderRadius: '10px',
          fontWeight: 700,
          fontSize: '13.5px',
          color: on ? C.primaryD : C.text,
          background: on ? C.primarySoft : 'transparent',
        }}
      >
        <Icon name={icon} size={18} color={color || (on ? C.primary : C.muted)} fill={on} />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {n > 0 ? <span style={{ fontSize: '12px', fontWeight: 700, color: C.faint }}>{n}</span> : null}
      </button>
    )
  }

  const sidebar = (
    <div
      style={{
        display: 'flex',
        flexDirection: narrow ? 'row' : 'column',
        gap: narrow ? '6px' : '3px',
        overflowX: narrow ? 'auto' : 'visible',
        background: narrow ? 'transparent' : C.card,
        border: narrow ? 'none' : '1px solid ' + C.line,
        borderRadius: '16px',
        padding: narrow ? '0 0 6px' : '10px',
        alignSelf: 'start',
        position: narrow ? 'static' : 'sticky',
        top: '66px',
      }}
    >
      {navItem('today', 'Hoy', 'wb_sunny')}
      {navItem('next7', 'Próximos 7 días', 'date_range')}
      {navItem('inbox', 'Bandeja', 'inbox')}
      {navItem('all', 'Todas', 'apps')}
      {!narrow ? <div style={{ fontSize: '11px', fontWeight: 800, color: C.faint, textTransform: 'uppercase', letterSpacing: '.5px', margin: '10px 8px 4px' }}>Listas</div> : null}
      {d.lists.map((l: TaskList) => navItem(l.id, l.name, l.icon, l.color))}
      <AddListButton />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '230px 1fr', gap: '18px', alignItems: 'start' }}>
        {sidebar}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '22px', fontWeight: 700 }}>{viewTitle}</h2>
            <span style={{ fontSize: '13px', color: C.muted, fontWeight: 600 }}>{pending.length} pendientes</span>
          </div>

          {/* quick add */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              quickAddTask(quick)
              setQuick('')
            }}
            style={{ display: 'flex', gap: '9px', marginBottom: '18px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="add" size={20} color={C.faint} />
              </span>
              <input
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                placeholder="Agregar una tarea…"
                style={{ ...inp(C), paddingLeft: '40px' }}
              />
            </div>
            <button type="button" onClick={() => openTaskForm()} title="Más opciones" style={{ width: '44px', borderRadius: '11px', border: '1px solid ' + C.line2, background: C.card, display: 'grid', placeItems: 'center', color: C.muted }}>
              <Icon name="tune" size={20} color={C.muted} />
            </button>
          </form>

          {pending.length === 0 && doneTasks.length === 0 ? (
            <div style={{ background: C.card, border: '1px dashed ' + C.line2, borderRadius: '16px', padding: '40px 20px', textAlign: 'center', color: C.faint, fontWeight: 600 }}>
              <Icon name="task_alt" size={36} color={C.faint} />
              <div style={{ marginTop: '10px' }}>Sin tareas aquí. Agrega una arriba para empezar.</div>
            </div>
          ) : null}

          {TASK_PRIORITIES.map((pr) => {
            const list = pending.filter((t) => t.priority === pr.id)
            if (!list.length) return null
            return (
              <div key={pr.id} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 2px 9px' }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: pr.color }} />
                  <span style={{ fontWeight: 800, fontSize: '13px', color: C.text }}>{pr.name}</span>
                  <span style={{ fontSize: '12px', color: C.faint, fontWeight: 700 }}>{list.length}</span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {list.map((t) => (
                    <TaskRow key={t.id} t={t} />
                  ))}
                </div>
              </div>
            )
          })}

          {doneTasks.length ? (
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => setShowDone((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.muted, fontWeight: 700, fontSize: '13px', marginBottom: '9px' }}>
                <Icon name={showDone ? 'expand_more' : 'chevron_right'} size={18} color={C.muted} />
                Completadas ({doneTasks.length})
              </button>
              {showDone ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {doneTasks.map((t) => (
                    <TaskRow key={t.id} t={t} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function TaskRow({ t }: { t: Task }) {
  const C = useC()
  const d = useStore((s) => s.data)
  const toggleTask = useStore((s) => s.toggleTask)
  const openTaskForm = useStore((s) => s.openTaskForm)
  const setView = useStore((s) => s.setView)
  const setPomoTask = useStore((s) => s.setPomoTask)
  const list = d.lists.find((l) => l.id === t.listId)
  const pr = TASK_PRIORITIES.find((p) => p.id === t.priority)!
  const subDone = t.subtasks.filter((x) => x.done).length
  const today = dateKey(new Date())
  const overdue = t.due != null && t.due < today && !t.done

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        background: C.card,
        border: '1px solid ' + C.line,
        borderLeft: '3px solid ' + pr.color,
        borderRadius: '12px',
        padding: '12px 14px',
      }}
    >
      <button
        onClick={() => toggleTask(t.id)}
        title="Completar"
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '7px',
          border: '2px solid ' + (t.done ? C.green : pr.color),
          background: t.done ? C.green : 'transparent',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {t.done ? <Icon name="check" size={15} color="#fff" fill /> : null}
      </button>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => openTaskForm(t)}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: t.done ? C.faint : C.text, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
        {t.notes ? (
          <div style={{ fontSize: '12.5px', color: C.muted, fontWeight: 500, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', marginTop: t.tags.length || t.estPomos || t.due || t.subtasks.length ? '7px' : 0 }}>
          {list ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: list.color }}>
              <Icon name={list.icon} size={13} color={list.color} fill />
              {list.name}
            </span>
          ) : null}
          {t.tags.map((tag) => (
            <span key={tag} style={{ fontSize: '11px', fontWeight: 700, color: C.primaryD, background: C.primarySoft, padding: '2px 8px', borderRadius: '6px' }}>
              {tag}
            </span>
          ))}
          {t.linkedGoal ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: C.green }} title={'Aporta a: ' + t.linkedGoal}>
              <Icon name="flag" size={12} color={C.green} fill />
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.linkedGoal}</span>
            </span>
          ) : null}
          {t.estPomos > 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: C.muted, fontWeight: 600 }}>
              <Icon name="timer" size={13} color={C.muted} />
              {t.spentPomos}/{t.estPomos}
            </span>
          ) : null}
          {t.subtasks.length ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: C.muted, fontWeight: 600 }}>
              <Icon name="checklist" size={13} color={C.muted} />
              {subDone}/{t.subtasks.length}
            </span>
          ) : null}
          {t.due ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: overdue ? C.danger : C.muted, fontWeight: 700 }}>
              <Icon name="event" size={13} color={overdue ? C.danger : C.muted} />
              {t.due}
            </span>
          ) : null}
        </div>
      </div>
      <button
        onClick={() => {
          setPomoTask(t.id)
          setView('pomodoro')
        }}
        title="Enfocar (Pomodoro)"
        style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center', color: C.primary, flexShrink: 0 }}
      >
        <Icon name="play_circle" size={20} color={C.primary} />
      </button>
    </div>
  )
}

const LIST_PRESETS: [string, string][] = [
  ['#3B82F6', 'work'],
  ['#1DA574', 'person'],
  ['#E9990A', 'menu_book'],
  ['#EC4899', 'favorite'],
  ['#8B5CF6', 'code'],
  ['#14B8A6', 'savings'],
]

function AddListButton() {
  const C = useC()
  const narrow = useStore((s) => s.narrow)
  const addList = useStore((s) => s.addList)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [pick, setPick] = useState(0)

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', color: C.muted, fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}
      >
        <Icon name="add" size={18} color={C.muted} />
        {narrow ? 'Lista' : 'Nueva lista'}
      </button>
    )

  return (
    <div style={{ padding: '8px', minWidth: '190px' }}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la lista" style={{ ...inp(C), marginBottom: '8px' }} />
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {LIST_PRESETS.map(([color, icon], i) => (
          <button
            key={icon}
            onClick={() => setPick(i)}
            style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'grid', placeItems: 'center', border: '2px solid ' + (pick === i ? color : C.line2), background: pick === i ? color + '22' : C.card }}
          >
            <Icon name={icon} size={16} color={color} fill={pick === i} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => {
            addList(name, LIST_PRESETS[pick][1], LIST_PRESETS[pick][0])
            setName('')
            setOpen(false)
          }}
          style={{ flex: 1, padding: '8px', borderRadius: '9px', background: C.primary, color: '#fff', fontWeight: 700, fontSize: '13px' }}
        >
          Crear
        </button>
        <button onClick={() => setOpen(false)} style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid ' + C.line2, color: C.muted, fontWeight: 700, fontSize: '13px' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
