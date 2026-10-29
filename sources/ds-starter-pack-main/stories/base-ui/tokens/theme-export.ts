/**
 * ThemeConfig → files for code: the whole theme resolved, both appearances, with no reference to
 * this repo. Same layering as applyTheme() (Figma base, brand, configurator overrides), written
 * out instead of applied to the page.
 *
 * - JSON: Figma token paths → values per appearance, the shape of figma-semantic.json's `modes`,
 *   plus component overrides (component token → semantic token path).
 * - CSS: custom properties; Light on :root, Dark under [data-appearance="dark"] (only what differs).
 */
import { overrideCss } from './component-tokens'
import { figmaTokenToCssVar } from './figma-css-var'
import { figmaBase, generateTokens, effectiveComponents } from './theme-generator'
import type { Appearance, ThemeConfig } from './theme-config'
import { variableGraph } from './variables-model'

export const THEME_FORMAT = 'ds-configurator/theme@1'

type TokenMap = Record<string, string>

export interface ThemeExport {
  format: typeof THEME_FORMAT
  name: string
  exportedAt: string
  /** Always null: the main brand is the default. Extra brands are under `brands`. */
  brand: string | null
  /** The modes the system ships, base first. */
  modeOrder: Appearance[]
  /** The main brand's semantic tokens per mode: 'color/background/accent/default' → '#06041f'. */
  modes: Partial<Record<Appearance, TokenMap>>
  /** Every other brand: its name and its full set of tokens per mode. */
  brands: { id: string; name: string; modes: Partial<Record<Appearance, TokenMap>> }[]
  /** Component overrides: 'button/radius/md' → 'shape/radius/full' (a semantic token or text style). */
  components: TokenMap
}

function brandModes(config: ThemeConfig, brand: string | null): Partial<Record<Appearance, TokenMap>> {
  const modes: Partial<Record<Appearance, TokenMap>> = {}
  for (const appearance of config.modes) {
    const at = { ...config, brand, appearance }
    const generated = generateTokens(at)
    modes[appearance] = {
      // A brand extension may only list what it changes: the default values fill the rest.
      ...figmaBase({ brand: null, appearance }),
      ...(brand ? figmaBase({ brand, appearance }) : {}),
      ...generated,
      ...variableGraph.overrides({ appearance, brand }, config.variables, generated),
    }
  }
  return modes
}

export function exportTheme(config: ThemeConfig): ThemeExport {
  return {
    format: THEME_FORMAT,
    name: config.name,
    exportedAt: new Date().toISOString(),
    brand: null,
    modeOrder: config.modes,
    modes: brandModes(config, null),
    brands: config.brands.slice(1).map((b) => ({ id: b.id, name: b.name, modes: brandModes(config, b.id) })),
    components: effectiveComponents(config),
  }
}

export function themeToCss(theme: ThemeExport): string {
  const decl = (map: TokenMap) =>
    Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, value]) => `  ${figmaTokenToCssVar(path)}: ${value};`)
      .join('\n')
  const [base, ...others] = theme.modeOrder
  const baseMap = theme.modes[base] ?? {}
  const label = (m: Appearance) => m[0].toUpperCase() + m.slice(1)
  const components = overrideCss(theme.components)
  const otherBlocks = others
    .map((m) => {
      const map = theme.modes[m] ?? {}
      const differs = Object.fromEntries(Object.entries(map).filter(([k, v]) => baseMap[k] !== v))
      return `
[data-appearance="${m}"] {
${decl(differs)}
}
`
    })
    .join('')
  // Each extra brand: what differs from the main brand, per mode.
  const brandBlocks = (theme.brands ?? [])
    .map((brand) =>
      theme.modeOrder
        .map((m, i) => {
          // What applies without this block: the main brand in this mode, then the brand's base-mode
          // block (same specificity, later, so it wins over the main mode's).
          const brandBase = brand.modes[base] ?? {}
          const baseDiff = Object.fromEntries(Object.entries(brandBase).filter(([k, v]) => baseMap[k] !== v))
          const fallback = i === 0 ? baseMap : { ...(theme.modes[m] ?? {}), ...baseDiff }
          const own = brand.modes[m] ?? {}
          const differs = Object.fromEntries(Object.entries(own).filter(([k, v]) => fallback[k] !== v))
          const selector = i === 0 ? `[data-brand="${brand.id}"]` : `[data-brand="${brand.id}"][data-appearance="${m}"], [data-appearance="${m}"] [data-brand="${brand.id}"]`
          return Object.keys(differs).length ? `\n/* ${brand.name}, ${label(m)} */\n${selector} {\n${decl(differs)}\n}\n` : ''
        })
        .join(''),
    )
    .join('')
  return `/*
 * Theme "${theme.name}", exported from the DS Configurator on ${theme.exportedAt.slice(0, 10)}.
 * ${label(base)} on :root${others.map((m) => `; ${label(m)} when an ancestor has data-appearance="${m}"`).join('')}.${
   theme.brands?.length ? `\n * Brands: ${theme.brands.map((b) => `${b.name} with data-brand="${b.id}"`).join(', ')}.` : ''
 }
 */

:root {
${decl(baseMap)}
}
${otherBlocks}${brandBlocks}${
  Object.keys(components).length
    ? `
/* Component overrides */
:root {
${decl(components)}
}
`
    : ''
}`
}
