/**
 * Specs → Figma Code Connect, so Dev Mode shows the React code for an instance: variant axes become
 * props, figmaProps become text / boolean / slot props. Figma node ids (and each set's own text
 * layers) come from stories/base-ui/spec/figma-nodes.json.
 *
 * Two files per component, next to it:
 * - <slug>.figma.tsx: written here, in the React format, so `tsc` checks every prop against the
 *   component (a wrong prop name or value is a type error);
 * - <slug>.figma.js: the template Figma publishes, converted from it by `figma connect migrate`
 *   (Code Connect v2 only publishes templates). figma.config.json points at these.
 *
 * Also written: stories/base-ui/components/index.ts, every connected component as one import (the
 * package's entry point), and figma.migrate.config.json, which makes the snippets import from the
 * package name in package.json (`import { Button } from 'nagarro-ds-starter-pack'`), so a client
 * project that renames its package gets its own name in Dev Mode.
 *
 *   npm run ds:code-connect            write all of it
 *   npm run ds:code-connect -- --check fail if any written file is out of date (CI)
 *
 * Publishing (a Figma token with Code Connect write scope; Organization or Enterprise plan):
 *   npx figma connect publish
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SPECS, type ComponentSpec } from '../../stories/base-ui/spec'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const check = process.argv.includes('--check')
const nodes = JSON.parse(readFileSync(join(root, 'stories/base-ui/spec/figma-nodes.json'), 'utf8')) as { fileKey: string; nodes: Record<string, { id: string; text: string[] }> }

/**
 * Where a spec's component lives in code, when it isn't `export function <Name>` in its folder:
 * sub-parts of compound components, the visible part of popups, and parts used through another
 * component.
 */
const CODE: Record<string, { jsx: string; import: string; from?: string }> = {
  'Menu Item': { jsx: 'Menu.Item', import: 'Menu' },
  'Menu Group Label': { jsx: 'Menu.GroupLabel', import: 'Menu' },
  'Menu Separator': { jsx: 'Menu.Separator', import: 'Menu' },
  Menu: { jsx: 'Menu.Popup', import: 'Menu' },
  Tab: { jsx: 'Tabs.Tab', import: 'Tabs' },
  Tabs: { jsx: 'Tabs.Root', import: 'Tabs' },
  'Accordion Item': { jsx: 'Accordion.Item', import: 'Accordion' },
  Accordion: { jsx: 'Accordion.Root', import: 'Accordion' },
  'Menubar Item': { jsx: 'Menubar.Trigger', import: 'Menubar' },
  Menubar: { jsx: 'Menubar.Root', import: 'Menubar' },
  'Navigation Menu Link': { jsx: 'NavigationMenu.Card', import: 'NavigationMenu' },
  'Navigation Menu': { jsx: 'NavigationMenu.Root', import: 'NavigationMenu' },
  Option: { jsx: 'Select.Item', import: 'Select', from: '../select/Select' },
  Select: { jsx: 'Select.Trigger', import: 'Select' },
  Combobox: { jsx: 'Combobox.Input', import: 'Combobox' },
  'OTP Field': { jsx: 'OtpField', import: 'OtpField' },
  Dialog: { jsx: 'Dialog.Popup', import: 'Dialog' },
  'Alert Dialog': { jsx: 'AlertDialog.Popup', import: 'AlertDialog' },
  Drawer: { jsx: 'Drawer.Popup', import: 'Drawer' },
  Popover: { jsx: 'Popover.Popup', import: 'Popover' },
  Tooltip: { jsx: 'Tooltip.Popup', import: 'Tooltip' },
  'Preview Card': { jsx: 'PreviewCard.Popup', import: 'PreviewCard' },
  Toolbar: { jsx: 'Toolbar.Root', import: 'Toolbar' },
}

/** Specs with no Code Connect file, and why: they don't map to one React element. */
const SKIP: Record<string, string> = {
  'OTP Slot': 'one box of OTP Field; code renders the boxes itself',
  Listbox: 'the popup of Select / Combobox; code renders it inside them',
  'Navigation Menu Item': 'is NavigationMenu.Trigger or NavigationMenu.Link depending on Type',
  Toast: 'toasts are created in code with useToastManager().add({ title, description, type })',
  Autocomplete: 'an Input with a Listbox; both have their own Code Connect',
}

/**
 * Per-component adjustments: Figma axes that aren't props in code (Avatar's Type follows from
 * whether there's an image), extra props from Figma properties the specs don't list, and fixed
 * attributes code needs that Figma can't provide (an accessible label, a value).
 */
const TUNE: Record<string, { skipAxes?: string[]; props?: Record<string, string>; attrs?: string; elementAttrs?: Record<string, string> }> = {
  'Icon Button': { props: { icon: "figma.instance('Icon')" }, attrs: 'label="Describe the action"' },
  Toggle: { props: { icon: "figma.instance<any>('Icon')" }, attrs: 'label="Describe the option"' },
  Field: { props: { label: "figma.string('Label')", description: "figma.boolean('Show description', { true: figma.string('Description'), false: undefined })", error: "figma.string('Error')" } },
  Radio: { attrs: 'value="option"' },
  Tab: { skipAxes: ['Size'], attrs: 'value="tab"' },
  'Menu Item': { skipAxes: ['Type'] },
  Avatar: { skipAxes: ['Type'], props: { initials: "figma.string('Initials')" } },
  // Side is set on Drawer.Root, which Dev Mode doesn't show.
  Drawer: { skipAxes: ['Side'] },
  Tabs: { elementAttrs: { 'Tabs.Panel': 'value="tab"' } },
}

/** State axes that are real props in code: Figma option → prop value. Disabled is handled for all. */
const STATE_PROPS: Record<string, Record<string, Record<string, Record<string, string>>>> = {
  Checkbox: { Checked: { checked: { True: 'true', Indeterminate: 'true' }, indeterminate: { Indeterminate: 'true' } } },
  Switch: { Checked: { checked: { True: 'true', False: 'false' } } },
  Toggle: { Selected: { pressed: { True: 'true', False: 'false' } } },
  Field: { Invalid: { invalid: { True: 'true', False: 'false' } } },
}

const pascal = (name: string) => name.replace(/(^|\s)(\w)/g, (_, __, c: string) => c.toUpperCase()).replace(/\s/g, '')
const camel = (name: string) => pascal(name).replace(/^./, (c) => c.toLowerCase())
const literal = (code: string) => (code === 'true' || code === 'false' || /^-?\d+(\.\d+)?$/.test(code) ? code : `'${code}'`)
const isIdent = (s?: string) => !!s && /^[a-z][A-Za-z]*$/.test(s)
/** A figmaProp whose code is one child element: '<Dialog.Title>'. */
const tagOf = (code?: string) => code?.match(/^<([A-Z][\w.]*)>$/)?.[1]

function locate(spec: ComponentSpec): { jsx: string; import: string; file: string } | undefined {
  const dir = join(root, 'stories/base-ui/components', spec.dir ?? spec.slug)
  const override = CODE[spec.name]
  if (override?.from) return { jsx: override.jsx, import: override.import, file: override.from }
  const want = override?.import ?? pascal(spec.name)
  for (const f of readdirSync(dir).filter((f) => /^[A-Z].*\.tsx$/.test(f))) {
    const src = readFileSync(join(dir, f), 'utf8')
    if (new RegExp(`export (function|const) ${want}\\b`).test(src)) return { jsx: override?.jsx ?? want, import: want, file: `./${f.replace(/\.tsx$/, '')}` }
  }
  return undefined
}

function render(spec: ComponentSpec, at: { jsx: string; import: string; file: string }, nodeId: string): string {
  const tune = TUNE[spec.name] ?? {}
  const props: string[] = []
  const attrs: string[] = []
  /** Child elements, in Figma order: '<Dialog.Title>{title}</Dialog.Title>'. */
  const elements: string[] = []
  let children: string | undefined
  const add = (name: string, expr: string, attr = true) => {
    props.push(`    ${name}: ${expr},`)
    if (attr) attrs.push(name)
  }

  for (const axis of spec.axes) {
    if (tune.skipAxes?.includes(axis.figma)) continue
    if (axis.kind === 'prop') {
      add(axis.prop ?? axis.id, `figma.enum('${axis.figma}', { ${axis.values.map((v) => `'${v.figma}': ${literal(v.code)}`).join(', ')} })`)
      continue
    }
    const disabled = axis.values.find((v) => v.code === 'disabled')
    if (disabled) add('disabled', `figma.enum('${axis.figma}', { '${disabled.figma}': true })`)
    for (const [prop, map] of Object.entries(STATE_PROPS[spec.name]?.[axis.figma] ?? {})) {
      add(prop, `figma.enum('${axis.figma}', { ${Object.entries(map).map(([k, v]) => `'${k}': ${v}`).join(', ')} })`)
    }
  }
  for (const [name, expr] of Object.entries(tune.props ?? {})) add(name, expr)

  const figmaProps = spec.figmaProps ?? []
  const texts = figmaProps.filter((p) => p.kind === 'text')
  /** "Show label" + a "Label" text property: the text while shown, else nothing. */
  const shown = (p: { name: string }) => texts.find((t) => !t.code && p.name.toLowerCase() === `show ${t.name.toLowerCase()}`)
  const el = (tag: string, value: string) => {
    const extra = tune.elementAttrs?.[tag]
    elements.push(`<${tag}${extra ? ` ${extra}` : ''}>{${value}}</${tag}>`)
  }
  const slotTags = new Set(figmaProps.flatMap((p) => (p.kind === 'slot' && tagOf(p.code) ? [tagOf(p.code)] : [])))
  for (const p of figmaProps) {
    const tag = tagOf(p.code)
    if (p.kind === 'text' && p.code === 'children') {
      add('children', `figma.string('${p.name}')`, false)
      children = 'children'
    } else if (p.kind === 'text' && isIdent(p.code)) {
      add(p.code!, `figma.string('${p.name}')`)
    } else if (p.kind === 'text' && tag) {
      add(camel(p.name), `figma.string('${p.name}')`, false)
      el(tag, camel(p.name))
    } else if (p.kind === 'boolean' && isIdent(p.code)) {
      const text = shown(p)
      add(p.code!, text ? `figma.boolean('${p.name}', { true: figma.string('${text.name}'), false: undefined })` : `figma.boolean('${p.name}')`)
    } else if (p.kind === 'boolean' && tag && shown(p)) {
      const text = shown(p)!
      add(camel(text.name), `figma.boolean('${p.name}', { true: figma.string('${text.name}'), false: undefined })`, false)
      el(tag, camel(text.name))
    } else if (p.kind === 'slot' && p.code === 'children') {
      add('children', `figma.slot('${p.name}')`, false)
      children = 'children'
    } else if (p.kind === 'slot' && tag && slotTags.has(tag)) {
      add(camel(p.name), `figma.slot('${p.name}')`, false)
      el(tag, camel(p.name))
    }
  }

  // The component's own "label" text layer is the children when nothing else names it.
  if (!children && !elements.length && !attrs.includes('label') && nodes.nodes[spec.name]?.text.includes('label')) {
    add('children', "figma.textContent('label')", false)
    children = 'children'
  }

  const vars = [...attrs, ...props.map((l) => l.trim().split(':')[0]).filter((n) => !attrs.includes(n))]
  const open = `<${at.jsx}${attrs.map((a) => ` ${a}={${a}}`).join('')}${tune.attrs ? ` ${tune.attrs}` : ''}`
  const inner = [...elements, ...(children ? ['{children}'] : [])]
  const example = inner.length
    ? inner.length === 1 && !elements.length
      ? `${open}>{children}</${at.jsx}>`
      : `(\n    ${open}>\n${inner.map((e) => `      ${e}`).join('\n')}\n    </${at.jsx}>\n  )`
    : `${open} />`
  // Child elements of other components from the same file (Form's <FormActions>).
  const imports = [...new Set([at.import, ...elements.map((e) => e.match(/^<([A-Z]\w*)/)![1])])]
  const url = `https://www.figma.com/design/${nodes.fileKey}/?node-id=${nodeId.replace(':', '-')}`

  return `/* Generated from ${spec.slug}.spec.ts by \`npm run ds:code-connect\`. Do not edit. */
import figma from '@figma/code-connect'

import { ${imports.join(', ')} } from '${at.file}'

figma.connect(${at.jsx}, '${url}', {
  props: {
${props.join('\n')}
  },
  example: (${vars.length ? `{ ${vars.join(', ')} }` : ''}) => ${example},
})
`
}

let stale = 0
const missing: string[] = []
/** Entry point exports: component name → its module, relative to stories/base-ui/components. */
const exportsByName = new Map<string, string>()
for (const spec of SPECS) {
  if (SKIP[spec.name]) continue
  const nodeId = nodes.nodes[spec.name]?.id
  const at = locate(spec)
  if (!nodeId || !at) {
    missing.push(`${spec.name}${nodeId ? '' : ' (no Figma node id)'}${at ? '' : ' (no component in code)'}`)
    continue
  }
  const dir = join(root, 'stories/base-ui/components', spec.dir ?? spec.slug)
  const text = render(spec, at, nodeId)
  // Every name the snippet imports (Form's <FormActions> too) must come from the entry point.
  const names = text.match(/^import \{ (.+) \} from '\.{1,2}\//m)?.[1].split(', ') ?? [at.import]
  for (const name of names) exportsByName.set(name, './' + relative(join(root, 'stories/base-ui/components'), join(dir, at.file)))
  emit(join(dir, `${spec.slug}.figma.tsx`), text)
}

/** Writes a file, or with --check reports it when it differs. */
function emit(file: string, text: string) {
  if (existsSync(file) && readFileSync(file, 'utf8') === text) return
  if (check) {
    console.error(`out of date: ${file.slice(root.length + 1)}`)
    stale++
  } else writeFileSync(file, text)
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { name: string }
emit(
  join(root, 'stories/base-ui/components/index.ts'),
  `/* Generated by \`npm run ds:code-connect\` from the specs. Do not edit. */
/** Every component Code Connect shows, as one import: \`import { Button } from '${pkg.name}'\`. */
${[...exportsByName].sort(([a], [b]) => a.localeCompare(b)).map(([name, from]) => `export { ${name} } from '${from}'`).join('\n')}
`,
)
emit(
  join(root, 'figma.migrate.config.json'),
  JSON.stringify({ codeConnect: { parser: 'react', include: ['stories/base-ui/components/**/*.tsx'], label: 'React', importPaths: { 'base-ui/components/*': pkg.name } } }, null, 2) + '\n',
)

// Templates, from every .figma.tsx: a changed package name or import path reaches all of them.
if (!check) {
  const all = SPECS.filter((s) => !SKIP[s.name]).map((s) => join(root, 'stories/base-ui/components', s.dir ?? s.slug, `${s.slug}.figma.tsx`)).filter(existsSync)
  // migrate skips templates that exist: remove them so every one is rewritten.
  for (const f of all) rmSync(f.replace(/\.tsx$/, '.js'), { force: true })
  const r = spawnSync(join(root, 'node_modules/.bin/figma'), ['connect', 'migrate', '--skip-update-check', '--batch', 'none', '--javascript', '-c', 'figma.migrate.config.json', '-f', ...all], { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr)
    process.exit(1)
  }
}

if (missing.length) console.log(`No Code Connect file: ${missing.join(', ')}`)
if (Object.keys(SKIP).length) console.log(`Skipped: ${Object.entries(SKIP).map(([n, why]) => `${n} (${why})`).join(', ')}`)
if (check && stale) {
  console.error(`${stale} file(s) out of date: run npm run ds:code-connect`)
  process.exit(1)
}
console.log(check ? 'Code Connect files are up to date' : `Code Connect: ${SPECS.length - missing.length - Object.keys(SKIP).length} files`)
