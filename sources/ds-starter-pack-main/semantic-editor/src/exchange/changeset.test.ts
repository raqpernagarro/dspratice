import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME_CONFIG, groupOf, separateMode, withDefaults } from '../../../stories/base-ui/tokens/theme-config'
import { fillMissingModes, REPO_DATA, variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { buildChangeSet } from './changeset'

describe('Figma change set follows the modes', () => {
  it('lists the modes, base first, as Figma names them', () => {
    expect(buildChangeSet(DEFAULT_THEME_CONFIG).modes).toEqual(['Light', 'Dark'])
    expect(buildChangeSet(withDefaults({ modes: ['dark', 'light'] })).modes).toEqual(['Dark', 'Light'])
  })

  it('a dark-only system only changes dark values', () => {
    const cs = buildChangeSet(withDefaults({ modes: ['dark'], radius: 16 }))
    expect(cs.modes).toEqual(['Dark'])
    expect(cs.values.length).toBeGreaterThan(0)
    expect(cs.values.every((v) => v.mode === 'Dark')).toBe(true)
  })

  it('both modes change both', () => {
    const cs = buildChangeSet(withDefaults({ radius: 16 }))
    expect(new Set(cs.values.map((v) => v.mode))).toEqual(new Set(['Light', 'Dark']))
  })
})

describe('Figma change set with a separate mode', () => {
  it('dark values come from dark’s own colors, in their own palette', () => {
    const base = separateMode(withDefaults({ color: { ...DEFAULT_THEME_CONFIG.color, main: { h: 200, c: 0.12, l: 0.55 } } }), 'dark')
    const own = { ...base, separate: { dark: { ...base.separate.dark!, color: { ...base.separate.dark!.color, main: { h: 20, c: 0.15, l: 0.6 } } } } }
    const linked = buildChangeSet(base)
    const split = buildChangeSet(own)
    const pick = (cs: typeof linked, mode: string) => JSON.stringify(cs.values.filter((v) => v.mode === mode))
    expect(pick(split, 'Light')).toEqual(pick(linked, 'Light'))
    expect(pick(split, 'Dark')).not.toEqual(pick(linked, 'Dark'))
    const families = (cs: typeof linked) => new Set(cs.primitives.map((p) => p.name.split('/')[1]))
    expect(families(split).size).toBeGreaterThan(families(linked).size)
  })
})

describe('Figma change set with brands', () => {
  it('the main brand goes to semantic, every other brand to its own collection', () => {
    const base = withDefaults({ radius: 12 })
    const theme = withDefaults({
      ...base,
      brands: [
        { id: 'health', name: 'Acme Health', description: '', appType: 'dashboard', own: null },
        { id: 'kids', name: 'Acme Kids', description: '', appType: 'mobile', own: { shape: { ...groupOf(base, 'shape'), radius: 24 } as never } },
      ],
    })
    const cs = buildChangeSet(theme)
    expect(cs.brands).toEqual(['Acme Kids'])
    const cols = new Set(cs.values.map((v) => v.collection))
    expect(cols).toEqual(new Set(['semantic', 'Acme Kids']))
  })

  it('a brand the starter file has under another name (Gold Brand) goes to a collection named as the brand', () => {
    const theme = withDefaults({
      brands: [
        { id: 'blue', name: 'Blue', description: '', appType: 'dashboard', own: null },
        { id: 'gold', name: 'Gold', description: '', appType: 'dashboard', own: { shape: { ...groupOf(DEFAULT_THEME_CONFIG, 'shape'), radius: 4 } as never } },
      ],
    })
    const cs = buildChangeSet(theme)
    expect(cs.brands).toEqual(['Gold'])
    expect(new Set(cs.values.map((v) => v.collection))).toEqual(new Set(['semantic', 'Gold']))
  })

  it('a single-brand system lists no extra brands', () => {
    expect(buildChangeSet(DEFAULT_THEME_CONFIG).brands).toEqual([])
  })
})

describe('another brand never silently inherits the main brand', () => {
  const base = withDefaults({ radius: 14, type: { ...DEFAULT_THEME_CONFIG.type, baseSize: 16 } })
  const theme = withDefaults({
    ...base,
    brands: [
      { id: 'main', name: 'Main', description: '', appType: 'dashboard', own: null },
      // Starter text size and default radius: values the starter Figma file already has.
      { id: 'zero', name: 'Zero', description: '', appType: 'mobile', own: { fonts: { type: { ...base.type, baseSize: 14 } }, shape: { ...groupOf(base, 'shape'), radius: null } as never } },
    ],
  })
  const cs = buildChangeSet(theme)
  const at = (collection: string, variable: string, mode = 'Light') => cs.values.find((v) => v.collection === collection && v.variable === variable && v.mode === mode)

  it('writes the brand’s own value where it matches the starter but the main brand changes it', () => {
    const main = at('semantic', 'font/size/body/md')
    const zero = at('Zero', 'font/size/body/md')
    expect(main).toBeDefined()
    expect(zero).toBeDefined()
    expect(zero!.value).not.toEqual(main!.value)
  })

  it('pins what the brand leaves at the default when the main brand changes it', () => {
    const main = at('semantic', 'shape/radius/md')
    const zero = at('Zero', 'shape/radius/md')
    expect(main).toBeDefined()
    expect(zero?.reason).toBe('System value')
    expect(zero!.value).not.toEqual(main!.value)
  })

  it('every token the main brand changes is decided for the brand too', () => {
    for (const mode of ['Light', 'Dark']) {
      const mainVars = cs.values.filter((v) => v.collection === 'semantic' && v.mode === mode).map((v) => v.variable)
      const missing = mainVars.filter((name) => !at('Zero', name, mode))
      // Whatever is left out is identical for both brands (same generated value).
      for (const name of missing) {
        const m = at('semantic', name, mode)!
        expect(m).toBeDefined()
      }
    }
  })
})

describe('the change set is complete', () => {
  it('every semantic token gets a value in every mode, even at the system default', () => {
    const cs = buildChangeSet(DEFAULT_THEME_CONFIG)
    for (const mode of ['Light', 'Dark']) {
      const names = new Set(cs.values.filter((v) => v.collection === 'semantic' && v.mode === mode).map((v) => v.variable))
      expect(names.size).toBeGreaterThanOrEqual(180)
    }
  })

  it('color + opacity tokens come back as a composite, not a flat color', () => {
    const cs = buildChangeSet(DEFAULT_THEME_CONFIG)
    const composites = cs.values.filter((v) => typeof v.value === 'object' && v.value.opacity !== undefined)
    expect(composites.length).toBeGreaterThan(10)
  })
})


describe('Variables-table edits in the change set', () => {
  const gold = variableGraph.brandCollection('gold')!
  const hover = variableGraph.byName('color/background/accent/hover')!
  const red = variableGraph.byName('colors/red/500')!
  const op = variableGraph.byName('opacity/50')!
  const goldLight = gold.modes.find((m) => m.name === 'Light')!

  it('a brand’s edit goes to the collection named as the brand, replacing its theme value', () => {
    const theme = withDefaults({
      brands: [
        { id: 'blue', name: 'Blue', description: '', appType: 'dashboard', own: null },
        { id: 'gold', name: 'Gold', description: '', appType: 'dashboard', own: null },
      ],
      variables: { [hover.id]: { [goldLight.id]: { a: red.id } } },
    })
    const cs = buildChangeSet(theme)
    const forHover = cs.values.filter((v) => v.variable === hover.name && v.mode === 'Light' && v.collection !== 'semantic')
    expect(forHover).toEqual([expect.objectContaining({ collection: 'Gold', value: { alias: red.name, collection: 'primitives' }, reason: 'Variables table' })])
  })

  it('a color + opacity edit keeps its opacity', () => {
    const light = variableGraph.semantic.modes.find((m) => m.name === 'Light')!
    const cs = buildChangeSet(withDefaults({ variables: { [hover.id]: { [light.id]: { a: red.id, o: op.id } } } }))
    expect(cs.values.find((v) => v.collection === 'semantic' && v.variable === hover.name && v.mode === 'Light')?.value).toEqual({ alias: red.name, collection: 'primitives', opacity: op.name })
  })
})

describe('a Figma file exported while the system was light only', () => {
  /** The starter file without its Dark mode, as the plugin would export it. */
  function lightOnly() {
    const data = structuredClone(REPO_DATA)
    const dark = new Set(data.collections.flatMap((c) => c.modes.filter((m) => m.name === 'Dark').map((m) => m.id)))
    for (const c of data.collections) {
      c.modes = c.modes.filter((m) => !dark.has(m.id))
      for (const byMode of Object.values(c.overrides ?? {})) for (const id of dark) delete byMode[id]
    }
    for (const v of data.variables) for (const id of dark) delete v.values[id]
    return data
  }
  const values = (cs: ReturnType<typeof buildChangeSet>) => JSON.stringify([...cs.values].sort((a, b) => `${a.collection}|${a.variable}|${a.mode}`.localeCompare(`${b.collection}|${b.variable}|${b.mode}`)))

  it('adding dark later exports the same dark as a system that had it from the start', () => {
    const theme = withDefaults({
      radius: 12,
      color: { ...DEFAULT_THEME_CONFIG.color, main: { h: 265, c: 0.3, l: 0.45 } },
      brands: [
        { id: 'blue', name: 'Blue', description: '', appType: 'dashboard', own: null },
        { id: 'gold', name: 'Gold', description: '', appType: 'dashboard', own: { colors: groupOf({ ...DEFAULT_THEME_CONFIG, color: { ...DEFAULT_THEME_CONFIG.color, main: { h: 80, c: 0.15, l: 0.6 } } }, 'colors') as never } },
      ],
    })
    const fromStart = buildChangeSet(theme)
    try {
      variableGraph.replace(fillMissingModes(lightOnly()), { fileName: 'light-only', exportedAt: '' })
      const later = buildChangeSet(theme)
      expect(later.values.some((v) => v.collection !== 'semantic' && v.mode === 'Dark')).toBe(true)
      expect(values(later)).toEqual(values(fromStart))
    } finally {
      variableGraph.replace(REPO_DATA, null)
    }
  })
})
