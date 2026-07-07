import { useEffect, useRef, useState } from 'react'
import { AREAS } from '../../constants'
import { useStore } from '../../store'
import type { GoalForm } from '../../store'
import { assistantChat, proposeGoals, type AIMessage, type ProposedGoal } from '../../lib/ai'
import { Icon, Overlay, ghostBtn, inp, primaryBtn, useC } from '../../ui'

const GREETING: AIMessage = {
  role: 'model',
  text: 'Hola 👋 Soy tu asistente de Life Quest. Puedo proponerte metas coherentes con tu nivel, calibrar XP y monedas, o ayudarte a organizar la semana. ¿En qué área quieres enfocarte?',
}

export function AssistantModal() {
  const C = useC()
  const open = useStore((s) => s.assistant)
  const setAssistant = useStore((s) => s.setAssistant)
  const setGoalForm = useStore((s) => s.setGoalForm)
  const data = useStore((s) => s.data)
  const statsFn = useStore((s) => s.stats)

  const [messages, setMessages] = useState<AIMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposals, setProposals] = useState<ProposedGoal[]>([])
  const [proposeLoading, setProposeLoading] = useState(false)
  const [focusArea, setFocusArea] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, proposals, loading])

  if (!open) return null

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    const next = [...messages, { role: 'user' as const, text }]
    setMessages(next)
    setLoading(true)
    try {
      const reply = await assistantChat(messages, text, data, statsFn())
      setMessages([...next, { role: 'model', text: reply || '(sin respuesta)' }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar la IA.')
      setMessages(next)
    } finally {
      setLoading(false)
    }
  }

  const doPropose = async () => {
    if (proposeLoading) return
    setProposeLoading(true)
    setError(null)
    try {
      const goals = await proposeGoals(data, statsFn(), focusArea || undefined)
      setProposals(goals)
      if (!goals.length) setError('La IA no devolvió propuestas. Intenta de nuevo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron proponer metas.')
    } finally {
      setProposeLoading(false)
    }
  }

  const useProposal = (g: ProposedGoal) => {
    const form: GoalForm = {
      areaId: g.areaId,
      title: g.title,
      priority: g.priority,
      type: g.type,
      xp: g.xp,
      coins: g.coins,
      extraXp: g.extraXp,
      extraCoins: g.extraCoins,
      penalty: g.penalty,
      targetDays: g.targetDays,
      target: g.target,
      dailyTarget: g.dailyTarget,
    }
    setGoalForm(form) // abre GoalModal prellenado para revisar antes de guardar
    setAssistant(false)
  }

  return (
    <Overlay onClose={() => setAssistant(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg,' + C.primary + ',#8B5CF6)', display: 'grid', placeItems: 'center' }}>
            <Icon name="auto_awesome" size={20} color="#fff" fill />
          </div>
          <div>
            <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '18px' }}>Asistente IA</h3>
            <div style={{ fontSize: '11.5px', color: C.muted, fontWeight: 600 }}>Metas, puntos y organización</div>
          </div>
        </div>
        <button onClick={() => setAssistant(false)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>

      {/* Proponer metas */}
      <div style={{ background: C.card2, border: '1px solid ' + C.line, borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <AreaChip label="Cualquier área" active={focusArea === ''} onClick={() => setFocusArea('')} color={C.primary} C={C} />
          {AREAS.map((a) => (
            <AreaChip key={a.id} label={a.name} active={focusArea === a.id} onClick={() => setFocusArea(a.id)} color={a.color} C={C} />
          ))}
        </div>
        <button
          onClick={doPropose}
          disabled={proposeLoading}
          style={{ ...primaryBtn(C), width: '100%', justifyContent: 'center', opacity: proposeLoading ? 0.6 : 1 }}
        >
          <Icon name={proposeLoading ? 'hourglass_top' : 'lightbulb'} size={18} color="#fff" fill />
          {proposeLoading ? 'Pensando metas…' : 'Proponer metas para mí'}
        </button>
        {proposals.length ? (
          <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
            {proposals.map((g, i) => {
              const area = AREAS.find((a) => a.id === g.areaId)
              return (
                <div key={i} style={{ border: '1px solid ' + C.line2, borderRadius: '11px', padding: '10px 11px', background: C.card }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: (area?.color || C.primary) + '22', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={area?.icon || 'flag'} size={15} color={area?.color || C.primary} fill />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{g.title}</div>
                      <div style={{ fontSize: '11.5px', color: C.muted, fontWeight: 600, marginTop: '2px' }}>
                        {g.priority === 'main' ? 'Principal' : 'Secundaria'} · +{g.xp} XP · +{g.coins} 🪙
                        {g.priority === 'main' && g.penalty ? ' · −' + g.penalty + ' vida' : ''}
                      </div>
                      {g.reason ? <div style={{ fontSize: '11.5px', color: C.faint, fontWeight: 500, marginTop: '3px', fontStyle: 'italic' }}>{g.reason}</div> : null}
                    </div>
                    <button onClick={() => useProposal(g)} style={{ ...ghostBtn(C), padding: '7px 11px', fontSize: '12.5px', color: C.primaryD, borderColor: C.primary + '55', flexShrink: 0 }}>
                      Usar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* Chat */}
      <div
        ref={scrollRef}
        style={{ maxHeight: '240px', overflowY: 'auto', display: 'grid', gap: '9px', marginBottom: '12px', padding: '2px' }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              justifySelf: m.role === 'user' ? 'end' : 'start',
              maxWidth: '85%',
              background: m.role === 'user' ? C.primary : C.card2,
              color: m.role === 'user' ? '#fff' : C.text,
              border: '1px solid ' + (m.role === 'user' ? 'transparent' : C.line2),
              borderRadius: '13px',
              padding: '9px 12px',
              fontSize: '13.5px',
              fontWeight: 500,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.text}
          </div>
        ))}
        {loading ? (
          <div style={{ justifySelf: 'start', fontSize: '12.5px', color: C.muted, fontWeight: 600, padding: '4px 8px' }}>
            escribiendo…
          </div>
        ) : null}
      </div>

      {error ? <div style={{ fontSize: '12px', color: C.danger, fontWeight: 600, marginBottom: '8px' }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Escribe tu pregunta…"
          style={{ ...inp(C), flex: 1 }}
        />
        <button
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          style={{ ...primaryBtn(C), padding: '11px 14px', opacity: loading || !input.trim() ? 0.5 : 1 }}
        >
          <Icon name="send" size={18} color="#fff" fill />
        </button>
      </div>
    </Overlay>
  )
}

function AreaChip({ label, active, onClick, color, C }: { label: string; active: boolean; onClick: () => void; color: string; C: ReturnType<typeof useC> }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: '9px',
        fontSize: '11.5px',
        fontWeight: 700,
        border: '1px solid ' + (active ? color : C.line2),
        background: active ? color + '1F' : C.card,
        color: active ? color : C.muted,
      }}
    >
      {label}
    </button>
  )
}
