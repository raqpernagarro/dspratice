/**
 * ThemeConfig → semantic token overrides.
 *
 * Layering (lowest first):
 *   1. Figma `semantic` collection       figma-semantic.css (:root / [data-appearance])
 *   2. Figma brand extension (optional)  figma-semantic.css ([data-brand])
 *   3. Configurator overrides            inline custom properties written by applyTheme()
 *
 * Only groups the user changed (non-null config fields) produce overrides, so anything left
 * alone stays exactly as designed in Figma.
 */
import { overrideCss } from './component-tokens'
import figmaResolved from './figma-semantic.json'
import { oklchToHex, parseColor, ramp, readableOn, toOklch, withAlpha, contrast } from './color-math'
import { figmaTokenToCssVar } from './figma-css-var'
import { baseCss, brandSlug, literalMap, variableGraph } from './variables-model'
import { DEFAULT_EXTRAS, isSeparate, withModeIntents, type Appearance, type Oklch3, type ShadowStyle, type StatusKind, type ThemeConfig, type WebFont } from './theme-config'

type TokenMap = Record<string, string>

interface ResolvedFile {
  modes: Record<Appearance, TokenMap>
  brands: Record<string, { name: string } & Record<Appearance, TokenMap>>
}
const FIGMA = figmaResolved as unknown as ResolvedFile

/** Brands available as starting points (brand extensions of the semantic collection). */
export function figmaBrands() {
  if (variableGraph.imported) {
    return variableGraph.collections
      .filter((c) => c.extends === variableGraph.semantic.id)
      .map((c) => ({ id: brandSlug(c.name), name: c.name }))
  }
  return Object.entries(FIGMA.brands).map(([id, b]) => ({ id, name: b.name }))
}

/** Literal Figma values for the chosen brand + appearance. */
export function figmaBase(config: Pick<ThemeConfig, 'brand' | 'appearance'>): TokenMap {
  if (variableGraph.imported) return literalMap(variableGraph, { appearance: config.appearance, brand: config.brand })
  const brand = config.brand ? FIGMA.brands[config.brand] : undefined
  return brand ? brand[config.appearance] : FIGMA.modes[config.appearance]
}

const px = (n: number) => `${Math.round(n * 100) / 100}px`
const num = (v: string | undefined) => (v ? parseFloat(v) : NaN)

/** Shifts lightness of a hex color in OKLCH. */
function shift(hex: string, dl: number) {
  const c = toOklch(hex)
  return c ? oklchToHex({ ...c, l: Math.min(1, Math.max(0, c.l + dl)) }) : hex
}

// ------------------------------------------------------------------ neutrals

/** Tokens owned by primary / accent / status generators, never re-tinted as neutrals. */
const CHROMATIC = /accent|interactive\/(primary|danger)|danger|\/(info|success|warning|error)|on-(info|success|warning|error)/

/** Chroma of the most tinted neutral ("Vivid"). */
export const MAX_NEUTRAL_CHROMA = 0.06

/**
 * Chroma for a neutral at lightness `l`. Mid-greys take the most tint; light surfaces keep a
 * floor so backgrounds visibly pick up the hue at higher amounts.
 */
export function neutralChroma(l: number, amount: number) {
  const weight = Math.max(0.4, Math.min(1, 4 * l * (1 - l) * 1.6))
  return MAX_NEUTRAL_CHROMA * Math.min(1, Math.max(0, amount)) * weight
}

/** Re-tints every neutral color token toward `hue`, keeping the system's lightness. 0 = pure grey. */
function tintNeutrals(base: TokenMap, hue: number, amount: number, out: TokenMap) {
  for (const [path, value] of Object.entries(base)) {
    if (!path.startsWith('color/') || CHROMATIC.test(path)) continue
    const c = toOklch(value)
    // The default neutrals already carry a slight navy tint (≈0.06 chroma at the darkest step).
    if (!c || c.c > 0.09) continue
    const hex = oklchToHex({ l: c.l, c: neutralChroma(c.l, amount), h: hue, alpha: 1 })
    out[path] = withAlpha(hex, c.alpha)
  }
}

/** Page and surfaces, and the subtle borders drawn on them. Text and strong borders are left alone. */
export const PAGE_PATHS = /^color\/(background\/(neutral\/(primary|secondary|tertiary)|surface\/(low|medium|high))|border\/neutral\/subtle)$/

/** Light pages stay light and dark pages stay dark, so the system's text always reads. */
export const PAGE_LIGHTNESS: Record<Appearance, [min: number, max: number]> = { light: [0.86, 1], dark: [0.08, 0.32] }

/**
 * Moves the page to `page`, keeping each surface's and subtle border's distance from it. In a mode
 * that only follows (`owner` false) the lightness stays and the page's hue comes along, softer.
 */
function pageTokens(base: TokenMap, page: Oklch3, mode: Appearance, owner: boolean, out: TokenMap) {
  const page0 = toOklch(base['color/background/neutral/primary'] ?? '')
  if (!page0) return
  const [min, max] = PAGE_LIGHTNESS[mode]
  const target = Math.min(max, Math.max(min, page.l))
  if (!owner && page.c < 0.004) return
  for (const [path, value] of Object.entries(base)) {
    if (!PAGE_PATHS.test(path)) continue
    const o = toOklch(out[path] ?? value)
    if (!o) continue
    const l = owner ? Math.min(1, Math.max(0, target + (o.l - page0.l))) : o.l
    const c = owner ? page.c : page.c * 0.6
    out[path] = withAlpha(oklchToHex({ l, c, h: page.h, alpha: 1 }), o.alpha)
  }
}

// ------------------------------------------------------------------ primary / accent

/** Default / hover / pressed for a seed color in the given appearance. */
function interactiveSteps(seed: string, mode: Appearance, k: number) {
  const r = ramp(seed, k)
  return mode === 'light'
    ? { r, def: seed, hover: shift(seed, -0.06), pressed: shift(seed, -0.12) }
    : { r, def: r[400], hover: r[300], pressed: r[200] }
}

/** Main actions: primary buttons and their labels. */
function primaryTokens(seed: string, mode: Appearance, k: number, out: TokenMap) {
  const { def, hover, pressed } = interactiveSteps(seed, mode, k)
  const on = readableOn(def)
  out['color/background/interactive/primary/default'] = def
  out['color/background/interactive/primary/hover'] = hover
  out['color/background/interactive/primary/pressed'] = pressed
  out['color/background/interactive/primary/selected'] = pressed
  out['color/foreground/on-interactive/primary'] = on
  out['color/foreground/on-interactive/secondary'] = withAlpha(on, 0.8)
}

/** Opacity of the link color in each subtle (ghost) state: Figma's opacity/0, /10, /15, /15. */
const SUBTLE_LINK_TINTS = { default: 0, hover: 0.1, pressed: 0.15, selected: 0.15 }

/** Highlights: checked/selected fills, accent text, links, selected borders, focus rings. */
function accentTokens(seed: string, mode: Appearance, k: number, out: TokenMap) {
  const { r, def, hover, pressed } = interactiveSteps(seed, mode, k)
  const light = mode === 'light'
  const on = readableOn(def)
  // Text needs AA on the page; fall back to a deeper/lighter step of the same hue.
  const fg = light ? (contrast(seed, '#ffffff') >= 4.5 ? seed : r[700]) : r[300]

  out['color/background/accent/default'] = def
  out['color/background/accent/hover'] = hover
  out['color/background/accent/pressed'] = pressed
  // Selected fills (avatars, chosen items) carry on-accent text too, so they follow the accent.
  out['color/background/accent/selected'] = pressed
  out['color/foreground/accent'] = fg
  out['color/foreground/on-accent/primary'] = on
  out['color/foreground/on-accent/secondary'] = withAlpha(on, 0.8)
  out['color/foreground/on-accent/tertiary'] = withAlpha(on, 0.6)
  out['color/foreground/interactive/default'] = fg
  out['color/foreground/interactive/hover'] = shift(fg, light ? -0.06 : 0.06)
  out['color/foreground/interactive/pressed'] = shift(fg, light ? -0.12 : 0.12)
  out['color/foreground/interactive/visited'] = light ? r[800] : r[200]
  // Subtle (ghost) fills are the link color at a low opacity, as in Figma (color + opacity composites).
  for (const [state, alpha] of Object.entries(SUBTLE_LINK_TINTS)) out[`color/background/interactive/subtle/${state}`] = withAlpha(fg, alpha)
  out['color/background/interactive/danger-subtle/default'] = withAlpha(fg, 0)
  out['color/border/interactive/selected'] = def
  out['color/shadow/focus-ring/primary'] = def
}

// ------------------------------------------------------------------ status

function statusTokens(kind: StatusKind, seed: string, mode: Appearance, k: number, out: TokenMap) {
  const r = ramp(seed, k)
  const light = mode === 'light'
  const strong = light ? seed : r[400]
  const onStrong = readableOn(strong)
  out[`color/background/${kind}/subtle`] = light ? r[50] : r[950]
  out[`color/background/${kind}/strong`] = strong
  out[`color/foreground/${kind}`] = light ? (contrast(seed, '#ffffff') >= 4.5 ? seed : r[700]) : r[300]
  out[`color/border/${kind}`] = light ? r[300] : r[700]
  out[`color/foreground/on-${kind}/primary`] = onStrong
  out[`color/foreground/on-${kind}/secondary`] = withAlpha(onStrong, 0.8)

  if (kind === 'error') {
    // Destructive actions share the error hue.
    const danger = strong
    const steps = light ? [r[700], r[800]] : [r[300], r[200]]
    out['color/background/interactive/danger/default'] = danger
    out['color/background/interactive/danger/hover'] = steps[0]
    out['color/background/interactive/danger/pressed'] = steps[1]
    out['color/background/interactive/danger/selected'] = steps[1]
    out['color/background/interactive/danger-subtle/hover'] = withAlpha(danger, 0.1)
    out['color/background/interactive/danger-subtle/pressed'] = withAlpha(danger, 0.2)
    out['color/foreground/interactive/danger/default'] = light ? r[700] : r[300]
    out['color/foreground/interactive/danger/hover'] = light ? r[800] : r[200]
    out['color/foreground/interactive/danger/pressed'] = light ? r[900] : r[100]
    out['color/foreground/on-danger/primary'] = readableOn(danger)
    out['color/foreground/on-danger/secondary'] = withAlpha(readableOn(danger), 0.8)
    out['color/shadow/focus-ring/error'] = danger
  }
}

// ------------------------------------------------------------------ type

const quoteFamily = (family: string) => (/\s/.test(family) && !/^['"]/.test(family) ? `'${family}'` : family)

function typeTokens(base: TokenMap, type: ThemeConfig['type'], out: TokenMap) {
  if (type.body) out['font/family/primary'] = quoteFamily(type.body.family)
  const heading = type.heading ?? type.body
  if (heading) out['font/family/secondary'] = quoteFamily(heading.family)

  if (type.baseSize == null && type.scale == null) return
  const md = type.baseSize ?? num(base['font/size/body/md'])
  const r = type.scale ?? num(base['font/size/body/lg']) / num(base['font/size/body/md'])
  const sizes: Record<string, number> = {
    'caption/sm': md / r ** 2,
    'caption/md': md / r,
    'body/sm': md / r,
    'body/md': md,
    'body/lg': md * r,
    'heading/sm': md * r ** 2,
    'heading/md': md * r ** 3,
    'heading/lg': md * r ** 4,
    'heading/xl': md * r ** 5,
  }
  for (const [key, size] of Object.entries(sizes)) {
    const s = Math.round(size)
    const factor = key.startsWith('heading') ? 1.2 : 1.5
    out[`font/size/${key}`] = px(s)
    out[`font/line-height/${key}`] = px(Math.max(s + 4, Math.round((s * factor) / 4) * 4))
  }
}

// ------------------------------------------------------------------ radius / density / depth

/** On the 4px grid: multiples of 4, and 2 for anything smaller than 4 (but not 0). */
export function snapToGrid(n: number) {
  if (n <= 0) return 0
  return n < 3 ? 2 : Math.max(4, Math.round(n / 4) * 4)
}

/**
 * Small / medium / large radius from the medium value; full stays a pill. On the grid, medium moves
 * in steps of 4, small is half of it (at least 2) and large about 1.6 times, both on the grid too.
 */
export function radiusScale(md: number, grid = false) {
  const r = Math.max(0, md)
  if (grid) {
    const m = snapToGrid(r)
    return { sm: m === 0 ? 0 : Math.max(2, Math.floor(m / 2 / 4) * 4), md: m, lg: snapToGrid(m * 1.6) }
  }
  return {
    sm: r === 0 ? 0 : Math.max(2, Math.round(r * 0.5)),
    md: Math.round(r),
    lg: Math.round(r * 1.6),
  }
}

/** Steps that must stay in order (and distinct) after rounding to the grid. */
const LADDERS = [
  ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((s) => `space/${s}`),
  ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'].map((s) => `size/${s}`),
]

function densityTokens(base: TokenMap, k: number, grid: boolean, out: TokenMap) {
  const scaled: Record<string, number> = {}
  for (const [path, value] of Object.entries(base)) {
    if (!/^(space|size)\//.test(path) || path.startsWith('size/border/')) continue
    scaled[path] = grid ? snapToGrid(num(value) * k) : Math.round(num(value) * k)
  }
  // Rounding can make neighbours meet (5 and 6 both become 4): the larger step moves up one grid step.
  if (grid)
    for (const ladder of LADDERS) {
      let prev = -1
      for (const path of ladder) {
        if (scaled[path] === undefined) continue
        if (scaled[path] <= prev) scaled[path] = prev < 4 ? 4 : prev + 4
        prev = scaled[path]
      }
    }
  for (const [path, v] of Object.entries(scaled)) out[path] = px(v)
}

/** Shadow geometry at depth 1; depth scales it linearly down to flat. */
const DEPTH_MAX: Record<'low' | 'medium' | 'high', [y: number, blur: number, spread: number]> = {
  low: [3, 8, 0],
  medium: [10, 24, -2],
  high: [20, 48, -4],
}

export function shadowScale(depth: number) {
  const d = Math.min(1, Math.max(0, depth))
  return Object.fromEntries(
    Object.entries(DEPTH_MAX).map(([level, [y, blur, spread]]) => [
      level,
      { y: Math.round(y * d), blur: Math.round(blur * d), spread: Math.round(spread * d) },
    ]),
  ) as Record<'low' | 'medium' | 'high', { y: number; blur: number; spread: number }>
}

function depthTokens(depth: number, out: TokenMap) {
  for (const [level, { y, blur, spread }] of Object.entries(shadowScale(depth))) {
    const g = `effect/shadow/elevation/${level}`
    out[`${g}/offset-x`] = px(0)
    out[`${g}/offset-y`] = px(y)
    out[`${g}/blur`] = px(blur)
    out[`${g}/spread`] = px(spread)
  }
}

// ------------------------------------------------------------------ web fonts

const loadedFonts = new Set<string>()

/** Loads a Google font (all weights the theme may use) once per document. */
export function ensureWebFont(font: WebFont | null) {
  if (!font || typeof document === 'undefined') return
  const key = `${font.family}:${font.weights}`
  if (loadedFonts.has(key)) return
  loadedFonts.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@${font.weights}&display=swap`
  document.head.appendChild(link)
}

// ------------------------------------------------------------------ public

export const mainHex = (m: Oklch3) => oklchToHex({ ...m, alpha: 1 })

/** Hue the neutrals lean toward: the main color, else the system's own accent. */
export function neutralHue(config: ThemeConfig) {
  // A background chosen on its own (warm, cool or a picked color); otherwise the brand color's hue.
  if (config.color.neutralHue != null) return config.color.neutralHue
  if (config.color.main) return config.color.main.h
  const a = toOklch(figmaBase(config)['color/foreground/accent'] ?? '')
  return a && a.c > 0.02 ? a.h : 265
}

/** Token path → CSS value, for every token the config changes. */
let addedIds = new Set<string>()

/**
 * Variables the system kept from Figma join the variable graph; ones another theme added (a
 * discarded draft, another project) leave it.
 */
export function includeAdded(config: Pick<ThemeConfig, 'added'>) {
  const next = new Set((config.added ?? []).map((v) => v.id))
  for (const id of addedIds) if (!next.has(id)) variableGraph.vars.delete(id)
  if (config.added?.length) variableGraph.addVariables(config.added)
  addedIds = next
}

export function generateTokens(input: ThemeConfig): TokenMap {
  includeAdded(input)
  // A mode set up separately brings its own colors and depth.
  const config = withModeIntents(input)
  const base = figmaBase(config)
  const out: TokenMap = {}
  const { color } = config
  const valid = (c: string | null): c is string => Boolean(c && parseColor(c))

  const k = color.rampContrast ?? 1
  const main = color.main ? mainHex(color.main) : null

  if (color.neutralTint != null) tintNeutrals(base, neutralHue(config), color.neutralTint, out)
  if (color.background) {
    // The page color applies in full to the mode it belongs to; a mode that follows gets its hue.
    const owner = config.appearance === config.modes[0] || isSeparate(input, input.appearance)
    pageTokens(base, color.background, config.appearance, owner, out)
  }
  if (main) primaryTokens(main, config.appearance, k, out)
  // Accent follows the main color unless it has its own.
  const accent = valid(color.accent) ? color.accent : main
  if (accent) accentTokens(accent, config.appearance, k, out)
  for (const kind of Object.keys(color.status) as StatusKind[]) {
    const seed = color.status[kind]
    if (valid(seed)) statusTokens(kind, seed, config.appearance, k, out)
    else if (color.rampContrast != null) statusTokens(kind, base[`color/foreground/${kind}`], config.appearance, k, out)
  }
  if (!color.tertiary) {
    for (const path of Object.keys(base)) {
      if (path.endsWith('/tertiary') && path.startsWith('color/')) {
        out[path] = `var(${figmaTokenToCssVar(path.replace(/tertiary$/, 'secondary'))})`
      }
    }
  }

  typeTokens(base, config.type, out)
  if (config.radius != null) {
    const { sm, md, lg } = radiusScale(config.radius, config.grid)
    out['shape/radius/sm'] = px(sm)
    out['shape/radius/md'] = px(md)
    out['shape/radius/lg'] = px(lg)
  }
  if (config.density != null) densityTokens(base, config.density, config.grid, out)
  if (config.depth != null) depthTokens(config.depth, out)
  extrasTokens(config, base, out)
  return out
}

// ------------------------------------------------------------------ extras

const SHADOW_LEVELS = ['low', 'medium', 'high'] as const
/** [offset-x, offset-y, blur, spread] per elevation level. */
const SHADOW_GEOMETRY: Record<Exclude<ShadowStyle, 'default'>, [number, number, number, number][]> = {
  none: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  // Flat, offset "sticker" shadows.
  hard: [[5, 5, 0, 0], [7, 7, 0, 0], [10, 10, 0, 0]],
  // Centered and wide: a halo.
  glow: [[0, 0, 18, 2], [0, 0, 32, 4], [0, 0, 56, 8]],
}
const GLOW_ALPHA = [0.75, 0.85, 0.9]

/**
 * Extras as tokens. Colors are taken from values the system already holds (its ink, its generated
 * brand color, black), so exports alias the same primitives instead of introducing literals.
 */
function extrasTokens(config: ThemeConfig, base: TokenMap, out: TokenMap) {
  const x = config.extras ?? DEFAULT_EXTRAS
  const ink = base['color/foreground/neutral/primary']
  const brand = out['color/background/interactive/primary/default'] ?? base['color/background/interactive/primary/default']

  if (x.borderWidth > 1) {
    out['size/border/regular'] = px(x.borderWidth)
    out['size/border/strong'] = px(x.borderWidth + 1)
  }
  const outline = x.borderColor === 'ink' ? ink : x.borderColor === 'brand' ? brand : null
  if (outline) for (const t of ['color/border/neutral/regular', 'color/border/neutral/strong', 'color/border/interactive/default']) out[t] = outline

  if (x.shadow !== 'default') {
    SHADOW_LEVELS.forEach((level, i) => {
      const [ox, oy, blur, spread] = SHADOW_GEOMETRY[x.shadow as Exclude<ShadowStyle, 'default'>][i]
      const g = `effect/shadow/elevation/${level}`
      out[`${g}/offset-x`] = px(ox)
      out[`${g}/offset-y`] = px(oy)
      out[`${g}/blur`] = px(blur)
      out[`${g}/spread`] = px(spread)
      if (x.shadow === 'hard') out[`color/shadow/elevation/${level}`] = config.appearance === 'light' ? ink : '#000000'
      if (x.shadow === 'glow' && brand) out[`color/shadow/elevation/${level}`] = withAlpha(brand.slice(0, 7), GLOW_ALPHA[i])
    })
  }
  if (x.headingWeight !== 700) out['font/weight/heading/strong'] = String(x.headingWeight)
}

const BUTTON_RADIUS_TOKENS = ['button/radius/sm', 'button/radius/md', 'button/radius/lg', 'icon-button/radius/sm', 'icon-button/radius/md', 'icon-button/radius/lg']

/** Component overrides the theme applies: the extras' button shape, then the user's own overrides (which win). */
export function effectiveComponents(config: ThemeConfig): Record<string, string> {
  const pill = (config.extras ?? DEFAULT_EXTRAS).buttonShape === 'pill'
  return { ...(pill ? Object.fromEntries(BUTTON_RADIUS_TOKENS.map((t) => [t, 'shape/radius/full'])) : {}), ...config.components }
}

const applied = new WeakMap<HTMLElement, string[]>()

/**
 * Font family tokens hold a bare family name (that is what Figma stores). In CSS a web font also
 * needs a generic fallback: without one, text shows in the browser default (usually Times) while the
 * font loads, and any glyph the font lacks does too.
 */
function withFontFallback(path: string, value: string, config: ThemeConfig): string {
  const font = path === 'font/family/primary' ? config.type.body : path === 'font/family/secondary' ? (config.type.heading ?? config.type.body) : null
  if (!font || value.includes(',')) return value
  return `${value}, ${font.fallback === 'sans-serif' || !font.fallback ? 'system-ui, sans-serif' : font.fallback}`
}

/**
 * Applies a theme to `el` (usually <html>, so portaled popups inherit it):
 * appearance + brand attributes, then the generated overrides as inline custom properties.
 */
export function applyTheme(el: HTMLElement, config: ThemeConfig) {
  ensureWebFont(config.type.body)
  ensureWebFont(config.type.heading)
  el.classList.add('theme-scope')
  el.dataset.appearance = config.appearance
  if (config.brand) el.dataset.brand = config.brand
  else delete el.dataset.brand

  for (const prop of applied.get(el) ?? []) el.style.removeProperty(prop)
  const ctx = { appearance: config.appearance, brand: config.brand }
  // Imported files have no generated stylesheet: their base values are applied inline too.
  const base = variableGraph.imported ? baseCss(variableGraph, ctx) : {}
  const generated = generateTokens(config)
  const manual = { ...variableGraph.overrides(ctx, config.variables, generated), ...overrideCss(effectiveComponents(config)) }
  const tokens = { ...base, ...generated, ...manual }
  const props: string[] = []
  for (const [path, value] of Object.entries(tokens)) {
    const prop = figmaTokenToCssVar(path)
    el.style.setProperty(prop, withFontFallback(path, value, config))
    props.push(prop)
  }
  applied.set(el, props)
  // Only what the theme changes (not the imported base layer).
  return { ...generated, ...manual }
}
