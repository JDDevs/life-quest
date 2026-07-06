// Thin UCI wrapper around the single-threaded Stockfish build served from
// /public/engine. It runs as a classic Web Worker (no SharedArrayBuffer, so no
// COOP/COEP headers needed) and speaks the standard UCI text protocol.
//
// The engine is the source of truth for moves/evaluation; the LLM only explains
// its output in natural language (see lib/ai.ts → explainChess).

const ENGINE_URL = (import.meta.env.BASE_URL || '/') + 'engine/stockfish-18-lite-single.js'

export interface EngineEval {
  /** Best move in UCI notation (e.g. "e2e4"), or null if none. */
  bestmove: string | null
  ponder: string | null
  /** Centipawns from the side-to-move's perspective (positive = better). */
  scoreCp: number | null
  /** Mate distance (signed) if a forced mate was found. */
  mate: number | null
  /** Principal variation in UCI moves. */
  pv: string[]
  depth: number
}

type EvalListener = (e: EngineEval) => void

export class ChessEngine {
  private worker: Worker | null = null
  private readyPromise: Promise<void> | null = null
  private pending: ((e: EngineEval) => void) | null = null
  private latest: EngineEval = { bestmove: null, ponder: null, scoreCp: null, mate: null, pv: [], depth: 0 }
  private onProgress: EvalListener | null = null

  /** Boot the worker and wait until the engine is ready. Safe to call repeatedly. */
  ready(): Promise<void> {
    if (this.readyPromise) return this.readyPromise
    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(ENGINE_URL)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('No se pudo cargar el motor.'))
        return
      }
      let uciOk = false
      this.worker.onmessage = (ev: MessageEvent) => {
        const line = typeof ev.data === 'string' ? ev.data : String(ev.data ?? '')
        if (line.startsWith('uciok')) {
          uciOk = true
          this.send('isready')
        } else if (line.startsWith('readyok')) {
          if (uciOk) resolve()
        } else {
          this.handleLine(line)
        }
      }
      this.worker.onerror = () => reject(new Error('El motor de ajedrez falló al iniciar.'))
      this.send('uci')
    })
    return this.readyPromise
  }

  private send(cmd: string): void {
    this.worker?.postMessage(cmd)
  }

  private handleLine(line: string): void {
    if (line.startsWith('info')) {
      const ev = parseInfo(line)
      if (ev) {
        this.latest = { ...this.latest, ...ev }
        this.onProgress?.(this.latest)
      }
      return
    }
    if (line.startsWith('bestmove')) {
      const parts = line.split(/\s+/)
      const best = parts[1] && parts[1] !== '(none)' ? parts[1] : null
      const ponderIdx = parts.indexOf('ponder')
      const ponder = ponderIdx >= 0 ? parts[ponderIdx + 1] : null
      const result: EngineEval = { ...this.latest, bestmove: best, ponder }
      const cb = this.pending
      this.pending = null
      this.onProgress = null
      cb?.(result)
    }
  }

  /** Set playing strength: skill 0 (weak) … 20 (full). */
  async setSkill(level: number): Promise<void> {
    await this.ready()
    const n = Math.max(0, Math.min(20, Math.round(level)))
    this.send(`setoption name Skill Level value ${n}`)
  }

  /** Analyze a position (FEN). Resolves with the engine's evaluation + best move. */
  async analyze(
    fen: string,
    opts: { depth?: number; movetime?: number; onProgress?: EvalListener } = {},
  ): Promise<EngineEval> {
    await this.ready()
    // Only one search at a time — cancel any in-flight one first.
    if (this.pending) {
      this.send('stop')
      await new Promise((r) => setTimeout(r, 30))
    }
    this.latest = { bestmove: null, ponder: null, scoreCp: null, mate: null, pv: [], depth: 0 }
    this.onProgress = opts.onProgress ?? null
    const go = opts.movetime ? `go movetime ${opts.movetime}` : `go depth ${opts.depth ?? 14}`
    return new Promise<EngineEval>((resolve) => {
      this.pending = resolve
      this.send('ucinewgame')
      this.send(`position fen ${fen}`)
      this.send(go)
    })
  }

  /** Ask the engine for its best move at a given skill level (for playing). */
  async bestMove(fen: string, opts: { movetime?: number; depth?: number } = {}): Promise<string | null> {
    const r = await this.analyze(fen, { movetime: opts.movetime, depth: opts.depth })
    return r.bestmove
  }

  stop(): void {
    this.send('stop')
  }

  dispose(): void {
    try {
      this.send('quit')
      this.worker?.terminate()
    } catch {
      /* ignore */
    }
    this.worker = null
    this.readyPromise = null
    this.pending = null
  }
}

function parseInfo(line: string): Partial<EngineEval> | null {
  const out: Partial<EngineEval> = {}
  const depthMatch = line.match(/\bdepth (\d+)/)
  if (depthMatch) out.depth = Number(depthMatch[1])
  const mateMatch = line.match(/\bscore mate (-?\d+)/)
  const cpMatch = line.match(/\bscore cp (-?\d+)/)
  if (mateMatch) {
    out.mate = Number(mateMatch[1])
    out.scoreCp = null
  } else if (cpMatch) {
    out.scoreCp = Number(cpMatch[1])
    out.mate = null
  }
  const pvMatch = line.match(/\bpv (.+)$/)
  if (pvMatch) out.pv = pvMatch[1].trim().split(/\s+/)
  if (out.depth === undefined && out.scoreCp === undefined && out.mate === undefined && !out.pv) return null
  return out
}

/** Human-readable evaluation text from the side-to-move perspective. */
export function evalText(e: EngineEval, turn: 'white' | 'black'): string {
  if (e.mate != null) {
    const forSide = e.mate > 0 ? (turn === 'white' ? 'blancas' : 'negras') : turn === 'white' ? 'negras' : 'blancas'
    return `Mate en ${Math.abs(e.mate)} para ${forSide}`
  }
  if (e.scoreCp == null) return 'Evaluación no disponible'
  // Convert to White's perspective for an intuitive +/− sign.
  const cpWhite = turn === 'white' ? e.scoreCp : -e.scoreCp
  const pawns = (cpWhite / 100).toFixed(2)
  const sign = cpWhite > 0 ? '+' : ''
  const who = cpWhite > 20 ? ' (ventaja blancas)' : cpWhite < -20 ? ' (ventaja negras)' : ' (igualada)'
  return `${sign}${pawns}${who}`
}
