import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME_CONFIG, withDefaults, type StyleExtras, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { effectiveComponents, figmaBase, generateTokens } from '../../../stories/base-ui/tokens/theme-generator'
import { variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { buildChangeSet } from '../exchange/changeset'
import { THEME_PRESETS } from './presets'
import { stripLegacyExtras } from './styleExtras'
import { applyProposal } from './themeAgent'
import { REPO_DATA } from '../../../stories/base-ui/tokens/variables-model'

const preset = (id: string) => THEME_PRESETS.find((p) => p.id === id)!.proposal
const themed = (id: string) => applyProposal(DEFAULT_THEME_CONFIG, preset(id))
const withExtras = (x: Partial<StyleExtras>): ThemeConfig => ({ ...DEFAULT_THEME_CONFIG, extras: { ...DEFAULT_THEME_CONFIG.extras, ...x } })

const EXTRA_PATHS = /^(size\/border\/|color\/border\/(neutral\/(regular|strong)|interactive\/default)$|color\/shadow\/elevation\/|effect\/shadow\/elevation\/)/

describe('style extras in the theme generator', () => {
  it('writes no tokens for the defaults', () => {
    const tokens = generateTokens(DEFAULT_THEME_CONFIG)
    expect(Object.keys(tokens).filter((p) => EXTRA_PATHS.test(p) || p === 'font/weight/heading/strong')).toEqual([])
    expect(effectiveComponents(DEFAULT_THEME_CONFIG)).toEqual({})
  })

  it('takes ink from the system’s own primary text color, per mode', () => {
    for (const appearance of ['light', 'dark'] as const) {
      const theme = { ...withExtras({ borderColor: 'ink', borderWidth: 2 }), appearance }
      const tokens = generateTokens(theme)
      expect(tokens['color/border/neutral/regular']).toBe(figmaBase(theme)['color/foreground/neutral/primary'])
      expect(tokens['size/border/regular']).toBe('2px')
    }
  })

  it('takes brand outlines and glow from the generated brand color', () => {
    const tokens = generateTokens(themed('neon'))
    expect(tokens['color/border/neutral/regular']).toBe(tokens['color/background/interactive/primary/default'])
    expect(tokens['color/shadow/elevation/low']).toMatch(/^rgba\(/)
  })

  it('pill buttons are component overrides the user can still override', () => {
    const theme = { ...withExtras({ buttonShape: 'pill' }), components: { 'button/radius/md': 'shape/radius/sm' } }
    expect(effectiveComponents(theme)['button/radius/lg']).toBe('shape/radius/full')
    expect(effectiveComponents(theme)['button/radius/md']).toBe('shape/radius/sm')
  })

  it('survives a project file round trip', () => {
    expect(withDefaults(JSON.parse(JSON.stringify(themed('playful')))).extras).toEqual(preset('playful').extras)
    expect(withDefaults({ extras: { borderWidth: 9, shadow: 'lava' } as never }).extras).toMatchObject({ borderWidth: 3, shadow: 'default' })
  })
})

describe('applying a look', () => {
  it('leaves no Variables-table edits behind', () => {
    for (const p of THEME_PRESETS) expect(applyProposal(DEFAULT_THEME_CONFIG, p.proposal).variables).toEqual({})
  })

  it('cleans up raw edits an earlier version wrote', () => {
    const border = variableGraph.byName('size/border/regular')!
    const light = variableGraph.semanticMode('light')
    const legacy: ThemeConfig = { ...DEFAULT_THEME_CONFIG, variables: { [border.id]: { [light]: 2 }, other: { [light]: 5 } }, components: { 'button/radius/md': 'shape/radius/full', 'input/radius/md': 'shape/radius/lg' } }
    const clean = stripLegacyExtras(legacy)
    expect(clean.variables).toEqual({ other: { [light]: 5 } })
    expect(clean.components).toEqual({ 'input/radius/md': 'shape/radius/lg' })
  })
})

describe('Figma export of style extras', () => {
  /** Semantic variables that alias a primitive in Figma today. */
  const aliased = (name: string) => {
    const v = variableGraph.byName(name)
    const val = v ? Object.values(v.values)[0] : undefined
    return Boolean(val && typeof val === 'object')
  }

  for (const id of ['playful', 'neon', 'editorial', 'calm']) {
    it(`${id}: tokens that alias primitives stay aliases (no hard-coded values)`, () => {
      const cs = buildChangeSet(themed(id))
      const literals = cs.values.filter((c) => c.collection === 'semantic' && aliased(c.variable) && typeof c.value !== 'object')
      expect(literals.map((c) => `${c.variable} (${c.mode}) = ${String(c.value)}`)).toEqual([])
    })
  }

  it('reuses existing primitives for ink and black: no new grey primitives', () => {
    const cs = buildChangeSet(withExtras({ borderColor: 'ink', shadow: 'hard', borderWidth: 2 }))
    // The repo's own primitives travel at their value too; none may be new.
    const repo = new Set(REPO_DATA.variables.map((v) => v.name))
    const colorPrims = cs.primitives.filter((p) => p.type === 'COLOR' && !repo.has(p.name))
    expect(colorPrims.map((p) => p.name)).toEqual([])
    // In this system the default outlines already are the ink, so borders may be a no-op;
    // whatever is exported must point at a primitive.
    for (const c of cs.values.filter((v) => v.variable.startsWith('color/border/'))) expect(c.value).toMatchObject({ collection: 'primitives' })
    const width = cs.values.find((c) => c.variable === 'size/border/regular')
    expect(width?.value).toMatchObject({ collection: 'primitives' })
    const shadow = cs.values.filter((c) => c.variable.startsWith('color/shadow/elevation/'))
    expect(shadow.length).toBeGreaterThan(0)
    for (const c of shadow) expect(c.value).toMatchObject({ collection: 'primitives' })
  })

  it('glow shadows become a translucent primitive linked to the brand color', () => {
    const cs = buildChangeSet(themed('neon'))
    const glow = cs.values.find((c) => c.variable === 'color/shadow/elevation/low' && c.mode === 'Dark')
    expect(glow?.value).toMatchObject({ collection: 'primitives' })
    const alias = (glow!.value as { alias: string }).alias
    expect(alias).toMatch(/\/alpha\/\d+$/)
    expect(cs.primitives.find((p) => p.name === alias)?.value).toMatchObject({ alias: expect.any(String), opacity: expect.any(String) })
  })

  it('lengths never alias opacity primitives', () => {
    for (const id of ['playful', 'neon']) {
      const cs = buildChangeSet(themed(id))
      const wrong = cs.values.filter((c) => /^(effect|size)\//.test(c.variable) && typeof c.value === 'object' && c.value.alias.startsWith('opacity/'))
      expect(wrong.map((c) => `${c.variable} -> ${(c.value as { alias: string }).alias}`)).toEqual([])
    }
  })

  it('pill buttons export as component overrides', () => {
    const cs = buildChangeSet(themed('playful'))
    expect(JSON.stringify(cs.components)).toContain('shape/radius/full')
  })
})
