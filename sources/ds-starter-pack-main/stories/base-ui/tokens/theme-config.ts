import type { RawVariable, VariableEdits } from './variables-model'

/**
 * What the configurator edits. Every field is an intent, never a token.
 * `null` means "keep the system default" for that group of tokens.
 */
export type Appearance = 'light' | 'dark'

export const APPEARANCES: Appearance[] = ['light', 'dark']

/** Mode names as Figma's semantic collection spells them. */
export const MODE_NAMES: Record<Appearance, string> = { light: 'Light', dark: 'Dark' }

/**
 * The modes a system ships, base first: ['light', 'dark'], ['dark', 'light'] (dark is designed
 * first), ['light'] or ['dark']. Invalid or empty input falls back to both, light first.
 */
export function normalizeModes(raw: unknown): Appearance[] {
  const list = Array.isArray(raw) ? raw.filter((m): m is Appearance => APPEARANCES.includes(m as Appearance)) : []
  const unique = [...new Set(list)]
  return unique.length ? unique : [...APPEARANCES]
}
export type StatusKind = 'info' | 'success' | 'warning' | 'error'

/** OKLCH color: hue (0–360), chroma (saturation), lightness (brightness 0–1). */
export interface Oklch3 {
  h: number
  c: number
  l: number
}

export type GenericFamily = 'sans-serif' | 'serif' | 'monospace' | 'cursive'

export interface WebFont {
  family: string
  /** Google Fonts css2 weight spec: "400;500;700" or a variable range "100..900". */
  weights: string
  /** Generic family used while the font loads or for a missing glyph. Older themes omit it: sans-serif. */
  fallback?: GenericFamily
}

/**
 * Character the sliders can't reach. The theme generator turns it into semantic tokens that
 * reference values the system already has (ink = the primary text color, brand = the brand color),
 * so exports link them to primitives like every other generated value.
 */
export type BorderColor = 'default' | 'ink' | 'brand'
export type ShadowStyle = 'default' | 'none' | 'hard' | 'glow'
export type ButtonShape = 'default' | 'pill'

export interface StyleExtras {
  /** Stroke width in px (1 = system default). */
  borderWidth: number
  borderColor: BorderColor
  /** default = soft shadows from `depth`; none = flat; hard = offset, no blur; glow = brand-colored halo. */
  shadow: ShadowStyle
  buttonShape: ButtonShape
  /** Heading weight, 400–900 (700 = system default). */
  headingWeight: number
}

export const DEFAULT_EXTRAS: StyleExtras = { borderWidth: 1, borderColor: 'default', shadow: 'default', buttonShape: 'default', headingWeight: 700 }

const clampNum = (v: unknown, min: number, max: number, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback)
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback)

export function sanitizeExtras(v: unknown): StyleExtras {
  const x = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
  return {
    borderWidth: Math.round(clampNum(x.borderWidth, 1, 3, 1)),
    borderColor: oneOf(x.borderColor, ['default', 'ink', 'brand'] as const, 'default'),
    shadow: oneOf(x.shadow, ['default', 'none', 'hard', 'glow'] as const, 'default'),
    buttonShape: oneOf(x.buttonShape, ['default', 'pill'] as const, 'default'),
    headingWeight: Math.round(clampNum(x.headingWeight, 400, 900, 700) / 100) * 100,
  }
}

export interface ThemeConfig {
  name: string
  /** The modes this system ships, base mode first (part of the system's profile). */
  modes: Appearance[]
  /** The mode being previewed; always one of `modes`. */
  appearance: Appearance
  /**
   * Modes set up separately: their own colors and shadow depth. A mode not listed follows the base
   * mode automatically (linked). The base mode is never listed: it holds the shared choices.
   */
  separate: Partial<Record<Appearance, ModeIntents>>
  /**
   * The brand being previewed: the id of one of `brands`, or `null` for the main brand (which is
   * the semantic collection itself). Extra brands are Figma collections that extend it.
   */
  brand: string | null
  /**
   * The system's named brands, main brand first. Empty for a single, unnamed brand. The main brand
   * uses the choices on this config; every other brand has its own colors, fonts and shape.
   */
  brands: BrandDef[]
  color: {
    /** Main brand color in OKLCH: hue (0–360), chroma (saturation), lightness (brightness). */
    main: Oklch3 | null
    /** Second brand color for highlights (selected states, links, focus). `null` follows main. */
    accent: string | null
    /** How much the greys (backgrounds, text, borders) lean toward their hue: 0 pure … 1 vivid. */
    neutralTint: number | null
    /** The hue the greys lean toward. `null` follows the brand color. */
    neutralHue: number | null
    /**
     * The page color of the mode these colors belong to (the base mode, or a mode set up
     * separately). Surfaces and subtle borders keep their distance from it; text is untouched.
     * A mode that follows takes only its hue. `null` keeps the system's page color.
     */
    background: Oklch3 | null
    /** Spread of generated palettes: <1 softer, >1 punchier. */
    rampContrast: number | null
    status: Record<StatusKind, string | null>
    /** Optional third emphasis level. Off: every …/tertiary token follows …/secondary. */
    tertiary: boolean
  }
  type: {
    body: WebFont | null
    /** `null` = same as body. */
    heading: WebFont | null
    /** Body text size in px. */
    baseSize: number | null
    /** Ratio between neighbouring text sizes. */
    scale: number | null
  }
  /** Medium radius in px; small / large / full scale from it. */
  radius: number | null
  /** Multiplier for spacing and control sizes (1 = default). */
  density: number | null
  /** Keeps spacing, control sizes and corners on the 4px grid (2px below 4). On unless switched off. */
  grid: boolean
  /** Shadow strength 0 (flat) … 1 (strongly elevated). */
  depth: number | null
  /** Borders, shadow style, button shape, heading weight. */
  extras: StyleExtras
  /** Manual edits from the Variables table: variable id → mode id → value. Applied last. */
  variables: VariableEdits
  /** Component overrides: component token (e.g. "button/radius/lg") → semantic token it points at. */
  components: Record<string, string>
  /** Variables made in Figma and kept in the system (imported from a plugin export); ids are Figma's. */
  added: RawVariable[]
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  name: 'Untitled theme',
  modes: ['light', 'dark'],
  appearance: 'light',
  separate: {},
  brands: [],
  brand: null,
  color: {
    main: null,
    accent: null,
    neutralTint: null,
    neutralHue: null,
    background: null,
    rampContrast: null,
    status: { info: null, success: null, warning: null, error: null },
    tertiary: false,
  },
  type: { body: null, heading: null, baseSize: null, scale: null },
  radius: null,
  density: null,
  grid: true,
  depth: null,
  extras: DEFAULT_EXTRAS,
  variables: {},
  components: {},
  added: [],
}

export function withDefaults(partial: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  const p = partial ?? {}
  const num = (v: unknown) => (typeof v === 'number' ? v : null)
  const modes = normalizeModes(p.modes)
  return {
    ...DEFAULT_THEME_CONFIG,
    ...p,
    modes,
    appearance: modes.includes(p.appearance as Appearance) ? (p.appearance as Appearance) : modes[0],
    separate: sanitizeSeparate(p.separate, modes),
    ...brandsAndPreview(p, modes),
    color: {
      ...DEFAULT_THEME_CONFIG.color,
      ...p.color,
      status: { ...DEFAULT_THEME_CONFIG.color.status, ...p.color?.status },
    },
    type: { ...DEFAULT_THEME_CONFIG.type, ...p.type },
    // Older saved configs stored presets as strings; ignore them.
    radius: num(p.radius),
    density: num(p.density),
    grid: p.grid !== false,
    depth: num(p.depth),
    extras: sanitizeExtras(p.extras),
    variables: p.variables && typeof p.variables === 'object' ? p.variables : {},
    components: p.components && typeof p.components === 'object' ? p.components : {},
    added: Array.isArray(p.added) ? p.added : [],
  }
}

/** What a separately set-up mode owns. Type, shape, spacing and component choices stay shared. */
export interface ModeIntents {
  color: ThemeConfig['color']
  depth: number | null
}

function sanitizeSeparate(raw: unknown, modes: Appearance[]): ThemeConfig['separate'] {
  const out: ThemeConfig['separate'] = {}
  if (!raw || typeof raw !== 'object') return out
  for (const m of modes.slice(1)) {
    const s = (raw as Record<string, Partial<ModeIntents> | undefined>)[m]
    if (!s || typeof s !== 'object') continue
    out[m] = {
      color: { ...DEFAULT_THEME_CONFIG.color, ...s.color, status: { ...DEFAULT_THEME_CONFIG.color.status, ...s.color?.status } },
      depth: typeof s.depth === 'number' ? s.depth : null,
    }
  }
  return out
}

/* ------------------------------------------------------------------ brands */

/** A brand of a multi-brand system. */
export interface BrandDef {
  /** Stable id: the CSS `data-brand` value and the link to its Figma collection. */
  id: string
  name: string
  description: string
  /** Product type id (see the configurator's product types). */
  appType: string
  /**
   * What this brand owns, group by group. A group left out follows the main brand: change the main
   * brand and this brand changes too. `null` for the main brand itself.
   */
  own: BrandOwn | null
}

/** The groups a brand can own. Modes, spacing, component choices and variable edits are system-wide. */
export type BrandGroup = 'colors' | 'fonts' | 'shape'
export const BRAND_GROUPS: BrandGroup[] = ['colors', 'fonts', 'shape']

export interface BrandOwn {
  /** Colors, and the colors of modes set up separately. */
  colors?: { color: ThemeConfig['color']; separate: ThemeConfig['separate'] }
  fonts?: { type: ThemeConfig['type'] }
  /** Corner radius, shadow depth and style (borders, shadow style, buttons, heading weight). */
  shape?: { radius: number | null; depth: number | null; extras: StyleExtras }
}

export const BRAND_KEYS = ['color', 'type', 'radius', 'depth', 'extras'] as const
type BrandKey = (typeof BRAND_KEYS)[number]
/** Which group each brand-owned setting belongs to. */
const GROUP_OF: Record<BrandKey | 'separate', BrandGroup> = { color: 'colors', separate: 'colors', type: 'fonts', radius: 'shape', depth: 'shape', extras: 'shape' }

/** A copy of a config's choices for one group (a brand that starts owning it starts from them). */
export function groupOf(config: ThemeConfig, group: BrandGroup): NonNullable<BrandOwn[BrandGroup]> {
  if (group === 'colors') return structuredClone({ color: config.color, separate: config.separate })
  if (group === 'fonts') return structuredClone({ type: config.type })
  return structuredClone({ radius: config.radius, depth: config.depth, extras: config.extras })
}

/** True when the brand owns `group` (the main brand and unknown brands own nothing). */
export const ownsGroup = (config: ThemeConfig, brandId: string | null, group: BrandGroup) =>
  Boolean(brandId && config.brands?.find((b) => b.id === brandId)?.own?.[group])

/** Gives a brand its own `group` (starting from the main brand's, so nothing jumps), or makes it follow again. */
export function setBrandGroup(config: ThemeConfig, brandId: string, group: BrandGroup, own: boolean): ThemeConfig {
  return {
    ...config,
    brands: config.brands.map((b, i) => {
      if (b.id !== brandId || i === 0) return b
      const next: BrandOwn = { ...b.own }
      if (own) next[group] = (b.own?.[group] ?? groupOf(config, group)) as never
      else delete next[group]
      return { ...b, own: next }
    }),
  }
}

function sanitizeOwn(raw: unknown, root: Partial<ThemeConfig>, modes: Appearance[]): BrandOwn {
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown> & Partial<BrandOwn>
  const color = (c: unknown) => {
    const x = (c ?? {}) as Partial<ThemeConfig['color']>
    return { ...DEFAULT_THEME_CONFIG.color, ...x, status: { ...DEFAULT_THEME_CONFIG.color.status, ...x.status } }
  }
  const out: BrandOwn = {}
  if ('color' in r || 'type' in r) {
    // Older files: a brand owned everything. Groups identical to the main brand follow it now.
    const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
    const old = r as Partial<ThemeConfig>
    const rootColor = color(root.color)
    if (!same(color(old.color), rootColor) || !same(old.separate ?? {}, root.separate ?? {})) {
      out.colors = { color: color(old.color), separate: sanitizeSeparate(old.separate, modes) }
    }
    if (!same({ ...DEFAULT_THEME_CONFIG.type, ...old.type }, { ...DEFAULT_THEME_CONFIG.type, ...root.type })) out.fonts = { type: { ...DEFAULT_THEME_CONFIG.type, ...old.type } }
    if (!same(old.radius, root.radius) || !same(old.depth, root.depth) || !same(sanitizeExtras(old.extras), sanitizeExtras(root.extras))) {
      out.shape = { radius: typeof old.radius === 'number' ? old.radius : null, depth: typeof old.depth === 'number' ? old.depth : null, extras: sanitizeExtras(old.extras) }
    }
    return out
  }
  if (r.colors) out.colors = { color: color(r.colors.color), separate: sanitizeSeparate(r.colors.separate, modes) }
  if (r.fonts) out.fonts = { type: { ...DEFAULT_THEME_CONFIG.type, ...r.fonts.type } }
  if (r.shape) {
    out.shape = {
      radius: typeof r.shape.radius === 'number' ? r.shape.radius : null,
      depth: typeof r.shape.depth === 'number' ? r.shape.depth : null,
      extras: sanitizeExtras(r.shape.extras),
    }
  }
  return out
}

function brandsAndPreview(p: Partial<ThemeConfig>, modes: Appearance[]): Pick<ThemeConfig, 'brands' | 'brand'> {
  const raw = Array.isArray(p.brands) ? p.brands : []
  const seen = new Set<string>()
  const brands: BrandDef[] = []
  for (const b of raw) {
    if (!b || typeof b !== 'object' || typeof b.id !== 'string' || !b.id || seen.has(b.id)) continue
    seen.add(b.id)
    brands.push({
      id: b.id,
      name: typeof b.name === 'string' && b.name.trim() ? b.name : b.id,
      description: typeof b.description === 'string' ? b.description : '',
      appType: typeof b.appType === 'string' ? b.appType : 'dashboard',
      own: brands.length === 0 ? null : sanitizeOwn(b.own, p, modes),
    })
  }
  // One named brand is a single-brand system.
  const list = brands.length > 1 ? brands : []
  const brand = typeof p.brand === 'string' && list.slice(1).some((b) => b.id === p.brand) ? p.brand : null
  return { brands: list, brand }
}

/** The brand being previewed, when it isn't the main brand. */
const previewedBrand = (config: ThemeConfig) => (config.brand ? config.brands?.slice(1).find((b) => b.id === config.brand) : undefined)

/** The previewed brand's own groups on top of the system's: the theme as that brand looks. */
function withBrandIntents(config: ThemeConfig): ThemeConfig {
  const own = previewedBrand(config)?.own
  if (!own) return config
  const next = { ...config, ...own.colors, ...own.fonts, ...own.shape }
  // How many shades of text and surfaces the system has is a system choice, not a brand's.
  return own.colors ? { ...next, color: { ...next.color, tertiary: config.color.tertiary } } : next
}

/**
 * Writes edits where they belong. A setting of a group the previewed brand owns goes to that
 * brand; one it follows goes to the main brand (and so changes both). Within the colors that are
 * written, a mode set up separately gets its own colors and depth.
 */
export function writeIntents(config: ThemeConfig, patch: Partial<Pick<ThemeConfig, BrandKey>>): ThemeConfig {
  let next = config
  const brand = previewedBrand(config)
  const mode = config.appearance
  for (const key of Object.keys(patch) as BrandKey[]) {
    const value = patch[key]
    const group = GROUP_OF[key]
    const owned = brand?.own?.[group]
    // The colors slot that holds this mode's own colors, when it has them.
    const colorsSlot = brand?.own?.colors ?? { color: next.color, separate: next.separate }
    const sepOwn = mode !== next.modes[0] ? colorsSlot.separate?.[mode] : undefined
    if ((key === 'color' || key === 'depth') && sepOwn) {
      const separate = { ...colorsSlot.separate, [mode]: { ...sepOwn, [key]: value } }
      next = brand?.own?.colors ? withOwn(next, brand.id, 'colors', { ...brand.own.colors, separate }) : { ...next, separate }
    } else if (owned && brand) {
      next = withOwn(next, brand.id, group, { ...owned, [key]: value } as never)
    } else {
      next = { ...next, [key]: value }
    }
  }
  return next
}

function withOwn<G extends BrandGroup>(config: ThemeConfig, brandId: string, group: G, value: NonNullable<BrandOwn[G]>): ThemeConfig {
  return { ...config, brands: config.brands.map((b) => (b.id === brandId ? { ...b, own: { ...b.own, [group]: value } } : b)) }
}

/** Where the previewed brand's mode colors live: its own colors, or the main brand's it follows. */
function colorsOf(config: ThemeConfig) {
  return previewedBrand(config)?.own?.colors ?? { color: config.color, separate: config.separate }
}

function withColors(config: ThemeConfig, colors: { color: ThemeConfig['color']; separate: ThemeConfig['separate'] }): ThemeConfig {
  const brand = previewedBrand(config)
  if (brand?.own?.colors) return withOwn(config, brand.id, 'colors', colors)
  return { ...config, ...colors }
}

/** True when `mode` is set up separately for the previewed brand's colors (never for the base mode). */
export const isSeparate = (config: ThemeConfig, mode: Appearance) => mode !== config.modes[0] && Boolean(colorsOf(config).separate?.[mode])

/**
 * The choices that apply right now: the previewed brand's (its own groups over the main brand's),
 * and in a mode set up separately, that mode's own colors and depth. Every token generator reads
 * the theme through this.
 */
export function withModeIntents(input: ThemeConfig): ThemeConfig {
  const config = withBrandIntents(input)
  if (!isSeparate(input, config.appearance)) return config
  const own = colorsOf(input).separate[config.appearance]!
  // Whether the system has a tertiary emphasis level is a system choice, not a mode's.
  return { ...config, color: { ...own.color, tertiary: input.color.tertiary }, depth: own.depth }
}

/** Sets `mode` up separately (for the previewed brand's colors), starting from its current colors so nothing jumps. */
export function separateMode(config: ThemeConfig, mode: Appearance): ThemeConfig {
  const colors = colorsOf(config)
  if (mode === config.modes[0] || colors.separate?.[mode]) return config
  const depth = withBrandIntents(config).depth
  return withColors(config, { ...colors, separate: { ...colors.separate, [mode]: { color: structuredClone(colors.color), depth } } })
}

/** Links `mode` back to the base mode (for the previewed brand's colors): its own colors and depth are dropped. */
export function linkMode(config: ThemeConfig, mode: Appearance): ThemeConfig {
  const colors = colorsOf(config)
  if (!colors.separate?.[mode]) return config
  const separate = { ...colors.separate }
  delete separate[mode]
  return withColors(config, { ...colors, separate })
}
