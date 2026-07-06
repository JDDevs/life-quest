export type GoalType = 'daily' | 'count' | 'weekly' | 'dailyCount'
export type GoalPriority = 'main' | 'side'

export interface Goal {
  id: string
  areaId: string
  title: string
  priority: GoalPriority
  type: GoalType
  xp: number
  /** XP awarded for each rep beyond the target (count-type goals only). */
  extraXp?: number
  /** Spendable coins awarded per completion. Falls back to `xp` (1:1) if unset. */
  coins?: number
  /** Coins awarded per rep beyond target (count-type). Falls back to extraXp. */
  extraCoins?: number
  penalty: number
  targetDays?: number
  target?: number
  /** Per-day target for `dailyCount` goals (e.g. 3 chapters/day). */
  dailyTarget?: number
  checks?: boolean[]
  count?: number
  /** Per-day counts for `dailyCount` goals (length 7, Mon–Sun). */
  counts?: number[]
  done?: boolean
}

// ---------- Tareas / Pomodoro (TickTick-style) ----------
export type TaskPriority = 'urgent' | 'important' | 'anytime' | 'backlog'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  notes: string
  listId: string
  tags: string[]
  priority: TaskPriority
  estPomos: number
  spentPomos: number
  focusMinutes: number
  due: string | null
  done: boolean
  doneDate: string | null
  createdAt: string
  subtasks: Subtask[]
  /** Optional link to a weekly goal (by its title) to track contribution. */
  linkedGoal?: string
}

export interface TaskList {
  id: string
  name: string
  icon: string
  color: string
}

export interface PomoSettings {
  workMin: number
  breakMin: number
  longBreakMin: number
  longEvery: number
}

export interface PomoSession {
  id: string
  date: string
  start: number
  end: number
  minutes: number
  taskId: string | null
  taskTitle: string
  mode: 'pomo' | 'stopwatch'
}

// Running timer state. Time-based (anchorTs + baseSec) so any device can
// reconstruct the exact remaining/elapsed time — and so it can be synced.
export interface PomoRun {
  running: boolean
  mode: 'pomo' | 'stopwatch'
  phase: 'work' | 'break'
  cycle: number
  taskId: string | null
  anchorTs: number | null
  baseSec: number
}

export interface Reward {
  id: string
  name: string
  cost: number
  icon: string
  minLevel?: number
}

export interface Potion {
  id: string
  name: string
  heal: number
  cost: number
  icon: string
}

export interface BadHabit {
  id: string
  name: string
  damage: number
  icon: string
}

export interface HabitLogEntry {
  id: string
  habitId: string
  name: string
  damage: number
  date: string
}

export interface Claim {
  id: string
  type: 'reward' | 'potion'
  rewardId?: string
  name: string
  cost: number
  date: string
}

export interface ChessLog {
  id: string
  date: string
  day: number
  theme: string
  games: number
  minutes: number
  result: string
  notes: string
}

export interface Review {
  done: boolean
  [key: string]: string | boolean
}

export type AchMetric = 'goal' | 'streak' | 'level' | 'xp' | 'chess'

export interface CustomAch {
  id: string
  name: string
  icon: string
  metric: AchMetric
  goalTitle: string
  target: number
  unlocked: string | null
}

export interface DailyNote {
  mood?: string | null
  note?: string
}

export interface Focus {
  date: string
  goalId: string
}

export interface AppData {
  version: number
  createdAt: string
  currentWeek: string
  weekStart: Record<string, string>
  goals: Record<string, Goal[]>
  rewards: Reward[]
  potions: Potion[]
  badHabits: BadHabit[]
  habitLog: HabitLogEntry[]
  hp: number | null
  claims: Claim[]
  chessPlan: string[]
  chess: { logs: ChessLog[] }
  reviews: Record<string, Review>
  activeDates: Record<string, boolean>
  achievements: Record<string, string>
  customAch: CustomAch[]
  dailyNotes: Record<string, DailyNote>
  focus: Focus | null
  muted: boolean
  theme: 'light' | 'dark'
  // tareas + pomodoro
  lists: TaskList[]
  tasks: Task[]
  pomoSettings: PomoSettings
  pomoSessions: PomoSession[]
  pomoRun: PomoRun
}

export interface LevelInfo {
  level: number
  into: number
  need: number
}

export interface Tier {
  min: number
  name: string
  color: string
  accent: string
  idx: number
}

export interface AvatarStage {
  min: number
  name: string
  idx: number
}

export interface Stats {
  earnedXP: number
  penaltyXP: number
  curRiskXP: number
  spent: number
  coins: number
  available: number
  hp: number
  maxHP: number
  hpPct: number
  tier: Tier
  avatar: AvatarStage
  level: number
  into: number
  need: number
  rank: string
  streak: number
  bestStreak: number
  areaEarned: Record<string, number>
  areaLvl: Record<string, LevelInfo>
  maxAreaLvl: number
  areasAt2: number
  weekXP: Record<string, number>
  weekPct: Record<string, number>
  perfectWeeks: number
  unitsEver: number
  chessGames: number
  chessMin: number
  chessXP: number
  reflections: number
  rewardsClaimed: number
  goalUnitsByTitle: Record<string, number>
  curPct: number
  // tareas + pomodoro (informativo; no aportan XP ni monedas)
  tasksDone: number
  pomosToday: number
  focusMinToday: number
  pomosTotal: number
  focusMinTotal: number
}

export type View =
  | 'dash'
  | 'metas'
  | 'tareas'
  | 'pomodoro'
  | 'tienda'
  | 'logros'
  | 'ajedrez'
  | 'revision'
  | 'historial'

export type ShopTab = 'rewards' | 'potions'

export interface ChessDraft {
  games: string
  minutes: string
  result: string
  notes: string
}

export type Palette = typeof import('./theme').LIGHT
