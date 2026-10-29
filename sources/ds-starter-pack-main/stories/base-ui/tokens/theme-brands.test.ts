import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME_CONFIG, groupOf, isSeparate, ownsGroup, separateMode, setBrandGroup, withDefaults, withModeIntents, writeIntents, type ThemeConfig } from './theme-config'
import { exportTheme, themeToCss } from './theme-export'
import { toOklch } from './color-math'
import { generateTokens } from './theme-generator'

const blue = { h: 250, c: 0.14, l: 0.5 }
const orange = { h: 40, c: 0.16, l: 0.62 }

function twoBrands(): ThemeConfig {
  const base = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, main: blue } })
  return withDefaults({
    ...base,
    brands: [
      { id: 'health', name: 'Acme Health', description: 'For clinicians', appType: 'dashboard', own: null },
      { id: 'kids', name: 'Acme Kids', description: 'For families', appType: 'mobile', own: { colors: { color: { ...base.color, main: orange }, separate: {} }, shape: { ...groupOf(base, 'shape'), radius: 20 } as never } },
    ],
  })
}

describe('brands', () => {
  it('keeps brands, the main one owning nothing of its own', () => {
    const t = twoBrands()
    expect(t.brands.map((b) => b.id)).toEqual(['health', 'kids'])
    expect(t.brands[0].own).toBeNull()
    expect(t.brands[1].own?.shape?.radius).toBe(20)
    expect(t.brands[1].own?.fonts).toBeUndefined()
  })

  it('one named brand is a single-brand system, and an unknown preview falls back to the main brand', () => {
    expect(withDefaults({ brands: [{ id: 'a', name: 'A', description: '', appType: 'dashboard', own: null }] }).brands).toEqual([])
    expect(withDefaults({ ...twoBrands(), brand: 'gold' }).brand).toBeNull()
  })

  it('a brand looks like itself; the main brand keeps the shared choices', () => {
    const t = twoBrands()
    expect(withModeIntents({ ...t, brand: 'kids' }).color.main).toEqual(orange)
    expect(withModeIntents({ ...t, brand: 'kids' }).radius).toBe(20)
    expect(withModeIntents(t).color.main).toEqual(blue)
    expect(generateTokens({ ...t, brand: 'kids' })).not.toEqual(generateTokens(t))
  })

  it('edits go to the brand being previewed', () => {
    const t = { ...twoBrands(), brand: 'kids' }
    const next = writeIntents(t, { radius: 4 })
    expect(next.brands[1].own?.shape?.radius).toBe(4)
    expect(next.radius).toBe(t.radius)
    const main = writeIntents({ ...t, brand: null }, { radius: 8 })
    expect(main.radius).toBe(8)
    expect(main.brands[1].own?.shape?.radius).toBe(20)
  })

  it('a brand can set its second mode up separately on its own', () => {
    const t = separateMode({ ...twoBrands(), brand: 'kids' }, 'dark')
    expect(isSeparate(t, 'dark')).toBe(true)
    expect(isSeparate({ ...t, brand: null }, 'dark')).toBe(false)
    const dark = writeIntents({ ...t, appearance: 'dark' }, { color: { ...t.brands[1].own!.colors!.color, main: blue } })
    expect(dark.brands[1].own?.colors?.separate.dark?.color.main).toEqual(blue)
    expect(dark.brands[1].own?.colors?.color.main).toEqual(orange)
  })
})

describe('brands follow the main brand, group by group', () => {
  it('a group the brand doesn’t own follows the main brand, including later changes', () => {
    const t = twoBrands()
    expect(withModeIntents({ ...t, brand: 'kids' }).type).toEqual(t.type)
    const bigger = writeIntents(t, { type: { ...t.type, baseSize: 20 } })
    expect(withModeIntents({ ...bigger, brand: 'kids' }).type.baseSize).toBe(20)
  })

  it('editing a followed group while viewing the brand changes the main brand, so both follow', () => {
    const t = { ...twoBrands(), brand: 'kids' }
    const next = writeIntents(t, { type: { ...t.type, baseSize: 18 } })
    expect(next.type.baseSize).toBe(18)
    expect(next.brands[1].own?.fonts).toBeUndefined()
  })

  it('owning a group starts from the main brand; following again drops the brand’s own', () => {
    const t = twoBrands()
    const owned = setBrandGroup(t, 'kids', 'fonts', true)
    expect(ownsGroup(owned, 'kids', 'fonts')).toBe(true)
    expect(owned.brands[1].own?.fonts?.type).toEqual(t.type)
    expect(ownsGroup(setBrandGroup(owned, 'kids', 'fonts', false), 'kids', 'fonts')).toBe(false)
  })

  it('older brands that copied everything keep only what differs from the main brand', () => {
    const base = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, main: blue }, radius: 8 })
    const old = withDefaults({
      ...base,
      brands: [
        { id: 'a', name: 'A', description: '', appType: 'dashboard', own: null },
        { id: 'b', name: 'B', description: '', appType: 'dashboard', own: { color: { ...base.color, main: orange }, type: base.type, radius: 8, depth: null, extras: base.extras, separate: {} } as never },
      ],
    })
    expect(Object.keys(old.brands[1].own ?? {})).toEqual(['colors'])
  })
})

describe('code export with brands', () => {
  it('exports every brand, each under its own data-brand attribute', () => {
    const data = exportTheme(twoBrands())
    expect(data.brands.map((b) => b.id)).toEqual(['kids'])
    const css = themeToCss(data)
    expect(css).toContain('Brands: Acme Kids with data-brand="kids"')
    expect(css).toContain('[data-brand="kids"] {')
  })

  it('a brand in dark mode gets what the cascade would otherwise get wrong', () => {
    const data = exportTheme(twoBrands())
    const css = themeToCss(data)
    // Resolve one token the way a browser would for a kids element in dark mode.
    const token = '--color-background-interactive-primary-default'
    const blocks = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.replace(/\/\*[\s\S]*?\*\//g, '').trim(), body }))
    const valueIn = (sel: (s: string) => boolean) => {
      let v: string | undefined
      for (const b of blocks) if (sel(b.sel)) v = b.body.match(new RegExp(`${token}: ([^;]+);`))?.[1] ?? v
      return v
    }
    const resolved = valueIn((s) => s === ':root' || s === '[data-appearance="dark"]' || s === '[data-brand="kids"]' || s.startsWith('[data-brand="kids"][data-appearance="dark"]'))
    expect(resolved).toBe(data.brands[0].modes.dark?.['color/background/interactive/primary/default'])
  })
})

describe('background and shades', () => {
  it('a background picked on its own leans the greys toward its hue, not the brand’s', () => {
    const brand = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, main: blue, neutralTint: 0.5 } })
    const warm = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, main: blue, neutralTint: 0.5, neutralHue: 70 } })
    const a = generateTokens(brand)['color/background/neutral/secondary']
    const b = generateTokens(warm)['color/background/neutral/secondary']
    expect(a).toBeDefined()
    expect(b).not.toEqual(a)
  })

  it('how many shades of text a system has is the same for every brand', () => {
    const t = { ...twoBrands(), color: { ...twoBrands().color, tertiary: true } }
    expect(withModeIntents({ ...t, brand: 'kids' }).color.tertiary).toBe(true)
  })
})

describe('page background color', () => {
  const cream = { l: 0.965, c: 0.025, h: 85 }
  const page = (t: ThemeConfig) => generateTokens(t)['color/background/neutral/primary']

  it('a light page takes the picked color, and surfaces keep their distance from it', () => {
    const t = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, background: cream } })
    const g = generateTokens(t)
    expect(g['color/background/neutral/primary']).toBeDefined()
    expect(g['color/background/neutral/primary']).not.toBe('#ffffff')
    expect(g['color/background/surface/low']).toBe(g['color/background/neutral/primary'])
    // Text is left alone.
    expect(g['color/foreground/neutral/primary']).toBeUndefined()
  })

  it('light pages stay light: a dark pick in light mode is lifted', () => {
    const t = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, background: { l: 0.2, c: 0, h: 0 } } })
    expect(toOklch(page(t))!.l).toBeGreaterThanOrEqual(0.85)
  })

  it('a dark mode that follows takes the page hue but keeps its own darkness', () => {
    const t = withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, background: cream } })
    const darkPage = page({ ...t, appearance: 'dark' })
    expect(darkPage).toBeDefined()
    expect(darkPage).not.toBe(page(t))
  })

  it('a dark mode with its own colors gets its own page', () => {
    const navy = { l: 0.2, c: 0.045, h: 265 }
    const t = separateMode(withDefaults({}), 'dark')
    const own = { ...t, appearance: 'dark' as const, separate: { dark: { ...t.separate.dark!, color: { ...t.separate.dark!.color, background: navy } } } }
    expect(page(own)).not.toBe(page({ ...t, appearance: 'dark' }))
    expect(generateTokens({ ...own, appearance: 'light' })['color/background/neutral/primary']).toBeUndefined()
  })
})
