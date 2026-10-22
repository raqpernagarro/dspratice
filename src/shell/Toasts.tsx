import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, FlaskConical, Info, X, XCircle } from 'lucide-react'
import { useStore } from '@/state/store'

export function Toasts() {
  const toasts = useStore((s) => s.sim.toasts)
  const dismiss = useStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toasts.length) return
    const t = toasts[toasts.length - 1]
    const h = setTimeout(() => dismiss(t.id), t.ttl ?? 6500)
    return () => clearTimeout(h)
  }, [toasts, dismiss])

  if (!toasts.length) return null
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === 'info' ? 'sim' : t.kind}`}>
          {t.kind === 'sim' ? <FlaskConical /> : t.kind === 'ok' ? <CheckCircle2 /> : t.kind === 'warn' ? <AlertTriangle /> : t.kind === 'err' ? <XCircle /> : <Info />}
          <div className="toast__body">
            <span className="toast__title">{t.title}</span>
            {t.detail && <span className="toast__detail">{t.detail}</span>}
            {t.diff && (
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
