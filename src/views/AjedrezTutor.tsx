import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStore } from '../store'
import { ChessEngine, evalText, type EngineEval } from '../lib/engine'
import { aiEnabled, explainChess } from '../lib/ai'
import { Card, Field, Icon, SectionTitle, ghostBtn, inp, primaryBtn, useC } from '../ui'

type Mode = 'white' | 'black' | 'analysis'

const SKILL_PRESETS: { label: string; skill: number }[] = [
  { label: 'Principiante', skill: 2 },
  { label: 'Fácil', skill: 5 },
  { label: 'Intermedio', skill: 10 },
  { label: 'Difícil', skill: 16 },
  { label: 'Máximo', skill: 20 },
]

function uciToMove(uci: string): { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' } {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: (uci[4] as 'q' | 'r' | 'b' | 'n') || undefined,
  }
}

function pvToSan(fen: string, pv: string[]): string {
  const c = new Chess(fen)
  const out: string[] = []
  for (const uci of pv.slice(0, 8)) {
    try {
      const mv = c.move(uciToMove(uci))
      out.push(mv.san)
    } catch {
      break
    }
  }
  return out.join(' ')
}

export function AjedrezTutor() {
  const C = useC()
  const narrow = useStore((s) => s.narrow)
  const gameRef = useRef(new Chess())
  const engineRef = useRef<ChessEngine | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const [fen, setFen] = useState(gameRef.current.fen())
  const [mode, setMode] = useState<Mode>('white')
  const [skill, setSkill] = useState(5)
  const [ev, setEv] = useState<EngineEval | null>(null)
  const [bestLine, setBestLine] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [boardWidth, setBoardWidth] = useState(380)

  const game = gameRef.current
  const turn: 'white' | 'black' = game.turn() === 'w' ? 'white' : 'black'

  // engine lifecycle
  useEffect(() => {
    engineRef.current = new ChessEngine()
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  // responsive board sizing
  useEffect(() => {
    const measure = () => {
      const w = boxRef.current?.clientWidth ?? 380
      setBoardWidth(Math.max(260, Math.min(w, 460)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [narrow])

  const status = useMemo(() => {
    if (game.isCheckmate()) return { text: (turn === 'white' ? 'Negras' : 'Blancas') + ' ganan (jaque mate)', over: true }
    if (game.isDraw()) return { text: 'Tablas', over: true }
    if (game.isStalemate()) return { text: 'Ahogado (tablas)', over: true }
    if (game.isCheck()) return { text: 'Jaque', over: false }
    return { text: turn === 'white' ? 'Juegan las blancas' : 'Juegan las negras', over: false }
  }, [fen, game, turn])

  const sync = () => setFen(game.fen())

  const engineMove = async () => {
    const engine = engineRef.current
    if (!engine || game.isGameOver()) return
    setThinking(true)
    setError(null)
    try {
      await engine.setSkill(skill)
      const uci = await engine.bestMove(game.fen(), { movetime: 400 + skill * 40 })
      if (uci) {
        game.move(uciToMove(uci))
        sync()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'El motor no pudo mover.')
    } finally {
      setThinking(false)
    }
  }

  const onDrop = (source: Square, target: Square): boolean => {
    if (thinking || status.over) return false
    if (mode !== 'analysis' && turn !== mode) return false // only move your own side
    try {
      game.move({ from: source, to: target, promotion: 'q' })
    } catch {
      return false
    }
    setEv(null)
    setBestLine('')
    setExplanation('')
    sync()
    if (mode !== 'analysis' && !game.isGameOver()) void engineMove()
    return true
  }

  const analyze = async (): Promise<EngineEval | null> => {
    const engine = engineRef.current
    if (!engine) return null
    setAnalyzing(true)
    setError(null)
    try {
      const r = await engine.analyze(game.fen(), { depth: 15 })
      setEv(r)
      setBestLine(pvToSan(game.fen(), r.pv))
      return r
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo analizar.')
      return null
    } finally {
      setAnalyzing(false)
    }
  }

  const explain = async () => {
    if (explaining) return
    setExplaining(true)
    setError(null)
    try {
      let cur = ev
      let line = bestLine
      if (!cur) {
        cur = await analyze()
        line = cur ? pvToSan(game.fen(), cur.pv) : ''
      }
      if (!cur) return
      const text = await explainChess({
        fen: game.fen(),
        turn,
        bestLineSan: line,
        evalText: evalText(cur, turn),
        moveHistorySan: game.history(),
        question: question.trim() || undefined,
      })
      setExplanation(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo obtener la explicación.')
    } finally {
      setExplaining(false)
    }
  }

  const reset = (newMode?: Mode) => {
    game.reset()
    setEv(null)
    setBestLine('')
    setExplanation('')
    setError(null)
    setQuestion('')
    sync()
    const m = newMode ?? mode
    if (m === 'black') void engineMove() // engine (white) opens
  }

  const undo = () => {
    game.undo()
    if (mode !== 'analysis') game.undo() // undo the engine reply too
    setEv(null)
    setBestLine('')
    setExplanation('')
    sync()
  }

  const arrows = useMemo(() => {
    if (!ev?.bestmove) return []
    return [[ev.bestmove.slice(0, 2), ev.bestmove.slice(2, 4), C.primary]]
  }, [ev, C.primary]) as ComponentProps<typeof Chessboard>['customArrows']

  const orientation: 'white' | 'black' = mode === 'black' ? 'black' : 'white'
  const history = game.history()

  return (
    <div>
      <SectionTitle title="Tutor de ajedrez" sub="Juega contra el motor y aprende con la IA" />
      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'minmax(0,1fr) 1fr', gap: '18px', alignItems: 'start' }}>
        {/* Board column */}
        <div ref={boxRef}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: status.over ? C.primaryD : C.muted }}>
                {thinking ? 'El motor está pensando…' : status.text}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={undo} title="Deshacer" style={{ ...ghostBtn(C), padding: '7px 10px' }}>
                  <Icon name="undo" size={16} color={C.muted} />
                </button>
                <button onClick={() => reset()} title="Reiniciar" style={{ ...ghostBtn(C), padding: '7px 10px' }}>
                  <Icon name="restart_alt" size={16} color={C.muted} />
                </button>
              </div>
            </div>
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardWidth={boardWidth}
              boardOrientation={orientation}
              customArrows={arrows}
              customBoardStyle={{ borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,.12)' }}
              customDarkSquareStyle={{ backgroundColor: C.primary }}
              customLightSquareStyle={{ backgroundColor: C.primarySoft }}
            />
          </Card>
        </div>

        {/* Controls column */}
        <div style={{ display: 'grid', gap: '14px' }}>
          <Card>
            <Field label="Modo de juego">
              <div style={{ display: 'flex', gap: '7px' }}>
                {(
                  [
                    ['white', 'Juego con blancas'],
                    ['black', 'Juego con negras'],
                    ['analysis', 'Análisis libre'],
                  ] as const
                ).map(([v, lb]) => {
                  const on = mode === v
                  return (
                    <button
                      key={v}
                      onClick={() => {
                        setMode(v)
                        reset(v)
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 6px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: '2px solid ' + (on ? C.primary : C.line2),
                        background: on ? C.primarySoft : C.card,
                        color: on ? C.primaryD : C.muted,
                      }}
                    >
                      {lb}
                    </button>
                  )
                })}
              </div>
            </Field>
            <div style={{ marginTop: '14px' }}>
              <Field label={'Fuerza del motor · nivel ' + skill}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SKILL_PRESETS.map((p) => {
                    const on = skill === p.skill
                    return (
                      <button
                        key={p.skill}
                        onClick={() => setSkill(p.skill)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: '9px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: '1px solid ' + (on ? C.primary : C.line2),
                          background: on ? C.primarySoft : C.card,
                          color: on ? C.primaryD : C.muted,
                        }}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontFamily: '"Space Grotesk"', fontSize: '15px' }}>Análisis</span>
              {ev ? (
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.primaryD, fontFamily: '"Space Grotesk"' }}>
                  {evalText(ev, turn)}
                </span>
              ) : null}
            </div>
            <button
              onClick={() => void analyze()}
              disabled={analyzing || status.over}
              style={{ ...ghostBtn(C), width: '100%', justifyContent: 'center', color: C.primaryD, borderColor: C.primary + '55', opacity: analyzing || status.over ? 0.55 : 1 }}
            >
              <Icon name={analyzing ? 'hourglass_top' : 'insights'} size={18} color={C.primary} fill />
              {analyzing ? 'Analizando…' : 'Analizar posición'}
            </button>
            {bestLine ? (
              <div style={{ marginTop: '10px', fontSize: '12.5px', color: C.muted, fontWeight: 600 }}>
                <span style={{ color: C.faint }}>Mejor línea: </span>
                {bestLine}
              </div>
            ) : null}

            {aiEnabled() ? (
              <div style={{ marginTop: '14px', borderTop: '1px solid ' + C.line, paddingTop: '14px' }}>
                <Field label="Pregúntale al tutor (opcional)">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ej: ¿por qué no puedo enrocar?"
                    style={inp(C)}
                  />
                </Field>
                <button
                  onClick={() => void explain()}
                  disabled={explaining || status.over}
                  style={{ ...primaryBtn(C), width: '100%', justifyContent: 'center', marginTop: '10px', opacity: explaining || status.over ? 0.6 : 1 }}
                >
                  <Icon name={explaining ? 'hourglass_top' : 'school'} size={18} color="#fff" fill />
                  {explaining ? 'Pensando…' : 'Explícame la posición'}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '12px', fontSize: '12px', color: C.faint, fontWeight: 600 }}>
                Configura la IA (GEMINI_API_KEY) para recibir explicaciones en lenguaje natural.
              </div>
            )}

            {explanation ? (
              <div style={{ marginTop: '12px', background: C.card2, border: '1px solid ' + C.line, borderRadius: '12px', padding: '12px 14px', fontSize: '13.5px', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {explanation}
              </div>
            ) : null}
            {error ? <div style={{ marginTop: '10px', fontSize: '12px', color: C.danger, fontWeight: 600 }}>{error}</div> : null}
          </Card>

          {history.length ? (
            <Card>
              <span style={{ fontWeight: 700, fontFamily: '"Space Grotesk"', fontSize: '14px' }}>Jugadas</span>
              <div style={{ marginTop: '8px', fontSize: '13px', color: C.muted, fontWeight: 600, lineHeight: 1.7, wordBreak: 'break-word' }}>
                {history.map((m, i) => (
                  <span key={i}>
                    {i % 2 === 0 ? <span style={{ color: C.faint }}>{Math.floor(i / 2) + 1}. </span> : null}
                    {m}{' '}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
