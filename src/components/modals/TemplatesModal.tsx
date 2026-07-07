import { AREAS, TASK_PRIORITIES } from '../../constants'
import { useStore } from '../../store'
import type { GoalTemplate, TaskTemplate } from '../../types'
import { Icon, Overlay, useC } from '../../ui'

export function TemplatesModal() {
  const C = useC()
  const open = useStore((s) => s.templatesModal)
  const setTemplatesModal = useStore((s) => s.setTemplatesModal)
  const d = useStore((s) => s.data)
  const setTaskForm = useStore((s) => s.setTaskForm)
  const setGoalForm = useStore((s) => s.setGoalForm)
  const deleteTaskTemplate = useStore((s) => s.deleteTaskTemplate)
  const deleteGoalTemplate = useStore((s) => s.deleteGoalTemplate)

  if (!open) return null
  const taskTemplates = d.taskTemplates || []
  const goalTemplates = d.goalTemplates || []
  const empty = taskTemplates.length === 0 && goalTemplates.length === 0

  const editTaskTpl = (tpl: TaskTemplate) => {
    setTaskForm({
      templateId: tpl.id,
      title: tpl.title,
      notes: tpl.notes,
      listId: tpl.listId,
      tags: [...tpl.tags],
      priority: tpl.priority,
      estPomos: tpl.estPomos,
      due: null,
      subtasks: tpl.subtasks.map((s) => ({ id: 'st' + Math.random().toString(36).slice(2, 7), title: s.title, done: false })),
      linkedGoal: tpl.linkedGoal || '',
    })
    setTemplatesModal(false)
  }

  const editGoalTpl = (tpl: GoalTemplate) => {
    setGoalForm({
      templateId: tpl.id,
      areaId: tpl.areaId,
      title: tpl.title,
      priority: tpl.priority,
      type: tpl.type,
      xp: tpl.xp,
      coins: tpl.coins,
      extraXp: tpl.extraXp,
      extraCoins: tpl.extraCoins,
      penalty: tpl.penalty,
      targetDays: tpl.targetDays,
      target: tpl.target,
      dailyTarget: tpl.dailyTarget,
    })
    setTemplatesModal(false)
  }

  return (
    <Overlay onClose={() => setTemplatesModal(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: C.primarySoft, display: 'grid', placeItems: 'center' }}>
            <Icon name="bookmarks" size={20} color={C.primary} fill />
          </div>
          <div>
            <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '18px' }}>Plantillas</h3>
            <div style={{ fontSize: '11.5px', color: C.muted, fontWeight: 600 }}>Ver, editar y eliminar</div>
          </div>
        </div>
        <button onClick={() => setTemplatesModal(false)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>

      {empty ? (
        <div style={{ textAlign: 'center', padding: '26px 10px', color: C.faint, fontWeight: 600, fontSize: '13.5px', lineHeight: 1.5 }}>
          <Icon name="bookmark_border" size={34} color={C.faint} />
          <div style={{ marginTop: '10px' }}>
            Aún no tienes plantillas. Crea una tarea o meta y toca <b>"Guardar como plantilla"</b> en su editor.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '18px' }}>
          {taskTemplates.length ? (
            <div>
              <SectionLabel icon="task_alt" text="Tareas" color={C.blue} C={C} />
              <div style={{ display: 'grid', gap: '8px' }}>
                {taskTemplates.map((tpl) => {
                  const pr = TASK_PRIORITIES.find((p) => p.id === tpl.priority)
                  return (
                    <Row
                      key={tpl.id}
                      color={pr?.color || C.muted}
                      icon="checklist"
                      name={tpl.name}
                      sub={[pr?.name, tpl.subtasks.length ? tpl.subtasks.length + ' subtareas' : '', tpl.estPomos ? tpl.estPomos + ' pomos' : ''].filter(Boolean).join(' · ')}
                      onEdit={() => editTaskTpl(tpl)}
                      onDelete={() => deleteTaskTemplate(tpl.id)}
                      C={C}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}

          {goalTemplates.length ? (
            <div>
              <SectionLabel icon="flag" text="Metas" color={C.primary} C={C} />
              <div style={{ display: 'grid', gap: '8px' }}>
                {goalTemplates.map((tpl) => {
                  const area = AREAS.find((a) => a.id === tpl.areaId)
                  return (
                    <Row
                      key={tpl.id}
                      color={area?.color || C.primary}
                      icon={area?.icon || 'flag'}
                      name={tpl.name}
                      sub={[area?.name, '+' + tpl.xp + ' XP', '+' + tpl.coins + ' 🪙', tpl.priority === 'main' ? 'principal' : 'secundaria'].filter(Boolean).join(' · ')}
                      onEdit={() => editGoalTpl(tpl)}
                      onDelete={() => deleteGoalTemplate(tpl.id)}
                      C={C}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Overlay>
  )
}

function SectionLabel({ icon, text, color, C }: { icon: string; text: string; color: string; C: ReturnType<typeof useC> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px' }}>
      <Icon name={icon} size={16} color={color} fill />
      <span style={{ fontSize: '11px', fontWeight: 800, color: C.faint, textTransform: 'uppercase', letterSpacing: '.5px' }}>{text}</span>
    </div>
  )
}

function Row({
  color,
  icon,
  name,
  sub,
  onEdit,
  onDelete,
  C,
}: {
  color: string
  icon: string
  name: string
  sub: string
  onEdit: () => void
  onDelete: () => void
  C: ReturnType<typeof useC>
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.card2, border: '1px solid ' + C.line, borderRadius: '12px', padding: '10px 12px' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: color + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={16} color={color} fill />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {sub ? <div style={{ fontSize: '11.5px', color: C.faint, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div> : null}
      </div>
      <button onClick={onEdit} title="Editar" style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center', color: C.primary, flexShrink: 0 }}>
        <Icon name="edit" size={17} color={C.primary} />
      </button>
      <button onClick={onDelete} title="Eliminar" style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center', color: C.faint, flexShrink: 0 }}>
        <Icon name="delete" size={17} color={C.faint} />
      </button>
    </div>
  )
}
