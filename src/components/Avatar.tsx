import type { CSSProperties } from 'react'
import type { Stats } from '../types'

type Mood = 'ko' | 'sick' | 'sad' | 'ok' | 'happy'

function moodFor(hpPct: number): Mood {
  return hpPct <= 0 ? 'ko' : hpPct < 20 ? 'sick' : hpPct < 45 ? 'sad' : hpPct < 75 ? 'ok' : 'happy'
}

// ---- palette (Habitica-ish: outlined, shaded pixel art) ----
const OUT = '#241c30'
const SKIN = '#f3c48d'
const SKIN_SH = '#dc9f65'
const SKIN_HI = '#ffd9a6'
const HAIR = '#5b3b28'
const WHITE = '#ffffff'
const PUP = '#38264a'
const CHK = '#ef9f8e'
const WOOD = '#b07a3a'
const WOOD_SH = '#8a5c28'
const STEEL = '#cfd6e6'
const STEEL_SH = '#98a1b8'
const STEEL_HI = '#eef2fb'
const GOLD = '#f2c94e'
const GOLD_SH = '#c1922a'
const GOLD_HI = '#ffe9a3'
const DARK = '#2f2a3d'

interface Cfg {
  body: string
  bodySh: string
  belt: string
  pants: string
  pantsSh: string
  band?: string
  weapon?: 'wood' | 'sword' | 'katana'
  armor?: string
  armorSh?: string
  armorHi?: string
  sode?: boolean
  shield?: boolean
  shieldC?: string
  shieldSh?: string
  cape?: string
  capeSh?: string
  helmet?: 'cap' | 'kabuto'
  horns?: boolean
  aura?: boolean
  halo?: boolean
}

// 10 stages — el camino del samurái con estética Habitica (gear que evoluciona)
const STAGES: Cfg[] = [
  // Aprendiz — túnica verde + cinta, espada de madera
  { body: '#6fae57', bodySh: '#4d8a3d', belt: '#3f6b30', pants: '#7a5334', pantsSh: '#5c3d26', band: '#c0432f', weapon: 'wood' },
  // Iniciado — túnica azul
  { body: '#4f79c4', bodySh: '#37599b', belt: '#2b447a', pants: '#3a4a6e', pantsSh: '#28324c', band: '#c0432f', weapon: 'wood' },
  // Discípulo — primera espada de acero
  { body: '#4a5f9e', bodySh: '#33456f', belt: '#28345e', pants: '#2c3550', pantsSh: '#1e2438', band: '#c0432f', weapon: 'sword' },
  // Espadachín — cinta dorada, hombreras ligeras
  { body: '#3f4d86', bodySh: '#2c3a68', belt: '#25315a', pants: '#262d46', pantsSh: '#191d31', band: '#e6b93f', weapon: 'sword', sode: true },
  // Guerrero — coraza de acero, capa, casco, escudo
  { body: '#3a4d86', bodySh: '#2a3a68', belt: '#22305a', pants: '#232a44', pantsSh: '#171d33', armor: '#8a94a8', armorSh: '#5d6579', armorHi: '#c3ccdd', weapon: 'sword', sode: true, shield: true, shieldC: '#b8863a', shieldSh: '#8a611f', cape: '#8a3030', capeSh: '#631f1f', helmet: 'cap' },
  // Bushi — acero pulido, capa roja
  { body: '#333f68', bodySh: '#232c4d', belt: '#1c2440', pants: '#1c2138', pantsSh: '#121626', armor: '#9aa4bd', armorSh: '#6b7590', armorHi: '#dfe6f4', weapon: 'katana', sode: true, shield: true, shieldC: '#c9922a', shieldSh: '#9a6f1f', cape: '#b83a3a', capeSh: '#8a2626', helmet: 'cap' },
  // Samurái — casco kabuto, katana
  { body: '#2c3357', bodySh: '#1e2340', belt: '#171d33', pants: '#161a2c', pantsSh: '#0e111f', armor: '#a5622f', armorSh: '#743f1c', armorHi: '#d0894a', weapon: 'katana', sode: true, shield: true, shieldC: '#a5622f', shieldSh: '#743f1c', cape: '#b83a3a', capeSh: '#8a2626', helmet: 'kabuto' },
  // Maestro — armadura lacada púrpura, kabuto con cuernos
  { body: '#2a2547', bodySh: '#1a1630', belt: '#140f28', pants: '#171232', pantsSh: '#0e0a20', armor: '#7a4bb0', armorSh: '#553288', armorHi: '#a87fe0', weapon: 'katana', sode: true, shield: true, shieldC: '#7a4bb0', shieldSh: '#553288', cape: '#3a2b6b', capeSh: '#271b4d', helmet: 'kabuto', horns: true },
  // Gran maestro — carmesí + oro, aura
  { body: '#262038', bodySh: '#180f28', belt: '#140f28', pants: '#160f26', pantsSh: '#0d0819', armor: '#9a3436', armorSh: '#6b2122', armorHi: '#d05a5c', weapon: 'katana', sode: true, shield: true, shieldC: '#c9922a', shieldSh: '#9a6f1f', cape: '#5a1f1f', capeSh: '#3d1414', helmet: 'kabuto', horns: true, aura: true },
  // Leyenda — armadura dorada radiante, aura + halo
  { body: '#1d1834', bodySh: '#100c22', belt: '#3a2b1a', pants: '#160f26', pantsSh: '#0d0819', armor: '#e8c24a', armorSh: '#b98a25', armorHi: '#ffe9a3', weapon: 'katana', sode: true, shield: true, shieldC: '#e8c24a', shieldSh: '#b98a25', cape: '#7a2bb0', capeSh: '#571f83', helmet: 'kabuto', horns: true, aura: true, halo: true },
]

const W = 22
const H = 26

function buildGrid(cfg: Cfg, mood: Mood): (string | null)[][] {
  const g: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  const P = (x: number, y: number, c: string | null) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c
  }
  const R = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P(x, y, c)
  }

  // cape (behind)
  if (cfg.cape) {
    R(5, 12, 16, 21, cfg.cape)
    for (let y = 12; y <= 21; y++) {
      P(5, y, cfg.capeSh || cfg.cape)
      P(16, y, cfg.capeSh || cfg.cape)
    }
    R(5, 21, 16, 21, cfg.capeSh || cfg.cape)
  }

  // weapon behind hand (blade up-right)
  if (cfg.weapon) {
    const blade = cfg.weapon === 'wood' ? WOOD : STEEL
    const bladeSh = cfg.weapon === 'wood' ? WOOD_SH : STEEL_SH
    const pts: [number, number][] = [
      [16, 15],
      [17, 14],
      [17, 13],
      [18, 12],
      [18, 11],
      [19, 10],
      [19, 9],
    ]
    pts.forEach(([x, y]) => {
      P(x, y, blade)
      P(x - 1, y, bladeSh)
    })
    P(15, 16, cfg.weapon === 'katana' ? GOLD : STEEL_SH)
    P(16, 16, cfg.weapon === 'katana' ? GOLD : STEEL_SH)
    P(15, 17, DARK)
    P(16, 17, DARK)
  }

  // legs
  R(8, 20, 9, 23, cfg.pants)
  R(12, 20, 13, 23, cfg.pants)
  R(8, 23, 9, 23, DARK)
  R(12, 23, 13, 23, DARK)
  P(9, 20, cfg.pantsSh)
  P(13, 20, cfg.pantsSh)

  // torso
  R(7, 13, 14, 19, cfg.body)
  for (let y = 13; y <= 19; y++) P(7, y, cfg.bodySh)
  R(7, 18, 14, 18, cfg.belt)
  P(10, 13, WHITE)
  P(11, 13, WHITE)
  P(10, 14, '#e8ebf5')
  P(11, 15, '#e8ebf5')

  // chest armor overlay
  if (cfg.armor) {
    R(7, 13, 14, 17, cfg.armor)
    R(7, 13, 14, 13, cfg.armorHi || cfg.armor)
    for (let y = 13; y <= 17; y++) P(7, y, cfg.armorSh || cfg.armor)
    P(9, 15, GOLD)
    P(12, 15, GOLD)
    R(7, 17, 14, 17, cfg.armorSh || cfg.armor)
  }

  // arms
  R(5, 13, 6, 17, cfg.armor || cfg.body)
  R(15, 13, 16, 17, cfg.armor || cfg.body)
  P(5, 13, cfg.armorSh || cfg.bodySh)
  P(15, 13, cfg.armorHi || cfg.body)
  P(5, 18, SKIN)
  P(6, 18, SKIN)
  P(15, 18, SKIN)
  P(16, 18, SKIN)

  // shoulder guards
  if (cfg.sode && cfg.armor) {
    R(4, 13, 6, 14, cfg.armor)
    R(15, 13, 17, 14, cfg.armor)
    P(4, 13, cfg.armorHi || cfg.armor)
    P(17, 13, cfg.armorHi || cfg.armor)
  }

  // shield (left)
  if (cfg.shield) {
    R(3, 14, 5, 17, cfg.shieldC || STEEL)
    P(3, 14, cfg.shieldSh || STEEL_SH)
    P(3, 17, cfg.shieldSh || STEEL_SH)
    P(5, 14, cfg.shieldSh || STEEL_SH)
    P(5, 17, cfg.shieldSh || STEEL_SH)
    P(4, 15, GOLD_HI)
    P(4, 16, GOLD)
  }

  // neck
  P(10, 12, SKIN_SH)
  P(11, 12, SKIN_SH)

  // head
  R(7, 5, 14, 11, SKIN)
  P(7, 5, null)
  P(14, 5, null)
  P(7, 11, null)
  P(14, 11, null)
  R(7, 5, 14, 5, SKIN_HI)
  P(6, 8, SKIN)
  P(15, 8, SKIN)
  P(14, 9, SKIN_SH)
  P(14, 10, SKIN_SH)

  // hair or helmet
  if (cfg.helmet === 'kabuto') {
    R(7, 3, 14, 5, STEEL)
    R(8, 2, 13, 2, STEEL_HI)
    for (let x = 7; x <= 14; x++) P(x, 5, STEEL_SH)
    P(10, 4, GOLD)
    P(11, 4, GOLD)
    if (cfg.horns) {
      P(6, 2, GOLD)
      P(5, 1, GOLD)
      P(4, 1, GOLD_SH)
      P(15, 2, GOLD)
      P(16, 1, GOLD)
      P(17, 1, GOLD_SH)
    }
    P(6, 5, STEEL_SH)
    P(15, 5, STEEL_SH)
  } else if (cfg.helmet === 'cap') {
    R(7, 4, 14, 5, STEEL)
    R(8, 4, 13, 4, STEEL_HI)
    P(10, 3, GOLD)
    P(11, 3, GOLD)
    P(6, 5, STEEL_SH)
    P(15, 5, STEEL_SH)
  } else {
    R(7, 4, 14, 5, HAIR)
    P(6, 5, HAIR)
    P(15, 5, HAIR)
    R(8, 3, 13, 3, HAIR)
    P(10, 2, HAIR)
    P(11, 2, HAIR)
    R(7, 6, 8, 6, HAIR)
    R(13, 6, 14, 6, HAIR)
  }
  // headband (only with hair)
  if (cfg.band && !cfg.helmet) {
    R(7, 6, 14, 6, cfg.band)
    P(15, 6, cfg.band)
    P(16, 7, cfg.band)
  }

  // ---- face (mood) ----
  const sick = mood === 'sick' || mood === 'ko'
  const eyeC = sick ? '#6f7a80' : PUP
  if (mood === 'ko') {
    P(8, 7, eyeC)
    P(9, 8, eyeC)
    P(9, 7, eyeC)
    P(8, 8, eyeC)
    P(12, 7, eyeC)
    P(13, 8, eyeC)
    P(13, 7, eyeC)
    P(12, 8, eyeC)
  } else {
    R(8, 7, 9, 8, WHITE)
    R(12, 7, 13, 8, WHITE)
    const lower = mood === 'sad' || mood === 'sick'
    P(9, lower ? 8 : 8, eyeC)
    P(12, lower ? 8 : 8, eyeC)
    P(8, 7, WHITE)
    P(13, 7, WHITE)
    if (lower) {
      // tired brow
      P(8, 6, SKIN_SH)
      P(9, 6, SKIN_SH)
      P(12, 6, SKIN_SH)
      P(13, 6, SKIN_SH)
    }
  }
  if (mood === 'happy' || mood === 'ok') {
    P(8, 9, CHK)
    P(13, 9, CHK)
  }
  // mouth
  if (mood === 'happy') {
    P(10, 10, '#7a4a3a')
    P(11, 10, '#7a4a3a')
    P(10, 11, '#c9736a')
    P(11, 11, '#c9736a')
  } else if (mood === 'ok') {
    P(10, 10, '#a2564a')
    P(11, 10, '#a2564a')
  } else {
    // frown
    P(9, 10, '#7a4a3a')
    P(12, 10, '#7a4a3a')
    P(10, 11, '#7a4a3a')
    P(11, 11, '#7a4a3a')
  }

  return g
}

function outlineOf(g: (string | null)[][]): (string | null)[][] {
  const o: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (g[y][x]) continue
      let near = false
      for (let dy = -1; dy <= 1 && !near; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && g[ny][nx]) {
            near = true
            break
          }
        }
      if (near) o[y][x] = OUT
    }
  return o
}

export function Avatar({ s, size = 150 }: { s: Stats; size?: number }) {
  const mood = moodFor(s.hpPct)
  const sick = mood === 'sick' || mood === 'ko'
  const idx = Math.min(STAGES.length - 1, s.avatar.idx)
  const cfg = STAGES[idx]
  const g = buildGrid(cfg, mood)
  const o = outlineOf(g)

  const rects: React.ReactNode[] = []
  const emit = (grid: (string | null)[][], keyp: string) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const c = grid[y][x]
        if (!c) continue
        rects.push(<rect key={keyp + x + '-' + y} x={x} y={y} width={1.02} height={1.02} fill={c} />)
      }
  }
  emit(o, 'o')
  emit(g, 'g')

  const containerStyle: CSSProperties = {
    width: size + 'px',
    height: size + 'px',
    animation: 'bob 3.2s ease-in-out infinite',
    filter:
      (sick ? 'grayscale(.55) brightness(.95) ' : '') +
      (cfg.aura ? 'drop-shadow(0 0 ' + size * 0.05 + 'px ' + GOLD + 'cc)' : ''),
    transition: 'filter .4s',
  }

  return (
    <div style={containerStyle}>
      <svg viewBox={`-2 -1 ${W + 4} ${H + 2}`} width={size} height={size} shapeRendering="crispEdges" style={{ display: 'block', overflow: 'visible' }}>
        {cfg.aura ? <circle cx={11} cy={13} r={13} fill={GOLD} opacity={0.12} /> : null}
        {cfg.halo ? (
          <>
            <ellipse cx={10.5} cy={4} rx={7} ry={2.4} fill="none" stroke={GOLD} strokeWidth={0.8} opacity={0.9} />
            <ellipse cx={10.5} cy={4} rx={7} ry={2.4} fill="none" stroke="#fff" strokeWidth={0.3} opacity={0.7} />
          </>
        ) : null}
        <ellipse cx={10.5} cy={24.6} rx={6.5} ry={1.1} fill="rgba(0,0,0,.18)" />
        {rects}
        {cfg.aura ? (
          <g fill={GOLD_HI}>
            <rect x={2} y={4} width={1.2} height={1.2} />
            <rect x={18.5} y={2.5} width={1.2} height={1.2} />
          </g>
        ) : null}
      </svg>
    </div>
  )
}

export { moodFor }
