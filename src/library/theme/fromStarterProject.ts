// Reads a DS Starter Pack project file (ds.project.json or <name>.dsproject.json, format
// "ds-configurator/project" v1, see stories/base-ui/tokens/project-file.ts in the Starter Pack)
// into the hub's ThemeConfig, so a set-up done in the real wizard is recorded in a project.
//
// Self-contained on purpose: the hub must build without the Starter Pack source, so the shape is
// checked here rather than with the Starter's own parser (fromStarterProject.test.ts checks the
// two agree when the source is installed). The hub's theme is smaller than the Starter's, so the
// import is lossy: `kept` and `notKept` say exactly what came across.

import type { BrandDef, BrandId, ThemeConfig } from '@/state/types'

export const STARTER_PROJECT_FORMAT = 'ds-configurator/project'
const SUPPORTED_VERSION = 1

interface Oklch3 { l: number; c: number; h: number }

export interface StarterImport {
  patch: Pick<ThemeConfig, 'name' | 'tagline' | 'appearance' | 'designedFirst' | 'secondMode' | 'productType' | 'brands' | 'activeBrand' | 'color' | 'type' | 'radius' | 'density' | 'depth' | 'buttonShape' | 'repoUrl' | 'figmaUrl'>
  kept: string[]
  notKept: string[]
  /** The Starter Pack's own version of the system ("1.0" before its first save) and export time. */
  source: { version: string; exportedAt: string }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const hex = (v: unknown): string | null => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null)
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function oklch(v: unknown): Oklch3 | null {
  if (!isObj(v)) return null
  const l = num(v.l), c = num(v.c), h = num(v.h)
  return l === null || c === null || h === null ? null : { l, c, h }
}

const linearToSrgb = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)

/** OKLCH → #rrggbb, clipped to sRGB (the same maths as the Starter Pack's color-math.ts). */
export function oklchToHex({ l, c, h }: Oklch3): string {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_]
  return `#${rgb.map((x) => Math.round(Math.min(1, Math.max(0, linearToSrgb(x))) * 255).toString(16).padStart(2, '0')).join('')}`
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'main'

/**
 * Throws an Error with a plain message when `raw` (text or parsed JSON) is not a project file the
 * hub can read. `current` supplies what the file leaves to the Starter's defaults (fonts, size).
 */
export function fromStarterProject(raw: unknown, current: ThemeConfig): StarterImport {
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error('This file is not valid JSON. Use the ds.project.json the Starter Pack saved, or a .dsproject.json it exported.')
    }
  }
  if (!isObj(data) || data.format !== STARTER_PROJECT_FORMAT) throw new Error('This is not a DS Starter Pack project file. Look for ds.project.json in the copy, or a file ending in .dsproject.json.')
  if (typeof data.version !== 'number' || data.version > SUPPORTED_VERSION) throw new Error('This project file was made by a newer DS Configurator than the hub reads. Ask the hub’s maintainer to update the import.')
  const project = isObj(data.project) ? data.project : {}
  const theme = isObj(data.theme) ? data.theme : {}
  const color = isObj(theme.color) ? theme.color : {}
  const type = isObj(theme.type) ? theme.type : {}
  const extras = isObj(theme.extras) ? theme.extras : {}
  const kept: string[] = []
  const notKept: string[] = []

  const name = str(project.name).trim() || str(theme.name).trim() || current.name
  kept.push(`Name: ${name}`)
  const tagline = str(project.description).trim()
  if (tagline) kept.push('One-line description')

  // Modes: base mode first. A second mode that is not "separate" follows the base mode.
  const modes = (Array.isArray(theme.modes) ? theme.modes : ['light', 'dark']).filter((m): m is 'light' | 'dark' => m === 'light' || m === 'dark')
  const base = modes[0] ?? 'light'
  const appearance: ThemeConfig['appearance'] = modes.length > 1 ? 'both' : base
  const separate = isObj(theme.separate) && modes[1] ? Boolean((theme.separate as Record<string, unknown>)[modes[1]]) : false
  kept.push(appearance === 'both' ? `Light and dark, ${base} first, the second ${separate ? 'set up on its own' : 'following'}` : `${base === 'light' ? 'Light' : 'Dark'} only`)
  if (separate) notKept.push(`The ${modes[1]} mode’s own colours (the hub keeps one colour set)`)

  const productType = str(project.appType) || current.productType
  kept.push(`Product: ${productType}`)

  const main = oklch(color.main)
  const mainHex = main ? oklchToHex(main) : current.color.main
  const accent = hex(color.accent) ?? mainHex
  const neutralTint = num(color.neutralTint) ?? current.color.neutralTint
  kept.push(main ? `Brand colour ${mainHex}` : 'Brand colour: the Starter Pack default, so the hub keeps its own')

  const starterBrands = (Array.isArray(theme.brands) ? theme.brands : []).filter(isObj)
  const brands: BrandDef[] = starterBrands.length
    ? starterBrands.map((b, i) => {
        const own = isObj(b.own) ? b.own : {}
        const ownColor = isObj(own.colors) && isObj(own.colors.color) ? own.colors.color : null
        const bMain = (ownColor && oklch(ownColor.main)) || null
        return { id: (str(b.id) || slug(str(b.name))) as BrandId, name: str(b.name) || `Brand ${i + 1}`, main: bMain ? oklchToHex(bMain) : mainHex, accent: (ownColor && hex(ownColor.accent)) || accent, ...(i === 0 ? { isDefault: true } : {}) }
      })
    : [{ id: slug(name) as BrandId, name, main: mainHex, accent, isDefault: true }]
  kept.push(starterBrands.length ? `${plural(brands.length, 'brand')}: ${brands.map((b) => b.name).join(', ')}` : 'One brand')
  const brandFonts = starterBrands.filter((b) => isObj(b.own) && (b.own.fonts || b.own.shape)).length
  if (brandFonts) notKept.push(`Fonts or shape owned by ${plural(brandFonts, 'brand')} (the hub keeps the main brand’s)`)

  const family = (f: unknown) => (isObj(f) && typeof f.family === 'string' ? f.family : null)
  const body = family(type.body)
  const heading = family(type.heading) ?? body
  const baseSize = num(type.baseSize)
  const headingWeight = num(extras.headingWeight)
  kept.push(body || heading ? `Type: ${heading ?? current.type.heading} and ${body ?? current.type.body}` : 'Type: the Starter Pack default fonts, so the hub keeps its own')

  const radius = num(theme.radius)
  const density = num(theme.density)
  const depth = num(theme.depth)
  const buttonShape = extras.buttonShape === 'pill' ? 'pill' : 'default'
  kept.push('Corners, spacing, depth and button shape')

  const repoUrl = str(project.githubUrl)
  const figmaUrl = str(project.figmaUrl)
  if (repoUrl) kept.push(`Repository: ${repoUrl}`)
  if (figmaUrl) kept.push(`Figma file: ${figmaUrl}`)

  const status = isObj(color.status) ? Object.values(color.status).filter(Boolean).length : 0
  if (status) notKept.push(`${plural(status, 'status colour')} (info, success, warning, error)`)
  if (num(color.neutralHue) !== null || oklch(color.background) || num(color.rampContrast) !== null || color.tertiary === true) notKept.push('Fine colour settings: neutral hue, page colour, palette contrast, a third emphasis level')
  if (theme.grid === false) notKept.push('The 4px grid is switched off')
  const count = (v: unknown) => (isObj(v) ? Object.keys(v).length : Array.isArray(v) ? v.length : 0)
  const edits = count(theme.variables), overrides = count(theme.components), added = count(theme.added)
  if (edits) notKept.push(`${plural(edits, 'variable edit')} from the Variables table`)
  if (overrides) notKept.push(`${plural(overrides, 'component override')}`)
  if (added) notKept.push(`${plural(added, 'variable')} made in Figma`)
  const protos = count(data.prototypes), pages = count(data.pages)
  if (protos) notKept.push(`${plural(protos, 'saved prototype')}`)
  if (pages) notKept.push(`${plural(pages, 'written docs page')}`)
  notKept.push('Everything above stays in the Starter Pack copy, where it was made.')

  const versions = Array.isArray(data.versions) ? data.versions.filter(isObj) : []
  return {
    patch: {
      name,
      tagline,
      appearance,
      designedFirst: base,
      secondMode: separate ? 'separate' : 'follows',
      productType,
      brands,
      activeBrand: brands[0].id,
      color: { main: mainHex, accent, neutralTint },
      type: { heading: heading ?? current.type.heading, body: body ?? current.type.body, baseSize: baseSize ?? current.type.baseSize, headingWeight: headingWeight ?? current.type.headingWeight },
      radius: radius ?? current.radius,
      density: density ?? current.density,
      depth: depth ?? current.depth,
      buttonShape,
      repoUrl: repoUrl || current.repoUrl,
      figmaUrl: figmaUrl || current.figmaUrl,
    },
    kept,
    notKept,
    source: { version: versions[0] ? str(versions[0].version) || '1.0' : '1.0', exportedAt: str(data.exportedAt) },
  }
}
