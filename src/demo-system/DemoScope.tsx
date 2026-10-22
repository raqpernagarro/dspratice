import type { CSSProperties, ReactNode } from 'react'
import { useStore } from '@/state/store'
import { useSystem } from '@/state/hooks'
import type { BrandId, Mode, SystemState, Token } from '@/state/types'
import { tokenValue } from '@/state/selectors'
import './demo.css'

/** Resolves the token set into CSS custom properties for one brand × mode (aliases resolved). */
export function tokensToVars(tokens: Token[], brand: BrandId, mode: Mode, theme?: { radius?: number; density?: number; heading?: string; body?: string; depth?: number }): Record<string, string> {
  const byId = new Map(tokens.map((t) => [t.id, t]))
  const resolve = (v: string, depth = 0): string => {
    const m = v.match(/^\{(.+)\}$/)
    if (!m || depth > 5) return v
    const t = byId.get(m[1].replace(/\./g, '-'))
    return t ? resolve(tokenValue(t, brand, mode), depth + 1) : v
  }
  const vars: Record<string, string> = {}
  for (const t of tokens) vars[t.cssName] = resolve(tokenValue(t, brand, mode))
  if (theme) {
    if (theme.radius !== undefined) {
      vars['--shape-radius-control'] = `${theme.radius}px`
      vars['--button-radius'] = `${theme.radius}px`
      vars['--card-radius'] = `${Math.round(theme.radius * 1.5)}px`
      vars['--shape-radius-sm'] = `${Math.max(2, Math.round(theme.radius * 0.6))}px`
    }
    if (theme.heading) vars['--font-family-heading'] = `'${theme.heading}', 'Outfit Variable', 'Figtree Variable', system-ui, sans-serif`
    if (theme.body) vars['--font-family-body'] = `'${theme.body}', 'Figtree Variable', system-ui, sans-serif`
    if (theme.depth !== undefined) vars['--effect-shadow-md'] = theme.depth <= 0 ? 'none' : `0 ${Math.round(8 * theme.depth * 2)}px ${Math.round(24 * theme.depth * 2)}px rgba(22,27,38,${(0.1 * theme.depth * 2).toFixed(2)})`
  }
  return vars
}

export function DemoScope({ brand, mode, density, children, style, className, themed, system }: { brand?: BrandId; mode?: Mode; density?: 'compact' | 'standard' | 'comfortable'; children: ReactNode; style?: CSSProperties; className?: string; themed?: boolean; /** Explicit system to render (e.g. a published snapshot outside the workspace shell). Defaults to the page's system. */ system?: Pick<SystemState, 'tokens' | 'theme'> }) {
  const current = useSystem()
  const sys = system ?? current
  const tokens = sys.tokens
  const theme = sys.theme
  const previewBrand = useStore((s) => s.ui.previewBrand)
  const previewMode = useStore((s) => s.ui.previewMode)
  const previewDensity = useStore((s) => s.ui.previewDensity)
  const b = brand ?? previewBrand
  const m = mode ?? previewMode
  const d = density ?? (themed ? (theme.density < 0.9 ? 'compact' : theme.density > 1.1 ? 'comfortable' : 'standard') : previewDensity)
  const vars = tokensToVars(tokens, b, m, themed ? { radius: theme.radius, heading: theme.type.heading, body: theme.type.body, depth: theme.depth } : undefined)
  return (
    <div className={`ds-scope ${className ?? ''}`} data-brand={b} data-appearance={m} data-density={d} style={{ ...(vars as CSSProperties), ...style }}>
      {children}
    </div>
  )
}
