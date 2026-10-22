import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { AlertTriangle, CheckCircle2, FlaskConical, Info, X, XCircle } from 'lucide-react'
import { useStore } from '@/state/store'

/**
 * Short confirmations. Each one leaves on its own timer. On the shared screen of the client demo
 * only the latest shows, for less time, without the internal "what changed" detail.
 */
export function Toasts() {
  const toasts = useStore((s) => s.sim.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const client = useLocation().pathname.startsWith('/client/')
  const shown = toasts.slice(client ? -1 : -3)
  const key = shown.map((t) => t.id).join(',')

  useEffect(() => {
    const timers = shown.map((t) => setTimeout(() => dismiss(t.id), client ? Math.min(t.ttl ?? 4500, 4500) : (t.ttl ?? 6500)))
    // Older toasts that are not shown leave at once.
    for (const t of toasts) if (!shown.includes(t)) dismiss(t.id)
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, client, dismiss])

  if (!shown.length) return null
  return (
    <div className="toasts" aria-live="polite">
      {shown.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === 'info' ? 'sim' : t.kind}`}>
          {t.kind === 'sim' ? <FlaskConical /> : t.kind === 'ok' ? <CheckCircle2 /> : t.kind === 'warn' ? <AlertTriangle /> : t.kind === 'err' ? <XCircle /> : <Info />}
          <div className="toast__body">
            <span className="toast__title">{t.title}</span>
            {t.detail && <span className="toast__detail">{t.detail}</span>}
            {t.diff && !client && (
              <span className="toast__detail">
                What changed: {t.diff.join(' · ')}
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ width: 24, height: 24 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      ))}
    </div>
  )
}
