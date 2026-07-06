import { palette } from '../theme'

type SoundKind = 'level' | 'coin' | 'hurt' | 'heal' | 'tick'

let ac: AudioContext | null = null

export function playSound(kind: SoundKind, muted: boolean): void {
  if (muted) return
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ac = ac || new AC()
    const now = ac.currentTime
    const notes =
      kind === 'level'
        ? [523, 659, 784, 1047]
        : kind === 'coin'
          ? [880, 1175]
          : kind === 'hurt'
            ? [330, 220]
            : kind === 'heal'
              ? [659, 880]
              : [784, 988]
    notes.forEach((f, i) => {
      const o = ac!.createOscillator()
      const g = ac!.createGain()
      o.type = kind === 'coin' ? 'square' : kind === 'hurt' ? 'sawtooth' : 'triangle'
      o.frequency.value = f
      const t = now + i * (kind === 'level' ? 0.09 : 0.05)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      o.connect(g)
      g.connect(ac!.destination)
      o.start(t)
      o.stop(t + 0.24)
    })
  } catch {
    /* ignore */
  }
}

export function celebrate(
  theme: 'light' | 'dark',
  text: string,
  color: string,
  isSpend?: boolean,
): void {
  const C = palette(theme)
  const layer = document.getElementById('fxLayer')
  if (!layer) return
  const t = document.createElement('div')
  t.textContent = text
  t.style.cssText =
    "position:absolute;left:50%;top:120px;transform:translate(-50%,0);font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:26px;color:" +
    color +
    ";text-shadow:0 4px 16px rgba(0,0,0,.18);animation:fxfloat 1.15s cubic-bezier(.2,.8,.3,1) forwards;white-space:nowrap"
  layer.appendChild(t)
  setTimeout(() => t.remove(), 1250)
  const cols = isSpend
    ? ['#E9990A', '#F5C24A', '#FFE0A3']
    : [color, C.primary, C.gold, C.green, '#FF6B4A']
  const cx = window.innerWidth / 2
  for (let i = 0; i < (isSpend ? 16 : 22); i++) {
    const p = document.createElement('div')
    const sz = 6 + Math.random() * 7
    p.style.cssText =
      'position:absolute;width:' +
      sz +
      'px;height:' +
      sz +
      'px;border-radius:' +
      (Math.random() < 0.5 ? '50%' : '2px') +
      ';background:' +
      cols[i % cols.length] +
      ';left:' +
      (cx + (Math.random() - 0.5) * 260) +
      'px;top:' +
      (90 + Math.random() * 30) +
      'px;opacity:.95;animation:fxfall ' +
      (1 + Math.random() * 0.7) +
      's ease-in forwards;animation-delay:' +
      Math.random() * 0.12 +
      's'
    layer.appendChild(p)
    setTimeout(() => p.remove(), 2000)
  }
}

export function levelUpFx(level: number, rank: string): void {
  const layer = document.getElementById('fxLayer')
  if (!layer) return
  const b = document.createElement('div')
  b.style.cssText =
    "position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);padding:26px 40px;border-radius:22px;background:linear-gradient(135deg,#6D5AE6,#8B5CF6);color:#fff;text-align:center;box-shadow:0 24px 60px rgba(109,90,230,.5);animation:lvlup .9s cubic-bezier(.2,.9,.3,1.1) forwards;font-family:'Space Grotesk',sans-serif"
  b.innerHTML =
    '<div style="font-size:13px;letter-spacing:3px;opacity:.85;font-weight:600">SUBISTE DE NIVEL</div><div style="font-size:60px;font-weight:700;line-height:1.05;margin:2px 0">Nivel ' +
    level +
    '</div><div style="font-size:16px;font-weight:600;opacity:.95">' +
    rank +
    '</div>'
  layer.appendChild(b)
  setTimeout(() => b.remove(), 2200)
  const cols = ['#6D5AE6', '#F2A01D', '#1DA574', '#FF6B4A', '#EC4899', '#3B82F6']
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('div')
    const sz = 7 + Math.random() * 9
    p.style.cssText =
      'position:absolute;width:' +
      sz +
      'px;height:' +
      sz +
      'px;border-radius:' +
      (Math.random() < 0.5 ? '50%' : '2px') +
      ';background:' +
      cols[i % cols.length] +
      ';left:' +
      Math.random() * 100 +
      'vw;top:-20px;animation:fxfall ' +
      (1.4 + Math.random() * 1.1) +
      's ease-in forwards;animation-delay:' +
      Math.random() * 0.5 +
      's'
    layer.appendChild(p)
    setTimeout(() => p.remove(), 3200)
  }
}
