// Client-side helpers for the AI features. All calls go through our own
// serverless proxy (/api/ai) so the Gemini key never touches the browser.
//
// The whole point of `playerContext()` is grounding: we hand the model a
// compact snapshot of the real save (level, economy, existing goals, the
// game's point-calibration rules) so its suggestions stay in-balance instead
// of proposing wild XP/coin numbers or duplicate goals.
import { AREAS, SUGGESTED } from '../constants'
import { levelNeed } from './goals'
import type { AppData, Stats } from '../types'

const SYNC_ID = (import.meta.env.VITE_SYNC_ID as string | undefined) || ''

/** AI features require the same shared secret the cloud sync uses (the proxy
 *  is gated by it). Without it configured we hide the AI UI. */
export function aiEnabled(): boolean {
  return !!SYNC_ID
}

export interface AIMessage {
  role: 'user' | 'model'
  text: string
}

interface CallOpts {
  system?: string
  messages: AIMessage[]
  schema?: unknown
  temperature?: number
}

async function callAI(opts: CallOpts): Promise<string> {
  let res: Response
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: SYNC_ID, ...opts }),
    })
  } catch {
    throw new Error('No hay conexión con el servidor de IA.')
  }
  if (!res.ok) {
    let msg = 'IA no disponible (' + res.status + ').'
    try {
      const j = (await res.json()) as { error?: string }
      if (j?.error) msg = j.error
    } catch {
      /* ignore */
    }
    if (res.status === 500) msg = 'Falta configurar GEMINI_API_KEY en el servidor.'
    if (res.status === 401) msg = 'No autorizado: revisa VITE_SYNC_ID.'
    throw new Error(msg)
  }
  const j = (await res.json()) as { text?: string; blocked?: string }
  if (j.blocked) throw new Error('La IA no pudo responder (' + j.blocked + ').')
  return (j.text || '').trim()
}

// ---------- shared context ----------

function areaName(id: string): string {
  return AREAS.find((a) => a.id === id)?.name || id
}

const GOAL_TYPES = ['daily', 'count', 'weekly', 'dailyCount'] as const
type GoalType = (typeof GOAL_TYPES)[number]

/** Compact JSON snapshot of the current save, for grounding the model. */
function playerContext(d: AppData, s: Stats): string {
  const cur = d.goals[d.currentWeek] || []
  const metasActuales = cur.map((g) => ({
    area: areaName(g.areaId),
    titulo: g.title,
    tipo: g.type,
    prioridad: g.priority,
    xp: g.xp,
    monedas: g.coins ?? g.xp,
    penalizacion: g.penalty,
  }))
  const areas = AREAS.map((a) => ({ id: a.id, nombre: a.name, nivel: s.areaLvl[a.id]?.level ?? 1 }))
  const costos = (d.rewards || []).map((r) => r.cost).sort((a, b) => a - b)
  return JSON.stringify({
    nivel: s.level,
    rango: s.rank,
    xpTotalGanado: s.earnedXP,
    monedasDisponibles: s.coins,
    progresoSemanaActual: s.curPct + '%',
    rachaDias: s.streak,
    areas,
    metasActuales,
    economiaRecompensas: costos.length
      ? { costoMin: costos[0], costoMax: costos[costos.length - 1] }
      : null,
  })
}

/** The game's point rules, derived from how the app actually scores goals.
 *  Handing these to the model keeps suggestions consistent with the balance. */
function calibration(s: Stats): string {
  const sample = SUGGESTED.slice(0, 8).map(([area, title, type, xp]) => `${areaName(area)} · "${title}" (${type}, ${xp} XP)`)
  return [
    'REGLAS DE CALIBRACIÓN (respétalas siempre):',
    '- Solo las metas dan XP y monedas. XP y monedas van casi a la par (monedas = XP ±20%).',
    '- daily (diaria sí/no): el XP se gana por CADA día cumplido. Principal típica 10–15 XP, secundaria 6–10.',
    '- count (por cantidad en la semana): XP por cada repetición hasta la meta; extraXp por repetición extra ≈ la mitad del XP base.',
    '- dailyCount (cantidad por día): XP por cada vez hasta el objetivo diario; extra por encima.',
    '- weekly (una sola vez): esfuerzo alto, 20–60 XP.',
    '- penalizacion: SOLO metas principales, ≈60% del XP. En secundarias es 0.',
    `- Escala: subir del nivel ${s.level} al ${s.level + 1} cuesta ~${levelNeed(s.level)} XP. No infles los números.`,
    '- Las monedas deben permitir 1–3 recompensas por semana, sin volverlas triviales ni inalcanzables.',
    'Ejemplos calibrados del propio sistema: ' + sample.join(' | '),
  ].join('\n')
}

// ---------- 1) suggest points for one goal ----------

export interface GoalDraft {
  areaId: string
  title: string
  type: GoalType
  priority: 'main' | 'side'
  targetDays?: number | string
  target?: number | string
  dailyTarget?: number | string
}

export interface GoalSuggestion {
  xp: number
  coins: number
  extraXp: number
  extraCoins: number
  penalty: number
  rationale: string
}

const SUGGESTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    xp: { type: 'INTEGER' },
    coins: { type: 'INTEGER' },
    extraXp: { type: 'INTEGER' },
    extraCoins: { type: 'INTEGER' },
    penalty: { type: 'INTEGER' },
    rationale: { type: 'STRING' },
  },
  required: ['xp', 'coins', 'extraXp', 'extraCoins', 'penalty', 'rationale'],
}

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

export async function suggestGoalPoints(draft: GoalDraft, d: AppData, s: Stats): Promise<GoalSuggestion> {
  const system = [
    "Eres el asistente de balance de 'Mi Camino', un sistema de hábitos gamificado (RPG).",
    'Tu tarea: asignar XP, monedas y penalización coherentes para UNA meta.',
    calibration(s),
    'Devuelve SOLO el JSON pedido. `rationale` es una frase corta en español explicando el porqué.',
  ].join('\n\n')

  const user = [
    'CONTEXTO DEL JUGADOR:',
    playerContext(d, s),
    '',
    'META A EVALUAR:',
    JSON.stringify({
      area: areaName(draft.areaId),
      titulo: draft.title,
      tipo: draft.type,
      prioridad: draft.priority,
      diasObjetivo: draft.targetDays,
      cantidadObjetivo: draft.target,
      vecesPorDia: draft.dailyTarget,
    }),
  ].join('\n')

  const text = await callAI({
    system,
    messages: [{ role: 'user', text: user }],
    schema: SUGGESTION_SCHEMA,
    temperature: 0.4,
  })
  const raw = JSON.parse(text) as Partial<GoalSuggestion>
  const withExtra = draft.type === 'count' || draft.type === 'dailyCount'
  const isMain = draft.priority === 'main'
  const xp = num(raw.xp, 1, 100, 10)
  return {
    xp,
    coins: num(raw.coins, 0, 150, xp),
    extraXp: withExtra ? num(raw.extraXp, 0, 60, Math.max(1, Math.round(xp / 2))) : 0,
    extraCoins: withExtra ? num(raw.extraCoins, 0, 60, Math.max(1, Math.round(xp / 2))) : 0,
    penalty: isMain ? num(raw.penalty, 0, 80, Math.round(xp * 0.6)) : 0,
    rationale: String(raw.rationale || '').slice(0, 240),
  }
}

// ---------- 2) propose new goals ----------

export interface ProposedGoal {
  areaId: string
  title: string
  type: GoalType
  priority: 'main' | 'side'
  xp: number
  coins: number
  extraXp: number
  extraCoins: number
  penalty: number
  targetDays: number
  target: number
  dailyTarget: number
  reason: string
}

const PROPOSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    goals: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          areaId: { type: 'STRING' },
          title: { type: 'STRING' },
          type: { type: 'STRING' },
          priority: { type: 'STRING' },
          xp: { type: 'INTEGER' },
          coins: { type: 'INTEGER' },
          extraXp: { type: 'INTEGER' },
          extraCoins: { type: 'INTEGER' },
          penalty: { type: 'INTEGER' },
          targetDays: { type: 'INTEGER' },
          target: { type: 'INTEGER' },
          dailyTarget: { type: 'INTEGER' },
          reason: { type: 'STRING' },
        },
        required: ['areaId', 'title', 'type', 'priority', 'xp', 'coins', 'reason'],
      },
    },
  },
  required: ['goals'],
}

function normalizeProposed(raw: Partial<ProposedGoal>): ProposedGoal {
  const areaId = AREAS.some((a) => a.id === raw.areaId) ? (raw.areaId as string) : 'esp'
  const type = (GOAL_TYPES as readonly string[]).includes(raw.type as string) ? (raw.type as GoalType) : 'daily'
  const priority = raw.priority === 'side' ? 'side' : 'main'
  const withExtra = type === 'count' || type === 'dailyCount'
  const xp = num(raw.xp, 1, 100, 10)
  return {
    areaId,
    title: String(raw.title || '').slice(0, 120).trim() || 'Nueva meta',
    type,
    priority,
    xp,
    coins: num(raw.coins, 0, 150, xp),
    extraXp: withExtra ? num(raw.extraXp, 0, 60, Math.max(1, Math.round(xp / 2))) : 0,
    extraCoins: withExtra ? num(raw.extraCoins, 0, 60, Math.max(1, Math.round(xp / 2))) : 0,
    penalty: priority === 'main' ? num(raw.penalty, 0, 80, Math.round(xp * 0.6)) : 0,
    targetDays: num(raw.targetDays, 1, 7, 7),
    target: num(raw.target, 1, 30, 3),
    dailyTarget: num(raw.dailyTarget, 1, 20, 3),
    reason: String(raw.reason || '').slice(0, 200),
  }
}

export async function proposeGoals(d: AppData, s: Stats, focusAreaId?: string): Promise<ProposedGoal[]> {
  const focus = focusAreaId && AREAS.some((a) => a.id === focusAreaId) ? areaName(focusAreaId) : null
  const system = [
    "Eres el coach de 'Mi Camino', un sistema de hábitos gamificado (RPG) en español.",
    'Propón entre 3 y 5 metas NUEVAS, concretas y alcanzables en una semana.',
    'Ten en cuenta el nivel, las áreas y las metas que YA existen: no repitas ni propongas nada desproporcionado.',
    'Prefiere metas medibles y específicas. Reparte entre áreas poco atendidas si tiene sentido.',
    `Áreas válidas (usa el id): ${AREAS.map((a) => `${a.id}=${a.name}`).join(', ')}.`,
    'Tipos válidos: daily (sí/no diario), count (cantidad semanal), dailyCount (cantidad por día), weekly (una vez).',
    calibration(s),
    '`reason` explica en una frase por qué esa meta le conviene AHORA. Devuelve SOLO el JSON pedido.',
  ].join('\n\n')

  const user = [
    'CONTEXTO DEL JUGADOR:',
    playerContext(d, s),
    focus ? `\nEl usuario quiere enfocarse en el área: ${focus}.` : '\nSin área preferida: elige tú las más útiles.',
  ].join('\n')

  const text = await callAI({
    system,
    messages: [{ role: 'user', text: user }],
    schema: PROPOSE_SCHEMA,
    temperature: 0.8,
  })
  const parsed = JSON.parse(text) as { goals?: Partial<ProposedGoal>[] }
  return (parsed.goals || []).slice(0, 6).map(normalizeProposed)
}

// ---------- 3) free chat assistant ----------

export async function assistantChat(history: AIMessage[], userMsg: string, d: AppData, s: Stats): Promise<string> {
  const system = [
    "Eres el asistente personal de 'Mi Camino', un sistema de crecimiento personal gamificado (RPG-tamagotchi) en español.",
    'Ayudas al usuario a definir metas, mantener hábitos, entender el sistema (XP, monedas, vida, niveles, áreas) y motivarte con cabeza (sin frases vacías).',
    'Responde SIEMPRE en español, claro y breve (2–6 frases salvo que pidan más). Usa el contexto real del jugador; no inventes datos que no tienes.',
    'Si sugieres metas, usa números coherentes con la calibración.',
    calibration(s),
    '\nCONTEXTO ACTUAL DEL JUGADOR:\n' + playerContext(d, s),
  ].join('\n\n')

  const messages: AIMessage[] = [...history.slice(-8), { role: 'user', text: userMsg }]
  return callAI({ system, messages, temperature: 0.7 })
}

// ---------- 4) chess tutor ----------

export interface ChessExplainInput {
  fen: string
  turn: 'white' | 'black'
  bestLineSan: string
  evalText: string
  moveHistorySan: string[]
  question?: string
}

export async function explainChess(input: ChessExplainInput): Promise<string> {
  const system = [
    'Eres un entrenador de ajedrez paciente y didáctico que enseña en español a un jugador que está aprendiendo.',
    'Te doy una posición (FEN), de quién es el turno, la mejor línea según el motor Stockfish y su evaluación. El motor es la verdad: NO inventes jugadas ni contradigas su evaluación.',
    'Explica en lenguaje claro POR QUÉ esa jugada/plan es bueno: amenazas, ideas, seguridad del rey, estructura de peones, actividad de piezas. Da el "por qué", no solo el "qué".',
    'Sé concreto pero no abrumes: ~120–200 palabras salvo que pidan más. Adapta el nivel a alguien que aprende. Puedes usar la notación de las jugadas.',
  ].join('\n\n')

  const user = [
    `Turno de: ${input.turn === 'white' ? 'blancas' : 'negras'}`,
    `FEN: ${input.fen}`,
    input.moveHistorySan.length ? `Jugadas previas: ${input.moveHistorySan.join(' ')}` : 'Partida desde el inicio.',
    `Mejor línea del motor: ${input.bestLineSan || '(sin datos)'}`,
    `Evaluación del motor: ${input.evalText}`,
    input.question ? `\nPregunta del alumno: ${input.question}` : '\nExplica la mejor jugada y el plan a seguir.',
  ].join('\n')

  return callAI({ system, messages: [{ role: 'user', text: user }], temperature: 0.6 })
}
