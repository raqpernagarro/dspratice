import { useState } from 'react'
import { useSys } from '@/state/hooks'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsAvatar, DsBadge, DsButton, DsCard, DsCheckbox, DsInput, DsPagination, DsSelect, DsTable, DsTabs, DsToast, DsToggle } from '@/demo-system/components'
import { Segmented } from '@/shell/ui'
import type { BrandId, Mode, ThemeConfig } from '@/state/types'

function hexShift(hex: string, amount: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))))
  return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** The theme's intents (brand colour, radius, button shape, type) as CSS variables over the system's tokens:
 *  what makes a preview look like this client's system before anything is saved. */
export function themeIntentVars(theme: ThemeConfig, brand: BrandId, mode: Mode): React.CSSProperties {
  const activeBrand = theme.brands.find((b) => b.id === brand) ?? theme.brands[0]
  const main = activeBrand.main
  return {
    '--color-background-interactive-primary-default': mode === 'light' ? main : hexShift(main, 0.18),
    '--color-background-interactive-primary-hover': mode === 'light' ? hexShift(main, -0.18) : hexShift(main, 0.32),
    '--color-background-interactive-primary-active': mode === 'light' ? hexShift(main, -0.3) : hexShift(main, 0.45),
    '--color-background-interactive-primary-selected': mode === 'light' ? main : hexShift(main, 0.18),
    '--button-background-primary-default': mode === 'light' ? main : hexShift(main, 0.18),
    '--color-border-interactive-focus': activeBrand.accent,
    '--button-radius': theme.buttonShape === 'pill' ? '999px' : `${theme.radius}px`,
    '--font-family-heading': `'${theme.type.heading}', 'Outfit Variable', system-ui, sans-serif`,
    '--font-family-body': `'${theme.type.body}', 'Figtree Variable', system-ui, sans-serif`,
    '--font-size-md': `${theme.type.baseSize}px`,
    '--font-size-sm': `${Math.round(theme.type.baseSize * 0.87)}px`,
    '--font-size-lg': `${Math.round(theme.type.baseSize * 1.2)}px`,
  } as React.CSSProperties
}

/** Live preview of the theme intents on the real Demo Brand components (the wizard's "bento"). */
export function LivePreview({ compact }: { compact?: boolean }) {
  const theme = useSys((s) => s.theme)
  const [mode, setMode] = useState<Mode>(theme.designedFirst)
  const [brand, setBrand] = useState<BrandId>(theme.activeBrand)
  const activeBrand = theme.brands.find((b) => b.id === brand) ?? theme.brands[0]
  const overrides = themeIntentVars(theme, brand, mode)
  return (
    <div className="preview-frame">
      <div className="preview-frame__bar">
        <span>
          Live preview · {theme.name} · {activeBrand.name}
        </span>
        <span className="row">
          {theme.brands.length > 1 && <Segmented value={brand} options={theme.brands.map((b) => ({ id: b.id, label: b.name }))} onChange={setBrand} />}
          {theme.appearance === 'both' && (
            <Segmented
              value={mode}
              options={[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ]}
              onChange={setMode}
            />
          )}
        </span>
      </div>
      <DemoScope brand={brand} mode={theme.appearance === 'both' ? mode : theme.appearance} themed style={overrides}>
        <div className="bento" style={{ fontWeight: undefined }}>
          <div className="span-2 row" style={{ gap: 8 }}>
            <DsButton>Primary</DsButton>
            <DsButton variant="secondary">Secondary</DsButton>
            <DsButton variant="ghost">Ghost</DsButton>
            <DsButton variant="destructive">Delete</DsButton>
            <DsBadge tone="success">Active</DsBadge>
            <DsAvatar />
          </div>
          <DsCard title="Notifications" body="Choose how and when the product reaches you.">
            <DsToggle />
            <DsCheckbox />
          </DsCard>
          <div className="stack" style={{ gap: 10 }}>
            <DsInput />
            <DsSelect />
            <DsTabs />
          </div>
          {!compact && (
            <>
              <div className="span-2">
                <DsTable />
              </div>
              <DsPagination />
              <DsToast />
            </>
          )}
        </div>
      </DemoScope>
    </div>
  )
}
