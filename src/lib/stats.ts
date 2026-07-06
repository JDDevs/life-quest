import { AREAS, RANKS, avatarStageFor, maxHP, tierFor } from '../constants'
import type { AppData, Stats } from '../types'
import { addDays, dateKey } from './date'
import { areaLevelInfo, goalCoins, goalEarned, goalReps, goalUnits, levelInfo } from './goals'

export function rankFor(l: number): string {
  let r = RANKS[0]
  RANKS.forEach((x) => {
    if (l >= x.min) r = x
  })
  return r.name
}

export function streakInfo(dates: Record<string, boolean>): { streak: number; best: number } {
  const keys = Object.keys(dates || {})
    .filter((k) => dates[k])
    .sort()
  if (!keys.length) return { streak: 0, best: 0 }
  const set = new Set(keys)
  // best
  let best = 0
  let run = 0
  let prev: string | null = null
  keys.forEach((k) => {
    if (prev && addDays(prev, 1) === k) run++
    else run = 1
    best = Math.max(best, run)
    prev = k
  })
  // current (ending today or yesterday)
  const today = dateKey(new Date())
  let cur = 0
  let cursor: string | null = set.has(today)
    ? today
    : set.has(addDays(today, -1))
      ? addDays(today, -1)
      : null
  while (cursor && set.has(cursor)) {
    cur++
    cursor = addDays(cursor, -1)
  }
  return { streak: cur, best }
}

export function computeStats(d: AppData): Stats {
  let earnedXP = 0
  let coinsEarned = 0
  let penaltyXP = 0
  let curRiskXP = 0
  const areaEarned: Record<string, number> = {}
  AREAS.forEach((a) => (areaEarned[a.id] = 0))
  const weekXP: Record<string, number> = {}
  const weekPct: Record<string, number> = {}
  const byTitle: Record<string, number> = {}
  let perfectWeeks = 0
  let unitsEver = 0

  Object.keys(d.goals).forEach((wk) => {
    const goals = d.goals[wk] || []
    let wkEarn = 0
    let wkDoneU = 0
    let wkTotU = 0
    const closed = wk !== d.currentWeek
    goals.forEach((g) => {
      const u = goalUnits(g)
      const earn = goalEarned(g)
      wkEarn += earn
      earnedXP += earn
      coinsEarned += goalCoins(g)
      areaEarned[g.areaId] = (areaEarned[g.areaId] || 0) + earn
      const reps = goalReps(g)
      unitsEver += reps
      const tk = (g.title || '').trim().toLowerCase()
      if (tk) byTitle[tk] = (byTitle[tk] || 0) + reps
      wkDoneU += Math.min(u.done, u.total)
      wkTotU += u.total
      if (g.priority === 'main' && !u.complete) {
        const pen = g.penalty || 0
        if (closed) penaltyXP += pen
        else curRiskXP += pen
      }
    })
    weekXP[wk] = wkEarn
    const pct = wkTotU > 0 ? Math.round((wkDoneU / wkTotU) * 100) : 0
    weekPct[wk] = pct
    if (wkTotU > 0 && pct >= 100 && goals.length > 0) perfectWeeks++
  })

  // chess xp
  let chessGames = 0
  let chessMin = 0
  let chessXP = 0
  ;(d.chess.logs || []).forEach((l) => {
    chessGames += +l.games || 0
    chessMin += +l.minutes || 0
    chessXP += (+l.games || 0) * 5 + Math.floor((+l.minutes || 0) / 5) * 2
  })
  earnedXP += chessXP
  coinsEarned += chessXP
  areaEarned.cre += chessXP

  // reflection xp
  const reflections = Object.values(d.reviews).filter((r) => r && r.done).length
  earnedXP += reflections * 60
  coinsEarned += reflections * 60

  // tareas + pomodoro: NO otorgan XP ni monedas (solo son productividad).
  // Solo se calculan métricas informativas para la vista de Pomodoro.
  const today = dateKey(new Date())
  const tasksDone = (d.tasks || []).filter((t) => t.done).length
  let pomosToday = 0
  let focusMinToday = 0
  let pomosTotal = 0
  let focusMinTotal = 0
  ;(d.pomoSessions || []).forEach((sn) => {
    focusMinTotal += sn.minutes
    if (sn.mode === 'pomo') pomosTotal++
    if (sn.date === today) {
      focusMinToday += sn.minutes
      if (sn.mode === 'pomo') pomosToday++
    }
  })

  const spent = (d.claims || []).reduce((a, c) => a + (c.cost || 0), 0)
  const coins = coinsEarned - spent

  const lvl = levelInfo(earnedXP)
  const mHP = maxHP(lvl.level)
  const hp = d.hp == null ? mHP : Math.max(0, Math.min(mHP, d.hp))
  const hpPct = Math.round((hp / mHP) * 100)
  const tier = tierFor(lvl.level)
  const avatar = avatarStageFor(lvl.level)

  // streak
  const { streak, best } = streakInfo(d.activeDates)

  // area levels
  const areaLvl: Record<string, ReturnType<typeof areaLevelInfo>> = {}
  let maxAreaLvl = 0
  let areasAt2 = 0
  AREAS.forEach((a) => {
    const li = areaLevelInfo(areaEarned[a.id] || 0)
    areaLvl[a.id] = li
    if (li.level > maxAreaLvl) maxAreaLvl = li.level
    if (li.level >= 2) areasAt2++
  })

  const cwk = d.currentWeek
  return {
    earnedXP,
    penaltyXP,
    curRiskXP,
    spent,
    coins,
    available: coins,
    hp,
    maxHP: mHP,
    hpPct,
    tier,
    avatar,
    level: lvl.level,
    into: lvl.into,
    need: lvl.need,
    rank: rankFor(lvl.level),
    streak,
    bestStreak: best,
    areaEarned,
    areaLvl,
    maxAreaLvl,
    areasAt2,
    weekXP,
    weekPct,
    perfectWeeks,
    unitsEver,
    chessGames,
    chessMin,
    chessXP,
    reflections,
    rewardsClaimed: (d.claims || []).length,
    goalUnitsByTitle: byTitle,
    curPct: weekPct[cwk] || 0,
    tasksDone,
    pomosToday,
    focusMinToday,
    pomosTotal,
    focusMinTotal,
  }
}
