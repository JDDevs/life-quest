// Thin helpers around the Tauri desktop runtime. All are safe to call from the
// web build — they no-op unless actually running inside Tauri.
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { currentMonitor, LogicalPosition } from '@tauri-apps/api/window'
import { emit } from '@tauri-apps/api/event'

// Keep in sync with the "widget" window size in tauri.conf.json (resting/mini).
const WIDGET_W = 128
const WIDGET_H = 54
let hasPositioned = false

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** The floating widget window loads the app with ?widget=1 so it renders the
 *  compact widget instead of the full app. */
export function isWidgetMode(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('widget')
}

async function widgetWindow(): Promise<WebviewWindow | null> {
  // getByLabel is a cheap reference lookup (no IPC); await handles both the
  // sync and promise-returning forms across Tauri versions.
  return await WebviewWindow.getByLabel('widget')
}

export async function showPomoWidget(): Promise<void> {
  if (!isTauri()) return
  const w = await widgetWindow()
  if (!w) return
  await w.show()
  await w.setFocus()
  void emit('widget:shown') // let the in-app pill know to hide itself
  // Place it in the bottom-right corner the first time it's shown this session;
  // after that we respect wherever the user dragged it.
  if (!hasPositioned) {
    hasPositioned = true
    try {
      const mon = await currentMonitor()
      if (mon) {
        const scale = mon.scaleFactor || 1
        const x = mon.size.width / scale - WIDGET_W - 20
        const y = mon.size.height / scale - WIDGET_H - 70 // clear the taskbar
        await w.setPosition(new LogicalPosition(Math.round(x), Math.round(y)))
      }
    } catch {
      /* ignore positioning errors */
    }
  }
}

export async function hidePomoWidget(): Promise<void> {
  if (!isTauri()) return
  const w = await widgetWindow()
  if (w) await w.hide()
}
