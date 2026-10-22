// The project's theme as intents (what the person decided), independent of either library's
// token grammar. Each adapter maps these to its own library.

import type { BrandDef, Mode, ThemeConfig } from '@/state/types'

export interface ThemeIntents {
  v: 1
  brand: { id: string; name: string; main: string; accent: string }
  neutralTint: number
  type: { heading: string; body: string; baseSize: number; headingWeight: number }
  radius: number
  buttonShape: 'default' | 'pill'
  density: number
  depth: number
  mode: Mode
}

export function intentsFromTheme(t: ThemeConfig, brandId?: string, mode?: Mode): ThemeIntents {
  const id = brandId ?? t.activeBrand
  const brand: BrandDef = t.brands.find((b) => b.id === id) ?? t.brands.find((b) => b.isDefault) ?? { id: 'demo', name: t.name, main: t.color.main, accent: t.color.accent }
  return {
    v: 1,
    brand: { id: brand.id, name: brand.name, main: brand.main, accent: brand.accent },
    neutralTint: t.color.neutralTint,
    type: { ...t.type },
    radius: t.radius,
    buttonShape: t.buttonShape,
    density: t.density,
    depth: t.depth,
    mode: mode ?? t.designedFirst,
  }
}

export function sameIntents(a: ThemeIntents | undefined, b: ThemeIntents | undefined) {
  return JSON.stringify(a) === JSON.stringify(b)
}
