import { useEffect } from 'react'
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

  // responsive breakpoint tracking
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 760)
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [setNarrow])

  // cloud sync: pull on start, then push (debounced) whenever data changes
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
        if (!cancelled) useStore.getState().setSyncStatus('synced')
      } catch {
        if (!cancelled) useStore.getState().setSyncStatus('offline')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!cloudEnabled()) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = useStore.subscribe((state, prev) => {
      if (state.data === prev.data) return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        useStore.getState().setSyncStatus('syncing')
        try {
          await pushState(useStore.getState().data)
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
    </div>
  )
}
