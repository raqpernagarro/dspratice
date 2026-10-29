/**
 * Generates the AI-ready docs from the component specs (stories/base-ui/spec), the React wrappers
 * (stories/base-ui/components/<dir>/<Name>.tsx) and the semantic tokens (tokens/figma-semantic.json):
 * - llms.txt                 index for AI agents (llms.txt convention)
 * - docs/ai/components.md    every component: guidance, code, props, parts, Figma properties, tokens
 * - docs/ai/tokens.md        the semantic token vocabulary and its rules
 * - docs/ai/rules.md         do / don't rules for agents building UI with the system
 *
 *   npm run ds:ai-docs            write files
 *   npm run ds:ai-docs -- --check fail if any file is out of date (CI)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SPECS, TEXT_STYLES, bindingCombos, partClass, tokensUsed, valueOf, type Axis, type ComponentSpec } from '../../stories/base-ui/spec'
import { CATALOG, CATEGORIES, catalogNumber, categoryOf } from '../../stories/base-ui/spec/categories'
import semantic from '../../stories/base-ui/tokens/figma-semantic.json'
import { figmaTokenToCssVar } from '../../stories/base-ui/tokens/figma-css-var'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const check = process.argv.includes('--check')
const stale: string[] = []

function write(path: string, content: string) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (current === content) return
  if (check) stale.push(relative(root, path))
  else {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
    console.log(`wrote ${relative(root, path)}`)
  }
}

const HEADER = 'Generated from the specs by `npm run ds:ai-docs`. Do not edit.'
const COMPONENTS_DIR = 'stories/base-ui/components'

/* ------------------------------------------------------------- markdown */

const code = (s: string) => `\`${s}\``
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
function table(head: string[], rows: string[][]): string {
  if (!rows.length) return ''
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n') + '\n'
}
const bullets = (xs: string[]) => xs.map((x) => `- ${x}`).join('\n') + '\n'
/** GitHub heading anchor. */
const anchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-')
const sortTokens = (xs: Iterable<string>) => [...xs].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

/* --------------------------------------------------- React wrapper parser */

interface Decl {
  name: string
  kind: 'function' | 'const' | 'interface' | 'type'
  exported: boolean
  doc: string
  /** Source from the declaration to the next top-level declaration. */
  body: string
}

interface Member {
  name: string
  optional: boolean
  type: string
  doc: string
}

interface Param {
  name: string
  alias?: string
  default?: string
}

interface Module {
  /** Folder under stories/base-ui/components. */
  dir: string
  file: string
  /** Import path from the repo root, without extension. */
  path: string
  decls: Decl[]
  /** Local alias → Base UI component ('BaseSelect' → 'Select'). */
  baseUi: Record<string, string>
  /**
   * Compound exports: export name → [member, target, kind]. Target is a local declaration, a Base UI
   * part ('Select.Root') or another wrapper's part ('Menu.Item').
   */
  compounds: Record<string, [string, string, 'local' | 'base' | 'ref'][]>
}

/** The JSDoc block right before `index`, as plain text. */
function docBefore(src: string, index: number): string {
  const before = src.slice(0, index).trimEnd()
  if (!before.endsWith('*/')) return ''
  const start = before.lastIndexOf('/**')
  if (start < 0) return ''
  return before
    .slice(start + 3, -2)
    .split('\n')
    .map((l) => l.replace(/^\s*\* ?/, '').trimEnd())
    .join('\n')
    .trim()
}

const flat = (doc: string) => doc.replace(/\s*\n\s*/g, ' ').trim()

/** Drops the "Styles: x.css + x.tokens.css (generated from …)." sentence wrappers start with. */
function withoutStyles(doc: string): string {
  if (!doc.startsWith('Styles:')) return doc
  const generated = doc.match(/^Styles:.*?generated from[^)]*\)[.;]?\s*/)
  return (generated ? doc.slice(generated[0].length) : doc.replace(/^Styles:.*?\.(\s+|$)/, '')).trim()
}

function parseModule(dir: string, file: string): Module {
  const src = readFileSync(resolve(root, COMPONENTS_DIR, dir, file), 'utf8')
  const baseUi: Record<string, string> = {}
  for (const m of src.matchAll(/import \{([^}]+)\} from '@base-ui\/react\/[\w-]+'/g)) {
    for (const spec of m[1].split(',')) {
      const [name, alias] = spec.trim().split(/\s+as\s+/)
      if (name) baseUi[alias ?? name] = name
    }
  }
  const starts = [...src.matchAll(/^(export )?(function|const|interface|type) (\w+)/gm)]
  const decls: Decl[] = starts.map((m, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : src.length
    // Stop at the JSDoc of the next declaration.
    let body = src.slice(m.index, end).trimEnd()
    if (body.endsWith('*/')) body = body.slice(0, body.lastIndexOf('/**'))
    return { name: m[3], kind: m[2] as Decl['kind'], exported: !!m[1], doc: docBefore(src, m.index), body }
  })
  const compounds: Module['compounds'] = {}
  for (const d of decls) {
    if (d.kind !== 'const' || !d.exported) continue
    const obj = d.body.match(/^export const \w+ = \{([\s\S]*?)\}\s*$/m)
    if (!obj) continue
    compounds[d.name] = obj[1]
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => {
        const [key, value] = x.split(/\s*:\s*/)
        if (!value) return [key, key, 'local']
        const [ns, part] = value.split('.')
        if (baseUi[ns]) return [key, `${baseUi[ns]}.${part}`, 'base']
        return [key, value, part ? 'ref' : 'local']
      })
  }
  return { dir, file, path: `${COMPONENTS_DIR}/${dir}/${file.replace(/\.tsx$/, '')}`, decls, baseUi, compounds }
}

const isPreview = (name: string) => /Preview$/.test(name)
const isComponentDecl = (d: Decl) => (d.kind === 'function' || d.kind === 'const') && /^[A-Z][a-z]/.test(d.name) && !isPreview(d.name)
/** What product code imports from a module: function components and compound objects (not previews or helpers). */
const publicExports = (mod: Module) => mod.decls.filter((d) => d.exported && isComponentDecl(d) && (d.kind === 'function' || !!mod.compounds[d.name]))

/** Destructured parameters of a function component: `({ size = 'md', label, ...props }: …)`. */
function params(d: Decl): Param[] {
  const m = d.body.match(/\(\{([\s\S]*?)\}\s*:/)
  if (!m) return []
  return m[1]
    .split(/,(?![^<{(]*[>})])/)
    .map((x) => x.trim())
    .filter((x) => x && !x.startsWith('...'))
    .map((x) => {
      const eq = x.search(/=(?!>)/)
      const [lhs, def] = eq < 0 ? [x] : [x.slice(0, eq).trim(), x.slice(eq + 1).trim()]
      const [name, alias] = lhs.split(/\s*:\s*/)
      return { name: name.replace(/^'|'$/g, ''), alias, default: def }
    })
}

/** The props type a function component is declared with (an interface in the module, if any). */
const propsTypeName = (d: Decl) => d.body.match(/\}\s*:\s*(\w+Props)\b/)?.[1]

function interfaceMembers(mod: Module, name: string | undefined): Member[] {
  const d = mod.decls.find((x) => x.kind === 'interface' && x.name === name)
  if (!d) return []
  const block = d.body.match(/\{\n([\s\S]*)\n\}/)?.[1] ?? ''
  const out: Member[] = []
  let doc = ''
  for (const line of block.split('\n')) {
    const t = line.trim()
    const one = t.match(/^\/\*\*\s*(.*?)\s*\*\/$/)
    if (one) doc = one[1]
    else if (t.startsWith('/**')) doc = t.replace(/^\/\*\*\s*/, '')
    else if (t.startsWith('*/')) continue
    else if (t.startsWith('*')) doc += ' ' + t.replace(/^\*\s?/, '').replace(/\*\/$/, '').trim()
    else {
      const m = t.match(/^'?([\w-]+)'?(\?)?:\s*(.+?);?$/)
      if (m) out.push({ name: m[1], optional: !!m[2], type: m[3], doc: doc.trim() })
      doc = ''
    }
  }
  return out
}

/** Base UI component(s) whose props a wrapper passes through: React.ComponentProps<typeof BaseX.Y>. */
function baseUiProps(mod: Module, d: Decl): string[] {
  const iface = mod.decls.find((x) => x.kind === 'interface' && x.name === propsTypeName(d))
  const sig = (iface?.body.split('{')[0] ?? '') + (d.body.match(/^[^\n]*\([\s\S]*?\)\s*(\{|=>)/)?.[0] ?? '')
  const out = new Set<string>()
  for (const m of sig.matchAll(/ComponentProps<typeof (\w+)(?:\.(\w+))?>/g)) {
    const name = mod.baseUi[m[1]]
    if (name) out.add(`Base UI ${code(m[2] ? `${name}.${m[2]}` : name)}`)
  }
  for (const m of sig.matchAll(/ComponentProps<'(\w+)'>/g)) out.add(code(`<${m[1]}>`))
  return [...out]
}

const MODULES: Module[] = readdirSync(resolve(root, COMPONENTS_DIR), { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== 'shared')
  .flatMap((e) =>
    readdirSync(resolve(root, COMPONENTS_DIR, e.name))
      .filter((f) => /^[A-Z]\w*\.tsx$/.test(f))
      .map((f) => parseModule(e.name, f)),
  )
  .sort((a, b) => a.path.localeCompare(b.path))

/** Exported string constants (`OPTION_CLASS = 'ds-option'`), so classes passed by name are found. */
const CLASS_CONSTANTS: [string, string][] = MODULES.flatMap((m) =>
  m.decls.flatMap((d) => {
    const v = d.kind === 'const' && d.body.match(/^export const [A-Z_]+ = '([^']*)'/)
    return v ? [[d.name, v[1]] as [string, string]] : []
  }),
)

/** The public names under which a module's declaration is used: 'Button', 'Select.Trigger'. */
function publicNames(mod: Module, local: string, depth = 0): string[] {
  const d = mod.decls.find((x) => x.name === local)
  if (d?.exported && d.kind === 'function' && !isPreview(local)) return [local]
  const out: string[] = []
  for (const [name, members] of Object.entries(mod.compounds)) for (const [key, value, kind] of members) if (kind === 'local' && value === local) out.push(`${name}.${key}`)
  if (out.length || depth > 1) return out
  // A helper rendered by another component (Toast's list, inside Toast.Viewport).
  for (const other of mod.decls) if (other.name !== local && isComponentDecl(other) && new RegExp(`<${local}[\\s/>]`).test(other.body)) out.push(...publicNames(mod, other.name, depth + 1))
  return [...new Set(out)]
}

interface Element {
  mod: Module
  decl: Decl
  /** How code refers to it: 'Select.Trigger'. */
  name: string
}

/** The wrapper components that render the spec's root class (`ds-<slug>`). */
function elementsOf(spec: ComponentSpec): Element[] {
  const cls = new RegExp(`${partClass(spec, 'root')}(?![\\w-])`)
  const consts = CLASS_CONSTANTS.filter(([, v]) => cls.test(v)).map(([k]) => k)
  const out: Element[] = []
  for (const mod of MODULES) {
    for (const d of mod.decls) {
      if (!isComponentDecl(d)) continue
      if (!cls.test(d.body) && !consts.some((k) => new RegExp(`\\b${k}\\b`).test(d.body))) continue
      for (const name of publicNames(mod, d.name)) out.push({ mod, decl: d, name })
    }
  }
  if (out.length) return dedupe(out)
  // Classes built at runtime (Progress, Meter render a shared gauge): match the component's name.
  const wanted = spec.name.replace(/\s/g, '').toLowerCase()
  for (const mod of MODULES)
    for (const d of mod.decls)
      if (d.exported && isComponentDecl(d) && d.name.toLowerCase() === wanted) out.push({ mod, decl: d, name: mod.compounds[d.name]?.some(([k]) => k === 'Root') ? `${d.name}.Root` : d.name })
  return out
}

const dedupe = (xs: Element[]) => xs.filter((x, i) => xs.findIndex((y) => y.name === x.name && y.mod === x.mod) === i)

/** How a variant axis is set in code. */
interface AxisCode {
  axis: Axis
  /** The prop, when a component takes one. */
  prop?: { name: string; on: string[]; default?: string; inherited?: boolean }
  /** Otherwise: what sets the data attribute. */
  note?: string
}

function defaultOf(decl: Decl, p: Param): { value?: string; inherited?: boolean } {
  if (p.default) return { value: p.default }
  const names = [p.name, p.alias].filter(Boolean)
  for (const line of decl.body.split('\n')) {
    if (!names.some((n) => new RegExp(`\\b${n}\\s*\\?\\?`).test(line))) continue
    const m = [...line.matchAll(/\?\?\s*('[\w-]+'|true|false|\d+)/g)].pop()
    if (m) return { value: m[1], inherited: /contextSize|useControlSize|Context/.test(line) }
  }
  return {}
}

function axisCode(axis: Axis, elements: Element[]): AxisCode {
  const prop = axis.prop ?? axis.id
  const attr = axis.attr ?? `data-${axis.id}`
  const declares = (el: { mod: Module; decl: Decl }) =>
    params(el.decl).find((p) => p.name === prop) ?? (interfaceMembers(el.mod, propsTypeName(el.decl)).some((m) => m.name === prop) ? { name: prop } : undefined)
  // On the element itself.
  const on = elements.filter((el) => declares(el))
  if (on.length) {
    const d = defaultOf(on[0].decl, declares(on[0])!)
    return { axis, prop: { name: prop, on: on.map((el) => el.name), default: d.value, inherited: d.inherited } }
  }
  // Inherited from a parent through context (Tabs.Tab takes Tabs.Root's size).
  const inherited = elements.find((el) => /useControlSize\(\)/.test(el.decl.body) && new RegExp(`${attr}=\\{`).test(el.decl.body))
  // On another component of the same module (Drawer's side is set on Drawer.Root).
  const mods = [...new Set(elements.map((el) => el.mod))]
  for (const mod of mods) {
    for (const d of mod.decls) {
      if (!isComponentDecl(d)) continue
      const p = declares({ mod, decl: d })
      const names = p ? publicNames(mod, d.name) : []
      if (!names.length) continue
      const def = defaultOf(d, p!)
      return { axis, prop: { name: prop, on: names, default: def.value, inherited: def.inherited } }
    }
  }
  if (inherited) return { axis, note: `Not a prop of ${code(inherited.name)}: it takes the enclosing group's ${code(prop)} (default ${code('md')}).` }
  // Set by the component you pick (Menu.Item → data-type="default").
  const literal = elements.flatMap((el) => {
    const m = el.decl.body.match(new RegExp(`${attr}="([\\w-]+)"`))
    return m ? [`${code(el.name)} → ${code(m[1])}`] : []
  })
  if (literal.length) return { axis, note: `Not a prop: each component sets it. ${literal.join(', ')}.` }
  const derived = elements.flatMap((el) => {
    const m = el.decl.body.match(new RegExp(`${attr}=\\{([^}]+)\\}`))
    return m ? [`${code(el.name)}: ${code(`${attr}={${m[1].trim()}}`)}`] : []
  })
  if (derived.length) return { axis, note: `Not a prop: the wrapper derives it. ${derived.join(', ')}.` }
  return { axis, note: `Passed through to Base UI as ${code(prop)} (not declared by the wrapper).` }
}

/* ---------------------------------------------------------------- tokens */

const LIGHT = semantic.modes.light as Record<string, string>
const DARK = semantic.modes.dark as Record<string, string>
const BRANDS = semantic.brands as Record<string, { name: string; light: Record<string, string>; dark: Record<string, string> }>

/** Composite shadow styles (`effect/shadow/focus-ring/primary`), from the generated CSS. */
const EFFECT_STYLES: { token: string; css: string }[] = (() => {
  const css = readFileSync(resolve(root, 'stories/base-ui/tokens/figma-semantic.css'), 'utf8')
  const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
  const groups = [...new Set(Object.keys(LIGHT).filter((k) => k.startsWith('effect/shadow/')).map((k) => k.split('/').slice(2, -1).join('/')))]
  const out: { token: string; css: string }[] = []
  for (const m of rootBlock.matchAll(/--effect-shadow-([a-z0-9-]+):\s*([^;]+);/g)) {
    if (/-(blur|offset-x|offset-y|spread)$/.test(m[1])) continue
    const group = groups.find((g) => m[1] === g.replace(/\//g, '-') || m[1].startsWith(g.replace(/\//g, '-') + '-'))
    if (!group) continue
    const rest = m[1].slice(group.replace(/\//g, '-').length + 1)
    out.push({ token: `effect/shadow/${group}${rest ? `/${rest}` : ''}`, css: m[2].trim() })
  }
  return out.sort((a, b) => a.token.localeCompare(b.token))
})()

const SEMANTIC = new Set([...Object.keys(LIGHT), ...EFFECT_STYLES.map((e) => e.token)])
const isPrimitive = (t: string) => /^(colors|scale|opacity)\//.test(t)

/** Semantic token → components that read it. */
const USED_BY = new Map<string, string[]>()
for (const name of CATALOG) {
  const spec = SPECS.find((s) => s.name === name)
  if (!spec) continue
  for (const t of tokensUsed(spec)) USED_BY.set(t, [...(USED_BY.get(t) ?? []), spec.name])
}

/* ------------------------------------------------------------ components */

const ordered = CATALOG.map((name) => {
  const spec = SPECS.find((s) => s.name === name)
  if (!spec) throw new Error(`${name} is in spec/categories.ts but not in SPECS`)
  return spec
})
for (const s of SPECS) if (!CATALOG.includes(s.name)) throw new Error(`${s.name} has no category: add it to spec/categories.ts`)

/** Modules with a spec'd component, in catalog order, then code-only modules. */
const moduleOf = (spec: ComponentSpec) => MODULES.find((m) => m.dir === (spec.dir ?? spec.slug))
const ELEMENTS = new Map(ordered.map((s) => [s.name, elementsOf(s)]))
const specModules = [...new Set(ordered.flatMap((s) => [moduleOf(s), ...ELEMENTS.get(s.name)!.map((el) => el.mod)]))].filter((m): m is Module => !!m && publicExports(m).length > 0)
const codeOnlyModules = MODULES.filter((m) => !specModules.includes(m) && publicExports(m).length > 0 && !ordered.some((s) => moduleOf(s) === m))
const moduleAnchor = (m: Module) => anchor(`${m.file.replace(/\.tsx$/, '')} module`)
const moduleHeading = (m: Module) => `${m.file.replace(/\.tsx$/, '')} module`
const importLine = (m: Module, names: string[]) => `import { ${[...new Set(names)].join(', ')} } from '${m.path}'`

/** Docs-only Base UI utilities: documented in Storybook, no spec, no styles. */
const UTILITIES = [
  { name: 'CSP Provider', slug: 'csp-provider', what: 'Passes a CSP nonce to the inline <style> / <script> tags Base UI renders.' },
  { name: 'Direction Provider', slug: 'direction-provider', what: 'Sets text direction (ltr / rtl) for Base UI components below it.' },
  { name: 'mergeProps', slug: 'merge-props', what: 'Merges React props: event handlers are chained, className and style combined.' },
  { name: 'useRender', slug: 'use-render', what: 'Hook for your own components that take a `render` prop, the same way Base UI parts do.' },
]

function componentSection(spec: ComponentSpec): string {
  const { docs } = spec
  const elements = ELEMENTS.get(spec.name)!
  const out: string[] = []
  out.push(`### ${spec.name}\n`)
  out.push(`${catalogNumber(spec.name)} · ${categoryOf(spec.name)} · CSS ${code(`.${partClass(spec, 'root')}`)} · [Base UI docs](${docs.baseUi})\n`)
  out.push(`${docs.summary}\n`)
  if (docs.usage?.length) out.push(`**Use it**\n\n${bullets(docs.usage)}`)
  if (docs.dont?.length) out.push(`**Don't**\n\n${bullets(docs.dont)}`)
  if (docs.accessibility?.length) out.push(`**Accessibility**\n\n${bullets(docs.accessibility)}`)

  // Code
  out.push('**Code**\n')
  if (elements.length) {
    const byMod = new Map<Module, string[]>()
    for (const el of elements) byMod.set(el.mod, [...(byMod.get(el.mod) ?? []), el.name.split('.')[0]])
    out.push('```tsx\n' + [...byMod].map(([m, names]) => importLine(m, names)).join('\n') + '\n```\n')
    out.push(`Rendered by ${elements.map((el) => `${code(`<${el.name}>`)}`).join(', ')}. API: ${[...byMod.keys()].map((m) => `[${moduleHeading(m)}](#${moduleAnchor(m)})`).join(', ')}.\n`)
  } else {
    const mod = moduleOf(spec)
    out.push(mod && publicExports(mod).length ? `No component of its own; part of [${moduleHeading(mod)}](#${moduleAnchor(mod)}).\n` : 'No React wrapper yet.\n')
  }

  // Variant axes
  const props = spec.axes.filter((a) => a.kind === 'prop').map((a) => axisCode(a, elements))
  if (props.length) {
    out.push('**Props (variant axes)**\n')
    const rows = props.map(({ axis: a, prop, note }) => {
      const values = a.values.map((v) => (/^(true|false|\d+)$/.test(v.code) ? v.code : `'${v.code}'`))
      const figma = `${a.figma}: ${a.values.map((v) => v.figma).join(' · ')}`
      if (!prop) return ['—', values.map(code).join(' '), '—', figma, note!]
      const def = prop.default ? `${code(prop.default)}${prop.inherited ? ' (or the enclosing group’s)' : ''}` : '—'
      const own = prop.on.every((n) => elements.some((el) => el.name === n))
      const where = own ? `On ${prop.on.map(code).join(', ')}` : `Set on ${prop.on.map(code).join(', ')}, which passes it down`
      return [code(prop.name), values.map(code).join(' '), def, figma, `${where}${a.layout ? '. Placement / content only: no token changes.' : ''}`]
    })
    out.push(table(['Prop', 'Values', 'Default', 'Figma', 'Notes'], rows))
  }
  const states = spec.axes.filter((a) => a.kind === 'state')
  if (states.length) {
    out.push('**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)\n')
    out.push(
      table(
        ['Figma', 'Values', 'Code condition'],
        states.map((a) => [
          a.figma + (a.layout ? ' (placement)' : ''),
          a.values.map((v) => v.figma).join(' · '),
          a.values
            .map((v) => {
              const css = (v.css ?? []).filter((c) => !c.includes('data-preview-state'))
              return `${v.code}: ${css.length ? css.map(code).join(' or ') : '(default)'}`
            })
            .join('; '),
        ]),
      ),
    )
  }

  // Parts
  out.push('**Parts**\n')
  out.push(
    table(
      ['Part', 'Base UI', 'Figma layer', 'CSS class', 'Description'],
      spec.parts.map((p) => [
        p.id,
        p.baseUi ? code(p.baseUi) : '—',
        [p.figma].flat().map((l) => code(l || '(variant)')).join(', ') || '(code only)',
        p.instanceOf ? `instance of ${p.instanceOf}` : code(`.${partClass(spec, p.element ?? p.id)}${p.element ? (p.pseudo ?? '') : ''}`),
        p.description ?? '',
      ]),
    ),
  )

  // Figma properties
  if (spec.figmaProps?.length) {
    out.push('**Figma properties** (set on an instance instead of detaching it)\n')
    out.push(
      table(
        ['Property', 'Kind', 'Default / suggested', 'In code'],
        spec.figmaProps.map((p) => [
          p.name,
          { slot: 'Slot', boolean: 'Boolean', text: 'Text', expose: 'Nested instance' }[p.kind],
          p.kind === 'slot' ? (p.preferred ?? []).join(', ') || 'any content' : p.kind === 'boolean' ? (p.default ? 'On' : 'Off') : p.kind === 'text' ? p.default : 'its own properties show here',
          p.code ? code(p.code) : '—',
        ]),
      ),
    )
  }

  // Tokens
  const used = tokensUsed(spec)
  const sem = used.filter((t) => SEMANTIC.has(t))
  const comp = used.filter((t) => !SEMANTIC.has(t) && !isPrimitive(t))
  const prim = used.filter(isPrimitive)
  const overrides = [...new Set(spec.bindings.flatMap((b) => (b.override ? [b.override.token] : [])))]
  out.push('**Tokens**\n')
  const lines = [`Semantic: ${sem.map(code).join(', ') || '—'}`]
  if (comp.length) lines.push(`Component tokens bound directly: ${comp.map(code).join(', ')}`)
  if (prim.length) lines.push(`Primitive keywords: ${prim.map(code).join(', ')}`)
  if (overrides.length) lines.push(`Override tokens (configurator; each aliases the semantic token it replaces): ${overrides.map(code).join(', ')}`)
  out.push(bullets(lines))
  return out.join('\n')
}

function moduleSection(mod: Module): string {
  const out: string[] = [`### ${moduleHeading(mod)}\n`]
  const exported = publicExports(mod)
  out.push('```tsx\n' + importLine(mod, exported.map((d) => d.name)) + '\n```\n')
  out.push(`Source: [${mod.path}.tsx](../../${mod.path}.tsx)\n`)
  for (const d of exported) {
    const doc = withoutStyles(flat(d.doc))
    if (mod.compounds[d.name]) {
      out.push(`**${code(d.name)}**${doc ? `: ${doc}` : ''}\n`)
      const rows = mod.compounds[d.name].map(([key, value, kind]) => {
        const local = mod.decls.find((x) => x.name === value)
        if (kind === 'ref') return [code(`${d.name}.${key}`), `The same component as ${code(value)}`, '']
        if (!local) return [code(`${d.name}.${key}`), `Base UI ${code(value)} as is${/^[A-Z]/.test(key) ? ' (no styles of its own)' : ''}`, '']
        return [code(`${d.name}.${key}`), flat(local.doc) || '—', propsOf(mod, local)]
      })
      out.push(table(['Part', 'What it is', 'Props (default)'], rows))
    } else {
      out.push(`**${code(d.name)}**${doc ? `: ${doc}` : ''}\n`)
      const p = propsOf(mod, d)
      if (p) out.push(`Props: ${p}\n`)
    }
  }
  return out.join('\n')
}

/** Props a wrapper declares (with defaults and docs), then the Base UI props it passes through. */
function propsOf(mod: Module, d: Decl): string {
  const members = interfaceMembers(mod, propsTypeName(d))
  const ps = params(d).filter((p) => p.name !== 'className' && p.name !== 'style' && p.name !== 'data-preview-state')
  const names = [...new Set([...ps.map((p) => p.name), ...members.map((m) => m.name)])].filter((n) => !['className', 'style', 'data-preview-state'].includes(n))
  const parts = names.map((n) => {
    const p = ps.find((x) => x.name === n)
    const m = members.find((x) => x.name === n)
    const def = p ? defaultOf(d, p) : {}
    const bits = [code(n)]
    if (m?.type) bits.push(`: ${code(m.type)}`)
    if (def.value) bits.push(` = ${code(def.value.length > 40 ? '…' : def.value)}`)
    if (m?.doc) bits.push(` (${m.doc.replace(/\.$/, '')})`)
    return bits.join('')
  })
  const base = baseUiProps(mod, d)
  if (base.length) parts.push(`+ ${base.join(', ')} props`)
  return parts.join('; ')
}

function componentsMd(): string {
  const out: string[] = []
  out.push(`<!-- ${HEADER} -->\n`)
  out.push('# Components\n')
  out.push(
    `Every component of the design system, in catalog order (${ordered.length} components in ${Object.keys(CATEGORIES).length} categories). ` +
      'Each one is a React wrapper around Base UI, styled by semantic tokens, with a matching Figma component set. ' +
      'Use the wrappers; see [rules.md](rules.md) and [tokens.md](tokens.md). Import paths are from the repo root: write them relative to your file.\n',
  )
  out.push('How to read a section:\n')
  out.push(
    bullets([
      '**Props (variant axes)**: the Figma variant properties that are React props. Values are the allowed literals; Figma shows them as the names after the colon.',
      '**States**: Figma variants that Base UI drives at runtime (hover, focus, checked, open…). Never set them yourself: use Base UI props (`disabled`, `checked`, `defaultValue`, Field `invalid`…).',
      '**Parts**: the anatomy. Part ↔ Base UI part ↔ Figma layer ↔ CSS class.',
      '**Figma properties**: slots, booleans and texts on the Figma component, and what they are in code (a prop, `children` or a sub-component).',
      '**Tokens**: the semantic tokens the component is bound to (in Figma and in code), and the override tokens a theme may set for it.',
    ]),
  )
  out.push('## Catalog\n')
  for (const [cat, names] of Object.entries(CATEGORIES)) out.push(`- **${cat}**: ${names.map((n) => `[${n}](#${anchor(n)})`).join(', ')}`)
  out.push('')
  for (const [cat, names] of Object.entries(CATEGORIES)) {
    out.push(`## ${cat}\n`)
    for (const n of names) out.push(componentSection(ordered.find((s) => s.name === n)!))
  }
  out.push('## Utilities (no spec)\n')
  out.push('Base UI utilities without styles of their own. Use them as Base UI documents them (`@base-ui/react`); their Storybook pages are under Base UI / Utils.\n')
  out.push(bullets(UTILITIES.map((u) => `**${u.name}**: ${u.what} Docs: [stories/base-ui/docs/${u.slug}.md](../../stories/base-ui/docs/${u.slug}.md)`)))
  out.push('## React modules\n')
  out.push('What each wrapper file exports, and the props each part declares. Parts marked "Base UI as is" are re-exported unstyled Base UI parts (roots, groups): use them through the wrapper export, not from `@base-ui/react`.\n')
  for (const m of specModules) out.push(moduleSection(m))
  if (codeOnlyModules.length) {
    out.push('### Code-only components\n')
    out.push('Wrappers with no spec and no Figma component of their own: they reuse other components’ styles.\n')
    for (const m of codeOnlyModules) out.push(moduleSection(m).replace(/^### /, '#### '))
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}

/* ---------------------------------------------------------------- tokens.md */

const TIERS: [string, string, string][] = [
  ['color/background', 'Color · background', 'Fills of surfaces and controls.'],
  ['color/foreground', 'Color · foreground', 'Text and icons.'],
  ['color/border', 'Color · border', 'Strokes and borders.'],
  ['color/shadow', 'Color · shadow', 'Colors of shadows and focus rings (used by the effect styles below).'],
  ['size', 'Size', 'Fixed dimensions: control heights, icon boxes, border widths.'],
  ['space', 'Space', 'Padding and gaps.'],
  ['shape', 'Shape', 'Corner radius.'],
  ['font', 'Font', 'Family, size, line height and weight. Prefer the text styles below over single font tokens.'],
  ['effect', 'Effect', 'Shadow parts, blur, border styles, list and text decoration.'],
  ['motion', 'Motion', 'Durations and easing curves.'],
]

const STATES = new Set(['default', 'hover', 'pressed', 'selected', 'disabled', 'visited'])

function tokenRows(prefix: string): string[][] {
  const keys = sortTokens(Object.keys(LIGHT).filter((k) => k === prefix || k.startsWith(prefix + '/')))
  const isColor = prefix.startsWith('color/')
  return keys.map((k) => {
    const used = USED_BY.get(k) ?? []
    const row = [code(k), code(figmaTokenToCssVar(k)), code(LIGHT[k])]
    if (isColor) row.push(code(DARK[k]))
    row.push(used.length ? used.join(', ') : '—')
    return row
  })
}

function tokensMd(): string {
  const colors = Object.keys(LIGHT).filter((k) => k.startsWith('color/'))
  const seg = (i: number) => sortTokens(new Set(colors.map((k) => k.split('/')[i]).filter((x): x is string => !!x)))
  const roles = seg(2)
  const later = sortTokens(new Set(colors.flatMap((k) => k.split('/').slice(3))))
  const prominence = later.filter((x) => !STATES.has(x))
  const states = later.filter((x) => STATES.has(x))
  const out: string[] = []
  out.push(`<!-- ${HEADER} -->\n`)
  out.push('# Design tokens\n')
  out.push(
    `The semantic token vocabulary (${Object.keys(LIGHT).length} variables, ${EFFECT_STYLES.length} shadow styles, ${TEXT_STYLES.length} text styles). ` +
      'Names are identical in Figma and code; the naming source of truth is `docs/Tokens-semantic-v2.xlsx`. Values here are the default theme (no brand).\n',
  )
  out.push('## Rules\n')
  out.push(
    bullets([
      '**Components use semantic tokens, never primitives.** Primitives (`scale/*`, `opacity/*`, `colors/*`) are building blocks of the semantic layer; the only one a spec binds directly is the keyword `colors/transparent`.',
      '**Component tokens exist only as overrides.** A component token (`button/space-x/md`) is created when a theme changes one component, and it aliases a semantic token. Never invent component tokens to style new UI.',
      '**Light / Dark only change color.** Size, space, shape, font, effect and motion tokens have one value for every mode. Brands (' +
        Object.values(BRANDS)
          .map((b) => b.name)
          .join(', ') +
        ') override a subset of tokens, color and non-color (see [Brands](#brands)).',
      '**Pick by job, not by value.** Two tokens with the same value today (`shape/radius/sm`, `shape/radius/md`) can diverge in another theme. Choose the one whose name describes what the element is.',
    ]),
  )
  out.push('## Using tokens in code\n')
  out.push(
    bullets([
      'CSS custom property: the path with `/` → `-`, prefixed with `--`: `color/background/neutral/primary` → `var(--color-background-neutral-primary)`. In TypeScript, `figmaTokenVar()` (`stories/base-ui/tokens/figma-css-var.ts`).',
      'Load `stories/base-ui/tokens/figma-semantic.css` once (generated from Figma). Colors resolve inside `.theme-scope[data-appearance="light"|"dark"]`, brands with `data-brand="<brand>"`. Put them on `<html>` so portalled popups inherit the theme.',
      'Typography: apply a text style through its four font tokens (family, size, line height, weight), as listed in [Text styles](#text-styles).',
      'Shadows: use the composite shadow styles (`var(--effect-shadow-elevation-low)`), not their parts.',
    ]),
  )
  out.push('## Naming grammar\n')
  out.push('`tier / aspect / role / prominence / state`. Not every token has every segment; segments are dropped from the right.\n')
  out.push(
    table(
      ['Segment', 'Meaning', 'Words in use'],
      [
        ['tier', 'The kind of value', TIERS.map(([p]) => p.split('/')[0]).filter((x, i, a) => a.indexOf(x) === i).map(code).join(' ')],
        ['aspect', 'What it paints (color) or measures (font, effect…)', seg(1).map(code).join(' ')],
        ['role', 'The job of the element', roles.map(code).join(' ')],
        ['prominence', 'Emphasis or step within the role', prominence.map(code).join(' ')],
        ['state', 'Interaction state (interactive roles only)', states.map(code).join(' ')],
      ],
    ),
  )
  out.push(
    'Examples: `color/background/interactive/primary/hover` (tier color, aspect background, role interactive, prominence primary, state hover); `color/foreground/neutral/secondary`; `color/border/error`. ' +
      '`on-<role>` foregrounds go on top of that role’s background (`color/foreground/on-interactive/primary` on `color/background/interactive/primary/*`). ' +
      'Size, space and shape use t-shirt steps (`2xs` … `3xl`); font tokens are `font/<aspect>/<role>/<step>` (`font/size/body/md`).\n',
  )
  for (const [prefix, title, what] of TIERS) {
    out.push(`## ${title}\n`)
    out.push(`${what}\n`)
    const isColor = prefix.startsWith('color/')
    out.push(table(['Token', 'CSS', isColor ? 'Light' : 'Value', ...(isColor ? ['Dark'] : []), 'Used by'], tokenRows(prefix)))
    if (prefix === 'font') {
      out.push('### Text styles\n')
      out.push('Figma text styles, each bound to four font tokens. Components bind these (`text-style`), not single font tokens.\n')
      const usedBy = new Map<string, Set<string>>()
      for (const s of ordered)
        for (const b of s.bindings) if (b.property === 'text-style') for (const v of bindingCombos(s, b)) usedBy.set(valueOf(b, v), (usedBy.get(valueOf(b, v)) ?? new Set()).add(s.name))
      out.push(
        table(
          ['Style', 'Family', 'Size', 'Line height', 'Weight', 'Used by'],
          TEXT_STYLES.map((t) => [t.name, code(t.fontFamily), code(t.fontSize), code(t.lineHeight), code(t.fontWeight), [...(usedBy.get(t.name) ?? [])].join(', ') || '—']),
        ),
      )
    }
    if (prefix === 'effect') {
      out.push('### Shadow styles\n')
      out.push('Composite shadows (Figma effect styles). In code each is one custom property built from its parts and its `color/shadow/*` color.\n')
      out.push(table(['Style token', 'CSS', 'Used by'], EFFECT_STYLES.map((e) => [code(e.token), code(`var(${figmaTokenToCssVar(e.token)})`), (USED_BY.get(e.token) ?? []).join(', ') || '—'])))
    }
  }
  out.push('## Brands\n')
  out.push(
    table(
      ['Brand', 'Attribute', 'Overrides'],
      Object.entries(BRANDS).map(([id, b]) => {
        const changed = sortTokens(new Set(Object.keys(LIGHT).filter((k) => (b.light[k] ?? LIGHT[k]) !== LIGHT[k] || (b.dark[k] ?? DARK[k]) !== DARK[k])))
        const groups = sortTokens(new Set(changed.map((k) => k.split('/').slice(0, k.startsWith('color/') ? 3 : 1).join('/') + '/*')))
        return [b.name, code(`data-brand="${id}"`), `${changed.length} tokens: ${groups.map(code).join(', ')}`]
      }),
    ),
  )
  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}

/* ----------------------------------------------------------------- rules.md */

function rulesMd(): string {
  return `<!-- ${HEADER} -->

# Rules for AI agents

Short rules for building UI with this design system. Details: [components.md](components.md) (what to use, props, parts) and [tokens.md](tokens.md) (token vocabulary).

## Build UI

Do:

- Pick components from [components.md](components.md) by their **Use it** / **Don't** notes. Check the catalog before writing a new one: there are ${ordered.length}.
- Import the wrappers from \`${COMPONENTS_DIR}/<folder>/<Name>.tsx\` (e.g. \`import { Button } from '${COMPONENTS_DIR}/button/Button'\`). They add the design system's classes, data attributes and tokens to Base UI.
- Set variants with the props listed under **Props (variant axes)**: \`variant\`, \`size\`, \`destructive\`…. Leave states (hover, focus, checked, open, invalid) to Base UI: pass \`disabled\`, \`checked\` / \`defaultChecked\`, \`value\` / \`defaultValue\`, Field \`invalid\`.
- Wrap form controls in \`Field\` for label, description and error. Groups (\`Field\`, \`Fieldset\`, \`RadioGroup\`, \`CheckboxGroup\`, \`Tabs.Root\`) pass their \`size\` to the controls inside.
- Give icon-only actions an \`IconButton\` with a \`label\`. Icons come from \`@phosphor-icons/react\` with \`weight="fill"\` (Check, Minus, Plus and X: \`weight="bold"\`).
- Style your own layout (page grids, gaps between components, custom surfaces) with semantic tokens: \`var(--space-md)\`, \`var(--color-background-neutral-secondary)\`, \`var(--shape-radius-md)\`.
- Load \`stories/base-ui/tokens/figma-semantic.css\` once; put \`class="theme-scope" data-appearance="light"\` (or \`"dark"\`, plus an optional \`data-brand\`) on \`<html>\`.

Don't:

- Don't render raw Base UI parts (\`@base-ui/react/*\`) with ad-hoc classes or styles when a wrapper exists. Use unstyled Base UI directly only for the utilities (mergeProps, useRender, Direction Provider, CSP Provider).
- Don't hard-code colors, sizes, spacing, radii, fonts, shadows or durations (\`#fff\`, \`12px\`, \`rgba(…)\`, \`300ms\`). Use a semantic token; if none fits, ask for one.
- Don't use primitives (\`scale/*\`, \`opacity/*\`, \`colors/*\`) or the legacy \`--ds-*\` variables in new code.
- Don't restyle a component through \`className\` or \`style\`. A different look is a variant (a prop), a theme override (configurator) or a spec change.
- Don't set \`data-*\` state attributes or \`data-preview-state\` yourself: they are for static previews in docs.
- Don't use \`*Preview\` exports in product UI: they draw a component statically for docs and the configurator.

## Change the system

- **Edit specs, not generated files.** Never hand-edit \`*.tokens.css\`, \`stories/base-ui/spec/anatomy.generated.json\`, \`stories/base-ui/tokens/figma-semantic.css\`, \`llms.txt\` or \`docs/ai/*\`.
- **Change a component**: edit \`${COMPONENTS_DIR}/<folder>/<slug>.spec.ts\`, then \`npm run ds:generate\` and \`npm run ds:ai-docs\`.
- **Add a token**: name it per \`docs/Tokens-semantic-v2.xlsx\` (grammar in [tokens.md](tokens.md#naming-grammar)), add it to the Figma \`semantic\` collection, then \`npm run figma:sync-semantics\`.
- **Add a component** (full steps: [docs §2a.3](../DESIGN_TOKENS_AND_FIGMA_SYNC.md#2a3-adding-a-component)):
  1. Write \`<slug>.spec.ts\` and add it to \`SPECS\` (\`stories/base-ui/spec/index.ts\`). Missing semantic roles go into Figma first.
  2. Write the Figma build file (\`scripts/ds/figma/<slug>.build.js\`), build it (\`npm run ds:figma-build -- <Name>\`), refresh the anatomy and run \`npm run ds:parity\` until it passes.
  3. \`npm run ds:generate\`; write \`<Name>.tsx\` (Base UI parts + \`ds-*\` classes + \`data-*\` attributes), \`<slug>.css\` (layout only: no colors or sizes), stories (\`Default\`, \`Matrix\`) and \`<Name>.mdx\`.
  4. Add a specimen (\`${COMPONENTS_DIR}/specimens.tsx\`) and a configurator tile (\`semantic-editor/src/showcase/registry.tsx\`).
  5. Give it a category in \`stories/base-ui/spec/categories.ts\`, then \`npm run ds:figma-docs -- <Name>\` and \`npm run ds:ai-docs\`.
- **Check before you finish**: \`npm test\` (every story, with accessibility checks), \`npm run ds:generate -- --check\`, \`npm run ds:ai-docs -- --check\`.
`
}

/* ------------------------------------------------------------------ llms.txt */

function llmsTxt(): string {
  const out: string[] = []
  out.push('# Nagarro DS Starter Pack\n')
  out.push(
    `> A design system for client projects: every Base UI component as a React wrapper and a matching Figma component, on one semantic token system (same names in Figma and code). Each component is described once, in a spec; code, Figma, the configurator and these docs are generated from it. ${ordered.length} components, ${Object.keys(LIGHT).length} semantic variables.\n`,
  )
  out.push(`${HEADER} Before building UI with this system, read the rules, then look components and tokens up instead of guessing.\n`)
  out.push('## Docs\n')
  out.push(
    bullets([
      '[Rules for AI agents](docs/ai/rules.md): do / don\'t when building UI, and how to change the system',
      '[Components](docs/ai/components.md): every component in catalog order, with usage, code import, props, states, parts, Figma properties and tokens',
      '[Design tokens](docs/ai/tokens.md): the semantic token vocabulary, naming grammar, text and shadow styles',
    ]),
  )
  out.push('## Components\n')
  out.push(bullets(ordered.map((s) => `[${s.name}](docs/ai/components.md#${anchor(s.name)}): ${s.docs.summary}`)))
  out.push('## Source\n')
  out.push(
    bullets([
      `[Component wrappers](${COMPONENTS_DIR}/): one folder per component (React wrapper, spec, layout CSS, generated token CSS)`,
      '[Spec types](stories/base-ui/spec/types.ts): what a component spec holds (axes, parts, bindings, Figma properties, docs)',
      '[All specs](stories/base-ui/spec/index.ts): the list every generator reads',
      '[Categories](stories/base-ui/spec/categories.ts): catalog order and categories',
      '[Semantic tokens CSS](stories/base-ui/tokens/figma-semantic.css): the token custom properties, per mode and brand',
    ]),
  )
  out.push('## Optional\n')
  out.push(
    bullets([
      '[README](README.md): what the starter pack is, quick start, layout',
      '[Design tokens and Figma sync](docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md): the full reference (token model, specs, configurator, Figma sync)',
    ]),
  )
  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}

/* ------------------------------------------------------------------- write */

write(resolve(root, 'llms.txt'), llmsTxt())
write(resolve(root, 'docs/ai/components.md'), componentsMd())
write(resolve(root, 'docs/ai/tokens.md'), tokensMd())
write(resolve(root, 'docs/ai/rules.md'), rulesMd())

if (check && stale.length) {
  console.error(`Out of date (run npm run ds:ai-docs):\n  ${stale.join('\n  ')}`)
  process.exit(1)
}
if (!check) console.log('specs → AI docs up to date')
