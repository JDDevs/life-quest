import type { AppData, BadHabit, Goal } from '../types'
import { addDays, dateKey, parseKey } from './date'
import { goalUnits } from './goals'
import { streakInfo } from './stats'

export type GoalStreakUnit = 'day' | 'week'

export interface StreakResult {
  streak: number
  best: number
  unit: GoalStreakUnit
}

function normTitle(t: string): string {
  return (t || '').trim().toLowerCase()
}

/** Identity of a recurring goal across weeks. Prefers the stable `seriesId`
 *  (set on new goals); falls back to the title so pre-existing goals still link. */
export function goalSeriesKey(g: Goal): string {
  return g.seriesId || 't:' + normTitle(g.title)
}

/** Daily-cadence goals streak in days; weekly-cadence goals streak in weeks. */
export function goalStreakUnit(g: Goal): GoalStreakUnit {
  return g.type === 'daily' || g.type === 'dailyCount' ? 'day' : 'week'
}

function dayComplete(g: Goal, i: number): boolean {
  if (g.type === 'daily') return !!(g.checks && g.checks[i])
  if (g.type === 'dailyCount') return (g.counts?.[i] || 0) >= (g.dailyTarget || 1)
  return false
}

/** Every week (with its goal instance) that belongs to this series, ascending. */
function seriesWeeks(data: AppData, key: string): { wk: string; g: Goal }[] {
  const out: { wk: string; g: Goal }[] = []
  Object.keys(data.goals || {}).forEach((wk) => {
    const g = (data.goals[wk] || []).find((x) => goalSeriesKey(x) === key)
    if (g) out.push({ wk, g })
  })
  out.sort((a, b) => (a.wk < b.wk ? -1 : 1))
  return out
}

/** Mirror of streakInfo but stepping a full week (7 days) and anchored at the
 *  current week — the in-progress week doesn't break the streak until it ends. */
function weekStreakInfo(doneWeeks: string[], currentWeek: string): { streak: number; best: number } {
  const keys = [...doneWeeks].sort()
  if (!keys.length) return { streak: 0, best: 0 }
  const set = new Set(keys)
  let best = 0
  let run = 0
  let prev: string | null = null
  keys.forEach((k) => {
    run = prev && addDays(prev, 7) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  })
  let cursor: string | null = set.has(currentWeek)
    ? currentWeek
    : set.has(addDays(currentWeek, -7))
      ? addDays(currentWeek, -7)
      : null
  let cur = 0
  while (cursor && set.has(cursor)) {
    cur++
    cursor = addDays(cursor, -7)
  }
  return { streak: cur, best }
}

/** Current + best streak for a recurring goal. Days for daily goals, weeks for
 *  weekly ones. Derived from the stored week data — never a mutable counter. */
export function goalStreak(data: AppData, goal: Goal): StreakResult {
  const key = goalSeriesKey(goal)
  const unit = goalStreakUnit(goal)
  const weeks = seriesWeeks(data, key)
  if (!weeks.length) return { streak: 0, best: 0, unit }

  if (unit === 'day') {
    const days: Record<string, boolean> = {}
    weeks.forEach(({ wk, g }) => {
      for (let i = 0; i < 7; i++) if (dayComplete(g, i)) days[addDays(wk, i)] = true
    })
    return { ...streakInfo(days), unit }
  }

  const done = weeks.filter(({ g }) => goalUnits(g).complete).map(({ wk }) => wk)
  return { ...weekStreakInfo(done, data.currentWeek), unit }
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86400000)
}

/** "Días sin caer": consecutive clean days up to today, plus the best clean run
 *  ever. A relapse today ⇒ 0; never relapsed ⇒ days since tracking started. */
export function habitCleanStreak(data: AppData, habit: BadHabit): { streak: number; best: number } {
  const today = dateKey(new Date())
  const start = habit.startedAt || data.createdAt || today
  const relapses = (data.habitLog || [])
    .filter((l) => l.habitId === habit.id)
    .map((l) => l.date)
    .sort()
  if (!relapses.length) {
    const s = Math.max(0, daysBetween(start, today) + 1)
    return { streak: s, best: s }
  }
  let best = Math.max(0, daysBetween(start, relapses[0]))
  for (let i = 0; i < relapses.length - 1; i++) {
    best = Math.max(best, daysBetween(relapses[i], relapses[i + 1]) - 1)
  }
  const current = Math.max(0, daysBetween(relapses[relapses.length - 1], today))
  best = Math.max(best, current)
  return { streak: current, best }
}

export interface GoalStreakItem extends StreakResult {
  goal: Goal
}

/** Goals in the current week with a live streak (≥ 2), best first. */
export function activeGoalStreaks(data: AppData): GoalStreakItem[] {
  const cur = data.goals[data.currentWeek] || []
  return cur
    .map((g) => ({ goal: g, ...goalStreak(data, g) }))
    .filter((x) => x.streak >= 2)
    .sort((a, b) => b.streak - a.streak)
}

export interface HabitStreakItem {
  habit: BadHabit
  streak: number
  best: number
}

/** Bad habits with at least one clean day, best first. */
export function activeHabitStreaks(data: AppData): HabitStreakItem[] {
  return (data.badHabits || [])
    .map((h) => ({ habit: h, ...habitCleanStreak(data, h) }))
    .filter((x) => x.streak >= 1)
    .sort((a, b) => b.streak - a.streak)
}
