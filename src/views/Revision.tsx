import { REVIEW_QS } from '../constants'
import { weekLabel } from '../lib/date'
import { useStore } from '../store'
import type { Stats } from '../types'
import { Icon, SectionTitle, inp, primaryBtn, useC } from '../ui'

export function Revision(_props: { s: Stats }) {
  const C = useC()
  const d = useStore((st) => st.data)
  const setReview = useStore((st) => st.setReview)
  const finishReview = useStore((st) => st.finishReview)
  const wk = d.currentWeek
  const r = d.reviews[wk] || { done: false }
  const answered = REVIEW_QS.filter((q) => ((r[q.k] as string) || '').trim()).length
  const done = r.done
  return (
    <div>
      <SectionTitle title="Revisión dominical" sub={weekLabel(wk)} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          background: done ? C.greenSoft : C.primarySoft,
          border: '1px solid ' + (done ? C.green + '44' : C.primary + '33'),
          borderRadius: '14px',
          padding: '13px 17px',
          margin: '6px 0 20px',
        }}
      >
        <Icon name={done ? 'task_alt' : 'self_improvement'} size={22} color={done ? C.green : C.primary} fill />
        <span style={{ fontWeight: 600, fontSize: '13.5px', color: done ? C.greenText : C.primaryD }}>
          {done
            ? 'Revisión completada — +60 XP ganados. Puedes seguir editándola.'
            : 'Responde con honestidad y gánate 60 XP al guardar. Es tu momento de reflexión, no de culpa.'}
        </span>
      </div>
      <div style={{ display: 'grid', gap: '14px' }}>
        {REVIEW_QS.map((q, i) => (
          <div key={q.k} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: '15px', padding: '16px' }}>
            <label style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '9px', fontWeight: 700, fontSize: '14.5px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  background: C.primarySoft,
                  color: C.primaryD,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  fontFamily: '"Space Grotesk"',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              {q.q}
            </label>
            <textarea
              rows={2}
              value={(r[q.k] as string) || ''}
              placeholder="Escribe aquí..."
              onChange={(e) => setReview(wk, q.k, e.target.value)}
              style={{ ...inp(C), width: '100%' }}
            />
          </div>
        ))}
        <button
          onClick={() => finishReview(wk)}
          disabled={answered < 3}
          style={{ ...primaryBtn(C), justifyContent: 'center', opacity: answered < 3 ? 0.5 : 1, cursor: answered < 3 ? 'not-allowed' : 'pointer' }}
        >
          <Icon name="check_circle" size={19} color="#fff" fill />
          {done ? 'Revisión guardada' : answered < 3 ? 'Responde al menos 3 preguntas' : 'Completar revisión (+60 XP)'}
        </button>
      </div>
    </div>
  )
}
