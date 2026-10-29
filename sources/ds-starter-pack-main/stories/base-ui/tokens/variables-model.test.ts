import { describe, expect, it } from 'vitest'

import { fillMissingModes, REPO_DATA, VariableGraph, type GraphData } from './variables-model'

/** The starter file as a Figma file exported while the system was light only: no Dark anywhere. */
function lightOnly(): GraphData {
  const data = structuredClone(REPO_DATA)
  const dark = new Set(data.collections.flatMap((c) => c.modes.filter((m) => m.name === 'Dark').map((m) => m.id)))
  for (const c of data.collections) {
    c.modes = c.modes.filter((m) => !dark.has(m.id))
    for (const byMode of Object.values(c.overrides ?? {})) for (const id of dark) delete byMode[id]
  }
  for (const v of data.variables) for (const id of dark) delete v.values[id]
  return data
}

describe('a mode the imported file doesn’t have', () => {
  const starter = new VariableGraph(REPO_DATA)
  const filled = new VariableGraph(fillMissingModes(lightOnly()))
  const semantic = [...filled.vars.values()].filter((v) => v.collection === filled.semantic.id)

  it('is added, marked as filled in, after the file’s own mode', () => {
    expect(filled.semantic.modes.map((m) => [m.name, Boolean(m.filled)])).toEqual([
      ['Light', false],
      ['Dark', true],
    ])
  })

  it('gets the values it would have had from the start', () => {
    for (const ctx of [
      { appearance: 'dark' as const, brand: null },
      { appearance: 'dark' as const, brand: 'gold' },
      { appearance: 'light' as const, brand: null },
    ])
      for (const v of semantic) expect([v.name, filled.resolve(v, ctx)]).toEqual([v.name, starter.resolve(starter.byName(v.name)!, ctx)])
  })

  it('keeps pointing at the file’s own tokens', () => {
    const v = semantic.find((x) => filled.value(x, { appearance: 'dark', brand: null }) !== null && typeof filled.value(x, { appearance: 'dark', brand: null }) === 'object')
    expect(v).toBeDefined()
    const alias = filled.value(v!, { appearance: 'dark', brand: null }) as { a: string }
    expect(filled.vars.has(alias.a)).toBe(true)
  })

  it('type, spacing and shape copy the file’s own mode', () => {
    const data = lightOnly()
    const sem = data.collections.find((c) => c.name === 'semantic')!
    const radius = data.variables.find((v) => v.collection === sem.id && v.type === 'FLOAT' && !(v.description ?? '').includes('[per-mode]'))!
    radius.values[sem.modes[0].id] = 99
    const graph = new VariableGraph(fillMissingModes(data))
    expect(graph.resolve(graph.vars.get(radius.id)!, { appearance: 'dark', brand: null })).toBe(99)
  })

  it('leaves files with both modes, or with unnamed modes, as they are', () => {
    expect(fillMissingModes(REPO_DATA)).toBe(REPO_DATA)
    const data = lightOnly()
    data.collections.find((c) => c.name === 'semantic')!.modes[0].name = 'Mode 1'
    expect(fillMissingModes(data)).toBe(data)
  })
})
