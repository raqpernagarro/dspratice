import { DEFAULT_EXTRAS, sanitizeExtras, type StyleExtras, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { variableGraph } from '../../../stories/base-ui/tokens/variables-model'

/**
 * Style extras (borders, shadow style, button shape, heading weight) are a theme intent:
 * `theme.extras`, turned into tokens by the theme generator (see theme-generator.ts). This file
 * only holds the agent-side helpers.
 */
export { DEFAULT_EXTRAS, sanitizeExtras, type StyleExtras }

/** The extras a theme carries. */
export const readExtras = (theme: ThemeConfig): StyleExtras => theme.extras ?? DEFAULT_EXTRAS

/** Tokens an earlier version wrote as raw Variables-table edits for the extras. */
const LEGACY_TOKENS = [
  'size/border/regular',
  'size/border/strong',
  'font/weight/heading/strong',
  'color/border/neutral/regular',
  'color/border/neutral/strong',
  'color/border/interactive/default',
  ...['low', 'medium', 'high'].flatMap((l) => [`color/shadow/elevation/${l}`, ...['offset-x', 'offset-y', 'blur', 'spread'].map((p) => `effect/shadow/elevation/${l}/${p}`)]),
]
const LEGACY_PILL = ['button/radius/sm', 'button/radius/md', 'button/radius/lg', 'icon-button/radius/sm', 'icon-button/radius/md', 'icon-button/radius/lg']

/**
 * Removes what an earlier version of the extras wrote by hand (literal token edits, pill
 * overrides), so a look applied now is expressed only through `theme.extras`.
 */
export function stripLegacyExtras(theme: ThemeConfig): ThemeConfig {
  const owned = new Set(LEGACY_TOKENS.map((n) => variableGraph.byName(n)?.id).filter(Boolean) as string[])
  const variables = Object.fromEntries(Object.entries(theme.variables).filter(([id]) => !owned.has(id)))
  const components = Object.fromEntries(Object.entries(theme.components).filter(([t, alias]) => !(LEGACY_PILL.includes(t) && alias === 'shape/radius/full')))
  return { ...theme, variables, components }
}

/** Plain-language lines for the change list. */
export function describeExtras(x: StyleExtras): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  if (x.borderWidth > 1 || x.borderColor !== 'default') out.push({ label: 'Borders', value: `${x.borderWidth}px${x.borderColor === 'default' ? '' : x.borderColor === 'ink' ? ', ink' : ', brand color'}` })
  if (x.shadow !== 'default') out.push({ label: 'Shadows', value: { none: 'None, flat', hard: 'Hard offset', glow: 'Glow', default: '' }[x.shadow] })
  if (x.buttonShape === 'pill') out.push({ label: 'Buttons', value: 'Pill shaped' })
  if (x.headingWeight !== 700) out.push({ label: 'Heading weight', value: String(x.headingWeight) })
  return out
}
