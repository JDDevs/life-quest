import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.tsx'
import { isWidgetMode } from './lib/tauri'
import { WidgetRoot } from './widget/WidgetRoot'

const widget = isWidgetMode()
if (widget) {
  // Transparent floating-widget window: kill the light body bg (and its fade
  // transition) before the first paint so the rounded corners are see-through.
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  document.body.style.transition = 'none'
}

createRoot(document.getElementById('root')!).render(
  widget ? (
    <WidgetRoot />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
)
