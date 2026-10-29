import { describe, expect, it } from 'vitest'

import { makeProjectFile, parseProjectFile, DEFAULT_PROJECT_INFO } from './project-file'
import { DEFAULT_THEME_CONFIG, isSeparate, linkMode, normalizeModes, separateMode, withDefaults, withModeIntents } from './theme-config'
import { generateTokens } from './theme-generator'
import { exportTheme, themeToCss } from './theme-export'

describe('system modes', () => {
  it('keeps valid modes in order, base first', () => {
    expect(normalizeModes(['dark', 'light'])).toEqual(['dark', 'light'])
    expect(normalizeModes(['dark'])).toEqual(['dark'])
  })

  it('falls back to light and dark for missing or broken input', () => {
    expect(normalizeModes(undefined)).toEqual(['light', 'dark'])
    expect(normalizeModes([])).toEqual(['light', 'dark'])
    expect(normalizeModes(['sepia', 'dark', 'dark'])).toEqual(['dark'])
  })

  it('older themes without modes get light and dark', () => {
    expect(withDefaults({ name: 'Old' }).modes).toEqual(['light', 'dark'])
  })

  it('previews only a mode the system ships', () => {
    expect(withDefaults({ modes: ['dark'], appearance: 'light' }).appearance).toBe('dark')
    expect(withDefaults({ modes: ['light', 'dark'], appearance: 'dark' }).appearance).toBe('dark')
  })

  it('saves the theme in its base mode', () => {
    const file = makeProjectFile(DEFAULT_PROJECT_INFO, { ...DEFAULT_THEME_CONFIG, modes: ['dark', 'light'], appearance: 'light' })
    expect(file.theme.appearance).toBe('dark')
    expect(makeProjectFile(DEFAULT_PROJECT_INFO, { ...DEFAULT_THEME_CONFIG, brand: 'kids' }).theme.brand).toBeNull()
    expect(parseProjectFile(JSON.stringify(file)).theme.modes).toEqual(['dark', 'light'])
  })
})

describe('code export follows the modes', () => {
  it('a dark-only system exports only dark', () => {
    const data = exportTheme(withDefaults({ modes: ['dark'] }))
    expect(data.modeOrder).toEqual(['dark'])
    expect(Object.keys(data.modes)).toEqual(['dark'])
    const css = themeToCss(data)
    expect(css).toContain('Dark on :root')
    expect(css).not.toContain('data-appearance')
  })

  it('a dark-first system puts dark on :root and light behind the attribute', () => {
    const css = themeToCss(exportTheme(withDefaults({ modes: ['dark', 'light'] })))
    expect(css).toContain('Dark on :root; Light when an ancestor has data-appearance="light"')
    expect(css).toContain('[data-appearance="light"] {')
    expect(css).not.toContain('[data-appearance="dark"]')
  })

  it('light and dark stay as before', () => {
    const css = themeToCss(exportTheme(DEFAULT_THEME_CONFIG))
    expect(css).toContain('Light on :root; Dark when an ancestor has data-appearance="dark"')
  })
})

describe('modes set up separately', () => {
  const both = withDefaults({ modes: ['light', 'dark'], color: { ...DEFAULT_THEME_CONFIG.color, main: { h: 200, c: 0.12, l: 0.55 } } })

  it('separating a mode starts it from the shared choices, so nothing jumps', () => {
    const t = separateMode(both, 'dark')
    expect(isSeparate(t, 'dark')).toBe(true)
    expect(generateTokens({ ...t, appearance: 'dark' })).toEqual(generateTokens({ ...both, appearance: 'dark' }))
  })

  it('a separate mode uses its own colors; the base mode keeps the shared ones', () => {
    const t = separateMode(both, 'dark')
    const own = { ...t, separate: { dark: { ...t.separate.dark!, color: { ...t.separate.dark!.color, main: { h: 20, c: 0.15, l: 0.6 } } } } }
    expect(generateTokens({ ...own, appearance: 'dark' })).not.toEqual(generateTokens({ ...both, appearance: 'dark' }))
    expect(generateTokens({ ...own, appearance: 'light' })).toEqual(generateTokens({ ...both, appearance: 'light' }))
  })

  it('the base mode is never separate, and linking drops the own choices', () => {
    expect(separateMode(both, 'light')).toBe(both)
    expect(isSeparate(linkMode(separateMode(both, 'dark'), 'dark'), 'dark')).toBe(false)
  })

  it('cleans up: only modes after the base can be separate', () => {
    const t = withDefaults({ modes: ['dark', 'light'], separate: { dark: { color: DEFAULT_THEME_CONFIG.color, depth: 1 }, light: { color: DEFAULT_THEME_CONFIG.color, depth: 0.5 } } })
    expect(Object.keys(t.separate)).toEqual(['light'])
    expect(withDefaults({ modes: ['light'], separate: { dark: { color: DEFAULT_THEME_CONFIG.color, depth: 1 } } }).separate).toEqual({})
  })

  it('previewing a separate mode shows its own colors and depth', () => {
    const t = { ...separateMode(both, 'dark'), appearance: 'dark' as const }
    t.separate.dark!.depth = 0.9
    expect(withModeIntents(t).depth).toBe(0.9)
    expect(withModeIntents({ ...t, appearance: 'light' }).depth).toBe(both.depth)
  })
})

describe('subtle (ghost) fills', () => {
  it('are the link color at a low opacity, as Figma links them', () => {
    const out = generateTokens(withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, accent: '#00ffd9' } }))
    const link = out['color/foreground/interactive/default']
    const rgb = (c: string) => c.match(/\d+/g)!.slice(0, 3).join(',')
    const hex = link.replace('#', '').match(/../g)!.map((x) => parseInt(x, 16)).join(',')
    expect(rgb(out['color/background/interactive/subtle/hover'])).toBe(hex)
    expect(out['color/background/interactive/subtle/hover']).toMatch(/,0\.1\)$/)
    expect(out['color/background/interactive/subtle/pressed']).toMatch(/,0\.15\)$/)
  })
})
