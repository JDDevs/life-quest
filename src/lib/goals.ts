import type { Goal, LevelInfo } from '../types'

export interface GoalUnits {
  done: number
  total: number
  complete: boolean
}

export function goalUnits(g: Goal): GoalUnits {
  if (g.type === 'daily') {
    const done = (g.checks || []).filter(Boolean).length
    const total = g.targetDays || 7
    return { done, total, complete: done >= total }
  }
  if (g.type === 'count') {
    const done = g.count || 0
    const total = g.target || 1
    return { done, total, complete: done >= total }
  }
  if (g.type === 'dailyCount') {
    // "done" = days that met the per-day target; drives completion & penalty
    const dt = g.dailyTarget || 1
    const done = (g.counts || []).filter((c) => (c || 0) >= dt).length
    const total = g.targetDays || 7
    return { done, total, complete: done >= total }
  }
  return { done: g.done ? 1 : 0, total: 1, complete: !!g.done }
}

export function goalEarned(g: Goal): number {
  if (g.type === 'daily') return (g.checks || []).filter(Boolean).length * g.xp
  if (g.type === 'count') {
    const count = g.count || 0
    const target = g.target || 1
    const base = Math.min(count, target) * g.xp
    const extra = Math.max(0, count - target) * (g.extraXp || 0)
    return base + extra
  }
  if (g.type === 'dailyCount') {
    // each day: xp per rep up to the daily target, extraXp per rep beyond it
    const dt = g.dailyTarget || 1
    return (g.counts || []).reduce((a, c0) => {
      const c = c0 || 0
      return a + Math.min(c, dt) * g.xp + Math.max(0, c - dt) * (g.extraXp || 0)
    }, 0)
  }
  return g.done ? g.xp : 0
}

// Spendable coins earned so far. Falls back to XP values (1:1) for goals
// created before coins were a separate field, preserving old behavior.
export function goalCoins(g: Goal): number {
  const coin = g.coins ?? g.xp
  const extraCoin = g.extraCoins ?? g.extraXp ?? 0
  if (g.type === 'daily') return (g.checks || []).filter(Boolean).length * coin
  if (g.type === 'count') {
    const count = g.count || 0
    const target = g.target || 1
    return Math.min(count, target) * coin + Math.max(0, count - target) * extraCoin
  }
  if (g.type === 'dailyCount') {
    const dt = g.dailyTarget || 1
    return (g.counts || []).reduce((a, c0) => {
      const c = c0 || 0
      return a + Math.min(c, dt) * coin + Math.max(0, c - dt) * extraCoin
    }, 0)
  }
  return g.done ? coin : 0
}

// Total completed reps (for achievements / "X veces" counters).
export function goalReps(g: Goal): number {
  if (g.type === 'daily') return (g.checks || []).filter(Boolean).length
  if (g.type === 'count') return g.count || 0
  if (g.type === 'dailyCount') return (g.counts || []).reduce((a, c) => a + (c || 0), 0)
  return g.done ? 1 : 0
}

// XP required to go from `lvl` to `lvl + 1`. Steeper than a flat curve so that
// each level-up feels earned (gentle quadratic ramp — hard, not impossible).
export function levelNeed(lvl: number): number {
  return 120 + lvl * 70 + lvl * lvl * 4
}

export function levelInfo(xp: number): LevelInfo {
  let lvl = 1
  let rem = xp
  for (;;) {
    const need = levelNeed(lvl)
    if (rem >= need) {
      rem -= need
      lvl++
    } else return { level: lvl, into: rem, need }
  }
}

// Total accumulated XP needed to *reach* a given level.
export function xpToReachLevel(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) total += levelNeed(l)
  return total
}

export function areaLevelInfo(xp: number): LevelInfo {
  let lvl = 1
  let rem = xp
  for (;;) {
    const need = 50 + lvl * 30
    if (rem >= need) {
      rem -= need
      lvl++
    } else return { level: lvl, into: rem, need }
  }
}
