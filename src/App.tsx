import { useEffect, useLayoutEffect, useRef } from 'react'
import { useStore } from './store'
import { cloudEnabled, pullState, pushState } from './lib/cloud'
import { palette } from './theme'
import { Header } from './components/Header'
import { Nav } from './components/Nav'
import { GoalModal } from './components/modals/GoalModal'
import { RewardModal } from './components/modals/RewardModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { AchModal } from './components/modals/AchModal'
import { HabitModal } from './components/modals/HabitModal'
import { AvatarModal } from './components/modals/AvatarModal'
import { TaskModal } from './components/modals/TaskModal'
import { AssistantModal } from './components/modals/AssistantModal'
import { TemplatesModal } from './components/modals/TemplatesModal'
import { Dashboard } from './views/Dashboard'
import { Metas } from './views/Metas'
import { Tareas } from './views/Tareas'
import { Pomodoro } from './views/Pomodoro'
import { Tienda } from './views/Tienda'
import { Logros } from './views/Logros'
import { Ajedrez } from './views/Ajedrez'
import { Revision } from './views/Revision'
import { Historial } from './views/Historial'

export default function App() {
  const view = useStore((s) => s.view)
  const theme = useStore((s) => s.data.theme)
  const stats = useStore((s) => s.stats)
  const setNarrow = useStore((s) => s.setNarrow)
  // subscribe to tick so the whole tree re-renders on any data mutation
  useStore((s) => s.tick)

  // apply theme to <body>
  useEffect(() => {
    const C = palette(theme)
    document.body.style.background = C.bg
    document.body.style.color = C.text
  }, [theme])

  // responsive breakpoint tracking — useLayoutEffect corrects before paint so
  // the mobile layout doesn't flash the desktop columns first
  useLayoutEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 760)
    onResize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [setNarrow])

  // drive the pomodoro/stopwatch timer globally so it keeps running (and can
  // complete) even when you're on another tab of the app. Only the *visible*
  // device advances/completes it, to avoid a backgrounded device double-logging
  // a session (the timer state itself is synced via data.pomoRun).
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (useStore.getState().data.pomoRun.running) useStore.getState().pomoTick()
    }, 500)
    return () => clearInterval(id)
  }, [])

  // ---- cloud sync ----
  const dirty = useRef(false)

  // pull on start; if nothing remote yet, push our local copy
  useEffect(() => {
    if (!cloudEnabled()) return
    let cancelled = false
    const st = useStore.getState()
    st.setSyncStatus('syncing')
    ;(async () => {
      try {
        const remote = await pullState()
        if (cancelled) return
        if (remote) st.replaceData(remote.data)
        else await pushState(useStore.getState().data)
        if (!cancelled) {
          dirty.current = false
          useStore.getState().setSyncStatus('synced')
        }
      } catch {
        if (!cancelled) useStore.getState().setSyncStatus('offline')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // push (debounced) whenever data changes
  useEffect(() => {
    if (!cloudEnabled()) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = useStore.subscribe((state, prev) => {
      if (state.data === prev.data) return
      dirty.current = true
      clearTimeout(timer)
      timer = setTimeout(async () => {
        useStore.getState().setSyncStatus('syncing')
        try {
          await pushState(useStore.getState().data)
          dirty.current = false
          useStore.getState().setSyncStatus('synced')
        } catch {
          useStore.getState().setSyncStatus('offline')
        }
      }, 1500)
    })
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [])

  // when this device regains focus, sync with the cloud: flush local changes if
  // any, otherwise pull the latest (so switching devices shows fresh data)
  useEffect(() => {
    if (!cloudEnabled()) return
    const onFocus = async () => {
      if (document.visibilityState === 'hidden') return
      useStore.getState().setSyncStatus('syncing')
      try {
        if (dirty.current) {
          await pushState(useStore.getState().data)
          dirty.current = false
        } else {
          const remote = await pullState()
          if (remote) useStore.getState().replaceData(remote.data)
          dirty.current = false
        }
        useStore.getState().setSyncStatus('synced')
      } catch {
        useStore.getState().setSyncStatus('offline')
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  const s = stats()

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 20px 120px' }}>
      <Header s={s} />
      <Nav />
      <div key={view} style={{ animation: 'fadein .25s ease' }}>
        {view === 'dash' ? (
          <Dashboard s={s} />
        ) : view === 'metas' ? (
          <Metas s={s} />
        ) : view === 'tareas' ? (
          <Tareas />
        ) : view === 'pomodoro' ? (
          <Pomodoro s={s} />
        ) : view === 'tienda' ? (
          <Tienda s={s} />
        ) : view === 'logros' ? (
          <Logros s={s} />
        ) : view === 'ajedrez' ? (
          <Ajedrez s={s} />
        ) : view === 'revision' ? (
          <Revision s={s} />
        ) : (
          <Historial s={s} />
        )}
      </div>
      <GoalModal />
      <RewardModal />
      <SettingsModal />
      <AchModal />
      <HabitModal />
      <TaskModal />
      <AvatarModal />
      <AssistantModal />
      <TemplatesModal />
    </div>
  )
}
