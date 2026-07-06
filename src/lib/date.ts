const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function dateKey(dt: Date | string | number): string {
  const d = new Date(dt)
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function mondayKey(dt: Date | string | number): string {
  const d = new Date(dt)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return dateKey(d)
}

export function parseKey(k: string): Date {
  const [y, m, dd] = k.split('-').map(Number)
  return new Date(y, m - 1, dd)
}

export function addDays(k: string, n: number): string {
  const d = parseKey(k)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

export function todayIdx(): number {
  return (new Date().getDay() + 6) % 7
}

export function weekLabel(wk: string): string {
  const s = parseKey(wk)
  const e = parseKey(addDays(wk, 6))
  return s.getDate() + ' ' + MONTHS[s.getMonth()] + ' – ' + e.getDate() + ' ' + MONTHS[e.getMonth()]
}
