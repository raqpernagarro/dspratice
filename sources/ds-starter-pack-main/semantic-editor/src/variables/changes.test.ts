import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME_CONFIG } from '../../../stories/base-ui/tokens/theme-config'
import { variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { THEME_PRESETS } from '../agent/presets'
import { applyProposal } from '../agent/themeAgent'
import { computeChanges } from './changes'

const playful = applyProposal(DEFAULT_THEME_CONFIG, THEME_PRESETS.find((p) => p.id === 'playful')!.proposal)

describe('what the theme changes', () => {
  it('a default theme changes nothing', () => {
    expect(computeChanges(DEFAULT_THEME_CONFIG).count).toBe(0)
  })

  it('a preset reports each changed variable with its new value per mode', () => {
    const { byName, count } = computeChanges(playful)
    expect(count).toBeGreaterThan(50)
    expect(byName.get('size/border/regular')).toEqual({ source: 'theme', values: { light: 2, dark: 2 } })
    expect(byName.get('font/family/secondary')?.values.light).toBe('Fredoka')
    expect(byName.get('button/radius/md')?.source).toBe('theme')
  })

  it('labels hand edits and component overrides', () => {
    const border = variableGraph.byName('size/border/regular')!
    const theme = {
      ...DEFAULT_THEME_CONFIG,
      variables: { [border.id]: { [variableGraph.semanticMode('light')]: 4 } },
      components: { 'input/radius/md': 'shape/radius/lg' },
    }
    const { byName, count } = computeChanges(theme)
    expect(byName.get('size/border/regular')?.source).toBe('edit')
    expect(byName.get('input/radius/md')?.source).toBe('override')
    expect(count).toBe(2)
  })
})
