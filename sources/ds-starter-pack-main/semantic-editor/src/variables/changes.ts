import type { Appearance, ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { effectiveComponents, figmaBase, generateTokens } from '../../../stories/base-ui/tokens/theme-generator'
import { figmaTokenToCssVar } from '../../../stories/base-ui/tokens/figma-css-var'
import { variableGraph as graph, type RawValue } from '../../../stories/base-ui/tokens/variables-model'

/**
 * What the current theme changes, variable by variable — the one count both the Theme and the
 * Variables tabs show. A variable is changed when the theme generates a value that differs from
 * the file's own (in either mode), when the user edited it in the Variables table, or when a
 * component override points it somewhere else.
 */

export type ChangeSource = 'theme' | 'edit' | 'override'

export interface VariableChange {
  source: ChangeSource
  /** Value the theme gives it, per appearance (theme and override changes; edits show in the cell). */
  values: Partial<Record<Appearance, RawValue>>
}

export interface ThemeChanges {
  /** Variable name → change. */
  byName: Map<string, VariableChange>
  count: number
}

const cssVarToName = new Map<string, string>()
function nameForCssVar(cssVar: string) {
  if (!cssVarToName.size) for (const v of graph.vars.values()) cssVarToName.set(figmaTokenToCssVar(v.name), v.name)
  return cssVarToName.get(cssVar)
}

const norm = (v: string | undefined) => (v ?? '').replace(/\s+/g, '').replace(/^['"]|['"]$/g, '').toLowerCase()

/** Follows var(--x) references through the generated map, then the file's own values. */
function resolveCss(value: string, gen: Record<string, string>, base: Record<string, string>, depth = 0): string {
  const ref = value.match(/^var\((--[\w-]+)\)$/)
  if (!ref || depth > 10) return value
  const name = nameForCssVar(ref[1])
  const next = name ? (gen[name] ?? base[name]) : undefined
  return next === undefined ? value : resolveCss(next, gen, base, depth + 1)
}

function displayValue(type: string, css: string): RawValue {
  if (type === 'FLOAT') {
    const n = parseFloat(css)
    return Number.isNaN(n) ? css : n
  }
  return css.replace(/^['"]|['"]$/g, '')
}

export function computeChanges(theme: ThemeConfig): ThemeChanges {
  const byName = new Map<string, VariableChange>()

  for (const appearance of theme.modes) {
    // Tertiary-following is a preview rule the Figma export leaves out (see changeset.ts); the
    // change list matches what is exported.
    const gen = generateTokens({ ...theme, appearance, color: { ...theme.color, tertiary: true } })
    const base = figmaBase({ brand: theme.brand, appearance })
    for (const [path, css] of Object.entries(gen)) {
      const v = graph.byName(path)
      if (!v) continue
      const value = resolveCss(css, gen, base)
      if (norm(value) === norm(resolveCss(base[path] ?? '', base, base))) continue
      const entry = byName.get(path) ?? { source: 'theme' as const, values: {} }
      entry.values[appearance] = displayValue(v.type, value)
      byName.set(path, entry)
    }
  }

  const own = theme.components
  for (const [token, alias] of Object.entries(effectiveComponents(theme))) {
    const target = graph.byName(alias)
    const value: RawValue = target ? { a: target.id } : alias
    byName.set(token, { source: token in own ? 'override' : 'theme', values: { light: value, dark: value } })
  }

  // Hand edits in the Variables table win: the cell shows the edit itself.
  for (const id of Object.keys(theme.variables)) {
    const v = graph.vars.get(id)
    if (v) byName.set(v.name, { source: 'edit', values: {} })
  }

  return { byName, count: byName.size }
}
