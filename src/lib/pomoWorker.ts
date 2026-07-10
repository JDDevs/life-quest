// Dedicated ticker for the Pomodoro. It only posts a heartbeat — all state
// lives in the store on the main thread. Running the interval inside a Worker
// avoids the aggressive background-tab throttling that Chrome applies to
// main-thread timers, so the timer completes (and alerts) close to on time
// even when the tab isn't focused.

let id: ReturnType<typeof setInterval> | null = null

self.onmessage = (e: MessageEvent<'start' | 'stop'>) => {
  if (e.data === 'start') {
    if (id != null) return
    id = setInterval(() => {
      ;(self as unknown as Worker).postMessage('tick')
    }, 500)
  } else if (e.data === 'stop') {
    if (id != null) clearInterval(id)
    id = null
  }
}
