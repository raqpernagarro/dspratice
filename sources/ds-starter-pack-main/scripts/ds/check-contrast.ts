/**
 * Contrast proof: for every component spec and every variant, pairs each foreground binding (text
 * color, icon fill) with the background it sits on and checks the WCAG 2.x contrast ratio in every
 * brand × mode of figma-semantic.json. Exits 1 on any failure.
 *
 * - Background: the part's own, else the nearest enclosing part's (a part drawn by another part's
 *   element sits on that element), else the page surface (color/background/surface/low). Portalled
 *   parts sit on the page. Translucent layers are composited from the surface up.
 * - Minimum: text 4.5:1, large text 3:1 (≥ 24px, or ≥ 18.66px bold, from the text style), icons
 *   3:1 (1.4.11). Disabled variants are exempt (1.4.3: inactive components) and reported apart.
 * - Code and Figma are checked separately where their bindings differ (on: 'code' / 'figma'), and
 *   code-only states (`when`, Number Field's hovered segments) are checked as extra rows.
 *
 *   npm run ds:contrast                  all specs
 *   npm run ds:contrast -- Button        one component
 *   npm run ds:contrast -- --report      also write docs/contrast-report.md
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SPECS, figmaProps, part, textStyle, valueOf, variantsOf, type Binding, type ComponentSpec, type VariantValues } from '../../stories/base-ui/spec'
import { contrast, parseColor } from '../../stories/base-ui/tokens/color-math'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const writeReport = args.includes('--report')
const only = args.filter((a) => !a.startsWith('--'))

const SURFACE = 'color/background/surface/low'
const TRANSPARENT = 'colors/transparent'

/* ---------------------------------------------------------------- tokens */

type Values = Record<string, string>
const semantic = JSON.parse(readFileSync(resolve(root, 'stories/base-ui/tokens/figma-semantic.json'), 'utf8')) as {
  modes: Record<string, Values>
  brands?: Record<string, { name: string } & Record<string, Values>>
}

/** Every brand × mode to check: the default brand first, then each brand's overrides on top of it. */
const THEMES: { id: string; label: string; values: Values }[] = []
for (const mode of Object.keys(semantic.modes)) THEMES.push({ id: `default/${mode}`, label: `Default ${cap(mode)}`, values: semantic.modes[mode] })
for (const [brand, b] of Object.entries(semantic.brands ?? {})) {
  for (const mode of Object.keys(semantic.modes)) {
    THEMES.push({ id: `${brand}/${mode}`, label: `${cap(brand)} ${cap(mode)}`, values: { ...semantic.modes[mode], ...b[mode] } })
  }
}

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

type Rgba = { r: number; g: number; b: number; a: number }

/** A color token's value in a theme; colors/transparent is the one primitive specs may use. */
function color(token: string, values: Values): Rgba {
  if (token === TRANSPARENT) return { r: 0, g: 0, b: 0, a: 0 }
  const raw = values[token]
  const c = raw === undefined ? null : parseColor(raw)
  if (!c) throw new Error(`${token}: not a color in figma-semantic.json (${raw})`)
  return c
}

/** `top` drawn over the opaque `under` (source-over). */
const over = (top: Rgba, under: Rgba): Rgba => ({
  r: top.r * top.a + under.r * (1 - top.a),
  g: top.g * top.a + under.g * (1 - top.a),
  b: top.b * top.a + under.b * (1 - top.a),
  a: 1,
})

const hex = ({ r, g, b }: Rgba) => '#' + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')

/** Font size / weight tokens are the same in every mode; read them from the first. */
const px = (token: string) => parseFloat(Object.values(semantic.modes)[0][token] ?? '0')

/* --------------------------------------------------------------- pairing */

type Side = 'code' | 'figma'
type Kind = 'text' | 'large text' | 'icon'
const MINIMUM: Record<Kind, number> = { text: 4.5, 'large text': 3, icon: 3 }

interface Pairing {
  /** Variant label: only the axes the colors (or text size) depend on, in Figma names. */
  variant: string
  part: string
  kind: Kind
  foreground: string
  /** Backgrounds from the outermost down; the page surface is implied. */
  backgrounds: string[]
  side: 'both' | Side
  /** A code-only state (`when`) on one of the backgrounds: 'decrement :hover'. */
  extra?: string
  exempt: boolean
}

const applies = (b: Binding, v: VariantValues, side: Side) =>
  (b.on === undefined || b.on === 'both' || b.on === side) && (!b.exists || b.exists(v))

/**
 * Parts with a foreground that aren't drawn in every variant (hidden in Figma by the build file,
 * not rendered by Base UI): spec slug → part → the axes it depends on and when it is drawn. The
 * spec doesn't say this, so it is mirrored from scripts/ds/figma/<slug>.build.js (`.visible = …`).
 */
const DRAWN: Record<string, Record<string, { by: string[]; when: (v: VariantValues) => boolean }>> = {
  checkbox: { indicator: { by: ['checked'], when: (v) => v.checked !== 'unchecked' } },
  'accordion-item': { text: { by: ['open'], when: (v) => v.open === 'true' } },
  collapsible: { text: { by: ['open'], when: (v) => v.open === 'true' } },
  avatar: { fallback: { by: ['type'], when: (v) => v.type === 'initials' } },
  field: {
    error: { by: ['invalid'], when: (v) => v.invalid === 'true' },
    description: { by: ['invalid'], when: (v) => v.invalid !== 'true' },
  },
  combobox: { clear: { by: ['filled'], when: (v) => v.filled === 'true' } },
  'menu-item': {
    icon: { by: ['type', 'checked'], when: (v) => (v.type === 'checkbox' || v.type === 'radio') && v.checked === 'true' },
    caret: { by: ['type'], when: (v) => v.type === 'submenu' },
  },
  'navigation-menu-item': { caret: { by: ['type'], when: (v) => v.type === 'trigger' } },
  option: { icon: { by: ['selected'], when: (v) => v.selected === 'true' } },
}

/** The part whose box a part sits in: its element (drawn by it) or its parent. */
const container = (spec: ComponentSpec, id: string) => {
  const p = part(spec, id)
  return p.element ?? p.parent ?? 'root'
}

/** Parts from `id` out to the root (stopping after a portalled part: it sits on the page). */
function chain(spec: ComponentSpec, id: string): string[] {
  const out = [id]
  for (let p = part(spec, id); p.id !== 'root' && !p.portal; p = part(spec, container(spec, p.id))) out.push(container(spec, p.id))
  return out
}

/** Background bindings that paint a part's box on one side (code: also parts drawn by its element). */
function backgroundsOf(spec: ComponentSpec, id: string, v: VariantValues, side: Side, when: boolean): Binding[] {
  return spec.bindings.filter((b) => {
    if (b.property !== 'background' || !applies(b, v, side) || !!b.when !== when) return false
    if (b.part === id) return true
    const p = part(spec, b.part)
    return side === 'code' && p.element === id && !p.pseudo
  })
}

/**
 * Text or icon, and how big: the text styles on the part and on the parts that inherit its color
 * (inside it, without a foreground of their own). No text style and only vector layers = an icon.
 */
function kindOf(spec: ComponentSpec, fg: Binding, v: VariantValues, side: Side): Kind {
  const ownColor = new Set(spec.bindings.filter((b) => b.property === 'foreground' && applies(b, v, side)).map((b) => b.part))
  const inherits = (id: string) => {
    for (let p = id; ; p = container(spec, p)) {
      if (p === fg.part) return true
      if (ownColor.has(p) || p === 'root') return false
    }
  }
  const texts = spec.bindings.filter((b) => b.property === 'text-style' && applies(b, v, side) && inherits(b.part))
  if (!texts.length) {
    const layers = fg.figmaLayers ?? [part(spec, fg.part).figma].flat()
    return layers.length && layers.every((l) => /(^| › )Vector$/.test(l)) ? 'icon' : 'text'
  }
  // The smallest text decides.
  const large = texts.every((b) => {
    const style = textStyle(valueOf(b, v))
    const size = px(style.fontSize)
    return size >= 24 || (size >= 18.66 && px(style.fontWeight) >= 700)
  })
  return large ? 'large text' : 'text'
}

const isDisabled = (v: VariantValues) => Object.values(v).includes('disabled')

/** The variant's label, keeping only the axes in `axes`. */
function label(spec: ComponentSpec, v: VariantValues, axes: Set<string>) {
  const kept = Object.fromEntries(Object.entries(v).filter(([id]) => axes.has(id)))
  const props = Object.entries(figmaProps(spec, kept))
  return props.length ? props.map(([k, x]) => `${k}=${x}`).join(', ') : '—'
}

/** Every foreground × background pairing of a spec, one per distinct variant label. */
function pairings(spec: ComponentSpec): Pairing[] {
  for (const id of Object.keys(DRAWN[spec.slug] ?? {})) part(spec, id)
  const out = new Map<string, Pairing>()
  const add = (p: Pairing) => {
    const key = [p.variant, p.part, p.side, p.extra ?? '', p.kind, p.exempt].join('|')
    if (!out.has(key)) out.set(key, p)
  }
  for (const v of variantsOf(spec)) {
    for (const fg of spec.bindings) {
      if (fg.property !== 'foreground' || fg.when) continue
      const drawn = DRAWN[spec.slug]?.[fg.part]
      if (drawn && !drawn.when(v)) continue
      const perSide = new Map<Side, Omit<Pairing, 'side'>>()
      const extras: Pairing[] = []
      for (const side of ['code', 'figma'] as Side[]) {
        if (!applies(fg, v, side)) continue
        const foreground = valueOf(fg, v)
        if (foreground === 'none' || foreground === TRANSPARENT) continue
        const axes = new Set([...fg.by, ...(drawn?.by ?? [])])
        const kind = kindOf(spec, fg, v, side)
        // Large text depends on the text style: name its axes (Fieldset: Size=Large).
        if (kind === 'large text') for (const b of spec.bindings) if (b.property === 'text-style') b.by.forEach((a) => axes.add(a))
        const layers = chain(spec, fg.part).map((id) => {
          const bgs = backgroundsOf(spec, id, v, side, false)
          for (const b of bgs) b.by.forEach((a) => axes.add(a))
          return { id, bgs }
        })
        const stack = (ls: typeof layers) =>
          ls
            .flatMap((l) => l.bgs.map((b) => valueOf(b, v)))
            .filter((t) => t !== TRANSPARENT && t !== 'none')
            .reverse()
        // A disabled variant names its disabled axis, so it never shares a row with an enabled one.
        for (const [id, x] of Object.entries(v)) if (x === 'disabled') axes.add(id)
        // The label is only known once every background has added its axes.
        const base = { variant: label(spec, v, axes), part: fg.part, kind, foreground, exempt: isDisabled(v) }
        perSide.set(side, { ...base, backgrounds: stack(layers) })
        // Code-only states of a background (a hovered segment), except while disabled.
        if (side === 'code' && !base.exempt) {
          for (const [i, l] of layers.entries()) {
            for (const w of backgroundsOf(spec, l.id, v, side, true)) {
              const swapped = layers.map((x, j) => (j === i ? { ...x, bgs: [w] } : x))
              extras.push({ ...base, backgrounds: stack(swapped), side: 'code', extra: `${l.id} ${w.when!.replace(/:not\(.*$/, '')}` })
            }
          }
        }
      }
      const [code, figma] = [perSide.get('code'), perSide.get('figma')]
      if (code && figma && code.backgrounds.join() === figma.backgrounds.join() && code.foreground === figma.foreground) add({ ...code, side: 'both' })
      else {
        if (code) add({ ...code, side: 'code' })
        if (figma) add({ ...figma, side: 'figma' })
      }
      extras.forEach(add)
    }
  }
  return [...out.values()]
}

/* ----------------------------------------------------------------- check */

interface Result {
  pairing: Pairing
  /** Ratio per theme id. */
  ratios: Record<string, number>
}

function measure(p: Pairing): Result {
  const ratios: Record<string, number> = {}
  for (const t of THEMES) {
    let bg = color(SURFACE, t.values)
    for (const token of p.backgrounds) bg = over(color(token, t.values), bg)
    const fg = over(color(p.foreground, t.values), bg)
    ratios[t.id] = contrast(hex(fg), hex(bg))
  }
  return { pairing: p, ratios }
}

/** Two decimals, rounded down: 4.496 shows as 4.49, never as a passing 4.50. */
const ratio = (r: number) => (Math.floor(r * 100) / 100).toFixed(2)
const short = (token: string) => token.replace(/^color\/(foreground|background)\//, '')
/** 'interactive/subtle/hover over neutral/primary': the top layer first. */
const onWhat = (p: Pairing) => (p.backgrounds.length ? [...p.backgrounds].reverse().map(short).join(' over ') : `${short(SURFACE)} (page)`)
const where = (p: Pairing) => [p.side === 'both' ? '' : p.side === 'code' ? 'code' : 'Figma', p.extra ?? ''].filter(Boolean).join(', ')

const totals = { pass: 0, fail: 0, exempt: 0 }
const failures: string[] = []
const sections: string[] = []
const summaryRows: string[] = []

for (const spec of SPECS) {
  if (only.length && !only.includes(spec.name) && !only.includes(spec.slug)) continue
  const results = pairings(spec).map(measure)
  const count = { pass: 0, fail: 0, exempt: 0 }
  const lines: string[] = []
  for (const { pairing: p, ratios } of results) {
    const min = MINIMUM[p.kind]
    for (const t of THEMES) {
      const r = ratios[t.id]
      if (p.exempt) count.exempt++
      else if (r >= min) count.pass++
      else {
        count.fail++
        const at = [p.variant, where(p)].filter((x) => x && x !== '—').join(' · ')
        const line = `${spec.name} · ${p.part}${at ? ` (${at})` : ''} · ${t.label}: ${short(p.foreground)} on ${onWhat(p)} = ${ratio(r)}:1, needs ${min}:1 (${p.kind})`
        lines.push(line)
        failures.push(line)
      }
    }
  }
  totals.pass += count.pass
  totals.fail += count.fail
  totals.exempt += count.exempt
  const checks = count.pass + count.fail + count.exempt
  if (!checks) continue

  console.log(`\n${spec.name}`)
  if (lines.length) for (const l of lines) console.log(`  ✗ ${l.slice(spec.name.length + 3)}`)
  else console.log(`  ✓ ${count.pass} pass${count.exempt ? `, ${count.exempt} exempt (disabled)` : ''}`)

  summaryRows.push(`| [${spec.name}](#${anchor(spec.name)}) | ${checks} | ${count.pass} | ${count.fail ? `**${count.fail}**` : 0} | ${count.exempt} |`)
  const head = `| Variant | Part | Kind | Foreground on background | ${THEMES.map((t) => t.label).join(' | ')} |`
  const rule = `|${' --- |'.repeat(4 + THEMES.length)}`
  const rows = results.map(({ pairing: p, ratios }) => {
    const cells = THEMES.map((t) => {
      const r = ratios[t.id]
      if (p.exempt) return `${ratio(r)} exempt`
      return r >= MINIMUM[p.kind] ? `${ratio(r)} ✓` : `**${ratio(r)} ✗**`
    })
    const variant = [p.variant, where(p)].filter((x) => x && x !== '—').join(' · ') || '—'
    return `| ${variant} | ${p.part} | ${p.kind} ${MINIMUM[p.kind]}:1 | \`${short(p.foreground)}\` on \`${onWhat(p)}\` | ${cells.join(' | ')} |`
  })
  sections.push(`### ${spec.name}\n\n${head}\n${rule}\n${rows.join('\n')}\n`)
}

function anchor(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-')
}

const all = totals.pass + totals.fail + totals.exempt
const summary = `${all} checks (pairings × ${THEMES.length} brand modes): ${totals.pass} pass, ${totals.fail} fail, ${totals.exempt} exempt (disabled)`
console.log(`\n${summary}`)

if (writeReport) {
  const path = resolve(root, 'docs/contrast-report.md')
  const md = [
    '# Contrast report',
    '',
    '> Generated from the component specs and `stories/base-ui/tokens/figma-semantic.json` by `scripts/ds/check-contrast.ts`. Do not edit.',
    '> Regenerate with `npm run ds:contrast -- --report`.',
    '',
    'Every foreground binding (text color, icon fill) of every component variant, paired with the background it sits on, in every brand and mode. WCAG 2.x minimums: **text 4.5:1**, **large text 3:1** (≥ 24px, or ≥ 18.66px bold), **icons 3:1**. Disabled variants are **exempt** (WCAG 1.4.3: inactive components) and are listed without failing.',
    '',
    `The background is the part's own, else the nearest enclosing part's, else the page surface (\`${short(SURFACE)}\`). Translucent backgrounds are composited over what is under them. Rows marked *code* or *Figma* differ between the two; rows naming a part and a state (\`decrement :hover\`) are code-only states. Ratios are rounded down.`,
    '',
    `**${summary}.**`,
    '',
    '## Summary',
    '',
    '| Component | Checks | Pass | Fail | Exempt |',
    '| --- | --- | --- | --- | --- |',
    ...summaryRows,
    '',
    ...(failures.length ? ['## Failures', '', ...failures.map((f) => `- ${f}`), ''] : []),
    '## Components',
    '',
    ...sections,
  ].join('\n')
  writeFileSync(path, md)
  console.log(`wrote ${relative(root, path)}`)
}

process.exit(totals.fail ? 1 : 0)
