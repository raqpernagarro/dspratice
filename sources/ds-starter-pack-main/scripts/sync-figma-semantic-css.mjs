/**
 * Figma variables → CSS custom properties.
 *
 *   npm run figma:sync-semantics
 *
 * Writes stories/base-ui/tokens/figma-semantic.css with:
 *  - the `semantic` collection per mode (Light / Dark), named after the token path
 *    (color/background/neutral/primary → --color-background-neutral-primary)
 *  - one composite variable per Figma shadow style (see SHADOW_STYLES)
 *  - `scale/*` primitives (still referenced directly by a few component recipes)
 *  - component tokens (`<spec slug>/*`, e.g. button/label/space-x/md) that Figma layers are bound
 *    to (per the component anatomy; unused component tokens are left out so code falls back to
 *    semantics)
 *  - brand extensions (e.g. "Violet Brand") as [data-brand] overrides
 *
 * Aliases to other exported tokens are emitted as var(--…) so overrides (brands, the
 * configurator) cascade. Aliases to primitives are resolved to literal values.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import FigmaApi from '../variables-github-action/src/figma_api.ts'
import { SPECS } from '../stories/base-ui/spec/index.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envPath = path.resolve(__dirname, '../variables-github-action/.env')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)="(.*)"/)
    if (m) process.env[m[1]] = m[2]
  }
}
const outDir = path.resolve(__dirname, '../stories/base-ui/tokens')

/**
 * Source of variables:
 *  --from-file <export.json>   a DS Configurator plugin export (any Figma plan)
 *  (default)                   the Figma REST API (Enterprise; needs .env token)
 */
const fileArg = process.argv.indexOf('--from-file')
let data
if (fileArg !== -1) {
  const file = process.argv[fileArg + 1]
  if (!file) {
    console.error('Usage: --from-file <path to plugin export>')
    process.exit(1)
  }
  // npm runs this from variables-github-action/; resolve relative to where the user ran npm.
  const resolved = path.resolve(process.env.INIT_CWD ?? process.cwd(), file)
  data = JSON.parse(fs.readFileSync(resolved, 'utf8'))
  if (data.format !== 'ds-configurator/variables@1') console.warn('warn: file has no DS Configurator format marker; reading it anyway')
  console.log(`Reading variables from ${path.relative(process.cwd(), resolved)}`)
} else {
  loadEnv()
  const token = process.env.PERSONAL_ACCESS_TOKEN
  const fileKey = process.env.FILE_KEY
  if (!token || !fileKey) {
    console.error('Set PERSONAL_ACCESS_TOKEN and FILE_KEY in variables-github-action/.env, or use --from-file <plugin export>')
    process.exit(1)
  }
  data = await new FigmaApi(token).getLocalVariables(fileKey)
}
// The REST API still lists deleted variables something references (deletedButReferenced); skip them.
const vars = Object.fromEntries(Object.entries(data.meta.variables).filter(([, v]) => !v.deletedButReferenced))
const collections = Object.values(data.meta.variableCollections)

function collectionNamed(name) {
  const c = collections.find((col) => col.name === name)
  if (!c) throw new Error(`Figma collection "${name}" not found`)
  return c
}
function modeNamed(collection, name) {
  const m = collection.modes.find((mode) => mode.name.toLowerCase() === name)
  if (!m) throw new Error(`Mode "${name}" not found in "${collection.name}"`)
  return m.modeId
}

const semantic = collectionNamed('semantic')
const components = collectionNamed('components')
const MODES = { light: modeNamed(semantic, 'light'), dark: modeNamed(semantic, 'dark') }
const brands = collections.filter((c) => c.isExtension && c.parentVariableCollectionId === semantic.id)

// ------------------------------------------------------------------ naming / filtering

const toCssVar = (name) => `--${name.replace(/\//g, '-')}`

const isSemantic = (v) => v.variableCollectionId === semantic.id
const isScale = (v) => v.name.startsWith('scale/')
/** Component tokens: in the `components` collection, named after a component spec (button/…). */
const SPEC_SLUGS = new Set(SPECS.map((s) => s.slug))
const isComponentToken = (v) => v.variableCollectionId === components.id && SPEC_SLUGS.has(v.name.split('/')[0])

/**
 * Component anatomy (which variables each variant's layers are bound to): from the plugin export
 * when it has one, else the copy kept in the repo. Only bound component tokens reach CSS.
 */
const anatomyPath = path.join(outDir, 'figma-components.json')
const anatomy = data.components ?? (fs.existsSync(anatomyPath) ? JSON.parse(fs.readFileSync(anatomyPath, 'utf8')) : null)
if (data.components) fs.writeFileSync(anatomyPath, JSON.stringify(data.components))
const boundNames = anatomy
  ? new Set(anatomy.flatMap((c) => c.variants.flatMap((v) => v.bindings.map((b) => b.variable))))
  : null
const isBoundComponentToken = (v) => isComponentToken(v) && (!boundNames || boundNames.has(v.name))

/** Tokens that get their own CSS variable (and can therefore be referenced with var()). */
const isExported = (v) => isSemantic(v) || isScale(v) || isBoundComponentToken(v)

// ------------------------------------------------------------------ value formatting

function figmaColorToCss(c, opacity = 1) {
  if (!c || typeof c !== 'object' || !('r' in c)) return null
  const r = Math.round(c.r * 255)
  const g = Math.round(c.g * 255)
  const b = Math.round(c.b * 255)
  const a = Math.round((c.a ?? 1) * opacity * 1000) / 1000
  if (a < 1) return `rgba(${r},${g},${b},${a})`
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/** Unit for a FLOAT token, decided by its path. */
function formatNumber(name, n) {
  if (name.startsWith('font/weight/')) return String(n)
  if (name.startsWith('motion/duration/')) return `${n}ms`
  if (name.startsWith('opacity/')) return String(n > 1 ? n / 100 : n)
  return `${n}px`
}

function formatString(name, s) {
  if (name.startsWith('font/family/')) return /[\s]/.test(s) && !/^['"]/.test(s) ? `'${s}'` : s
  return s
}

// ------------------------------------------------------------------ resolution

/** Mode to read for a variable, given the semantic mode we are rendering. */
function modeFor(v, semanticMode) {
  const ids = Object.keys(v.valuesByMode)
  if (v.valuesByMode[semanticMode] !== undefined) return semanticMode
  return ids[0]
}

/** Raw value of a variable in a semantic mode, honouring brand overrides. */
function rawValue(v, semanticMode, brand) {
  if (brand) {
    const brandMode = brand.modes.find((m) => m.parentModeId === semanticMode)?.modeId
    const ov = brand.variableOverrides?.[v.id]?.[brandMode]
    if (ov !== undefined) return ov
  }
  return v.valuesByMode[modeFor(v, semanticMode)]
}

/** Follows aliases to a literal (number / string / color object). */
function resolveLiteral(id, semanticMode, brand) {
  const seen = new Set()
  let cur = id
  while (!seen.has(cur)) {
    seen.add(cur)
    const v = vars[cur]
    if (!v) return null
    const val = rawValue(v, semanticMode, brand)
    if (val?.type === 'VARIABLE_ALIAS') {
      cur = val.id
      continue
    }
    if (val?.color) return resolveCompositeColor(val, semanticMode, brand)
    return { v, val }
  }
  return null
}

/** Figma color-with-opacity composite: { color: alias, opacity: alias }. */
function resolveCompositeColor(val, semanticMode, brand) {
  const base = val.color?.type === 'VARIABLE_ALIAS' ? resolveLiteral(val.color.id, semanticMode, brand)?.val : val.color
  let op = 1
  if (val.opacity?.type === 'VARIABLE_ALIAS') {
    const o = resolveLiteral(val.opacity.id, semanticMode, brand)?.val
    if (typeof o === 'number') op = o > 1 ? o / 100 : o
  } else if (typeof val.opacity === 'number') {
    op = val.opacity > 1 ? val.opacity / 100 : val.opacity
  }
  return { v: null, val: { ...base, a: (base?.a ?? 1) * op }, composite: true }
}

/** CSS value for variable `v`: var() for exported aliases, literal otherwise. */
function cssValue(v, semanticMode, brand) {
  const val = rawValue(v, semanticMode, brand)
  if (val?.type === 'VARIABLE_ALIAS') {
    const target = vars[val.id]
    if (target && isExported(target)) return `var(${toCssVar(target.name)})`
  }
  // Color + opacity composite on top of an exported color: keep the link so overrides cascade.
  if (val?.color?.type === 'VARIABLE_ALIAS' && vars[val.color.id] && isExported(vars[val.color.id])) {
    const o = val.opacity?.type === 'VARIABLE_ALIAS' ? resolveLiteral(val.opacity.id, semanticMode, brand)?.val : val.opacity
    const pct = typeof o === 'number' ? (o > 1 ? o : o * 100) : 100
    return `color-mix(in srgb, var(${toCssVar(vars[val.color.id].name)}) ${Math.round(pct * 10) / 10}%, transparent)`
  }
  const lit = val?.color ? resolveCompositeColor(val, semanticMode, brand) : resolveLiteral(v.id, semanticMode, brand)
  if (!lit) return null
  const x = lit.val
  if (v.resolvedType === 'COLOR') return figmaColorToCss(x)
  if (typeof x === 'number') return formatNumber(v.name, x)
  if (typeof x === 'string') return formatString(v.name, x)
  return null
}

// ------------------------------------------------------------------ shadow styles

/**
 * Mirrors the effect styles in Figma ("Shadow/…"). The REST styles endpoint needs a
 * file-read scope the sync token does not have, so the mapping lives here.
 * Each style = geometry variables (offset-x / offset-y / blur / spread) + a color token.
 */
const SHADOW_STYLES = [
  { name: 'effect/shadow/elevation/low', geometry: 'effect/shadow/elevation/low', layers: ['color/shadow/elevation/low'] },
  { name: 'effect/shadow/elevation/medium', geometry: 'effect/shadow/elevation/medium', layers: ['color/shadow/elevation/medium'] },
  { name: 'effect/shadow/elevation/high', geometry: 'effect/shadow/elevation/high', layers: ['color/shadow/elevation/high'] },
  { name: 'effect/shadow/focus-ring/primary', geometry: 'effect/shadow/focus-ring', layers: ['color/shadow/focus-ring/primary'] },
  { name: 'effect/shadow/focus-ring/error', geometry: 'effect/shadow/focus-ring', layers: ['color/shadow/focus-ring/error'] },
  { name: 'effect/shadow/emboss', geometry: 'effect/shadow/emboss', inset: true, layers: ['color/shadow/emboss-top/subtle', 'color/shadow/emboss-bottom/subtle'] },
  { name: 'effect/shadow/deboss', geometry: 'effect/shadow/deboss', inset: true, layers: ['color/shadow/deboss-top/subtle', 'color/shadow/deboss-bottom/subtle'] },
]

function shadowCss(style) {
  const g = (part) => `var(${toCssVar(`${style.geometry}/${part}`)})`
  return style.layers
    .map((color) => `${style.inset ? 'inset ' : ''}${g('offset-x')} ${g('offset-y')} ${g('blur')} ${g('spread')} var(${toCssVar(color)})`)
    .join(', ')
}

// ------------------------------------------------------------------ build

const byName = (a, b) => a.name.localeCompare(b.name)
const semanticVars = Object.values(vars).filter(isSemantic).sort(byName)
const scaleVars = Object.values(vars).filter(isScale).sort(byName)
const componentVars = Object.values(vars).filter(isBoundComponentToken).sort(byName)

/**
 * Non-color semantic tokens (size, space, radius, type, effects, motion) are the same in every
 * color mode — see scripts/link-semantic-modes.mjs. A token opts out with "[per-mode]" in its
 * Figma description (keep in sync with PER_MODE_MARKER there).
 */
const PER_MODE_MARKER = '[per-mode]'
const isLinked = (v) => v.resolvedType !== 'COLOR' && !(v.description ?? '').includes(PER_MODE_MARKER)
const linkedVars = semanticVars.filter(isLinked)
const modedVars = semanticVars.filter((v) => !isLinked(v))

function block(selector, lines) {
  return lines.length ? `${selector} {\n${lines.map((l) => `  ${l}`).join('\n')}\n}\n` : ''
}

const warnings = []
function declarations(list, mode, brand) {
  const out = []
  for (const v of list) {
    const val = cssValue(v, mode, brand)
    if (val == null) warnings.push(`${v.name} (${mode}${brand ? `, ${brand.name}` : ''}) could not be resolved`)
    else out.push(`${toCssVar(v.name)}: ${val};`)
  }
  return out
}

for (const v of linkedVars) {
  if (cssValue(v, MODES.light) !== cssValue(v, MODES.dark)) {
    warnings.push(`${v.name} differs between Light and Dark in Figma; using Light (run npm run figma:link-modes)`)
  }
}

let css = '/* Generated from Figma — npm run figma:sync-semantics. Do not edit by hand. */\n\n'
css += '/* Mode-independent: primitives, sizing/type/effect/motion tokens, shadow styles. */\n'
css += block(':root', [
  ...declarations(scaleVars, MODES.light),
  ...declarations(linkedVars, MODES.light),
  ...SHADOW_STYLES.map((s) => `${toCssVar(s.name)}: ${shadowCss(s)};`),
])
css += '\n'
css += block(':root,\n.theme-scope[data-appearance="light"]', [
  ...declarations(modedVars, MODES.light),
  ...declarations(componentVars, MODES.light),
])
css += '\n'
css += block('.theme-scope[data-appearance="dark"]', [
  ...declarations(modedVars, MODES.dark),
  ...declarations(componentVars, MODES.dark),
])

const brandSlug = (b) => b.name.replace(/\s*brand\s*/i, '').trim().toLowerCase().replace(/\s+/g, '-')
for (const brand of brands) {
  const sel = `.theme-scope[data-brand="${brandSlug(brand)}"]`
  css += '\n'
  css += block(sel, declarations(linkedVars.filter((v) => brand.variableOverrides?.[v.id]), MODES.light, brand))
  const overridden = modedVars.filter((v) => brand.variableOverrides?.[v.id])
  for (const [mode, modeId] of Object.entries(MODES)) {
    css += '\n'
    css += block(`${sel}[data-appearance="${mode}"]`, declarations(overridden, modeId, brand))
  }
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'figma-semantic.css'), css)

// Resolved literal values (no var()) — the configurator does math on these (density, tinting).
function literalValue(v, mode, brand) {
  const lit = resolveLiteral(v.id, mode, brand)
  if (!lit) return null
  if (v.resolvedType === 'COLOR') return figmaColorToCss(lit.val)
  if (typeof lit.val === 'number') return formatNumber(v.name, lit.val)
  if (typeof lit.val === 'string') return formatString(v.name, lit.val)
  return null
}
function literalMap(mode, brand) {
  return Object.fromEntries(
    semanticVars
      .map((v) => [v.name, literalValue(v, isLinked(v) ? MODES.light : mode, brand)])
      .filter(([, x]) => x != null),
  )
}
const resolved = {
  modes: { light: literalMap(MODES.light), dark: literalMap(MODES.dark) },
  brands: Object.fromEntries(
    brands.map((b) => [brandSlug(b), { name: b.name, light: literalMap(MODES.light, b), dark: literalMap(MODES.dark, b) }]),
  ),
}
fs.writeFileSync(path.join(outDir, 'figma-semantic.json'), JSON.stringify(resolved, null, 2))

// Raw variable structure for the configurator's Variables table (aliases kept as ids).
// Components (large) go to a separate file, except button / icon-button which the preview uses.
function rawValue2(val) {
  if (val?.type === 'VARIABLE_ALIAS') return { a: val.id }
  if (val?.color) {
    const o = val.opacity?.type === 'VARIABLE_ALIAS' ? { o: val.opacity.id } : typeof val.opacity === 'number' ? { o: val.opacity } : {}
    return val.color?.type === 'VARIABLE_ALIAS' ? { a: val.color.id, ...o } : figmaColorToCss(val.color)
  }
  if (val && typeof val === 'object' && 'r' in val) return figmaColorToCss(val)
  return val ?? null
}
function rawVariable(v) {
  return {
    id: v.id,
    name: v.name,
    collection: v.variableCollectionId,
    type: v.resolvedType,
    description: v.description || undefined,
    values: Object.fromEntries(Object.entries(v.valuesByMode).map(([m, val]) => [m, rawValue2(val)])),
  }
}
const rawCollections = collections.map((c) => ({
  id: c.id,
  name: c.name,
  modes: c.modes.map((m) => ({ id: m.modeId, name: m.name, parent: m.parentModeId })),
  count: (c.variableIds ?? []).filter((id) => vars[id]).length,
  extends: c.isExtension ? c.parentVariableCollectionId : undefined,
  overrides: c.isExtension
    ? Object.fromEntries(
        Object.entries(c.variableOverrides ?? {}).map(([vid, byMode]) => [
          vid,
          Object.fromEntries(Object.entries(byMode).map(([m, val]) => [m, rawValue2(val)])),
        ]),
      )
    : undefined,
}))
const isLargeComponent = (v) => v.variableCollectionId === components.id && !isComponentToken(v)
const allVars = Object.values(vars).sort(byName)
fs.writeFileSync(
  path.join(outDir, 'figma-variables.json'),
  JSON.stringify({
    collections: rawCollections,
    variables: allVars.filter((v) => !isLargeComponent(v)).map(rawVariable),
    // Component tokens some layer is bound to (the rest are not emitted to CSS).
    bound: componentVars.map((v) => v.name),
  }),
)
fs.writeFileSync(
  path.join(outDir, 'figma-variables-components.json'),
  JSON.stringify({ variables: allVars.filter(isLargeComponent).map(rawVariable) }),
)

// Component → semantic leaf map (used by the Figma rebind helper scripts).
const componentToSemantic = {}
for (const v of Object.values(vars).filter(isComponentToken).sort(byName)) {
  let cur = v
  const seen = new Set()
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    const val = cur.valuesByMode[modeFor(cur, MODES.light)]
    if (val?.type !== 'VARIABLE_ALIAS') break
    const next = vars[val.id]
    if (next && isSemantic(next)) {
      componentToSemantic[v.name] = next.name
      break
    }
    cur = next
  }
}
fs.writeFileSync(path.join(outDir, 'figma-component-to-semantic.json'), JSON.stringify(componentToSemantic, null, 2))

const specPath = path.join(outDir, 'component-button-token-spec.json')
if (fs.existsSync(specPath)) {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
  fs.writeFileSync(path.join(outDir, 'figma-rebind-map.json'), JSON.stringify(spec.sharedOverlay ?? spec.sharedStateLayer ?? spec.composites ?? {}, null, 2))
}

for (const w of warnings) console.warn(`warn: ${w}`)
console.log(`Modes: light=${MODES.light} dark=${MODES.dark}; brands: ${brands.map(brandSlug).join(', ') || 'none'}`)
console.log(
  `Wrote ${semanticVars.length} semantic, ${scaleVars.length} scale, ${SHADOW_STYLES.length} shadow, ${componentVars.length} component variables`,
)
