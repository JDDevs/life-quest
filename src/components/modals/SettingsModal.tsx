import type { ReactNode } from 'react'
import { useStore } from '../../store'
import { cloudEnabled, pullState, pushState } from '../../lib/cloud'
import { Icon, Overlay, ghostBtn, primaryBtn, useC } from '../../ui'
import { ensurePomoNotifyPermission, notifySupported } from '../../lib/notify'

const SYNC_LABEL: Record<string, string> = {
  disabled: 'No configurada',
  syncing: 'Sincronizando…',
  synced: 'Sincronizado',
  error: 'Error',
  offline: 'Sin conexión',
}

export function SettingsModal() {
  const C = useC()
  const open = useStore((s) => s.settings)
  const d = useStore((s) => s.data)
  const setSettings = useStore((s) => s.setSettings)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const toggleMuted = useStore((s) => s.toggleMuted)
  const updatePomoSettings = useStore((s) => s.updatePomoSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetAll = useStore((s) => s.resetAll)
  const syncStatus = useStore((s) => s.syncStatus)
  const setSyncStatus = useStore((s) => s.setSyncStatus)
  const replaceData = useStore((s) => s.replaceData)
  if (!open) return null

  const cloudOn = cloudEnabled()
  const syncColor = syncStatus === 'synced' ? C.green : syncStatus === 'offline' || syncStatus === 'error' ? C.danger : C.muted
  const cloudUp = async () => {
    setSyncStatus('syncing')
    try {
      await pushState(useStore.getState().data)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
  }
  const cloudDown = async () => {
    setSyncStatus('syncing')
    try {
      const r = await pullState()
      if (r) replaceData(r.data)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
  }

  const sec = (title: string, children: ReactNode) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '10px' }}>{title}</div>
      {children}
    </div>
  )

  return (
    <Overlay onClose={() => setSettings(false)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontFamily: '"Space Grotesk"', fontSize: '19px' }}>Ajustes</h3>
        <button onClick={() => setSettings(false)} style={{ color: C.faint }}>
          <Icon name="close" size={22} color={C.faint} />
        </button>
      </div>
      {sec(
        'Nube (sincronización)',
        cloudOn ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: syncColor }} />
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: syncColor }}>{SYNC_LABEL[syncStatus] || syncStatus}</span>
              <span style={{ fontSize: '12.5px', color: C.muted, fontWeight: 500 }}>· guarda automáticamente</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={cloudUp} style={primaryBtn(C)}>
                <Icon name="cloud_upload" size={18} color="#fff" />
                Subir a la nube
              </button>
              <button onClick={cloudDown} style={ghostBtn(C)}>
                <Icon name="cloud_download" size={18} color={C.primary} />
                Bajar de la nube
              </button>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
            La sincronización en la nube no está configurada. Para activarla, define <b>VITE_SYNC_ID</b> (en el sitio) y{' '}
            <b>DATABASE_URL</b> de Neon (en el servidor de Vercel) — ver <b>DEPLOY.md</b>. Mientras tanto, tus datos viven en
            este navegador; usa <b>Exportar copia</b> para respaldarlos.
          </p>
        ),
      )}
      {sec(
        'Respaldo de tu progreso',
        <div>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>
            Tus datos se guardan en este navegador. Descarga una copia para no perder tu progreso si cambias de equipo o borras datos.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => exportData()} style={primaryBtn(C)}>
              <Icon name="download" size={18} color="#fff" />
              Exportar copia
            </button>
            <label style={{ ...ghostBtn(C), cursor: 'pointer' }}>
              <Icon name="upload" size={18} color={C.primary} />
              Importar copia
              <input
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  importData(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </div>,
      )}
      {sec(
        'Apariencia',
        <div style={{ display: 'flex', gap: '8px' }}>
          {(
            [
              ['light', 'Claro', 'light_mode'],
              ['dark', 'Oscuro', 'dark_mode'],
            ] as const
          ).map(([v, lb, ic]) => {
            const on = (d.theme || 'light') === v
            return (
              <button
                key={v}
                onClick={() => {
                  if (!on) toggleTheme()
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  border: '2px solid ' + (on ? C.primary : C.line2),
                  background: on ? C.primarySoft : C.card,
                  color: on ? C.primaryD : C.muted,
                }}
              >
                <Icon name={ic} size={19} color={on ? C.primary : C.faint} fill={on} />
                {lb}
              </button>
            )
          })}
        </div>,
      )}
      {sec(
        'Sonido',
        <button onClick={() => toggleMuted()} style={{ ...ghostBtn(C), width: '100%', justifyContent: 'center' }}>
          <Icon name={d.muted ? 'volume_off' : 'volume_up'} size={18} color={C.text} />
          {d.muted ? 'Sonido desactivado — toca para activar' : 'Sonido activado — toca para silenciar'}
        </button>,
      )}
      {notifySupported()
        ? sec(
            'Notificaciones',
            <div>
              <button
                onClick={async () => {
                  if (d.pomoSettings.notifyOnDone) {
                    updatePomoSettings({ notifyOnDone: false })
                    return
                  }
                  const ok = await ensurePomoNotifyPermission()
                  updatePomoSettings({ notifyOnDone: ok })
                }}
                style={{ ...ghostBtn(C), width: '100%', justifyContent: 'center' }}
              >
                <Icon name={d.pomoSettings.notifyOnDone ? 'notifications_active' : 'notifications_off'} size={18} color={C.text} />
                {d.pomoSettings.notifyOnDone ? 'Aviso al terminar el Pomodoro activado' : 'Avisarme al terminar el Pomodoro (escritorio)'}
              </button>
              {typeof Notification !== 'undefined' && Notification.permission === 'denied' ? (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: C.danger, fontWeight: 600 }}>
                  El navegador bloqueó las notificaciones. Actívalas en los permisos del sitio para recibir avisos.
                </p>
              ) : null}
            </div>,
          )
        : null}
      {sec(
        'Zona de riesgo',
        <button onClick={() => resetAll()} style={{ ...ghostBtn(C), width: '100%', justifyContent: 'center', color: C.danger, borderColor: C.danger + '55' }}>
          <Icon name="restart_alt" size={18} color={C.danger} />
          Borrar todo y empezar de cero
        </button>,
      )}
    </Overlay>
  )
}
