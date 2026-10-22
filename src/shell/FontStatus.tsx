import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

export interface FontCheck {
  equipRegular: boolean
  equipMedium: boolean
  equipExtended: boolean
}

export async function checkNagarroFonts(): Promise<FontCheck> {
  if (typeof document === 'undefined' || !('fonts' in document)) return { equipRegular: false, equipMedium: false, equipExtended: false }
  const specs = ['400 16px "Equip"', '500 16px "Equip"', '500 16px "Equip Extended"']
  try {
    await Promise.all(specs.map((s) => document.fonts.load(s)))
  } catch {
    /* fall through to check() */
  }
  const [equipRegular, equipMedium, equipExtended] = specs.map((s) => document.fonts.check(s))
  return { equipRegular, equipMedium, equipExtended }
}

/** Nagarro-only typography status line. Verifies the licensed fonts actually loaded. */
export function FontStatus() {
  const [state, setState] = useState<FontCheck | null>(null)
  useEffect(() => {
    let alive = true
    checkNagarroFonts().then((r) => {
      if (!alive) return
      setState(r)
      if (!(r.equipRegular && r.equipMedium && r.equipExtended)) console.warn('[typography] Equip / Equip Extended not fully loaded', r)
    })
    return () => {
      alive = false
    }
  }, [])
  if (!state) return <span className="small muted">Checking fonts…</span>
  const ok = state.equipRegular && state.equipMedium && state.equipExtended
  const missing = [!state.equipRegular && 'Equip 400', !state.equipMedium && 'Equip 500', !state.equipExtended && 'Equip Extended 500'].filter(Boolean)
  return (
    <span className="row small" style={{ color: ok ? 'var(--n-ok)' : 'var(--n-warn)' }}>
      {ok ? <CheckCircle2 style={{ width: 14 }} /> : <AlertTriangle style={{ width: 14 }} />}
      {ok ? 'Equip and Equip Extended loaded (document.fonts.check)' : `Missing: ${missing.join(', ')} · system fallback active`}
    </span>
  )
}
