/**
 * Builds the change set the Figma plugin imports: theme changes + Variables-table edits.
 *
 * Palette rule: a token that aliases a primitive in Figma keeps aliasing one. A generated value
 * reuses an existing primitive with the same value, or becomes a new primitive:
 *  - colors are grouped in families named after their hue ("sky", "rose") or, for tinted greys,
 *    a classic grey name ("slate", "stone"); names never merge into a hand-made family
 *  - translucent colors link to their base color + an opacity primitive: colors/sky/600/alpha/80
 *  - sizes follow the file's naming (scale/325 = 13px)
 * Tokens holding literals get literals.
 */
import { oklchToHex, parseColor, toOklch } from '../../../stories/base-ui/tokens/color-math'
import { overrideChanges } from '../../../stories/base-ui/tokens/component-anatomy'
import { CHANGESET_FORMAT, GENERATED_MARKER, type ChangeSet, type ChangeValue, type PrimitiveChange, type ValueChange } from '../../../stories/base-ui/tokens/exchange-format'
import { figmaTokenToCssVar } from '../../../stories/base-ui/tokens/figma-css-var'
import { APPEARANCES, MODE_NAMES, withModeIntents, type Appearance, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { effectiveComponents, generateTokens, includeAdded, neutralHue, PAGE_PATHS } from '../../../stories/base-ui/tokens/theme-generator'
import { brandSlug, isAlias, REPO_DATA, variableGraph as graph, type RawVariable } from '../../../stories/base-ui/tokens/variables-model'

const PRIMITIVES = 'primitives'

const STEPS: [string, number][] = [
  ['25', 0.985],
  ['50', 0.975],
  ['100', 0.945],
  ['200', 0.895],
  ['300', 0.82],
  ['400', 0.73],
  ['500', 0.645],
  ['600', 0.565],
  ['700', 0.485],
  ['800', 0.405],
  ['900', 0.32],
  ['950', 0.235],
]

const hex2 = (n: number) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, '0')

/** Any CSS color → #RRGGBB or #RRGGBBAA (uppercase), for comparison and export. */
function normalizeColor(css: string) {
  const c = parseColor(css)
  if (!c) return null
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 ? hex2(c.a) : ''}`.toUpperCase()
}

/**
 * Palette step name from lightness, on a continuous 25-step scale between the standard steps
 * ("600", "675", …) so neighbouring colors rarely collide.
 */
function stepName(hex: string) {
  const o = toOklch(hex.slice(0, 7))
  let step = 'white'
  const [last, lastL] = STEPS[STEPS.length - 1]
  const [prev, prevL] = STEPS[STEPS.length - 2]
  if (o && o.l < lastL) {
    // Darker than the last standard step: keep counting past 950 (975, 1000, …).
    const perStep = (prevL - lastL) / (Number(last) - Number(prev))
    step = String(Math.round((Number(last) + (lastL - o.l) / perStep) / 25) * 25)
  } else if (o && o.l < 0.995) {
    const l = Math.min(STEPS[0][1], o.l)
    const i = STEPS.findIndex(([, sl], k) => k < STEPS.length - 1 && l <= sl && l >= STEPS[k + 1][1])
    const [aName, aL] = STEPS[Math.max(0, i)]
    const [bName, bL] = STEPS[Math.max(0, i) + 1] ?? STEPS[Math.max(0, i)]
    const t = aL === bL ? 0 : (aL - l) / (aL - bL)
    const value = Number(aName) + t * (Number(bName) - Number(aName))
    step = String(Math.round(value / 25) * 25)
  }
  return step
}

/** OKLCH hue of each color name (close to the Tailwind palette), for naming generated families. */
const HUE_NAMES: [string, number][] = [
  ['red', 25],
  ['orange', 47],
  ['amber', 70],
  ['yellow', 90],
  ['lime', 128],
  ['green', 150],
  ['emerald', 165],
  ['teal', 185],
  ['cyan', 212],
  ['sky', 237],
  ['blue', 260],
  ['indigo', 277],
  ['violet', 293],
  ['purple', 305],
  ['fuchsia', 322],
  ['pink', 350],
  ['rose', 12],
]

const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))
const hueName = (h: number) => HUE_NAMES.reduce((best, n) => (hueDistance(n[1], h) < hueDistance(best[1], h) ? n : best))[0]

/** Classic grey names by the hue the grey leans toward. */
function greyName(h: number, tinted: boolean) {
  if (!tinted) return 'gray'
  if (h >= 30 && h < 100) return 'stone'
  if (h >= 100 && h < 170) return 'olive'
  if (h >= 170 && h < 215) return 'mist'
  if (h >= 215 && h < 265) return 'slate'
  if (h >= 265 && h < 310) return 'zinc'
  return 'mauve'
}

/** Which seed color a generated token comes from: 'grey' for tinted neutrals. */
function seedFor(path: string, theme: ThemeConfig): { kind: string; hex: string | null } {
  // A page color picked on its own: its surfaces get a family named after it.
  if (theme.color.background && PAGE_PATHS.test(path)) return { kind: 'page', hex: oklchToHex({ ...theme.color.background, alpha: 1 }) }
  const main = theme.color.main ? oklchToHex({ ...theme.color.main, alpha: 1 }) : null
  const status = path.match(/(info|success|warning|error)/)?.[1] ?? (/danger/.test(path) ? 'error' : null)
  if (status) {
    const seed = theme.color.status[status as 'info']
    const current = graph.resolve([...graph.vars.values()].find((v) => v.name === `color/foreground/${status}`)!, {
      appearance: 'light',
      brand: theme.brand,
    })
    return { kind: status, hex: seed ?? (typeof current === 'string' ? current : null) }
  }
  if (/interactive\/primary|on-interactive/.test(path)) return { kind: 'main', hex: main }
  if (/accent|foreground\/interactive\/(default|hover|pressed|visited)$|border\/interactive\/selected|focus-ring\/primary/.test(path)) {
    return { kind: theme.color.accent ? 'accent' : 'main', hex: theme.color.accent ?? main }
  }
  return { kind: 'grey', hex: null }
}

function reasonFor(path: string) {
  if (path.startsWith('color/shadow/elevation/')) return 'Theme · Shadows'
  if (path.startsWith('color/border/')) return 'Theme · Borders'
  if (path.startsWith('color/')) return 'Theme · Color'
  if (path.startsWith('font/')) return 'Theme · Typography'
  if (path.startsWith('shape/')) return 'Theme · Radius'
  if (path.startsWith('effect/') || path.startsWith('color/shadow/elevation/')) return 'Theme · Shadows'
  if (path.startsWith('size/border/')) return 'Theme · Borders'
  return 'Theme · Spacing'
}

/** A token's value in the repo's own Figma file, as a change: alias (with opacity), or literal. */
function starterValue(v: RawVariable, ctx: { appearance: Appearance; brand: string | null }): ChangeValue | null {
  const raw = graph.value(v, ctx)
  if (raw === null || raw === undefined) return null
  if (isAlias(raw)) {
    const to = graph.vars.get(raw.a)
    if (!to) return null
    const alias = { alias: to.name, collection: graph.collection(to.collection)?.name }
    if (raw.o === undefined) return alias
    const opacity = typeof raw.o === 'string' ? graph.vars.get(raw.o)?.name : raw.o
    return opacity === undefined ? null : { ...alias, opacity }
  }
  return v.type === 'COLOR' && typeof raw === 'string' ? (normalizeColor(raw) ?? raw) : raw
}

/** `version`: the system version the changes come from; the plugin remembers it as the last sync. */
export function buildChangeSet(theme: ThemeConfig, version?: string): ChangeSet {
  includeAdded(theme)
  const values = new Map<string, ValueChange>()
  const primitives = new Map<string, PrimitiveChange>()

  // Existing primitives, indexed by their resolved value.
  const primCol = graph.collections.find((c) => c.name === PRIMITIVES)
  const prims = [...graph.vars.values()].filter((v) => v.collection === primCol?.id)
  const ctx0 = { appearance: 'light' as Appearance, brand: null }
  const primByColor = new Map<string, string>()
  const primByNumber = new Map<string, string>() // `${group}|${n}` and `*|${n}`
  const takenNames = new Set(prims.map((p) => p.name))
  for (const p of prims) {
    const lit = graph.resolve(p, ctx0)
    if (p.type === 'COLOR' && typeof lit === 'string') {
      const key = normalizeColor(lit)
      if (key && !primByColor.has(key)) primByColor.set(key, p.name)
    } else if (p.type === 'FLOAT' && typeof lit === 'number') {
      const group = p.name.slice(0, p.name.lastIndexOf('/'))
      if (!primByNumber.has(`${group}|${lit}`)) primByNumber.set(`${group}|${lit}`, p.name)
      // The any-group fallback is for lengths: an opacity step must never stand in for a size.
      if (!p.name.startsWith('opacity/') && !primByNumber.has(`*|${lit}`)) primByNumber.set(`*|${lit}`, p.name)
    }
  }
  const cssVarToName = new Map([...graph.vars.values()].map((v) => [figmaTokenToCssVar(v.name), v.name]))

  const uniqueName = (base: string, sameValue: (name: string) => boolean) => {
    let name = base
    for (let i = 2; takenNames.has(name) && !sameValue(name); i++) name = `${base}-${i}`
    takenNames.add(name)
    return name
  }

  // Families already in the file; only ones the configurator generated may receive new steps.
  const families = new Map<string, boolean>() // family → all generated?
  for (const p of prims) {
    const fam = p.name.match(/^colors\/([^/]+)\//)?.[1]
    if (!fam) continue
    const generated = (p.description ?? '').includes(GENERATED_MARKER)
    families.set(fam, (families.get(fam) ?? true) && generated)
  }
  const familyBySeed = new Map<string, string>()
  // The choices of the mode being exported: a mode set up separately has its own colors, so its
  // palettes get their own families.
  let modeTheme = theme
  const familyFor = (path: string) => {
    const seed = seedFor(path, modeTheme)
    const key = `${seed.kind}|${seed.kind === 'grey' ? `${neutralHue(modeTheme)}|${modeTheme.color.neutralTint ?? 0}` : seed.hex}`
    if (familyBySeed.has(key)) return familyBySeed.get(key)!
    let base: string
    if (seed.kind === 'page') {
      const bg = modeTheme.color.background!
      base = greyName(bg.h, bg.c > 0.006)
    } else if (seed.kind === 'grey') {
      base = greyName(neutralHue(modeTheme), (modeTheme.color.neutralTint ?? 0) > 0.02)
    } else {
      const o = seed.hex ? toOklch(seed.hex) : null
      base = o && o.c > 0.03 ? hueName(o.h) : 'gray'
    }
    let name = base
    // Never mix generated steps into a hand-made family: use teal-2, teal-3, …
    for (let i = 2; families.has(name) && families.get(name) === false; i++) name = `${base}-${i}`
    families.set(name, true)
    familyBySeed.set(key, name)
    return name
  }

  const opacityByValue = new Map(
    prims
      .filter((p) => p.name.startsWith('opacity/'))
      .map((p) => [graph.resolve(p, ctx0), p.name] as const)
      .filter(([v]) => typeof v === 'number')
  )
  /** Opacity primitive for a percentage, reusing the file's own steps (0–100 scale). */
  const opacityPrimitive = (pct: number) => {
    const existing = opacityByValue.get(pct)
    if (existing) return existing
    const name = uniqueName(`opacity/${pct}`, (n) => primitives.get(n)?.value === pct)
    primitives.set(name, { collection: PRIMITIVES, name, type: 'FLOAT', value: pct, description: GENERATED_MARKER })
    opacityByValue.set(pct, name)
    return name
  }

  /** Alias to a primitive holding `hex`, creating it in the right family if needed. */
  const colorPrimitive = (hex: string, path: string): string => {
    const existing = primByColor.get(hex)
    if (existing) return existing
    const alpha = parseColor(hex)?.a ?? 1
    if (alpha < 1) {
      // Translucent: link to the opaque base color + an opacity primitive.
      const base = colorPrimitive(hex.slice(0, 7), path)
      const pct = Math.round(alpha * 100)
      const name = `${base}/alpha/${pct}`
      if (!takenNames.has(name)) {
        takenNames.add(name)
        primitives.set(name, {
          collection: PRIMITIVES,
          name,
          type: 'COLOR',
          value: { alias: base, opacity: opacityPrimitive(pct) },
          description: GENERATED_MARKER,
        })
      }
      primByColor.set(hex, name)
      return name
    }
    const name = uniqueName(`colors/${familyFor(path)}/${stepName(hex)}`, (n) => primitives.get(n)?.value === hex)
    primitives.set(name, { collection: PRIMITIVES, name, type: 'COLOR', value: hex, description: GENERATED_MARKER })
    primByColor.set(hex, name)
    return name
  }

  /** Alias to a number primitive, named like the one the token used before. */
  const numberPrimitive = (n: number, previous: RawVariable | undefined) => {
    const group = previous ? previous.name.slice(0, previous.name.lastIndexOf('/')) : 'scale'
    const existing = primByNumber.get(`${group}|${n}`) ?? primByNumber.get(`*|${n}`)
    if (existing) return existing
    const prev = previous?.name ?? ''
    const base = /\/t-\d+$/.test(prev) ? `${group}/t-${n}` : /^scale\/\d+$/.test(prev) ? `scale/${Math.round(n * 25)}` : `${group}/${n}`
    const name = uniqueName(base, (x) => primitives.get(x)?.value === n)
    primitives.set(name, { collection: PRIMITIVES, name, type: 'FLOAT', value: n, description: GENERATED_MARKER })
    primByNumber.set(`${group}|${n}`, name)
    primByNumber.set(`*|${n}`, name)
    return name
  }

  // Where each brand's values go: the main brand into the semantic collection, every other brand
  // into its own collection extending it, named as the brand is (the plugin creates it, or renames
  // a collection of the same brand, like "Gold Brand" for "Gold"). The same names go in `brands`.
  const targets = (theme.brands.length ? theme.brands : [null]).map((b, i) => {
    if (!b || i === 0) return { preview: null, collection: graph.semantic.name, existing: graph.semantic as typeof graph.semantic | undefined }
    const existing = graph.collections.find((c) => c.extends === graph.semantic.id && c.name === b.name) ?? graph.brandCollection(b.id)
    return { preview: b.id, collection: b.name, existing }
  })
  const semanticVar = new Map([...graph.vars.values()].filter((v) => v.collection === graph.semantic.id).map((v) => [v.name, v]))

  /* ---- theme changes (each mode the system ships; tertiary-following is a preview concern, not exported) */
  for (const target of targets)
    for (const appearance of theme.modes) {
      modeTheme = withModeIntents({ ...theme, brand: target.preview, appearance })
      const generated = generateTokens({ ...modeTheme, color: { ...modeTheme.color, tertiary: true } })
      const semMode = graph.semantic.modes.find((m) => m.name.toLowerCase() === appearance)
      if (!semMode) continue
      const isBrandCol = target.existing && target.existing !== graph.semantic
      const mode = isBrandCol ? target.existing!.modes.find((m) => m.parent === semMode.id) : semMode
      if (!mode) continue
      // A brand collection the file doesn't have yet starts as a copy of the semantic one.
      const ctx = { appearance, brand: isBrandCol ? brandSlug(target.existing!.name) : null }

      for (const [path, css] of Object.entries(generated)) {
        const v = semanticVar.get(path)
        if (!v) continue
        const current = graph.value(v, ctx)
        // Color + opacity composites point at another token (which this change set updates);
        // replacing them with flat colors would lose that link. Exception: hard and glow shadows
        // replace the shadow color on purpose; it becomes a primitive (with its own opacity link).
        const restyledShadow = path.startsWith('color/shadow/elevation/') && (modeTheme.extras.shadow === 'hard' || modeTheme.extras.shadow === 'glow')
        if (isAlias(current) && current.o !== undefined && !restyledShadow) continue
        const currentTarget = isAlias(current) ? graph.vars.get(current.a) : undefined
        let value: ChangeValue | null = null

        const varRef = css.match(/^var\((--[\w-]+)\)$/)
        if (varRef) {
          const name = cssVarToName.get(varRef[1])
          if (name) value = { alias: name, collection: 'semantic' }
        } else if (v.type === 'COLOR') {
          const hex = normalizeColor(css)
          if (hex) value = currentTarget ? { alias: colorPrimitive(hex, path), collection: PRIMITIVES } : hex
        } else if (v.type === 'FLOAT') {
          const n = parseFloat(css)
          if (!Number.isNaN(n)) value = currentTarget ? { alias: numberPrimitive(n, currentTarget), collection: PRIMITIVES } : n
        } else {
          value = css.replace(/^['"]|['"]$/g, '')
        }
        if (value === null) continue

        // Always written, even when it matches the starter file: the Figma file may hold values
        // from earlier imports, and the plugin skips whatever is already right.
        const change: ValueChange = { collection: target.collection, variable: v.name, mode: mode.name, value, reason: reasonFor(path) }
        values.set(`${change.collection}|${change.variable}|${change.mode}`, change)
      }

      // Every other token gets its value too, so nothing from an earlier import lingers. A token the
      // theme doesn't generate is at the system's own value; for another brand too (a brand that
      // follows a group generates the same values as the main brand anyway).
      for (const v of semanticVar.values()) {
        const key = `${target.collection}|${v.name}|${mode.name}`
        if (values.has(key)) continue
        const value = starterValue(v, ctx)
        if (value === null) continue
        values.set(key, { collection: target.collection, variable: v.name, mode: mode.name, value, reason: 'System value' })
      }
    }

  /* ---- every other primitive at the system's value (the repo's, and ones kept from Figma), so a
     primitive edited in Figma goes back unless the system kept the edit; files that have them skip them */
  for (const v of graph.vars.values()) {
    const col = graph.collection(v.collection)
    const raw = col?.name === PRIMITIVES ? v.values[col.modes[0].id] : undefined
    if (raw === undefined || raw === null || primitives.has(v.name)) continue
    if (v.type !== 'COLOR' && v.type !== 'FLOAT' && v.type !== 'STRING') continue
    const description = v.description ? { description: v.description } : {}
    if (isAlias(raw)) {
      // Translucent colors linked to a base color and an opacity primitive.
      const base = graph.vars.get(raw.a)?.name
      const opacity = typeof raw.o === 'string' ? graph.vars.get(raw.o)?.name : undefined
      if (base && opacity && v.type === 'COLOR') primitives.set(v.name, { collection: PRIMITIVES, name: v.name, type: 'COLOR', value: { alias: base, opacity }, ...description })
      continue
    }
    const value = v.type === 'COLOR' && typeof raw === 'string' ? (normalizeColor(raw) ?? raw) : raw
    if (typeof value === 'boolean') continue
    primitives.set(v.name, { collection: PRIMITIVES, name: v.name, type: v.type, value, ...description })
  }

  /* ---- Variables-table edits (win over theme changes for the same variable + mode) */
  for (const [varId, byMode] of Object.entries(theme.variables)) {
    const v = graph.vars.get(varId)
    if (!v) continue
    for (const [modeId, raw] of Object.entries(byMode)) {
      const col = graph.collections.find((c) => c.modes.some((m) => m.id === modeId))
      const mode = col?.modes.find((m) => m.id === modeId)
      if (!col || !mode) continue
      // Edits to a mode the system no longer ships are dropped with that mode.
      const appearance = APPEARANCES.find((a) => a === mode.name.toLowerCase())
      if (appearance && !theme.modes.includes(appearance)) continue
      let value: ChangeValue
      if (isAlias(raw)) {
        const target = graph.vars.get(raw.a)
        if (!target) continue
        // Color + opacity edits keep their opacity (a name, or a number).
        const opacity = raw.o === undefined ? undefined : typeof raw.o === 'string' ? graph.vars.get(raw.o)?.name : raw.o
        if (raw.o !== undefined && opacity === undefined) continue
        value = { alias: target.name, collection: graph.collection(target.collection)?.name, ...(opacity !== undefined ? { opacity } : {}) }
      } else if (raw === null) {
        continue
      } else {
        value = v.type === 'COLOR' && typeof raw === 'string' ? normalizeColor(raw) ?? raw : raw
      }
      // A brand's edits go where its theme values go (the collection named as the brand).
      const collection = targets.find((t) => t.existing?.id === col.id && t.existing !== graph.semantic)?.collection ?? col.name
      const change: ValueChange = { collection, variable: v.name, mode: mode.name, value, reason: 'Variables table' }
      values.set(`${change.collection}|${change.variable}|${change.mode}`, change)
    }
  }

  return {
    format: CHANGESET_FORMAT,
    createdAt: new Date().toISOString(),
    source: theme.name,
    ...(version ? { version } : {}),
    modes: theme.modes.map((m) => MODE_NAMES[m]),
    brands: theme.brands.slice(1).map((b) => b.name),
    primitives: sortPrimitives([...primitives.values()]),
    values: [...values.values()],
    components: overrideChanges(effectiveComponents(theme)),
  }
}

/** Opacity first, then each family's steps light → dark, with alphas right after their base. */
function sortPrimitives(list: PrimitiveChange[]) {
  const key = (p: PrimitiveChange) => {
    const isOpacity = p.name.startsWith('opacity/')
    const m = p.name.match(/^(.*?)\/(\d+|white)(?:-\d+)?(?:\/alpha\/(\d+))?$/)
    const family = m?.[1] ?? p.name
    const step = m ? (m[2] === 'white' ? 0 : Number(m[2])) : 0
    const alpha = m?.[3] ? Number(m[3]) : -1
    return { isOpacity, family, step, alpha }
  }
  return list.sort((a, b) => {
    const x = key(a)
    const y = key(b)
    if (x.isOpacity !== y.isOpacity) return x.isOpacity ? -1 : 1
    return x.family.localeCompare(y.family) || x.step - y.step || x.alpha - y.alpha || a.name.localeCompare(b.name)
  })
}

/**
 * One plain sentence on what a change set does. It always holds every value (the plugin skips what
 * the file already has), so it can also clear what earlier imports left behind.
 */
const REPO_PRIMITIVES = new Set(REPO_DATA.variables.map((v) => v.name))

export function changeSetSummary(cs: ChangeSet): string {
  const themed = cs.values.filter((v) => v.reason !== 'System value').length
  const collections = new Set(cs.values.map((v) => v.collection)).size
  const modes = cs.modes?.length ?? new Set(cs.values.map((v) => v.mode)).size
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  const overrides = cs.components?.length ?? 0
  const fresh = cs.primitives.filter((p) => !REPO_PRIMITIVES.has(p.name)).length
  return [
    `Every value for ${plural(modes, 'mode')}${collections > 1 ? ` and ${plural(collections, 'brand')}` : ''} (${themed} from your theme, the rest at the system’s own value)`,
    fresh ? plural(fresh, 'new color') : '',
    overrides ? plural(overrides, 'component override') : '',
  ]
    .filter(Boolean)
    .join(', ')
    .concat('. Values your Figma file already has are skipped.')
}

