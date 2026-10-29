/**
 * Figma ↔ spec parity: compares what every Figma variant's layers are bound to
 * (figma-components.json, written by the plugin's Export / figma:sync) with what the component spec
 * expects. Exits 1 on any difference.
 *
 *   npm run ds:parity                 all specs
 *   npm run ds:parity -- Button       one component
 *   npm run ds:parity -- --file x.variables.json   anatomy from a plugin export
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SPECS, codeValues, expectedAnatomy, inSlot, type ExpectedAnatomy } from '../../stories/base-ui/spec'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const fileArg = args.indexOf('--file')
const only = args.filter((a, i) => !a.startsWith('--') && i !== fileArg + 1)

interface FigmaBinding {
  layer: string
  nodeType?: string
  field: string
  variable: string
}
type Anatomy = { name: string; axes: Record<string, string[]>; variants: { props: Record<string, string>; bindings: FigmaBinding[] }[] }

const actual: Anatomy[] =
  fileArg >= 0
    ? JSON.parse(readFileSync(resolve(args[fileArg + 1]), 'utf8')).components ?? []
    : JSON.parse(readFileSync(resolve(root, 'stories/base-ui/tokens/figma-components.json'), 'utf8'))

const key = (props: Record<string, string>) =>
  Object.entries(props)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')

let problems = 0
const report = (line: string) => {
  problems++
  console.log(`  ✗ ${line}`)
}

function compare(spec: (typeof SPECS)[number], expected: ExpectedAnatomy, figma: Anatomy | undefined) {
  console.log(`\n${spec.name}`)
  if (!figma) return report('no component set with this name in the file')

  for (const [axis, values] of Object.entries(expected.axes)) {
    const got = figma.axes[axis]
    if (!got) report(`variant property "${axis}" missing`)
    else if ([...values].sort().join() !== [...got].sort().join()) report(`${axis}: expected ${values.join('/')}, Figma has ${got.join('/')}`)
  }
  for (const axis of Object.keys(figma.axes)) if (!expected.axes[axis]) report(`variant property "${axis}" isn't in the spec`)

  // Instances of other spec'd components (Field's Input) are checked by their own spec.
  // So is whatever designers put in a slot (only the slot's own bindings are checked).
  const nested = spec.parts.filter((p) => p.instanceOf).flatMap((p) => [p.figma].flat())
  const inNested = (layer: string) => nested.some((n) => layer === n || layer.startsWith(`${n} › `)) || inSlot(spec, layer)
  const figmaVariants = new Map(
    figma.variants.map((v) => [key(v.props), { ...v, bindings: v.bindings.filter((b) => !inNested(b.layer)) }]),
  )
  const expectedKeys = new Set(expected.variants.map((v) => key(v.props)))
  for (const k of figmaVariants.keys()) if (!expectedKeys.has(k)) report(`variant {${k}} isn't in the spec`)

  // Group differences by (layer, field, expected → actual) so one wrong binding reads as one line.
  const diffs = new Map<string, string[]>()
  const note = (what: string, variant: Record<string, string>) => {
    if (!diffs.has(what)) diffs.set(what, [])
    diffs.get(what)!.push(key(codeValues(spec, variant)))
  }
  for (const ev of expected.variants) {
    const fv = figmaVariants.get(key(ev.props))
    if (!fv) {
      report(`variant {${key(ev.props)}} missing`)
      continue
    }
    const got = new Map(fv.bindings.map((b) => [`${b.layer}|${b.field}`, b.variable]))
    const want = new Map(ev.bindings.map((b) => [`${b.layer}|${b.field}`, b.variable]))
    for (const [lf, variable] of want) {
      const [layer, field] = lf.split('|')
      const has = got.get(lf)
      if (has === variable) continue
      note(has ? `${layer || '(root)'} · ${field}: ${has} → expected ${variable}` : `${layer || '(root)'} · ${field}: unbound → expected ${variable}`, ev.props)
    }
    for (const [lf, variable] of got) {
      if (want.has(lf)) continue
      const [layer, field] = lf.split('|')
      note(`${layer || '(root)'} · ${field}: bound to ${variable}, not in the spec`, ev.props)
    }
  }
  for (const [what, variants] of diffs) report(`${what}  (${variants.length} variant${variants.length > 1 ? 's' : ''})`)
  if (!diffs.size) console.log('  ✓ bindings match')
}

for (const spec of SPECS) {
  if (only.length && !only.includes(spec.name) && !only.includes(spec.slug)) continue
  compare(spec, expectedAnatomy(spec), actual.find((a) => a.name === spec.name))
}
console.log(problems ? `\n${problems} problem(s)` : '\nFigma matches the specs')
process.exit(problems ? 1 : 0)
