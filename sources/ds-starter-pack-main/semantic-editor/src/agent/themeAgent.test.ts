import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME_CONFIG, separateMode } from '../../../stories/base-ui/tokens/theme-config'
import { THEME_PRESETS } from './presets'
import { applyProposal, describeChanges, sanitizeProposal } from './themeAgent'

describe('theme agent output', () => {
  it('clamps out-of-range values and drops invalid ones', () => {
    const p = sanitizeProposal({
      appearance: 'neon',
      main: { h: 400, c: 0.9, l: 0.1 },
      accent: 'pink',
      radius: 80,
      density: 0.1,
      bodyFont: 'Comic Sans Imaginary',
      headingFont: 'fredoka',
      status: { info: '#2563EB', success: 'green', warning: null, error: '#dc2626' },
    })
    expect(p.appearance).toBe('light')
    expect(p.main).toEqual({ h: 360, c: 0.3, l: 0.3 })
    expect(p.accent).toBeNull()
    expect(p.radius).toBe(24)
    expect(p.density).toBe(0.75)
    expect(p.bodyFont).toBeNull()
    expect(p.headingFont).toBe('Fredoka')
    expect(p.status).toEqual({ info: '#2563eb', success: null, warning: null, error: '#dc2626' })
  })

  it('keeps variable edits and component overrides when applying', () => {
    const before = { ...DEFAULT_THEME_CONFIG, components: { 'input/radius/md': 'shape/radius/lg' } }
    const after = applyProposal(before, sanitizeProposal({ radius: 12, appearance: 'dark' }))
    expect(after.components).toEqual(before.components)
    expect(describeChanges(before, after).map((c) => c.label)).toEqual(['Appearance', 'Corner radius'])
  })
})

describe('styling a mode set up separately', () => {
  it('changes that mode’s colors and the shared type and shape, not the base colors', () => {
    const preset = THEME_PRESETS.find((p) => p.id === 'playful')!.proposal
    const theme = { ...separateMode(DEFAULT_THEME_CONFIG, 'dark'), appearance: 'dark' as const }
    const next = applyProposal(theme, preset)
    expect(next.appearance).toBe('dark')
    expect(next.color).toEqual(theme.color)
    expect(next.separate.dark!.color.main).toEqual(preset.main)
    expect(next.radius).toBe(preset.radius)
  })
})
