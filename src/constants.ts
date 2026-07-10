import type { AchMetric, AvatarStage, BadHabit, PomoSettings, Potion, Reward, Stats, TaskList, Tier } from './types'

export interface Area {
  id: string
  name: string
  color: string
  icon: string
}

export const AREAS: Area[] = [
  { id: 'esp', name: 'Espiritual', color: '#7C5CFF', icon: 'self_improvement' },
  { id: 'lab', name: 'Laboral', color: '#3B82F6', icon: 'work' },
  { id: 'sal', name: 'Salud', color: '#1DA574', icon: 'ecg_heart' },
  { id: 'cre', name: 'Crecimiento personal', color: '#E9990A', icon: 'trending_up' },
  { id: 'dom', name: 'Dominio propio', color: '#EC4899', icon: 'bolt' },
  { id: 'rel', name: 'Relaciones', color: '#FF6B4A', icon: 'diversity_3' },
  { id: 'fin', name: 'Finanzas', color: '#14B8A6', icon: 'savings' },
  { id: 'hog', name: 'Hogar y organización', color: '#64748B', icon: 'home' },
]

export const RANKS = [
  { min: 1, name: 'Aprendiz' },
  { min: 5, name: 'Iniciado' },
  { min: 10, name: 'Constante' },
  { min: 16, name: 'Disciplinado' },
  { min: 24, name: 'Maestro' },
  { min: 34, name: 'Leyenda' },
  { min: 50, name: 'Ascendido' },
]

export const CHESS_PLAN = [
  'Táctica',
  'Finales',
  'Estrategia',
  'Aperturas',
  'Partidas de maestros',
  'Análisis de errores propios',
  'Revisión y planificación',
]

export const REVIEW_QS = [
  { k: 'mejor', q: '¿Qué hice mejor esta semana?' },
  { k: 'falle', q: '¿Dónde fallé?' },
  { k: 'aprendi', q: '¿Qué aprendí?' },
  { k: 'dificil', q: '¿Qué hábito fue el más difícil?' },
  { k: 'facil', q: '¿Qué hábito fue el más fácil?' },
  { k: 'ajuste', q: '¿Qué ajustaré la próxima semana?' },
  { k: 'gracias', q: '¿De qué doy gracias a Dios esta semana?' },
]

export const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', name: 'Comer un dulce', cost: 60, icon: 'cake' },
  { id: 'r2', name: '1 hora de videojuegos', cost: 140, icon: 'sports_esports' },
  { id: 'r3', name: 'Ver una película o serie', cost: 180, icon: 'movie' },
  { id: 'r4', name: 'Pedir comida especial', cost: 300, icon: 'restaurant' },
  { id: 'r5', name: 'Comprar un libro', cost: 450, icon: 'menu_book', minLevel: 1 },
]

export const DEFAULT_POTIONS: Potion[] = [
  { id: 'p1', name: 'Poción menor', heal: 25, cost: 40, icon: 'local_drink' },
  { id: 'p2', name: 'Poción mayor', heal: 60, cost: 90, icon: 'science' },
  { id: 'p3', name: 'Elíxir completo', heal: 9999, cost: 200, icon: 'auto_awesome' },
]

export const DEFAULT_BADHABITS: BadHabit[] = [
  { id: 'b1', name: 'Compra impulsiva', damage: 18, icon: 'money_off' },
  { id: 'b2', name: 'Consumí azúcar en exceso', damage: 12, icon: 'no_food' },
  { id: 'b3', name: 'Trasnoché sin razón', damage: 12, icon: 'bedtime_off' },
  { id: 'b4', name: 'Procrastiné el día', damage: 10, icon: 'hourglass_disabled' },
]

export const TIERS: Omit<Tier, 'idx'>[] = [
  { min: 1, name: 'Brote', color: '#7FD18B', accent: '#4FB765' },
  { min: 5, name: 'Retoño', color: '#63C6E4', accent: '#2FA6C9' },
  { min: 10, name: 'Guardián', color: '#8B7BF0', accent: '#6D5AE6' },
  { min: 16, name: 'Centinela', color: '#F0A64E', accent: '#E0891A' },
  { min: 24, name: 'Campeón', color: '#EC6F9E', accent: '#D6457E' },
  { min: 34, name: 'Ascendido', color: '#F2C14E', accent: '#DBA517' },
]

export interface AchDef {
  id: string
  name: string
  desc: string
  icon: string
  tgt: (s: Stats) => number
  cur: (s: Stats) => number
  test: (s: Stats) => boolean
}

export const ACH: AchDef[] = [
  { id: 'first_goal', name: 'Primer paso', desc: 'Completa tu primera acción', icon: 'flag', tgt: () => 1, cur: (s) => s.unitsEver, test: (s) => s.unitsEver >= 1 },
  { id: 'streak_3', name: 'Encendiendo', desc: '3 días seguidos activo', icon: 'local_fire_department', tgt: () => 3, cur: (s) => s.streak, test: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', name: 'Semana de fuego', desc: '7 días seguidos activo', icon: 'local_fire_department', tgt: () => 7, cur: (s) => s.bestStreak, test: (s) => s.bestStreak >= 7 },
  { id: 'streak_30', name: 'Imparable', desc: '30 días seguidos activo', icon: 'whatshot', tgt: () => 30, cur: (s) => s.bestStreak, test: (s) => s.bestStreak >= 30 },
  { id: 'perfect_week', name: 'Semana perfecta', desc: 'Cumple el 100% de una semana', icon: 'verified', tgt: () => 1, cur: (s) => s.perfectWeeks, test: (s) => s.perfectWeeks >= 1 },
  { id: 'level_5', name: 'Nivel 5', desc: 'Alcanza el nivel 5', icon: 'military_tech', tgt: () => 5, cur: (s) => s.level, test: (s) => s.level >= 5 },
  { id: 'level_10', name: 'Nivel 10', desc: 'Alcanza el nivel 10', icon: 'military_tech', tgt: () => 10, cur: (s) => s.level, test: (s) => s.level >= 10 },
  { id: 'level_20', name: 'Nivel 20', desc: 'Alcanza el nivel 20', icon: 'workspace_premium', tgt: () => 20, cur: (s) => s.level, test: (s) => s.level >= 20 },
  { id: 'xp_1000', name: 'Mil de XP', desc: 'Acumula 1.000 XP ganado', icon: 'bolt', tgt: () => 1000, cur: (s) => s.earnedXP, test: (s) => s.earnedXP >= 1000 },
  { id: 'xp_5000', name: 'Cinco mil', desc: 'Acumula 5.000 XP ganado', icon: 'bolt', tgt: () => 5000, cur: (s) => s.earnedXP, test: (s) => s.earnedXP >= 5000 },
  { id: 'first_reward', name: 'Date un gusto', desc: 'Reclama tu primera recompensa', icon: 'redeem', tgt: () => 1, cur: (s) => s.rewardsClaimed, test: (s) => s.rewardsClaimed >= 1 },
  { id: 'reward_10', name: 'Bien merecido', desc: 'Reclama 10 recompensas', icon: 'redeem', tgt: () => 10, cur: (s) => s.rewardsClaimed, test: (s) => s.rewardsClaimed >= 10 },
  { id: 'chess_10', name: 'Ajedrecista', desc: 'Registra 10 partidas', icon: 'chess', tgt: () => 10, cur: (s) => s.chessGames, test: (s) => s.chessGames >= 10 },
  { id: 'chess_100', name: '100 partidas', desc: 'Registra 100 partidas', icon: 'chess', tgt: () => 100, cur: (s) => s.chessGames, test: (s) => s.chessGames >= 100 },
  { id: 'chess_5h', name: 'Estudio profundo', desc: '5 horas de estudio de ajedrez', icon: 'timer', tgt: () => 300, cur: (s) => s.chessMin, test: (s) => s.chessMin >= 300 },
  { id: 'reflect_1', name: 'Introspección', desc: 'Completa tu primera revisión dominical', icon: 'auto_stories', tgt: () => 1, cur: (s) => s.reflections, test: (s) => s.reflections >= 1 },
  { id: 'reflect_4', name: 'Un mes de reflexión', desc: 'Completa 4 revisiones dominicales', icon: 'auto_stories', tgt: () => 4, cur: (s) => s.reflections, test: (s) => s.reflections >= 4 },
  { id: 'area_3', name: 'Especialista', desc: 'Lleva un área al nivel 3', icon: 'star', tgt: () => 3, cur: (s) => s.maxAreaLvl, test: (s) => s.maxAreaLvl >= 3 },
  { id: 'allround_2', name: 'Equilibrio', desc: 'Todas las áreas en nivel 2+', icon: 'hub', tgt: () => 8, cur: (s) => s.areasAt2, test: (s) => s.areasAt2 >= 8 },
]

// [areaId, title, type, xp, targetValue, priority]
export const SUGGESTED: [string, string, string, number, number, string][] = [
  ['esp', 'Levantarme 5:30 a.m. al menos 5 días', 'daily', 15, 5, 'main'],
  ['esp', 'Escuchar una prédica diaria', 'daily', 8, 7, 'side'],
  ['esp', 'Leer un capítulo de la Biblia cada día', 'daily', 10, 7, 'main'],
  ['esp', 'Memorizar un versículo', 'weekly', 30, 1, 'side'],
  ['esp', 'Orar 10 minutos diarios', 'daily', 10, 7, 'main'],
  ['esp', 'Orar por tres personas cada día', 'daily', 8, 7, 'side'],
  ['esp', 'Ayunar 3 veces', 'count', 40, 3, 'main'],
  ['lab', '85% de confirmación en la tienda', 'weekly', 50, 1, 'main'],
  ['lab', 'Publicar 3 productos nuevos', 'count', 20, 3, 'main'],
  ['lab', 'No procrastinar al iniciar la jornada', 'daily', 12, 5, 'main'],
  ['lab', 'Completar 1 funcionalidad importante', 'weekly', 60, 1, 'main'],
  ['lab', 'Completar 5 tareas de prioridad media', 'count', 12, 5, 'side'],
  ['lab', '2 bloques de trabajo profundo (60-90 min)', 'daily', 18, 7, 'main'],
  ['sal', 'Dormir 10 p.m. y levantarme 5 a.m.', 'daily', 12, 7, 'main'],
  ['sal', 'Celular fuera del cuarto desde las 8 p.m.', 'daily', 10, 7, 'side'],
  ['sal', '30 min de ejercicio 3 veces', 'count', 25, 3, 'main'],
  ['sal', '2 litros de agua diarios', 'daily', 8, 7, 'main'],
  ['sal', 'No consumir azúcar 3 días', 'count', 20, 3, 'side'],
  ['sal', 'Descanso de 15 min al almuerzo', 'daily', 6, 5, 'side'],
  ['sal', '10 min de sol cada mañana', 'daily', 8, 7, 'side'],
  ['cre', 'Estudiar un idioma 15 min diarios', 'daily', 12, 7, 'main'],
  ['cre', 'Leer 20 páginas diarias', 'daily', 15, 7, 'main'],
  ['cre', 'Estudiar ajedrez 30 min diarios', 'daily', 15, 7, 'main'],
  ['cre', 'Jugar 3 partidas diarias y analizarlas', 'daily', 12, 7, 'side'],
  ['rel', 'Llamar a un familiar', 'weekly', 20, 1, 'main'],
  ['fin', 'No hacer compras impulsivas', 'daily', 15, 7, 'main'],
  ['hog', 'Barrer el cuarto todos los días', 'daily', 8, 7, 'side'],
  ['hog', 'Limpiar dos habitaciones', 'count', 20, 2, 'main'],
]

export const METRIC_LABELS: Record<AchMetric, string> = {
  goal: 'Completar una meta X veces',
  streak: 'Días de racha (récord)',
  level: 'Nivel alcanzado',
  xp: 'XP total ganado',
  chess: 'Partidas de ajedrez',
}

export function maxHP(level: number): number {
  return 100 + (level - 1) * 20
}

export function tierFor(level: number): Tier {
  let t = TIERS[0]
  let idx = 0
  TIERS.forEach((x, i) => {
    if (level >= x.min) {
      t = x
      idx = i
    }
  })
  return { ...t, idx }
}

// ---------- Avatar: 10 stages, el camino del samurái (Aprendiz → Leyenda) ----------
export const AVATAR_STAGES: Omit<AvatarStage, 'idx'>[] = [
  { min: 1, name: 'Aprendiz' },
  { min: 3, name: 'Iniciado' },
  { min: 6, name: 'Discípulo' },
  { min: 9, name: 'Espadachín' },
  { min: 13, name: 'Guerrero' },
  { min: 18, name: 'Bushi' },
  { min: 24, name: 'Samurái' },
  { min: 31, name: 'Maestro' },
  { min: 40, name: 'Gran maestro' },
  { min: 50, name: 'Leyenda' },
]

export function avatarStageFor(level: number): AvatarStage {
  let st = AVATAR_STAGES[0]
  let idx = 0
  AVATAR_STAGES.forEach((x, i) => {
    if (level >= x.min) {
      st = x
      idx = i
    }
  })
  return { ...st, idx }
}

// ---------- Tareas + Pomodoro ----------
export const DEFAULT_LISTS: TaskList[] = [
  { id: 'inbox', name: 'Bandeja', icon: 'inbox', color: '#8A87A0' },
  { id: 'work', name: 'Trabajo', icon: 'work', color: '#3B82F6' },
  { id: 'study', name: 'Estudio', icon: 'menu_book', color: '#E9990A' },
  { id: 'personal', name: 'Personal', icon: 'person', color: '#1DA574' },
]

export const DEFAULT_POMO_SETTINGS: PomoSettings = {
  workMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  longEvery: 4,
  notifyOnDone: false,
  tickSound: false,
}

export const TASK_PRIORITIES: { id: 'urgent' | 'important' | 'anytime' | 'backlog'; name: string; color: string }[] = [
  { id: 'urgent', name: 'Urgente', color: '#E14748' },
  { id: 'important', name: 'Importante', color: '#E9990A' },
  { id: 'anytime', name: 'Cuando sea', color: '#3B82F6' },
  { id: 'backlog', name: 'Backlog', color: '#8A87A0' },
]

// Nota: Tareas y Pomodoro son solo productividad — NO otorgan XP ni monedas.
// Solo las Metas dan la experiencia/monedas que el usuario define.
