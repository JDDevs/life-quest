import { create } from 'zustand'
import {
  ACH,
  AREAS,
  CHESS_PLAN,
  DEFAULT_POTIONS,
  DEFAULT_REWARDS,
  SUGGESTED,
  maxHP,
} from './constants'
import { cloudEnabled } from './lib/cloud'
import { celebrate, levelUpFx, playSound } from './fx'
import { notifyPomoDone } from './lib/notify'
import { addDays, dateKey, mondayKey, parseKey, todayIdx } from './lib/date'
import { goalUnits } from './lib/goals'
import { computeStats } from './lib/stats'
import { clone, load, migrate, persist, seed } from './lib/storage'
import { palette } from './theme'
import type {
  AppData,
  BadHabit,
  ChessDraft,
  CustomAch,
  Goal,
  PomoRun,
  Potion,
  Reward,
  ShopTab,
  Stats,
  Subtask,
  Task,
  TaskList,
  TaskPriority,
  View,
} from './types'

export type TaskView = 'today' | 'next7' | 'inbox' | 'all' | string

export interface TaskForm {
  id?: string
  title: string
  notes: string
  listId: string
  tags: string[]
  priority: TaskPriority
  estPomos: number | string
  due: string | null
  subtasks: Subtask[]
  linkedGoal: string
  images: string[]
  /** When set, the TaskModal edits this template instead of a task. */
  templateId?: string
}

// The running timer now lives inside `data` (so it syncs across devices). It is
// time-based: `anchorTs` + `baseSec` let any device reconstruct the exact
// remaining/elapsed time via Date.now().
export function pomoRemainingOf(run: PomoRun): number {
  if (run.mode !== 'pomo') return run.baseSec
  if (!run.running || run.anchorTs == null) return run.baseSec
  return Math.max(0, run.baseSec - Math.floor((Date.now() - run.anchorTs) / 1000))
}
export function pomoElapsedOf(run: PomoRun): number {
  if (run.mode !== 'stopwatch') return run.baseSec
  if (!run.running || run.anchorTs == null) return run.baseSec
  return run.baseSec + Math.floor((Date.now() - run.anchorTs) / 1000)
}

export function areaColor(id: string): string {
  const a = AREAS.find((x) => x.id === id)
  return a ? a.color : '#6D5AE6'
}

function customValue(ca: CustomAch, s: Stats): number {
  if (ca.metric === 'level') return s.level
  if (ca.metric === 'xp') return s.earnedXP
  if (ca.metric === 'streak') return s.bestStreak
  if (ca.metric === 'chess') return s.chessGames
  return s.goalUnitsByTitle[(ca.goalTitle || '').trim().toLowerCase()] || 0
}

function checkAch(data: AppData, s: Stats): void {
  const theme = data.theme
  ACH.forEach((a) => {
    if (!data.achievements[a.id] && a.test(s)) {
      data.achievements[a.id] = dateKey(new Date())
      setTimeout(() => {
        celebrate(theme, '🏆 ' + a.name, palette(theme).gold)
        playSound('level', data.muted)
      }, 200)
    }
  })
  ;(data.customAch || []).forEach((ca) => {
    if (!ca.unlocked && customValue(ca, s) >= ca.target) {
      ca.unlocked = dateKey(new Date())
      setTimeout(() => {
        celebrate(theme, '🏆 ' + ca.name, palette(theme).gold)
        playSound('level', data.muted)
      }, 200)
    }
  })
}

// forms
export interface GoalForm {
  id?: string
  areaId: string
  title: string
  priority: 'main' | 'side'
  type: 'daily' | 'count' | 'weekly' | 'dailyCount'
  xp: number | string
  coins: number | string
  extraXp: number | string
  extraCoins: number | string
  penalty: number | string
  targetDays: number | string
  target: number | string
  dailyTarget: number | string
  /** When set, the GoalModal edits this template instead of a goal. */
  templateId?: string
}
export interface RewardForm {
  id?: string
  kind: 'reward' | 'potion'
  name: string
  cost: number | string
  icon: string
  heal: number | string
  minLevel: number | string
}
export interface HabitForm {
  id?: string
  name: string
  damage: number | string
  icon: string
}
export interface AchForm {
  id?: string
  name: string
  icon: string
  metric: CustomAch['metric']
  goalTitle: string
  target: number | string
  unlocked?: string | null
}

interface StoreState {
  data: AppData
  view: View
  goalForm: GoalForm | null
  rewardForm: RewardForm | null
  histWeek: string | null
  chessDraft: ChessDraft
  settings: boolean
  achForm: AchForm | null
  habitForm: HabitForm | null
  shopTab: ShopTab
  narrow: boolean
  tick: number

  // tareas + pomodoro ui
  taskView: TaskView
  taskForm: TaskForm | null

  // avatar progression modal
  avatarModal: boolean

  // AI assistant chat modal
  assistant: boolean

  // cloud sync
  syncStatus: 'disabled' | 'syncing' | 'synced' | 'error' | 'offline'

  // derived
  stats: () => Stats
  curGoals: () => Goal[]

  // ui
  setView: (v: View) => void
  setNarrow: (n: boolean) => void
  setShopTab: (t: ShopTab) => void
  setHistWeek: (wk: string | null) => void
  setSettings: (open: boolean) => void
  setChessDraft: (d: ChessDraft) => void

  // theme / sound
  toggleTheme: () => void
  toggleMuted: () => void

  // goal completion
  toggleDay: (goalId: string, i: number) => void
  incCount: (goalId: string, delta: number) => void
  incDayCount: (goalId: string, dayIdx: number, delta: number) => void
  toggleWeekly: (goalId: string) => void

  // goal crud
  openGoalForm: (g?: Goal) => void
  setGoalForm: (f: GoalForm | null) => void
  saveGoal: (f: GoalForm) => void
  deleteGoal: (id: string) => void
  importSuggested: () => void
  reorderGoal: (activeId: string, overId: string) => void

  // rewards / potions
  claimReward: (r: Reward) => void
  buyPotion: (p: Potion) => void
  openRewardForm: (r?: Reward | Potion | null, kind?: 'reward' | 'potion') => void
  setRewardForm: (f: RewardForm | null) => void
  saveReward: (f: RewardForm) => void
  deleteReward: (id: string) => void

  // bad habits
  openHabitForm: (b?: BadHabit) => void
  setHabitForm: (f: HabitForm | null) => void
  saveHabit: (f: HabitForm) => void
  deleteHabit: (id: string) => void
  logHabit: (b: BadHabit) => void
  undoHabit: (logId: string) => void
  habitCountWeek: (id: string) => number

  // chess
  addChessLog: () => void
  delChessLog: (id: string) => void
  setPlan: (i: number, v: string) => void

  // review
  setReview: (wk: string, k: string, v: string) => void
  finishReview: (wk: string) => void

  // weeks
  startNewWeek: (copy: boolean) => void
  gotoWeek: (wk: string) => void

  // backup
  exportData: () => void
  importData: (file: File | undefined) => void
  resetAll: () => void

  // daily note / mood / focus
  setMood: (m: string) => void
  setNote: (v: string) => void
  setFocus: (id: string) => void
  clearFocus: () => void

  // custom achievements
  openAchForm: (a?: CustomAch) => void
  setAchForm: (f: AchForm | null) => void
  saveCustomAch: (f: AchForm) => void
  deleteCustomAch: (id: string) => void

  // tareas
  setTaskView: (v: TaskView) => void
  openTaskForm: (t?: Task) => void
  setTaskForm: (f: TaskForm | null) => void
  saveTask: (f: TaskForm) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  quickAddTask: (title: string) => void
  toggleSubtask: (taskId: string, subId: string) => void
  reorderTask: (activeId: string, overId: string) => void
  addList: (name: string, icon: string, color: string) => void
  deleteList: (id: string) => void

  // templates
  saveTaskTemplate: (f: TaskForm) => void
  deleteTaskTemplate: (id: string) => void
  createTaskFromTemplate: (id: string) => void
  saveGoalTemplate: (f: GoalForm) => void
  deleteGoalTemplate: (id: string) => void
  useGoalTemplate: (id: string) => void
  updateTaskTemplate: (id: string, f: TaskForm) => void
  updateGoalTemplate: (id: string, f: GoalForm) => void
  templatesModal: boolean
  setTemplatesModal: (open: boolean) => void

  // pomodoro
  setPomoTask: (id: string | null) => void
  setPomoMode: (m: 'pomo' | 'stopwatch') => void
  updatePomoSettings: (patch: Partial<AppData['pomoSettings']>) => void
  logPomoSession: (args: { minutes: number; mode: 'pomo' | 'stopwatch'; taskId: string | null; start: number; end: number }) => void
  // timer controls (state persisted across tab switches & reloads)
  pomoStart: () => void
  pomoPause: () => void
  pomoStopLog: () => void
  pomoReset: () => void
  pomoTick: () => void

  // avatar modal
  setAvatarModal: (open: boolean) => void

  // AI assistant modal
  setAssistant: (open: boolean) => void

  // cloud sync
  setSyncStatus: (s: StoreState['syncStatus']) => void
  replaceData: (data: AppData) => void
}

export const useStore = create<StoreState>((set, get) => {
  /** Clone data, run mutator (may play sound / return a celebrate thunk),
   *  then detect level-ups, check achievements, persist and re-render. */
  function apply(mutator: (data: AppData) => void | (() => void)): void {
    const data = clone(get().data)
    const before = computeStats(data)
    const fx = mutator(data)
    const after = computeStats(data)
    if (after.level > before.level) {
      data.hp = maxHP(after.level)
      levelUpFx(after.level, after.rank)
      playSound('level', data.muted)
    }
    checkAch(data, computeStats(data))
    persist(data)
    set({ data, tick: Date.now() })
    if (fx) fx()
  }

  /** Lightweight patch: no level/achievement side effects (settings, notes, plans). */
  function patch(mutator: (data: AppData) => void, extra?: Partial<StoreState>): void {
    const data = clone(get().data)
    mutator(data)
    persist(data)
    set({ data, tick: Date.now(), ...extra })
  }

  function markToday(data: AppData): void {
    data.activeDates[dateKey(new Date())] = true
  }
  function ensureHP(data: AppData): void {
    if (data.hp == null) data.hp = maxHP(computeStats(data).level)
  }

  return {
    data: load(),
    view: 'dash',
    goalForm: null,
    rewardForm: null,
    histWeek: null,
    chessDraft: { games: '', minutes: '', result: '', notes: '' },
    settings: false,
    achForm: null,
    habitForm: null,
    shopTab: 'rewards',
    narrow: typeof window !== 'undefined' && window.innerWidth < 760,
    tick: 0,

    taskView: 'today',
    taskForm: null,
    avatarModal: false,
    assistant: false,
    templatesModal: false,

    syncStatus: cloudEnabled() ? 'syncing' : 'disabled',

    stats: () => computeStats(get().data),
    curGoals: () => {
      const d = get().data
      return d.goals[d.currentWeek] || []
    },

    setView: (v) => set({ view: v, histWeek: null }),
    setNarrow: (n) => {
      if (n !== get().narrow) set({ narrow: n })
    },
    setShopTab: (t) => set({ shopTab: t }),
    setHistWeek: (wk) => set({ histWeek: wk }),
    setSettings: (open) => set({ settings: open }),
    setChessDraft: (d) => set({ chessDraft: d }),

    toggleTheme: () =>
      patch((d) => {
        d.theme = d.theme === 'dark' ? 'light' : 'dark'
      }),
    toggleMuted: () =>
      patch((d) => {
        d.muted = !d.muted
      }),

    toggleDay: (goalId, i) =>
      apply((data) => {
        const g = (data.goals[data.currentWeek] || []).find((x) => x.id === goalId)
        if (!g) return
        g.checks = g.checks || Array(7).fill(false)
        const was = g.checks[i]
        g.checks[i] = !was
        if (g.checks[i]) {
          const coin = g.coins ?? g.xp
          g.log = g.log || []
          g.log.push(Date.now())
          markToday(data)
          playSound('tick', data.muted)
          return () => celebrate(data.theme, '+' + g.xp + ' XP · +' + coin + ' 🪙', areaColor(g.areaId))
        } else if (g.log && g.log.length) {
          g.log.pop()
        }
      }),
    incCount: (goalId, delta) =>
      apply((data) => {
        const g = (data.goals[data.currentWeek] || []).find((x) => x.id === goalId)
        if (!g) return
        const prev = g.count || 0
        g.count = Math.max(0, prev + delta)
        if (delta > 0) {
          // beyond the target each rep grants the "extra" xp/coins instead of base
          const target = g.target || 1
          const beyond = prev >= target
          const gained = beyond ? g.extraXp || 0 : g.xp
          const coin = beyond ? g.extraCoins ?? g.extraXp ?? 0 : g.coins ?? g.xp
          g.log = g.log || []
          g.log.push(Date.now())
          markToday(data)
          playSound('tick', data.muted)
          return () =>
            celebrate(data.theme, '+' + gained + ' XP · +' + coin + ' 🪙' + (beyond ? ' extra' : ''), areaColor(g.areaId))
        } else if (g.count < prev && g.log && g.log.length) {
          g.log.pop()
        }
      }),
    incDayCount: (goalId, dayIdx, delta) =>
      apply((data) => {
        const g = (data.goals[data.currentWeek] || []).find((x) => x.id === goalId)
        if (!g) return
        g.counts = g.counts || Array(7).fill(0)
        const prev = g.counts[dayIdx] || 0
        g.counts[dayIdx] = Math.max(0, prev + delta)
        if (delta > 0) {
          const dt = g.dailyTarget || 1
          const beyond = prev >= dt
          const gained = beyond ? g.extraXp || 0 : g.xp
          const coin = beyond ? g.extraCoins ?? g.extraXp ?? 0 : g.coins ?? g.xp
          g.log = g.log || []
          g.log.push(Date.now())
          markToday(data)
          playSound('tick', data.muted)
          return () =>
            celebrate(data.theme, '+' + gained + ' XP · +' + coin + ' 🪙' + (beyond ? ' extra' : ''), areaColor(g.areaId))
        } else if (g.counts[dayIdx] < prev && g.log && g.log.length) {
          g.log.pop()
        }
      }),
    toggleWeekly: (goalId) =>
      apply((data) => {
        const g = (data.goals[data.currentWeek] || []).find((x) => x.id === goalId)
        if (!g) return
        g.done = !g.done
        if (g.done) {
          const coin = g.coins ?? g.xp
          g.log = g.log || []
          g.log.push(Date.now())
          markToday(data)
          playSound('tick', data.muted)
          return () => celebrate(data.theme, '+' + g.xp + ' XP · +' + coin + ' 🪙', areaColor(g.areaId))
        } else if (g.log && g.log.length) {
          g.log.pop()
        }
      }),

    openGoalForm: (g) =>
      set({
        goalForm: g
          ? {
              ...g,
              targetDays: g.targetDays || 7,
              target: g.target || 3,
              dailyTarget: g.dailyTarget || 3,
              coins: g.coins ?? g.xp,
              extraXp: g.extraXp ?? 5,
              extraCoins: g.extraCoins ?? g.extraXp ?? 5,
              penalty: g.penalty || 0,
            }
          : {
              areaId: 'esp',
              title: '',
              priority: 'main',
              type: 'daily',
              xp: 10,
              coins: 10,
              extraXp: 5,
              extraCoins: 5,
              penalty: 6,
              targetDays: 7,
              target: 3,
              dailyTarget: 3,
            },
      }),
    setGoalForm: (f) => set({ goalForm: f }),
    saveGoal: (f) => {
      apply((data) => {
        const arr = data.goals[data.currentWeek]
        const g: Goal = {
          id: f.id || 'g' + Date.now() + Math.random().toString(36).slice(2, 6),
          areaId: f.areaId,
          title: f.title.trim(),
          priority: f.priority,
          type: f.type,
          xp: Math.max(0, +f.xp || 0),
          coins: Math.max(0, +f.coins || 0),
          extraXp: f.type === 'count' || f.type === 'dailyCount' ? Math.max(0, +f.extraXp || 0) : undefined,
          extraCoins: f.type === 'count' || f.type === 'dailyCount' ? Math.max(0, +f.extraCoins || 0) : undefined,
          penalty: f.priority === 'main' ? Math.max(0, +f.penalty || 0) : 0,
          targetDays: f.type === 'daily' || f.type === 'dailyCount' ? Math.min(7, Math.max(1, +f.targetDays || 7)) : undefined,
          target: f.type === 'count' ? Math.max(1, +f.target || 1) : undefined,
          dailyTarget: f.type === 'dailyCount' ? Math.max(1, +f.dailyTarget || 1) : undefined,
        }
        if (f.id) {
          const i = arr.findIndex((x) => x.id === f.id)
          const old = arr[i]
          g.checks = old.checks
          g.count = old.count
          g.counts = old.counts
          g.done = old.done
          g.log = old.log
          arr[i] = g
        } else arr.push(g)
        // ensure the progress field for this type exists
        if (g.type === 'daily' && !g.checks) g.checks = Array(7).fill(false)
        if (g.type === 'count' && g.count == null) g.count = 0
        if (g.type === 'dailyCount' && !g.counts) g.counts = Array(7).fill(0)
        if (g.type === 'weekly' && g.done == null) g.done = false
      })
      set({ goalForm: null })
    },
    deleteGoal: (id) => {
      apply((data) => {
        data.goals[data.currentWeek] = data.goals[data.currentWeek].filter((g) => g.id !== id)
      })
      set({ goalForm: null })
    },
    importSuggested: () =>
      apply((data) => {
        const arr = data.goals[data.currentWeek]
        SUGGESTED.forEach(([areaId, title, type, xp, tv, priority]) => {
          const g: Goal = {
            id: 'g' + Date.now() + Math.random().toString(36).slice(2, 7),
            areaId,
            title,
            priority: priority as Goal['priority'],
            type: type as Goal['type'],
            xp,
            coins: xp,
            penalty: priority === 'main' ? Math.round(xp * 0.6) : 0,
          }
          if (type === 'daily') {
            g.targetDays = tv
            g.checks = Array(7).fill(false)
          } else if (type === 'count') {
            g.target = tv
            g.count = 0
            g.extraXp = Math.max(1, Math.round(xp / 2))
            g.extraCoins = g.extraXp
          } else g.done = false
          arr.push(g)
        })
      }),
    reorderGoal: (activeId, overId) =>
      patch((d) => {
        const arr = d.goals[d.currentWeek]
        if (!arr) return
        const from = arr.findIndex((g) => g.id === activeId)
        const to = arr.findIndex((g) => g.id === overId)
        if (from < 0 || to < 0 || from === to) return
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
      }),

    claimReward: (r) => {
      const s = get().stats()
      if (s.coins < r.cost || s.level < (r.minLevel || 1)) return
      apply((data) => {
        data.claims.push({
          id: 'c' + Date.now(),
          type: 'reward',
          rewardId: r.id,
          name: r.name,
          cost: r.cost,
          date: dateKey(new Date()),
        })
        playSound('coin', data.muted)
        return () =>
          celebrate(data.theme, '−' + r.cost + ' monedas · ' + r.name, palette(data.theme).gold, true)
      })
    },
    buyPotion: (p) => {
      const s = get().stats()
      if (s.coins < p.cost || s.hp >= s.maxHP) return
      const healed = p.heal >= 9999 ? s.maxHP - s.hp : Math.min(p.heal, s.maxHP - s.hp)
      apply((data) => {
        ensureHP(data)
        data.hp = s.hp + healed
        data.claims.push({
          id: 'c' + Date.now(),
          type: 'potion',
          name: p.name,
          cost: p.cost,
          date: dateKey(new Date()),
        })
        playSound('heal', data.muted)
        return () => celebrate(data.theme, '+' + healed + ' ♥ ' + p.name, palette(data.theme).green)
      })
    },
    openRewardForm: (r, kind) => {
      const k = kind || (r && 'heal' in r && r.heal !== undefined ? 'potion' : 'reward')
      set({
        rewardForm: r
          ? {
              ...(r as Reward & Partial<Potion>),
              kind: k,
              heal: (r as Potion).heal || 30,
              minLevel: (r as Reward).minLevel || 1,
            }
          : {
              kind: k,
              name: '',
              cost: k === 'potion' ? 60 : 100,
              icon: k === 'potion' ? 'local_drink' : 'redeem',
              heal: 30,
              minLevel: 1,
            },
      })
    },
    setRewardForm: (f) => set({ rewardForm: f }),
    saveReward: (f) => {
      apply((data) => {
        if (f.kind === 'potion') {
          const rec: Potion = {
            id: f.id || 'p' + Date.now(),
            name: f.name.trim(),
            cost: Math.max(0, +f.cost || 0),
            heal: Math.max(1, +f.heal || 1),
            icon: f.icon || 'local_drink',
          }
          if (f.id) {
            const i = data.potions.findIndex((x) => x.id === f.id)
            data.potions[i] = rec
          } else data.potions.push(rec)
        } else {
          const rec: Reward = {
            id: f.id || 'r' + Date.now(),
            name: f.name.trim(),
            cost: Math.max(0, +f.cost || 0),
            minLevel: Math.max(1, +f.minLevel || 1),
            icon: f.icon || 'redeem',
          }
          if (f.id) {
            const i = data.rewards.findIndex((x) => x.id === f.id)
            data.rewards[i] = rec
          } else data.rewards.push(rec)
        }
      })
      set({ rewardForm: null })
    },
    deleteReward: (id) => {
      apply((data) => {
        data.rewards = data.rewards.filter((r) => r.id !== id)
        data.potions = (data.potions || []).filter((p) => p.id !== id)
      })
      set({ rewardForm: null })
    },

    openHabitForm: (b) =>
      set({ habitForm: b ? { ...b } : { name: '', damage: 12, icon: 'block' } }),
    setHabitForm: (f) => set({ habitForm: f }),
    saveHabit: (f) => {
      apply((data) => {
        data.badHabits = data.badHabits || []
        const rec: BadHabit = {
          id: f.id || 'b' + Date.now(),
          name: f.name.trim(),
          damage: Math.max(0, +f.damage || 0),
          icon: f.icon || 'block',
        }
        if (f.id) {
          const i = data.badHabits.findIndex((x) => x.id === f.id)
          data.badHabits[i] = rec
        } else data.badHabits.push(rec)
      })
      set({ habitForm: null })
    },
    deleteHabit: (id) => {
      apply((data) => {
        data.badHabits = (data.badHabits || []).filter((x) => x.id !== id)
        data.habitLog = (data.habitLog || []).filter((l) => l.habitId !== id)
      })
      set({ habitForm: null })
    },
    logHabit: (b) =>
      apply((data) => {
        ensureHP(data)
        data.hp = Math.max(0, (data.hp as number) - b.damage)
        data.habitLog.unshift({
          id: 'hl' + Date.now(),
          habitId: b.id,
          name: b.name,
          damage: b.damage,
          date: dateKey(new Date()),
        })
        playSound('hurt', data.muted)
        return () => celebrate(data.theme, '−' + b.damage + ' ♥ ' + b.name, palette(data.theme).danger)
      }),
    undoHabit: (logId) =>
      apply((data) => {
        const l = (data.habitLog || []).find((x) => x.id === logId)
        if (!l) return
        ensureHP(data)
        const mx = maxHP(computeStats(data).level)
        data.hp = Math.min(mx, (data.hp as number) + l.damage)
        data.habitLog = data.habitLog.filter((x) => x.id !== logId)
      }),
    habitCountWeek: (id) => {
      const d = get().data
      const ws = d.currentWeek
      const we = addDays(ws, 6)
      return (d.habitLog || []).filter((l) => l.habitId === id && l.date >= ws && l.date <= we).length
    },

    addChessLog: () => {
      const cd = get().chessDraft
      if (!cd.games && !cd.minutes) return
      const idx = todayIdx()
      const xp = (+cd.games || 0) * 5 + Math.floor((+cd.minutes || 0) / 5) * 2
      apply((data) => {
        data.chess.logs.unshift({
          id: 'cl' + Date.now(),
          date: dateKey(new Date()),
          day: idx,
          theme: data.chessPlan[idx],
          games: +cd.games || 0,
          minutes: +cd.minutes || 0,
          result: cd.result || '',
          notes: (cd.notes || '').trim(),
        })
        markToday(data)
        playSound('tick', data.muted)
        return () => {
          if (xp > 0) celebrate(data.theme, '+' + xp + ' XP · Ajedrez', areaColor('cre'))
        }
      })
      set({ chessDraft: { games: '', minutes: '', result: '', notes: '' } })
    },
    delChessLog: (id) =>
      apply((data) => {
        data.chess.logs = data.chess.logs.filter((l) => l.id !== id)
      }),
    setPlan: (i, v) =>
      patch((d) => {
        d.chessPlan[i] = v
      }),

    setReview: (wk, k, v) =>
      patch((d) => {
        d.reviews[wk] = d.reviews[wk] || { done: false }
        d.reviews[wk][k] = v
      }),
    finishReview: (wk) => {
      const r = get().data.reviews[wk]
      if (!r) return
      const answered = Object.keys(r)
        .filter((k) => k !== 'done')
        .filter((k) => (r[k] as string || '').trim()).length
      if (answered < 3) return
      apply((data) => {
        const rev = data.reviews[wk]
        const wasDone = rev.done
        rev.done = true
        return () => {
          if (!wasDone) {
            celebrate(data.theme, '+60 XP · Revisión', palette(data.theme).primary)
            playSound('level', data.muted)
          }
        }
      })
    },

    startNewWeek: (copy) => {
      const d0 = get().data
      const closing = d0.goals[d0.currentWeek] || []
      let dmg = 0
      closing.forEach((g) => {
        const u = goalUnits(g)
        if (g.priority === 'main' && !u.complete) dmg += g.penalty || 0
      })
      apply((data) => {
        if (dmg > 0) {
          ensureHP(data)
          data.hp = Math.max(0, (data.hp as number) - dmg)
        }
        const real = mondayKey(new Date())
        let next = addDays(data.currentWeek, 7)
        if (parseKey(real) > parseKey(next)) next = real
        data.weekStart[next] = next
        if (copy) {
          data.goals[next] = (data.goals[data.currentWeek] || []).map((g) => {
            const n: Goal = { ...g, id: 'g' + Date.now() + Math.random().toString(36).slice(2, 6), log: [] }
            if (n.type === 'daily') n.checks = Array(7).fill(false)
            if (n.type === 'count') n.count = 0
            if (n.type === 'dailyCount') n.counts = Array(7).fill(0)
            if (n.type === 'weekly') n.done = false
            return n
          })
        } else data.goals[next] = []
        data.currentWeek = next
        return () => {
          if (dmg > 0) {
            celebrate(data.theme, '−' + dmg + ' ♥ metas principales', palette(data.theme).danger)
            playSound('hurt', data.muted)
          } else {
            celebrate(data.theme, '¡Nueva semana!', palette(data.theme).primary)
          }
        }
      })
      set({ view: 'metas', histWeek: null })
    },
    gotoWeek: (wk) => {
      apply((data) => {
        data.currentWeek = wk
      })
      set({ view: 'metas', histWeek: null })
    },

    exportData: () => {
      try {
        const blob = new Blob([JSON.stringify(get().data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'life-quest-respaldo-' + dateKey(new Date()) + '.json'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1500)
      } catch {
        alert('No se pudo exportar la copia.')
      }
    },
    importData: (file) => {
      if (!file) return
      const r = new FileReader()
      r.onload = () => {
        try {
          const parsed = JSON.parse(r.result as string)
          const md = migrate(parsed)
          persist(md)
          set({ data: md, settings: false, tick: Date.now() })
          setTimeout(() => {
            celebrate(md.theme, 'Copia restaurada', palette(md.theme).green)
            playSound('level', md.muted)
          }, 150)
        } catch {
          alert('El archivo no es una copia válida.')
        }
      }
      r.readAsText(file)
    },
    resetAll: () => {
      if (
        !window.confirm(
          '¿Borrar TODO tu progreso y empezar de cero? Esto no se puede deshacer. (Considera exportar una copia antes.)',
        )
      )
        return
      const fresh = seed()
      persist(fresh)
      set({ data: fresh, settings: false, tick: Date.now() })
    },

    setMood: (m) =>
      patch((d) => {
        const k = dateKey(new Date())
        d.dailyNotes[k] = d.dailyNotes[k] || {}
        d.dailyNotes[k].mood = d.dailyNotes[k].mood === m ? null : m
      }),
    setNote: (v) =>
      patch((d) => {
        const k = dateKey(new Date())
        d.dailyNotes[k] = d.dailyNotes[k] || {}
        d.dailyNotes[k].note = v
      }),
    setFocus: (id) =>
      patch((d) => {
        d.focus = { date: dateKey(new Date()), goalId: id }
      }),
    clearFocus: () =>
      patch((d) => {
        d.focus = null
      }),

    openAchForm: (a) =>
      set({
        achForm: a
          ? { ...a }
          : { name: '', icon: 'star', metric: 'goal', goalTitle: '', target: 1 },
      }),
    setAchForm: (f) => set({ achForm: f }),
    saveCustomAch: (f) => {
      apply((data) => {
        data.customAch = data.customAch || []
        const rec: CustomAch = {
          id: f.id || 'ca' + Date.now(),
          name: f.name.trim(),
          icon: f.icon || 'star',
          metric: f.metric,
          goalTitle: (f.goalTitle || '').trim(),
          target: Math.max(1, +f.target || 1),
          unlocked: f.unlocked || null,
        }
        if (f.id) {
          const i = data.customAch.findIndex((x) => x.id === f.id)
          data.customAch[i] = rec
        } else data.customAch.push(rec)
      })
      set({ achForm: null })
    },
    deleteCustomAch: (id) => {
      apply((data) => {
        data.customAch = (data.customAch || []).filter((x) => x.id !== id)
      })
      set({ achForm: null })
    },

    // ---------- tareas ----------
    setTaskView: (v) => set({ taskView: v }),
    openTaskForm: (t) => {
      const tv = get().taskView
      const defaultList = tv === 'today' || tv === 'next7' || tv === 'inbox' || tv === 'all' ? 'inbox' : tv
      set({
        taskForm: t
          ? {
              id: t.id,
              title: t.title,
              notes: t.notes,
              listId: t.listId,
              tags: [...t.tags],
              priority: t.priority,
              estPomos: t.estPomos,
              due: t.due,
              subtasks: t.subtasks.map((x) => ({ ...x })),
              linkedGoal: t.linkedGoal || '',
              images: t.images ? [...t.images] : [],
            }
          : { title: '', notes: '', listId: defaultList, tags: [], priority: 'anytime', estPomos: 0, due: tv === 'today' ? dateKey(new Date()) : null, subtasks: [], linkedGoal: '', images: [] },
      })
    },
    setTaskForm: (f) => set({ taskForm: f }),
    saveTask: (f) => {
      if (!f.title.trim()) return
      apply((data) => {
        const rec: Task = {
          id: f.id || 't' + Date.now() + Math.random().toString(36).slice(2, 5),
          title: f.title.trim(),
          notes: f.notes.trim(),
          listId: f.listId,
          tags: f.tags.map((t) => t.trim()).filter(Boolean),
          priority: f.priority,
          estPomos: Math.max(0, +f.estPomos || 0),
          spentPomos: 0,
          focusMinutes: 0,
          due: f.due,
          done: false,
          doneDate: null,
          createdAt: dateKey(new Date()),
          subtasks: f.subtasks.filter((s) => s.title.trim()),
          linkedGoal: (f.linkedGoal || '').trim() || undefined,
          images: (f.images || []).filter(Boolean),
        }
        if (f.id) {
          const i = data.tasks.findIndex((x) => x.id === f.id)
          if (i >= 0) {
            const old = data.tasks[i]
            rec.spentPomos = old.spentPomos
            rec.focusMinutes = old.focusMinutes
            rec.done = old.done
            rec.doneDate = old.doneDate
            rec.createdAt = old.createdAt
            data.tasks[i] = rec
          }
        } else data.tasks.push(rec)
      })
      set({ taskForm: null })
    },
    deleteTask: (id) => {
      apply((data) => {
        data.tasks = data.tasks.filter((t) => t.id !== id)
      })
      set({ taskForm: null })
    },
    toggleTask: (id) => {
      // Las tareas NO dan XP/monedas ni afectan la racha; solo se marcan.
      const wasDone = get().data.tasks.find((x) => x.id === id)?.done
      patch((data) => {
        const t = data.tasks.find((x) => x.id === id)
        if (!t) return
        t.done = !t.done
        t.doneDate = t.done ? dateKey(new Date()) : null
      })
      if (!wasDone) playSound('tick', get().data.muted)
    },
    quickAddTask: (title) => {
      if (!title.trim()) return
      const tv = get().taskView
      const listId = tv === 'today' || tv === 'next7' || tv === 'inbox' || tv === 'all' ? 'inbox' : tv
      const due = tv === 'today' ? dateKey(new Date()) : null
      apply((data) => {
        data.tasks.push({
          id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
          title: title.trim(),
          notes: '',
          listId,
          tags: [],
          priority: tv === 'today' ? 'urgent' : 'anytime',
          estPomos: 0,
          spentPomos: 0,
          focusMinutes: 0,
          due,
          done: false,
          doneDate: null,
          createdAt: dateKey(new Date()),
          subtasks: [],
        })
      })
    },
    toggleSubtask: (taskId, subId) =>
      apply((data) => {
        const t = data.tasks.find((x) => x.id === taskId)
        if (!t) return
        const st = t.subtasks.find((x) => x.id === subId)
        if (st) st.done = !st.done
      }),
    reorderTask: (activeId, overId) =>
      patch((d) => {
        const from = d.tasks.findIndex((t) => t.id === activeId)
        const to = d.tasks.findIndex((t) => t.id === overId)
        if (from < 0 || to < 0 || from === to) return
        const [moved] = d.tasks.splice(from, 1)
        d.tasks.splice(to, 0, moved)
      }),
    addList: (name, icon, color) => {
      if (!name.trim()) return
      apply((data) => {
        const rec: TaskList = { id: 'l' + Date.now(), name: name.trim(), icon: icon || 'list', color: color || '#8A87A0' }
        data.lists.push(rec)
      })
    },
    deleteList: (id) => {
      if (id === 'inbox') return
      apply((data) => {
        data.lists = data.lists.filter((l) => l.id !== id)
        data.tasks.forEach((t) => {
          if (t.listId === id) t.listId = 'inbox'
        })
      })
    },

    // ---------- templates ----------
    saveTaskTemplate: (f) => {
      if (!f.title.trim()) return
      patch((d) => {
        d.taskTemplates = d.taskTemplates || []
        d.taskTemplates.push({
          id: 'tt' + Date.now() + Math.random().toString(36).slice(2, 5),
          name: f.title.trim(),
          title: f.title.trim(),
          notes: f.notes.trim(),
          listId: f.listId,
          tags: f.tags.map((t) => t.trim()).filter(Boolean),
          priority: f.priority,
          estPomos: Math.max(0, +f.estPomos || 0),
          subtasks: f.subtasks.filter((s) => s.title.trim()).map((s) => ({ title: s.title.trim() })),
          linkedGoal: (f.linkedGoal || '').trim() || undefined,
        })
      })
    },
    deleteTaskTemplate: (id) =>
      patch((d) => {
        d.taskTemplates = (d.taskTemplates || []).filter((t) => t.id !== id)
      }),
    createTaskFromTemplate: (id) => {
      const tpl = (get().data.taskTemplates || []).find((t) => t.id === id)
      if (!tpl) return
      const tv = get().taskView
      const due = tv === 'today' ? dateKey(new Date()) : null
      apply((data) => {
        data.tasks.push({
          id: 't' + Date.now() + Math.random().toString(36).slice(2, 5),
          title: tpl.title,
          notes: tpl.notes,
          listId: tpl.listId,
          tags: [...tpl.tags],
          priority: tpl.priority,
          estPomos: tpl.estPomos,
          spentPomos: 0,
          focusMinutes: 0,
          due,
          done: false,
          doneDate: null,
          createdAt: dateKey(new Date()),
          subtasks: tpl.subtasks.map((s) => ({ id: 's' + Date.now() + Math.random().toString(36).slice(2, 4), title: s.title, done: false })),
          linkedGoal: tpl.linkedGoal || undefined,
        })
      })
    },
    saveGoalTemplate: (f) => {
      if (!f.title.trim()) return
      patch((d) => {
        d.goalTemplates = d.goalTemplates || []
        d.goalTemplates.push({
          id: 'gt' + Date.now() + Math.random().toString(36).slice(2, 5),
          name: f.title.trim(),
          areaId: f.areaId,
          title: f.title.trim(),
          priority: f.priority,
          type: f.type,
          xp: Math.max(0, +f.xp || 0),
          coins: Math.max(0, +f.coins || 0),
          extraXp: Math.max(0, +f.extraXp || 0),
          extraCoins: Math.max(0, +f.extraCoins || 0),
          penalty: Math.max(0, +f.penalty || 0),
          targetDays: Math.min(7, Math.max(1, +f.targetDays || 7)),
          target: Math.max(1, +f.target || 1),
          dailyTarget: Math.max(1, +f.dailyTarget || 1),
        })
      })
    },
    deleteGoalTemplate: (id) =>
      patch((d) => {
        d.goalTemplates = (d.goalTemplates || []).filter((t) => t.id !== id)
      }),
    useGoalTemplate: (id) => {
      const tpl = (get().data.goalTemplates || []).find((t) => t.id === id)
      if (!tpl) return
      set({
        goalForm: {
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
        },
      })
    },
    updateTaskTemplate: (id, f) =>
      patch((d) => {
        const i = (d.taskTemplates || []).findIndex((t) => t.id === id)
        if (i < 0) return
        d.taskTemplates[i] = {
          id,
          name: f.title.trim(),
          title: f.title.trim(),
          notes: f.notes.trim(),
          listId: f.listId,
          tags: f.tags.map((t) => t.trim()).filter(Boolean),
          priority: f.priority,
          estPomos: Math.max(0, +f.estPomos || 0),
          subtasks: f.subtasks.filter((s) => s.title.trim()).map((s) => ({ title: s.title.trim() })),
          linkedGoal: (f.linkedGoal || '').trim() || undefined,
        }
      }),
    updateGoalTemplate: (id, f) =>
      patch((d) => {
        const i = (d.goalTemplates || []).findIndex((t) => t.id === id)
        if (i < 0) return
        d.goalTemplates[i] = {
          id,
          name: f.title.trim(),
          areaId: f.areaId,
          title: f.title.trim(),
          priority: f.priority,
          type: f.type,
          xp: Math.max(0, +f.xp || 0),
          coins: Math.max(0, +f.coins || 0),
          extraXp: Math.max(0, +f.extraXp || 0),
          extraCoins: Math.max(0, +f.extraCoins || 0),
          penalty: Math.max(0, +f.penalty || 0),
          targetDays: Math.min(7, Math.max(1, +f.targetDays || 7)),
          target: Math.max(1, +f.target || 1),
          dailyTarget: Math.max(1, +f.dailyTarget || 1),
        }
      }),
    setTemplatesModal: (open) => set({ templatesModal: open }),

    // ---------- pomodoro ----------
    setPomoTask: (id) => {
      const cur = get().data.pomoRun
      if (id === cur.taskId) return
      // Bank the minutes worked on the CURRENT task so far to the previous task,
      // then keep the SAME timer running for the new task — never reset a pomo /
      // stopwatch that's already in progress. `loggedSec` remembers how much of
      // this block was already attributed, so completion credits only the rest.
      let newLogged = cur.loggedSec || 0
      if (cur.phase === 'work') {
        const workedSec = cur.mode === 'pomo' ? get().data.pomoSettings.workMin * 60 - pomoRemainingOf(cur) : pomoElapsedOf(cur)
        const segSec = workedSec - (cur.loggedSec || 0)
        const minutes = Math.floor(segSec / 60)
        if (minutes >= 1) {
          const now = Date.now()
          get().logPomoSession({ minutes, mode: 'stopwatch', taskId: cur.taskId, start: now - minutes * 60000, end: now })
        }
        // advance by whole minutes only — the leftover seconds carry to the next
        // segment so no focus time is lost
        newLogged = (cur.loggedSec || 0) + minutes * 60
      }
      patch((d) => {
        d.pomoRun = { ...d.pomoRun, taskId: id, loggedSec: newLogged }
      })
    },
    setPomoMode: (m) =>
      patch((d) => {
        if (d.pomoRun.running) return
        d.pomoRun = { ...d.pomoRun, mode: m, phase: 'work', cycle: 0, anchorTs: null, baseSec: m === 'pomo' ? d.pomoSettings.workMin * 60 : 0, loggedSec: 0 }
      }),
    updatePomoSettings: (p) =>
      patch((d) => {
        d.pomoSettings = { ...d.pomoSettings, ...p }
        // keep the idle countdown in sync with a changed work duration
        const r = d.pomoRun
        if (!r.running && r.mode === 'pomo' && r.phase === 'work') {
          d.pomoRun = { ...r, baseSec: d.pomoSettings.workMin * 60 }
        }
      }),
    logPomoSession: ({ minutes, mode, taskId, start, end }) => {
      if (minutes <= 0) return
      // El enfoque NO da XP/monedas ni afecta la racha; solo registra la sesión.
      patch((data) => {
        const task = taskId ? data.tasks.find((t) => t.id === taskId) : null
        data.pomoSessions.unshift({
          id: 'ps' + Date.now() + Math.random().toString(36).slice(2, 5),
          date: dateKey(new Date()),
          start,
          end,
          minutes,
          taskId: taskId || null,
          taskTitle: task ? task.title : '',
          mode,
        })
        if (task) {
          task.focusMinutes += minutes
          if (mode === 'pomo') task.spentPomos += 1
        }
      })
    },

    // ---------- pomodoro timer (lives in `data`, so it syncs across devices) ----------
    pomoStart: () =>
      patch((d) => {
        const cur = d.pomoRun
        const base = cur.mode === 'pomo' ? pomoRemainingOf(cur) : pomoElapsedOf(cur)
        d.pomoRun = { ...cur, running: true, anchorTs: Date.now(), baseSec: base }
      }),
    pomoPause: () =>
      patch((d) => {
        const cur = d.pomoRun
        const base = cur.mode === 'pomo' ? pomoRemainingOf(cur) : pomoElapsedOf(cur)
        d.pomoRun = { ...cur, running: false, anchorTs: null, baseSec: base }
      }),
    pomoReset: () =>
      patch((d) => {
        const cur = d.pomoRun
        d.pomoRun = { ...cur, running: false, phase: 'work', cycle: 0, anchorTs: null, baseSec: cur.mode === 'pomo' ? d.pomoSettings.workMin * 60 : 0, loggedSec: 0 }
      }),
    pomoStopLog: () => {
      const cur = get().data.pomoRun
      const s = get().data.pomoSettings
      const now = Date.now()
      if (cur.mode === 'pomo') {
        const done = s.workMin * 60 - pomoRemainingOf(cur) - (cur.loggedSec || 0)
        const minutes = Math.floor(done / 60)
        if (cur.phase === 'work' && minutes >= 1) {
          get().logPomoSession({ minutes, mode: 'pomo', taskId: cur.taskId, start: now - minutes * 60000, end: now })
        }
      } else {
        const minutes = Math.floor((pomoElapsedOf(cur) - (cur.loggedSec || 0)) / 60)
        if (minutes >= 1) get().logPomoSession({ minutes, mode: 'stopwatch', taskId: cur.taskId, start: now - minutes * 60000, end: now })
      }
      playSound('bell', get().data.muted)
      get().pomoReset()
    },
    pomoTick: () => {
      const cur = get().data.pomoRun
      if (!cur.running) return
      if (cur.mode === 'pomo' && pomoRemainingOf(cur) <= 0) {
        const s = get().data.pomoSettings
        const now = Date.now()
        const completedAnchor = cur.anchorTs
        if (cur.phase === 'work') {
          // work block finished → log the un-attributed remainder to the current
          // task (earlier segments were banked on switch), then start a break
          const minutes = Math.max(0, Math.floor((s.workMin * 60 - (cur.loggedSec || 0)) / 60))
          if (minutes >= 1) {
            get().logPomoSession({ minutes, mode: 'pomo', taskId: cur.taskId, start: now - minutes * 60000, end: now })
          }
          const nextCycle = cur.cycle + 1
          const brk = nextCycle % s.longEvery === 0 ? s.longBreakMin : s.breakMin
          patch((d) => {
            d.pomoRun = { ...d.pomoRun, running: false, anchorTs: null, phase: 'break', cycle: nextCycle, baseSec: brk * 60, loggedSec: 0, lastCompletedAnchor: completedAnchor }
          })
          playSound('bell', get().data.muted)
          if (s.notifyOnDone) notifyPomoDone('work')
        } else {
          patch((d) => {
            d.pomoRun = { ...d.pomoRun, running: false, anchorTs: null, phase: 'work', baseSec: s.workMin * 60, loggedSec: 0, lastCompletedAnchor: completedAnchor }
          })
          playSound('bell', get().data.muted)
          if (s.notifyOnDone) notifyPomoDone('break')
        }
        return
      }
      // still running: just refresh the display (no data write → no cloud push)
      set({ tick: Date.now() })
    },

    // ---------- avatar modal ----------
    setAvatarModal: (open) => set({ avatarModal: open }),

    // ---------- AI assistant modal ----------
    setAssistant: (open) => set({ assistant: open }),

    // ---------- cloud sync ----------
    setSyncStatus: (st) => set({ syncStatus: st }),
    replaceData: (incoming) => {
      // Preserve a timer that is running *here* unless the remote has a newer
      // one, so an unrelated change on the other device can't wipe it.
      const localRun = get().data.pomoRun
      const r = incoming.pomoRun
      const keepLocal =
        !!localRun && localRun.running && (!r || !r.running || (localRun.anchorTs || 0) > (r.anchorTs || 0))
      // …but if the remote already completed the exact block we're still
      // running, adopt its finished state instead of re-completing (and
      // re-logging) the same session locally.
      const remoteFinishedOurBlock =
        keepLocal && !!r && r.lastCompletedAnchor != null && r.lastCompletedAnchor === localRun.anchorTs
      const data = keepLocal && !remoteFinishedOurBlock ? { ...incoming, pomoRun: localRun } : incoming
      persist(data)
      set({ data, tick: Date.now() })
    },
  }
})

// keep unused imports referenced for tree-shaking clarity
void DEFAULT_REWARDS
void DEFAULT_POTIONS
void CHESS_PLAN
export { customValue }
