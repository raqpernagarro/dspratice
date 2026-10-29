import { describe, expect, it } from 'vitest'

import { repoAnatomy } from '../../../stories/base-ui/tokens/component-anatomy'
import { VARIABLES_FORMAT, type FigmaValue, type VariablesExport } from '../../../stories/base-ui/tokens/exchange-format'
import { fileValues, valueId, valueKey, variantKey } from '../../../stories/base-ui/tokens/figma-sync'
import { DEFAULT_THEME_CONFIG, withDefaults, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { isAlias, REPO_DATA, type RawValue } from '../../../stories/base-ui/tokens/variables-model'
import { buildChangeSet } from './changeset'
import { recordFigmaChanges, reviewFigmaFile } from './figmaSync'

/** The repo's own variables as a plugin export: a Figma file exactly like the system's starter. */
function repoExport(): VariablesExport {
  const toFigma = (raw: RawValue): FigmaValue => {
    if (isAlias(raw)) {
      const color = { type: 'VARIABLE_ALIAS' as const, id: raw.a }
      return raw.o === undefined ? color : { color, opacity: typeof raw.o === 'number' ? raw.o : { type: 'VARIABLE_ALIAS', id: raw.o } }
    }
    if (typeof raw === 'string' && /^#|^rgb/.test(raw)) {
      const m = raw.startsWith('#') ? raw.slice(1).match(/../g)!.map((h) => parseInt(h, 16) / 255) : raw.match(/[\d.]+/g)!.map((x, i) => (i < 3 ? Number(x) / 255 : Number(x)))
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }
    }
    return raw as FigmaValue
  }
  const exp: VariablesExport = { format: VARIABLES_FORMAT, fileName: 'Starter', exportedAt: 'now', meta: { variables: {}, variableCollections: {} }, components: structuredClone(repoAnatomy()) }
  for (const c of REPO_DATA.collections) {
    exp.meta.variableCollections[c.id] = {
      id: c.id,
      name: c.name,
      modes: c.modes.map((m) => ({ modeId: m.id, name: m.name, parentModeId: m.parent })),
      defaultModeId: c.modes[0].id,
      variableIds: REPO_DATA.variables.filter((v) => v.collection === c.id).map((v) => v.id),
      ...(c.extends
        ? {
            isExtension: true,
            parentVariableCollectionId: c.extends,
            variableOverrides: Object.fromEntries(Object.entries(c.overrides ?? {}).map(([vid, byMode]) => [vid, Object.fromEntries(Object.entries(byMode).map(([m, r]) => [m, toFigma(r)]))])),
          }
        : {}),
    }
  }
  for (const v of REPO_DATA.variables) {
    exp.meta.variables[v.id] = {
      id: v.id,
      name: v.name,
      variableCollectionId: v.collection,
      resolvedType: v.type,
      description: v.description,
      valuesByMode: Object.fromEntries(Object.entries(v.values).filter(([, r]) => r !== null).map(([m, r]) => [m, toFigma(r)])),
    }
  }
  return exp
}

/** The file as the plugin remembers it right after a sync. */
function synced(exp: VariablesExport): VariablesExport {
  const values = Object.fromEntries(fileValues(exp).map((f) => [valueId(f.collection, f.variable, f.mode), valueKey(f.value)]))
  return { ...exp, sync: { base: { syncedAt: 'then', source: 'Starter', version: '1.0' }, values, rebound: [] } }
}

const byName = (exp: VariablesExport, name: string) => Object.values(exp.meta.variables).find((v) => v.name === name)!
const point = (exp: VariablesExport, name: string, to: string) => {
  const v = byName(exp, name)
  for (const m of Object.keys(v.valuesByMode)) v.valuesByMode[m] = { type: 'VARIABLE_ALIAS', id: byName(exp, to).id }
}
const starter = withDefaults({ ...DEFAULT_THEME_CONFIG, modes: ['light', 'dark'] })
const apply = (theme: ThemeConfig, exp: VariablesExport) => {
  const review = reviewFigmaFile(exp, theme)
  const rec = recordFigmaChanges(exp, theme, review.items.filter((i) => i.keep))
  return { review, theme: { ...theme, ...rec.theme }, rec }
}

describe('what changed in Figma', () => {
  it('a file just like the system has nothing to review', () => {
    expect(reviewFigmaFile(repoExport(), starter).items).toEqual([])
    expect(reviewFigmaFile(synced(repoExport()), starter).items).toEqual([])
  })

  it('a hand edit since the sync is suggested to keep, and recording it sends it back', () => {
    const exp = synced(repoExport())
    point(exp, 'color/background/accent/hover', 'colors/red/500')
    const { review, theme } = apply(starter, exp)
    expect(review.items.map((i) => [i.label, i.status, i.keep])).toEqual([
      ['color/background/accent/hover · Light', 'figma', true],
      ['color/background/accent/hover · Dark', 'figma', true],
    ])
    const sent = buildChangeSet(theme).values.find((v) => v.collection === 'semantic' && v.variable === 'color/background/accent/hover' && v.mode === 'Light')
    expect(sent?.value).toMatchObject({ alias: 'colors/red/500' })
    expect(reviewFigmaFile(exp, theme).items).toEqual([])
  })

  it('without memory, a difference is shown but the system’s value is suggested', () => {
    const exp = repoExport()
    point(exp, 'color/background/accent/hover', 'colors/red/500')
    expect(reviewFigmaFile(exp, starter).items.map((i) => [i.status, i.keep])).toEqual([
      ['different', false],
      ['different', false],
    ])
  })

  it('a change on both sides says so', () => {
    const exp = synced(repoExport())
    point(exp, 'color/background/accent/default', 'colors/red/500')
    const moved = withDefaults({ ...starter, color: { ...starter.color, accent: '#00ffd9' } })
    const item = reviewFigmaFile(exp, moved).items.find((i) => i.label === 'color/background/accent/default · Light')
    expect(item?.status).toBe('both')
  })

  it('a new variable joins the system, with the primitive it points at', () => {
    const exp = synced(repoExport())
    const prim = Object.values(exp.meta.variableCollections).find((c) => c.name === 'primitives')!
    const sem = Object.values(exp.meta.variableCollections).find((c) => c.name === 'semantic')!
    exp.meta.variables['new:1'] = { id: 'new:1', name: 'colors/brand/glow', variableCollectionId: prim.id, resolvedType: 'COLOR', valuesByMode: { [prim.modes[0].modeId]: { r: 1, g: 0.5, b: 0, a: 1 } } }
    exp.meta.variables['new:2'] = { id: 'new:2', name: 'color/background/glow', variableCollectionId: sem.id, resolvedType: 'COLOR', valuesByMode: Object.fromEntries(sem.modes.map((m) => [m.modeId, { type: 'VARIABLE_ALIAS', id: 'new:1' }])) }
    const { review, theme } = apply(starter, exp)
    expect(review.items.every((i) => i.status === 'new' && i.keep)).toBe(true)
    expect(theme.added.map((v) => v.name).sort()).toEqual(['color/background/glow', 'colors/brand/glow'])
    const cs = buildChangeSet(theme)
    expect(cs.primitives.find((p) => p.name === 'colors/brand/glow')?.value).toBe('#FF8000')
    expect(cs.values.find((v) => v.variable === 'color/background/glow')?.value).toMatchObject({ alias: 'colors/brand/glow' })
  })

  it('a rebound component layer becomes a component override', () => {
    const exp = synced(repoExport())
    const variant = exp.components!.find((c) => c.name === 'Button')!.variants.find(
      (v) => v.props.Type === 'Secondary' && v.props.State === 'Hover' && v.props.Size === 'Medium' && v.props.Destructive === 'False',
    )!
    variant.bindings.find((b) => b.field === 'fills' && b.layer === '')!.variable = 'color/background/accent/hover'
    exp.sync!.rebound = [variantKey('Button', variant.props)]
    const { review, theme } = apply(starter, exp)
    expect(review.items.map((i) => i.label)).toEqual(['Button · Background · Secondary · Hover'])
    expect(theme.components).toEqual({ 'button/background/secondary/hover': 'color/background/accent/hover' })
    expect(buildChangeSet(theme).components?.map((c) => c.token)).toEqual(['button/background/secondary/hover'])
  })

  it('a variable only Figma has is listed as new, also when it was there at the sync', () => {
    const exp = repoExport()
    const prim = Object.values(exp.meta.variableCollections).find((c) => c.name === 'primitives')!
    exp.meta.variables['new:3'] = { id: 'new:3', name: 'colors/brand/ember', variableCollectionId: prim.id, resolvedType: 'COLOR', valuesByMode: { [prim.modes[0].modeId]: { r: 0.8, g: 0.2, b: 0, a: 1 } } }
    expect(reviewFigmaFile(synced(exp), starter).items.map((i) => [i.label, i.status])).toEqual([['colors/brand/ember', 'new']])
  })

  it('“Use the system’s” for an edited primitive sends the system’s value back', () => {
    const exp = synced(repoExport())
    const blue = byName(exp, 'colors/blue/500')
    for (const m of Object.keys(blue.valuesByMode)) blue.valuesByMode[m] = { r: 1, g: 0, b: 0, a: 1 }
    const item = reviewFigmaFile(exp, starter).items.find((i) => i.label === 'colors/blue/500')
    expect(item?.system).toMatch(/^#/)
    expect(valueKey(buildChangeSet(starter).primitives.find((p) => p.name === 'colors/blue/500')!.value as string)).toBe(item?.system)
  })

  it('variables kept in one theme don’t follow into another', () => {
    const exp = synced(repoExport())
    const prim = Object.values(exp.meta.variableCollections).find((c) => c.name === 'primitives')!
    exp.meta.variables['new:4'] = { id: 'new:4', name: 'colors/brand/moss', variableCollectionId: prim.id, resolvedType: 'COLOR', valuesByMode: { [prim.modes[0].modeId]: { r: 0.3, g: 0.5, b: 0.2, a: 1 } } }
    const { theme } = apply(starter, exp)
    expect(buildChangeSet(theme).primitives.some((p) => p.name === 'colors/brand/moss')).toBe(true)
    expect(buildChangeSet(starter).primitives.some((p) => p.name === 'colors/brand/moss')).toBe(false)
  })
})
