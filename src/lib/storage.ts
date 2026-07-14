import {
  CHESS_PLAN,
  DEFAULT_BADHABITS,
  DEFAULT_LISTS,
  DEFAULT_POMO_SETTINGS,
  DEFAULT_POTIONS,
  DEFAULT_REWARDS,
} from '../constants'
import type { AppData } from '../types'
import { dateKey, mondayKey } from './date'

export const KEY = 'gce_state_v2'

export function seed(): AppData {
  const wk = mondayKey(new Date())
  return {
    version: 2,
    createdAt: dateKey(new Date()),
    currentWeek: wk,
    weekStart: { [wk]: wk },
    goals: { [wk]: [] },
    rewards: DEFAULT_REWARDS.map((r) => ({ ...r })),
    potions: DEFAULT_POTIONS.map((p) => ({ ...p })),
    badHabits: DEFAULT_BADHABITS.map((b) => ({ ...b })),
    habitLog: [],
    hp: null,
    claims: [],
    chessPlan: CHESS_PLAN.slice(),
    chess: { logs: [] },
    reviews: {},
    activeDates: {},
    achievements: {},
    customAch: [],
    dailyNotes: {},
    focus: null,
    muted: false,
    theme: 'light',
    lists: DEFAULT_LISTS.map((l) => ({ ...l })),
    tasks: [],
    pomoSettings: { ...DEFAULT_POMO_SETTINGS },
    pomoSessions: [],
    pomoRun: { running: false, mode: 'pomo', phase: 'work', cycle: 0, taskId: null, anchorTs: null, baseSec: DEFAULT_POMO_SETTINGS.workMin * 60, loggedSec: 0, lastCompletedAnchor: null },
    taskTemplates: [],
    goalTemplates: [],
  }
}

export function migrate(input: Partial<AppData>): AppData {
  const d = input as AppData
  d.weekStart = d.weekStart || {}
  d.goals = d.goals || {}
  d.rewards = d.rewards || DEFAULT_REWARDS.map((r) => ({ ...r }))
  d.potions = d.potions || DEFAULT_POTIONS.map((p) => ({ ...p }))
  d.badHabits = d.badHabits || DEFAULT_BADHABITS.map((b) => ({ ...b }))
  d.habitLog = d.habitLog || []
  // Anchor the "días sin caer" streak for habits created before it existed.
  d.badHabits.forEach((b) => {
    if (!b.startedAt) b.startedAt = d.createdAt || dateKey(new Date())
  })
  if (d.hp === undefined) d.hp = null
  d.claims = d.claims || []
  d.chessPlan = d.chessPlan || CHESS_PLAN.slice()
  d.chess = d.chess || { logs: [] }
  d.reviews = d.reviews || {}
  d.activeDates = d.activeDates || {}
  d.achievements = d.achievements || {}
  d.customAch = d.customAch || []
  d.dailyNotes = d.dailyNotes || {}
  if (d.focus === undefined) d.focus = null
  d.theme = d.theme || 'light'
  d.lists = d.lists || DEFAULT_LISTS.map((l) => ({ ...l }))
  d.tasks = d.tasks || []
  d.pomoSettings = d.pomoSettings || { ...DEFAULT_POMO_SETTINGS }
  if (d.pomoSettings.notifyOnDone === undefined) d.pomoSettings.notifyOnDone = false
  if (d.pomoSettings.tickSound === undefined) d.pomoSettings.tickSound = false
  d.pomoSessions = d.pomoSessions || []
  d.pomoRun = d.pomoRun || {
    running: false,
    mode: 'pomo',
    phase: 'work',
    cycle: 0,
    taskId: null,
    anchorTs: null,
    baseSec: (d.pomoSettings.workMin || 25) * 60,
    loggedSec: 0,
    lastCompletedAnchor: null,
  }
  if (d.pomoRun.loggedSec === undefined) d.pomoRun.loggedSec = 0
  if (d.pomoRun.lastCompletedAnchor === undefined) d.pomoRun.lastCompletedAnchor = null
  d.taskTemplates = d.taskTemplates || []
  d.goalTemplates = d.goalTemplates || []
  if (!d.currentWeek) {
    const wk = mondayKey(new Date())
    d.currentWeek = wk
    d.goals[wk] = d.goals[wk] || []
    d.weekStart[wk] = wk
  }
  return d
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw)
      return migrate(d)
    }
  } catch {
    /* ignore */
  }
  return seed()
}

export function persist(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}
