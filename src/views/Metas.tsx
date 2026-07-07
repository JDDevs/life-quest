import { useState, type CSSProperties, type ReactNode } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AREAS, type Area } from '../constants'
import { weekLabel } from '../lib/date'
import { goalUnits } from '../lib/goals'
import { useStore } from '../store'
import type { Goal, Stats } from '../types'
import { WeekReminder } from '../components/WeekReminder'
import { Card, Icon, SectionTitle, ghostBtn, primaryBtn, stepBtn, useC } from '../ui'

const COLLAPSE_KEY = 'metas_collapsed'

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function Metas(_props: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const curGoals = useStore((st) => st.curGoals)
  const setView = useStore((st) => st.setView)
  const openGoalForm = useStore((st) => st.openGoalForm)
  const importSuggested = useStore((st) => st.importSuggested)
  const reorderGoal = useStore((st) => st.reorderGoal)
  const useGoalTemplate = useStore((st) => st.useGoalTemplate)
  const deleteGoalTemplate = useStore((st) => st.deleteGoalTemplate)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const goals = curGoals()
  const goalTemplates = d.goalTemplates || []
  const [showTpl, setShowTpl] = useState(false)

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed)
  const persist = (next: Record<string, boolean>) => {
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  const toggleArea = (id: string) => persist({ ...collapsed, [id]: !collapsed[id] })
  const areasWithGoals = AREAS.filter((a) => goals.some((g) => g.areaId === a.id))
  const allCollapsed = areasWithGoals.length > 0 && areasWithGoals.every((a) => collapsed[a.id])
  const toggleAll = () => {
    const next = { ...collapsed }
    areasWithGoals.forEach((a) => (next[a.id] = !allCollapsed))
    persist(next)
  }

  return (
    <div>
      <ReminderRow />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <SectionTitle title="Metas de la semana" sub={weekLabel(d.currentWeek)} />
        </div>
        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          {areasWithGoals.length > 1 ? (
            <button onClick={toggleAll} style={ghostBtn(C)} title={allCollapsed ? 'Expandir todas' : 'Colapsar todas'}>
              <Icon name={allCollapsed ? 'unfold_more' : 'unfold_less'} size={18} color={C.muted} />
              {allCollapsed ? 'Expandir' : 'Colapsar'}
            </button>
          ) : null}
          <button onClick={() => setView('historial')} style={ghostBtn(C)}>
            <Icon name="history" size={18} color={C.muted} />
            Semanas
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowTpl((v) => !v)} style={{ ...ghostBtn(C), color: showTpl ? C.primaryD : C.text, borderColor: showTpl ? C.primary + '55' : C.line2 }}>
              <Icon name="bookmarks" size={18} color={showTpl ? C.primary : C.muted} fill={showTpl} />
              Plantillas
            </button>
            {showTpl ? (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  zIndex: 60,
                  width: '300px',
                  maxWidth: '80vw',
                  background: C.card,
                  border: '1px solid ' + C.line2,
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,.18)',
                  padding: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: C.faint, textTransform: 'uppercase', letterSpacing: '.5px', padding: '6px 8px 4px' }}>
                  Plantillas de metas
                </div>
                {goalTemplates.length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: C.faint, fontWeight: 600, padding: '6px 8px 8px', lineHeight: 1.4 }}>
                    Aún no tienes plantillas. Guarda una desde el editor de metas (botón "Guardar como plantilla").
                  </div>
                ) : (
                  goalTemplates.map((tpl) => {
                    const area = AREAS.find((x) => x.id === tpl.areaId)
                    return (
                      <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '9px' }}>
                        <button
                          onClick={() => {
                            useGoalTemplate(tpl.id)
                            setShowTpl(false)
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0, textAlign: 'left' }}
                        >
                          <span style={{ width: '24px', height: '24px', borderRadius: '7px', background: (area?.color || C.primary) + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Icon name={area?.icon || 'flag'} size={14} color={area?.color || C.primary} fill />
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</span>
                            <span style={{ display: 'block', fontSize: '11px', color: C.faint, fontWeight: 600 }}>
                              {area?.name} · +{tpl.xp} XP
                            </span>
                          </span>
                        </button>
                        <button
                          onClick={() => deleteGoalTemplate(tpl.id)}
                          title="Eliminar plantilla"
                          style={{ color: C.faint, display: 'grid', placeItems: 'center', width: '26px', height: '26px', flexShrink: 0 }}
                        >
                          <Icon name="delete" size={15} color={C.faint} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>
          <button onClick={() => openGoalForm()} style={primaryBtn(C)}>
            <Icon name="add" size={19} color="#fff" />
            Nueva meta
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <EmptyMetas onCreate={() => openGoalForm()} onImport={importSuggested} />
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {AREAS.map((a) => {
            const list = goals.filter((g) => g.areaId === a.id)
            if (!list.length) return null
            const agg = list.reduce(
              (acc, g) => {
                const u = goalUnits(g)
                acc.done += Math.min(u.done, u.total)
                acc.total += u.total
                if (u.complete) acc.doneGoals += 1
                return acc
              },
              { done: 0, total: 0, doneGoals: 0 },
            )
            const pct = agg.total > 0 ? Math.round((agg.done / agg.total) * 100) : 0
            const isCollapsed = !!collapsed[a.id]
            const complete = pct >= 100
            return (
              <div key={a.id} style={{ border: '1px solid ' + C.line, borderRadius: '14px', background: C.card, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleArea(a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '11px', width: '100%', padding: '12px 14px', textAlign: 'left', background: 'transparent' }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: a.color + '1F', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={a.icon} size={17} color={a.color} fill />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontFamily: '"Space Grotesk"', fontWeight: 700 }}>{a.name}</h3>
                      <span style={{ fontSize: '11.5px', color: C.faint, fontWeight: 700 }}>
                        {agg.doneGoals}/{list.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ flex: 1, height: '7px', borderRadius: '5px', background: C.line, overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: pct + '%', height: '100%', background: complete ? C.green : a.color, borderRadius: '5px', transition: 'width .35s' }} />
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: complete ? C.green : a.color, fontFamily: '"Space Grotesk"', minWidth: '38px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                  <Icon name={isCollapsed ? 'expand_more' : 'expand_less'} size={22} color={C.faint} />
                </button>
                {!isCollapsed ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (over && active.id !== over.id) reorderGoal(String(active.id), String(over.id))
                    }}
                  >
                    <SortableContext items={list.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                      <div style={{ display: 'grid', gap: '10px', padding: '0 12px 12px' }}>
                        {list.map((g) => (
                          <SortableGoalRow key={g.id} g={g} a={a} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
      <BadHabits />
    </div>
  )
}

function ReminderRow() {
  const d = useStore((st) => st.data)
  // Only render wrapper margin when reminder is active
  const show = (() => {
    // mirror WeekReminder condition without duplicating parse — cheap check
    return d.currentWeek < mondayNow()
  })()
  if (!show) return null
  return (
    <div style={{ marginBottom: '18px' }}>
      <WeekReminder />
    </div>
  )
}

function mondayNow(): string {
  const dt = new Date()
  const day = (dt.getDay() + 6) % 7
  dt.setDate(dt.getDate() - day)
  dt.setHours(0, 0, 0, 0)
  return (
    dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
  )
}

function EmptyMetas({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  const C = useC()
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '22px 10px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: C.primarySoft, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <Icon name="rocket_launch" size={32} color={C.primary} fill />
        </div>
        <h3 style={{ margin: '0 0 6px', fontFamily: '"Space Grotesk"', fontSize: '20px' }}>Empieza tu semana</h3>
        <p style={{ margin: '0 auto 20px', maxWidth: '420px', color: C.muted, fontSize: '14px', fontWeight: 500, lineHeight: 1.5 }}>
          Crea tus metas por área. Marca cada una como principal (resta XP si no la cumples) o secundaria (solo suma). Tú
          defines los puntos.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onCreate} style={primaryBtn(C)}>
            <Icon name="add" size={19} color="#fff" />
            Crear meta
          </button>
          <button onClick={onImport} style={ghostBtn(C)}>
            <Icon name="download" size={18} color={C.primary} />
            Cargar mis metas del PDF
          </button>
        </div>
      </div>
    </Card>
  )
}

function SortableGoalRow({ g, a }: { g: Goal; a: Area }) {
  const C = useC()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: g.id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
  }
  const handle = (
    <button
      {...attributes}
      {...listeners}
      title="Arrastrar para reordenar"
      style={{ cursor: 'grab', color: C.faint, touchAction: 'none', display: 'grid', placeItems: 'center', width: '24px', height: '30px', flexShrink: 0 }}
    >
      <Icon name="drag_indicator" size={18} color={C.faint} />
    </button>
  )
  return (
    <div ref={setNodeRef} style={style}>
      <GoalRow g={g} a={a} handle={handle} />
    </div>
  )
}

function GoalRow({ g, a, handle }: { g: Goal; a: Area; handle?: ReactNode }) {
  const C = useC()
  const openGoalForm = useStore((st) => st.openGoalForm)
  const setView = useStore((st) => st.setView)
  const tasks = useStore((st) => st.data.tasks)
  const u = goalUnits(g)
  const done = u.complete
  const main = g.priority === 'main'
  const linked = tasks.filter((t) => t.linkedGoal === g.title)
  const linkedDone = linked.filter((t) => t.done).length
  const linkPct = linked.length ? Math.round((linkedDone / linked.length) * 100) : 0
  return (
    <div
      style={{
        background: C.card,
        border: '1px solid ' + (done ? a.color + '55' : C.line),
        borderRadius: '15px',
        padding: '14px 15px',
        transition: '.2s',
        boxShadow: done ? '0 4px 14px ' + a.color + '18' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {handle}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
            <span style={{ fontWeight: 700, fontSize: '14.5px', color: done ? C.muted : C.text, textDecoration: done ? 'line-through' : 'none' }}>
              {g.title}
            </span>
            {main ? (
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.5px', color: C.danger, background: C.dangerSoft, padding: '2px 7px', borderRadius: '6px' }}>
                PRINCIPAL
              </span>
            ) : (
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.5px', color: C.muted, background: C.line, padding: '2px 7px', borderRadius: '6px' }}>
                SECUNDARIA
              </span>
            )}
            {done ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: a.color }}>
                <Icon name="check_circle" size={15} color={a.color} fill />
                Completada
              </span>
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: C.muted, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: C.primaryD }}>
              <Icon name="bolt" size={14} color={C.primary} fill />
              +{g.xp} XP
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: C.goldText }}>
              <Icon name="paid" size={14} color={C.gold} fill />
              +{g.coins ?? g.xp}
            </span>
            {(g.type === 'count' || g.type === 'dailyCount') && ((g.extraXp || 0) > 0 || (g.extraCoins ?? g.extraXp ?? 0) > 0) ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: C.green }}>
                <Icon name="add" size={14} color={C.green} />
                {g.extraXp || 0} XP / {g.extraCoins ?? g.extraXp ?? 0} 🪙 extra
              </span>
            ) : null}
            {main && g.penalty > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: C.danger }}>
                <Icon name="remove" size={14} color={C.danger} />
                {g.penalty} si no cumples
              </span>
            ) : null}
            <span>
              {g.type === 'daily'
                ? u.done + '/' + u.total + ' días'
                : g.type === 'dailyCount'
                  ? u.done + '/' + u.total + ' días (≥' + (g.dailyTarget || 1) + '/día)'
                  : g.type === 'count'
                    ? u.done + '/' + u.total + ' veces'
                    : '1 vez'}
            </span>
          </div>
        </div>
        <button onClick={() => openGoalForm(g)} style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center', color: C.faint, flexShrink: 0 }}>
          <Icon name="edit" size={17} color={C.faint} />
        </button>
      </div>
      <div style={{ marginTop: '12px' }}>
        <GoalControl g={g} a={a} />
      </div>
      {linked.length ? (
        <button
          onClick={() => setView('tareas')}
          title="Ver tareas"
          style={{
            marginTop: '12px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '9px 11px',
            borderRadius: '11px',
            background: C.card2,
            border: '1px solid ' + C.line,
            textAlign: 'left',
          }}
        >
          <Icon name="task_alt" size={16} color={C.green} fill />
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>
            {linkedDone}/{linked.length} tareas
          </span>
          <span style={{ flex: 1, height: '7px', borderRadius: '5px', background: C.line, overflow: 'hidden' }}>
            <span style={{ display: 'block', width: linkPct + '%', height: '100%', background: C.green, borderRadius: '5px' }} />
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: linkPct === 100 ? C.green : C.faint }}>{linkPct}%</span>
        </button>
      ) : null}
    </div>
  )
}

function GoalControl({ g, a }: { g: Goal; a: Area }) {
  const C = useC()
  const toggleDay = useStore((st) => st.toggleDay)
  const incCount = useStore((st) => st.incCount)
  const incDayCount = useStore((st) => st.incDayCount)
  const toggleWeekly = useStore((st) => st.toggleWeekly)

  if (g.type === 'daily') {
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    const checks = g.checks || Array(7).fill(false)
    return (
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
        {labels.map((lb, i) => {
          const on = checks[i]
          return (
            <button
              key={i}
              onClick={() => toggleDay(g.id, i)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                fontWeight: 700,
                fontSize: '14px',
                fontFamily: '"Space Grotesk"',
                border: '2px solid ' + (on ? a.color : C.line2),
                background: on ? a.color : C.card,
                color: on ? '#fff' : C.faint,
                transition: '.15s',
                boxShadow: on ? '0 4px 12px ' + a.color + '40' : 'none',
              }}
            >
              {lb}
            </button>
          )
        })}
      </div>
    )
  }
  if (g.type === 'count') {
    const c = g.count || 0
    const t = g.target || 1
    const pct = Math.min(100, Math.round((c / t) * 100))
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => incCount(g.id, -1)} disabled={c <= 0} style={stepBtn(C, c <= 0)}>
          <Icon name="remove" size={20} color={c <= 0 ? C.faint : C.text} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
            <span style={{ fontFamily: '"Space Grotesk"', color: a.color, fontSize: '16px' }}>
              {c} / {t}
              {c > t ? <span style={{ color: C.green, fontSize: '12px', marginLeft: '6px' }}>+{c - t} extra</span> : null}
            </span>
            <span style={{ color: C.muted }}>{pct}%</span>
          </div>
          <div style={{ height: '9px', borderRadius: '6px', background: C.line, overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: a.color, borderRadius: '6px', transition: 'width .35s' }} />
          </div>
        </div>
        <button onClick={() => incCount(g.id, 1)} style={stepBtn(C, false, a.color)}>
          <Icon name="add" size={20} color="#fff" />
        </button>
      </div>
    )
  }
  if (g.type === 'dailyCount') {
    const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    const dt = g.dailyTarget || 1
    const counts = g.counts || Array(7).fill(0)
    const days = counts.filter((c) => (c || 0) >= dt).length
    const need = g.targetDays || 7
    return (
      <div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {labels.map((lb, i) => {
            const c = counts[i] || 0
            const met = c >= dt
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '44px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: met ? a.color : C.faint }}>{lb}</span>
                <button
                  onClick={() => incDayCount(g.id, i, 1)}
                  title="Sumar una vez"
                  style={{
                    width: '44px',
                    height: '40px',
                    borderRadius: '11px',
                    fontFamily: '"Space Grotesk"',
                    fontWeight: 700,
                    fontSize: '16px',
                    border: '2px solid ' + (met ? a.color : C.line2),
                    background: met ? a.color : C.card,
                    color: met ? '#fff' : C.text,
                    boxShadow: met ? '0 4px 12px ' + a.color + '40' : 'none',
                  }}
                >
                  {c}
                </button>
                <button
                  onClick={() => incDayCount(g.id, i, -1)}
                  disabled={c <= 0}
                  title="Quitar una"
                  style={{ fontSize: '13px', fontWeight: 800, color: c <= 0 ? C.faint : C.muted, opacity: c <= 0 ? 0.4 : 1, lineHeight: 1 }}
                >
                  −
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: C.muted }}>
          Meta {dt}/día ·{' '}
          <span style={{ color: days >= need ? C.green : C.muted }}>
            {days}/{need} días cumplidos
          </span>
        </div>
      </div>
    )
  }
  const on = !!g.done
  return (
    <button
      onClick={() => toggleWeekly(g.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '9px',
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '14px',
        border: '2px solid ' + (on ? a.color : C.line2),
        background: on ? a.color : C.card,
        color: on ? '#fff' : C.muted,
        transition: '.15s',
      }}
    >
      <Icon name={on ? 'check_circle' : 'radio_button_unchecked'} size={20} color={on ? '#fff' : C.faint} fill={on} />
      {on ? '¡Completada!' : 'Marcar como completada'}
    </button>
  )
}

function BadHabits() {
  const C = useC()
  const d = useStore((st) => st.data)
  const openHabitForm = useStore((st) => st.openHabitForm)
  const logHabit = useStore((st) => st.logHabit)
  const habitCountWeek = useStore((st) => st.habitCountWeek)
  const narrow = useStore((st) => st.narrow)
  const habits = d.badHabits || []
  return (
    <div style={{ marginTop: '26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: C.dangerSoft, display: 'grid', placeItems: 'center' }}>
            <Icon name="heart_broken" size={16} color={C.danger} fill />
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', fontFamily: '"Space Grotesk"', fontWeight: 700 }}>Hábitos a evitar</h3>
          <span style={{ fontSize: '12px', color: C.faint, fontWeight: 600 }}>roban vida si los haces</span>
        </div>
        <button onClick={() => openHabitForm()} style={ghostBtn(C)}>
          <Icon name="add" size={18} color={C.danger} />
          Añadir
        </button>
      </div>
      {habits.length === 0 ? (
        <div style={{ background: C.card, border: '1px dashed ' + C.line2, borderRadius: '14px', padding: '18px', textAlign: 'center', color: C.faint, fontWeight: 600, fontSize: '13px' }}>
          Define los hábitos que quieres dejar. Al registrarlos honestamente, tu avatar pierde algo de vida — sin culpa, solo consecuencia.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: '10px' }}>
          {habits.map((b) => {
            const cnt = habitCountWeek(b.id)
            return (
              <div key={b.id} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: '14px', padding: '13px 15px', display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.dangerSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={b.icon || 'block'} size={19} color={C.danger} fill />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{b.name}</div>
                  <div style={{ fontSize: '12px', color: C.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: C.danger }}>
                      <Icon name="favorite" size={13} color={C.danger} fill />
                      −{b.damage}
                    </span>
                    {cnt > 0 ? (
                      <span>{cnt + (cnt === 1 ? ' vez esta semana' : ' veces esta semana')}</span>
                    ) : (
                      <span style={{ color: C.green }}>limpio esta semana</span>
                    )}
                  </div>
                </div>
                <button onClick={() => openHabitForm(b)} style={{ color: C.faint, width: '28px', height: '28px', display: 'grid', placeItems: 'center' }}>
                  <Icon name="edit" size={16} color={C.faint} />
                </button>
                <button onClick={() => logHabit(b)} style={{ padding: '8px 13px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', color: '#fff', background: C.danger, whiteSpace: 'nowrap' }}>
                  Lo hice
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
