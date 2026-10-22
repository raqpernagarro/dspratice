#!/usr/bin/env node
/**
 * build-registry.mjs — read-only registry generator for the two design-system libraries.
 *
 *   node scripts/build-registry.mjs
 *
 * Reads (never writes) the DSN repo (ds-ngr) and the DS Starter Pack repo, then writes inside this app only:
 *   src/library/generated/dsn.json        RegistryEntry[] for DSN
 *   src/library/generated/starter.json    RegistryEntry[] for the Starter Pack
 *   src/library/generated/manifest.json   generatedAt, source paths, counts
 *   src/library/generated/registry.types.ts
 *   docs/coverage-matrix.md
 *   .cache/starter-spec/                  transpiled Starter spec modules (scratch, regenerated every run)
 *
 * No network, no dependencies beyond Node 24 built-ins and the app's `typescript` devDependency.
 * Run `node scripts/check-sources.mjs` afterwards to prove both source repos are untouched.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const started = Date.now()
const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCES = {
  dsn: resolve(APP_ROOT, '..', 'demo tools', 'DSN-main'),
  starter: resolve(APP_ROOT, '..', 'demo tools', 'ds-starter-pack-main'),
}
const OUT_DIR = join(APP_ROOT, 'src', 'library', 'generated')
const DOCS_DIR = join(APP_ROOT, 'docs')
const CACHE_DIR = join(APP_ROOT, '.cache', 'starter-spec')

const DSN_FILE_KEY = '9Lqv0lrj1pRM14NVs4TsSk'
const STARTER_FILE_KEY = '0lCfWZBgpscbrOKQ7iIRi8'

/** Storybook groups DSN uses as its catalogue. Anything else falls back to the atomic tier. */
const DSN_STORY_GROUPS = new Set(['Actions', 'Data Display', 'Feedback', 'Inputs & Controls', 'Layout', 'Navigation', 'Overlays'])
/** Bare-specifier prefixes that make a component heavy (lazy-loaded in the unified tool). */
const HEAVY_DEP_PREFIXES = ['@fullcalendar/', '@lexical/', 'lexical', 'react-zoom-pan-pinch', '@visx/', '@react-spring/', 'styled-components']
/** Components that are heavy by size / behaviour even without a heavy dependency. */
const DSN_HEAVY_BY_NAME = {
  DataTable: 'heavy by size: 27 KB organism composing cells, selection, sorting and pagination',
  Command: 'heavy by size: 21 KB command palette with its own filtering/scoring and keyboard engine',
}
/** Boolean props that describe a state rather than configuration. */
const STATE_BOOLEANS = new Set(['disabled', 'loading', 'error', 'selected', 'checked', 'indeterminate', 'expanded', 'open', 'active', 'pressed', 'readOnly', 'invalid', 'required', 'dragging', 'collapsed', 'busy', 'met', 'optional'])

/** Starter specs that live inside a parent's wrapper and story (the 13 sub-specs) — slug → parent slug + provider. */
const STARTER_SUB_SPECS = {
  'accordion-item': { parent: 'accordion', providerNeeds: ['Accordion.Root'], via: 'Accordion.Item' },
  'breadcrumb-item': { parent: 'breadcrumb', providerNeeds: ['Breadcrumb.Root'], via: 'Breadcrumb.Item' },
  'menu-item': { parent: 'menu', providerNeeds: ['Menu.Root'], via: 'Menu.Item' },
  'menu-group-label': { parent: 'menu', providerNeeds: ['Menu.Root', 'Menu.Group'], via: 'Menu.GroupLabel' },
  'menu-separator': { parent: 'menu', providerNeeds: ['Menu.Root'], via: 'Menu.Separator' },
  'menubar-item': { parent: 'menubar', providerNeeds: ['Menubar.Root'], via: 'Menubar.Trigger' },
  'navigation-menu-item': { parent: 'navigation-menu', providerNeeds: ['NavigationMenu.Root'], via: 'NavigationMenu.Item' },
  'navigation-menu-link': { parent: 'navigation-menu', providerNeeds: ['NavigationMenu.Root'], via: 'NavigationMenu.Link' },
  'otp-slot': { parent: 'otp-field', providerNeeds: ['OtpField'], via: 'OtpField (one slot per character)' },
  tab: { parent: 'tabs', providerNeeds: ['Tabs.Root'], via: 'Tabs.Tab' },
  listbox: { parent: 'select', providerNeeds: ['Select.Root'], via: 'Select.Popup / Combobox.Popup / Autocomplete.Popup (shared ds-listbox popup)' },
  option: { parent: 'listbox', providerNeeds: ['Select.Root'], via: 'Select.Item / Combobox.Item / Autocomplete.Item' },
  radio: { parent: 'radio-group', providerNeeds: ['RadioGroup'], via: 'Radio inside RadioGroup (story lives in RadioGroup.stories.tsx)' },
}

const REGISTRY_KEYS = ['id', 'source', 'sourceName', 'sourceId', 'importPath', 'exportName', 'barrelExport', 'category', 'tier', 'variants', 'props', 'states', 'a11y', 'tokensUsed', 'specPath', 'storyPath', 'testPath', 'docs', 'figma', 'weight', 'dependencies', 'status', 'providerNeeds', 'parent', 'notes']

const warnings = []
const warn = (msg) => warnings.push(msg)

/* ------------------------------------------------------------------ helpers */

const readJSON = (file) => JSON.parse(readFileSync(file, 'utf8'))
const read = (file) => readFileSync(file, 'utf8')
const posix = (p) => p.split(sep).join('/')
const relTo = (root, file) => posix(relative(root, file))
const unique = (arr) => [...new Set(arr)]
const sortStr = (arr) => [...arr].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '_dev') walk(full, out)
    } else if (entry.isFile()) out.push(full)
  }
  return out
}

/** 'OTPInput' → 'otp-input', 'XYLineChart' → 'xy-line-chart', 'DataTableHeaderCell' → 'data-table-header-cell'. */
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase()
const words = (s) => s.replace(/[()]/g, ' ').split(/[\s_\-/]+/).filter(Boolean)
const pascal = (s) => words(s).map((w) => w[0].toUpperCase() + w.slice(1)).join('')
const lettersOnly = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Bare specifiers imported by a file, following relative imports that stay inside `folder`. */
function dependenciesOf(file, folder) {
  const seen = new Set()
  const bare = new Set()
  const visit = (f) => {
    if (seen.has(f) || !existsSync(f)) return
    seen.add(f)
    const src = read(f)
    const specs = []
    for (const m of src.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g)) specs.push(m[1])
    for (const m of src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1])
    for (const spec of specs) {
      if (spec.startsWith('.') || spec.startsWith('/')) {
        if (/\.(css|scss|svg|png|json)$/.test(spec)) continue
        const base = resolve(dirname(f), spec)
        if (!base.startsWith(folder)) continue
        for (const cand of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
          if (existsSync(cand) && statSync(cand).isFile()) { visit(cand); break }
        }
      } else bare.add(spec)
    }
  }
  visit(file)
  return sortStr(bare)
}

const isHeavyDep = (spec) => HEAVY_DEP_PREFIXES.some((p) => spec === p || spec.startsWith(p))

/** Markdown `## ` sections of a spec: heading → body. */
function mdSections(text) {
  const sections = {}
  let current = null
  for (const line of text.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) { current = h[1]; sections[current] = [] } else if (current) sections[current].push(line)
  }
  return Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n').trim()]))
}
const section = (sections, re) => Object.entries(sections).find(([k]) => re.test(k))?.[1]
const bullets = (body) => (body ? body.split('\n').map((l) => l.replace(/^\s*[-*]\s+/, '').trim()).filter((l) => l && !l.startsWith('|') && !l.startsWith('```')) : [])

/** Prop names/types from `export interface <Name>Props { ... }` in a TSX file (fallback when ds-index has no entry). */
function propsFromInterface(src, name) {
  const m = src.match(new RegExp(`export interface ${escapeRe(name)}Props[^{]*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) return []
  const props = []
  for (const line of m[1].split('\n')) {
    const p = line.match(/^\s*'?([\w-]+)'?(\?)?:\s*([^;]+);?\s*$/)
    if (!p || line.trim().startsWith('/') || line.trim().startsWith('*')) continue
    const type = p[3].trim()
    const literal = type.match(/^'[^']*'(\s*\|\s*'[^']*')+$/) ? type.split('|').map((v) => v.trim().replace(/^'|'$/g, '')) : undefined
    props.push({ name: p[1], type, ...(literal ? { values: literal } : {}), required: !p[2] })
  }
  return props
}

/**
 * Story title group from a Storybook story file: `title: 'Actions/Button/Button'` → 'Actions'.
 * Story data also carries `title:` props, so prefer a value whose first segment is a known group,
 * then any slash-separated value.
 */
function storyGroup(file) {
  const titles = [...read(file).matchAll(/title:\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1])
  const groups = titles.filter((t) => t.includes('/')).map((t) => t.split('/')[0].trim())
  return groups.find((g) => DSN_STORY_GROUPS.has(g)) ?? groups[0] ?? null
}

/** Markdown with fenced code blocks removed (so prose extraction never quotes examples). */
const stripFences = (text) => text.replace(/```[\s\S]*?```/g, '')

/* ---------------------------------------------------------------------- DSN */

function buildDsn() {
  const ROOT = SOURCES.dsn
  const pkg = readJSON(join(ROOT, 'package.json'))
  const dsIndex = readJSON(join(ROOT, 'ds-index.json'))
  const figmaSets = readJSON(join(ROOT, 'Design Tokens', 'figma-components.json'))
  const componentMap = readJSON(join(ROOT, 'Design Tokens', 'component-map.json'))
  const barrelSrc = read(join(ROOT, 'src', 'index.ts'))
  const COMPONENTS_DIR = join(ROOT, 'src', 'components')
  const FIGMA_DIR = join(ROOT, 'src', 'figma')

  // Public API: value exports of src/index.ts. Components start uppercase; the rest are hooks/utilities.
  const barrelExports = []
  for (const m of barrelSrc.matchAll(/export\s+\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/).pop()
      if (name) barrelExports.push({ name, from: m[2] })
    }
  }
  const publicComponents = barrelExports.filter((e) => /^[A-Z]/.test(e.name)).map((e) => e.name)
  const nonComponentExports = barrelExports.filter((e) => !/^[A-Z]/.test(e.name)).map((e) => e.name)

  // ds-index: primary source. 'Charts' is a meta entry covering the chart exports, not an export itself.
  const index = dsIndex.components
  const metaEntries = Object.keys(index).filter((k) => !publicComponents.includes(k))
  const indexedPublic = publicComponents.filter((n) => index[n])
  const synthesized = publicComponents.filter((n) => !index[n])

  // Component folders: every directory under atoms/molecules/organisms that holds a `<Dir>.tsx`.
  const componentFolders = []
  for (const tier of ['atoms', 'molecules', 'organisms']) {
    const tierDir = join(COMPONENTS_DIR, tier)
    const dirs = new Set(walk(tierDir).map((f) => dirname(f)))
    for (const d of dirs) if (existsSync(join(d, `${basename(d)}.tsx`))) componentFolders.push(d)
  }
  componentFolders.sort()

  // Figma: set name → code name, mirroring scripts/sync-components.mjs (component-map exceptions first, then convention).
  const codeNames = new Set([...Object.keys(index), ...publicComponents])
  const lastSegment = (name) => name.split('/').pop().trim()
  const matchComponent = (setName) => {
    if (componentMap.components && setName in componentMap.components) return componentMap.components[setName]
    const last = pascal(lastSegment(setName))
    return [last, `${last}Input`, pascal(setName)].find((c) => codeNames.has(c))
  }
  const setsByComponent = new Map()
  const unmatchedSets = []
  for (const [setName, set] of Object.entries(figmaSets.sets)) {
    const code = matchComponent(setName)
    if (code === null) continue // intentionally Figma-only (component-map.json)
    if (!code) { unmatchedSets.push(setName); continue }
    if (!setsByComponent.has(code)) setsByComponent.set(code, [])
    setsByComponent.get(code).push({ setName, nodeId: set.nodeId, props: set.props ?? {} })
  }

  // Code Connect templates: `// component=<Name>` + `// url=...node-id=19-574` headers.
  const codeConnectByComponent = new Map()
  for (const file of walk(FIGMA_DIR).filter((f) => f.endsWith('.figma.ts'))) {
    const src = read(file)
    const comp = src.match(/^\/\/\s*component=(\S+)/m)?.[1]
    const node = src.match(/node-id=(\d+)-(\d+)/)
    if (!comp) continue
    if (!codeConnectByComponent.has(comp)) codeConnectByComponent.set(comp, [])
    codeConnectByComponent.get(comp).push({ path: relTo(ROOT, file), nodeId: node ? `${node[1]}:${node[2]}` : null })
  }

  const allTsx = walk(COMPONENTS_DIR).filter((f) => f.endsWith('.tsx'))
  const implFiles = allTsx.filter((f) => !/\.(stories|test)\.tsx$/.test(f))
  const findImpl = (folder, name) => {
    const re = new RegExp(`export\\s+(?:default\\s+)?(?:function|const|let|class)\\s+${escapeRe(name)}\\b`)
    const inFolder = implFiles.filter((f) => f.startsWith(folder + sep))
    const exact = join(folder, `${name}.tsx`)
    if (existsSync(exact) && re.test(read(exact))) return exact
    return inFolder.find((f) => re.test(read(f))) ?? (existsSync(exact) ? exact : join(folder, `${basename(folder)}.tsx`))
  }
  const findCompanion = (folder, name, suffix) => {
    const exact = join(folder, `${name}${suffix}`)
    if (existsSync(exact)) return { path: exact, own: true }
    const re = new RegExp(`\\b${escapeRe(name)}\\b`)
    const shared = allTsx.filter((f) => f.startsWith(folder + sep) && f.endsWith(suffix)).find((f) => re.test(read(f)))
    return shared ? { path: shared, own: false } : null
  }

  const entries = []
  const idOf = (name) => `dsn:${kebab(name)}`

  for (const name of publicComponents) {
    const ix = index[name]
    const notes = []
    const tierFromFolder = (folder) => ({ atoms: 'atom', molecules: 'molecule', organisms: 'organism' })[relTo(COMPONENTS_DIR, folder).split('/')[0]]
    let folder
    if (ix) folder = join(ROOT, ix.path)
    else {
      folder = dirname(barrelExports.find((e) => e.name === name).from.replace(/^\.\//, '') + '/x')
      folder = join(ROOT, 'src', folder)
      notes.push('not in ds-index.json: entry synthesized from the folder, barrel and TSX props interface')
    }
    const implFile = findImpl(folder, name)
    const implFolder = dirname(implFile)
    const implSrc = read(implFile)
    const indexTier = ix?.tier ?? tierFromFolder(folder)
    const parentName = ix?.parent && publicComponents.includes(ix.parent) ? ix.parent : null
    if (ix?.parent && !parentName) notes.push(`ds-index parent '${ix.parent}' is a meta entry (${ix.parent} family), not an export`)

    // Props / variants
    const props = ix
      ? Object.entries(ix.props ?? {}).map(([pname, p]) => ({ name: pname, type: p.type, ...(p.values ? { values: p.values } : {}), required: !!p.required }))
      : propsFromInterface(implSrc, name)
    const variants = Object.fromEntries(props.filter((p) => p.values?.length).map((p) => [p.name, p.values]))
    const booleanProps = ix?.booleanProps ?? props.filter((p) => p.type === 'boolean').map((p) => p.name)

    // Figma
    const sets = setsByComponent.get(name) ?? []
    const ccFiles = codeConnectByComponent.get(name) ?? []
    const ccExact = ccFiles.find((f) => basename(f.path) === `${name}.figma.ts`)
    const primarySet = sets.find((s) => ccExact && s.nodeId === ccExact.nodeId) ?? sets.find((s) => pascal(lastSegment(s.setName)) === name) ?? sets[0]
    const nodeId = primarySet?.nodeId ?? ccExact?.nodeId ?? ccFiles[0]?.nodeId ?? null
    if (sets.length) notes.push(`Figma set${sets.length > 1 ? 's' : ''}: ${sets.map((s) => `${s.setName} (${s.nodeId})`).join(', ')}`)
    else if (nodeId) notes.push('node id taken from the Code Connect template (no set in figma-components.json)')
    const codeConnectPath = ccExact?.path ?? ccFiles[0]?.path ?? null
    if (!ccExact && ccFiles.length) notes.push(`Code Connect via ${ccFiles.map((f) => basename(f.path)).join(', ')}`)
    const figmaStates = sets.flatMap((s) => s.props?.State?.values ?? []).map((v) => v.toLowerCase())

    // Companion files
    const story = findCompanion(implFolder, name, '.stories.tsx') ?? (folder !== implFolder ? findCompanion(folder, name, '.stories.tsx') : null)
    const test = findCompanion(implFolder, name, '.test.tsx') ?? (folder !== implFolder ? findCompanion(folder, name, '.test.tsx') : null)
    let specFile = ix?.spec && existsSync(join(ROOT, ix.spec)) ? join(ROOT, ix.spec) : null
    if (!specFile && existsSync(join(implFolder, `${name}.spec.md`))) specFile = join(implFolder, `${name}.spec.md`)
    if (!specFile && parentName && index[parentName]?.spec && existsSync(join(ROOT, index[parentName].spec))) {
      specFile = join(ROOT, index[parentName].spec)
      notes.push(`spec shared with parent ${parentName}`)
    }
    if (!specFile) {
      const nameRe = new RegExp(`\\b${escapeRe(name)}\\b`)
      const shared = walk(implFolder).find((f) => f.endsWith('.spec.md') && nameRe.test(read(f)))
      if (shared) { specFile = shared; notes.push(`spec via ${basename(shared)} (no own spec file)`) }
    }
    if (story && !story.own) notes.push(`stories via ${basename(story.path)} (no own story file)`)
    if (test && !test.own) notes.push(`tests via ${basename(test.path)} (no own test file)`)

    // Category from the Storybook group: own/shared story first, else the folder's main story (category only).
    let group = story ? storyGroup(story.path) : null
    if (!group) {
      const folderStory = join(implFolder, `${basename(implFolder)}.stories.tsx`)
      if (existsSync(folderStory) && DSN_STORY_GROUPS.has(storyGroup(folderStory))) {
        group = storyGroup(folderStory)
        notes.push(`category from ${basename(folderStory)} (no story renders ${name})`)
      }
    }
    const category = group && DSN_STORY_GROUPS.has(group) ? group : indexTier
    if (!(group && DSN_STORY_GROUPS.has(group))) warn(`dsn: ${name} has no Storybook group (${story ? `title group '${group}'` : 'no story'}); category = tier '${indexTier}'`)

    // Spec-derived docs
    const sections = specFile ? mdSections(stripFences(read(specFile))) : {}
    const whenToUse = bullets(section(sections, /^when to use$/i)).join('\n') || undefined
    const whenNotToUse = bullets(section(sections, /^when not to use$/i)).join('\n') || undefined
    const mistakes = bullets(section(sections, /^common mistakes$/i)).map((l) => l.replace(/^\d+\.\s*/, '')).map((l) => l.match(/^\*\*(.+?)\*\*/)?.[1] ?? l.split(' — ')[0]).filter(Boolean)
    const composition = (section(sections, /^composition rules$/i) ?? '').split('\n').filter((l) => /❌/.test(l)).map((l) => l.replace(/^\s*[-*]\s*❌\s*/, '').trim())
    const antiPatterns = unique([...mistakes, ...composition])
    const a11ySection = bullets(section(sections, /^accessibility$/i))
    const a11y = a11ySection.length
      ? a11ySection.join('\n')
      : unique(Object.values(sections).flatMap((b) => bullets(b)).filter((l) => /aria-|role=|screen reader|keyboard|focus/i.test(l) && !/^[<`]|^[\w-]+=/.test(l) && l.length > 24)).slice(0, 6).join('\n')

    // Weight / status / provider
    const dependencies = dependenciesOf(implFile, implFolder)
    const heavyDeps = dependencies.filter(isHeavyDep)
    const heavyName = DSN_HEAVY_BY_NAME[name] ?? (parentName && DSN_HEAVY_BY_NAME[parentName] ? `${DSN_HEAVY_BY_NAME[parentName]} (part of ${parentName})` : null)
    const weight = heavyDeps.length || heavyName ? 'heavy' : 'light'
    if (heavyDeps.length) notes.push(`heavy deps: ${unique(heavyDeps.map((d) => d.split('/').slice(0, d.startsWith('@') ? 2 : 1).join('/'))).join(', ')}`)
    else if (heavyName) notes.push(heavyName)

    let providerNeeds = []
    if (parentName === 'Command' && name !== 'CommandDialog') providerNeeds = ['Command']
    if (parentName === 'Carousel') providerNeeds = ['Carousel']
    const isSubPart = providerNeeds.length > 0
    let status = 'rendered'
    if (name === 'AppShell') { status = 'preserved'; notes.push('preserved: expects a 100vh flex host and hard-codes id="dsn-main-content"') }
    else if (isSubPart) { status = 'preserved'; notes.push(`sub-part: must render inside <${providerNeeds[0]}>`) }
    else if (weight === 'heavy') status = 'rendered-lazy'
    const tier = isSubPart ? 'part' : indexTier
    if (tier !== indexTier) notes.push(`ds-index tier: ${indexTier}`)
    const states = sortStr(unique([...figmaStates, ...booleanProps.filter((b) => STATE_BOOLEANS.has(b))]))

    entries.push({
      id: idOf(name),
      source: 'dsn',
      sourceName: name,
      sourceId: name,
      importPath: relTo(ROOT, implFile),
      exportName: name,
      barrelExport: true,
      category,
      tier,
      variants,
      props,
      states,
      a11y,
      tokensUsed: sortStr(unique(ix?.tokens ?? [])),
      specPath: specFile ? relTo(ROOT, specFile) : null,
      storyPath: story ? relTo(ROOT, story.path) : null,
      testPath: test ? relTo(ROOT, test.path) : null,
      docs: { ...(whenToUse ? { whenToUse } : {}), ...(whenNotToUse ? { whenNotToUse } : {}), ...(antiPatterns.length ? { antiPatterns } : {}) },
      figma: { fileKey: DSN_FILE_KEY, nodeId, codeConnect: ccFiles.length > 0, codeConnectPath },
      weight,
      dependencies,
      status,
      providerNeeds,
      parent: parentName ? idOf(parentName) : null,
      notes: unique([ix?.notes, ...notes].filter(Boolean)).join('; '),
    })
  }

  // Every component folder must be represented.
  const uncovered = componentFolders.filter((folder) => !entries.some((e) => join(ROOT, e.importPath).startsWith(folder + sep)))
  if (uncovered.length) throw new Error(`dsn: component folders without a registry entry: ${uncovered.map((f) => relTo(ROOT, f)).join(', ')}`)
  for (const s of unmatchedSets) warn(`dsn: Figma set '${s}' matches no code component (not in component-map.json either)`)

  return {
    entries,
    facts: {
      package: pkg.name,
      version: pkg.version,
      fileKey: DSN_FILE_KEY,
      publicComponents: publicComponents.length,
      dsIndexComponents: indexedPublic.length,
      dsIndexMetaEntries: metaEntries,
      synthesized,
      nonComponentExports,
      componentFolders: componentFolders.length,
      figmaSets: Object.keys(figmaSets.sets).length,
      figmaSetsUnmatched: unmatchedSets,
      codeConnectTemplates: [...codeConnectByComponent.values()].reduce((n, l) => n + l.length, 0),
      specFiles: walk(COMPONENTS_DIR).filter((f) => f.endsWith('.spec.md')).length,
      storyFiles: allTsx.filter((f) => f.endsWith('.stories.tsx')).length,
      testFiles: allTsx.filter((f) => f.endsWith('.test.tsx')).length,
    },
  }
}

/* ------------------------------------------------------------------ Starter */

/** Transpile the Starter's plain-data spec modules into .cache/ so Node can import them (never touches the repo). */
function transpileStarterSpecs(ROOT) {
  const BASE = join(ROOT, 'stories', 'base-ui')
  rmSync(CACHE_DIR, { recursive: true, force: true })
  const files = [
    ...walk(join(BASE, 'spec')),
    ...walk(join(BASE, 'components')).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts')),
    join(BASE, 'tokens', 'figma-css-var.ts'),
    join(BASE, 'tokens', 'figma-text-styles.json'),
  ].filter((f) => /\.(ts|json)$/.test(f) && !/\.test\.ts$/.test(f))
  let count = 0
  for (const file of files) {
    const target = join(CACHE_DIR, relative(BASE, file)).replace(/\.ts$/, '.js')
    mkdirSync(dirname(target), { recursive: true })
    if (file.endsWith('.json')) { writeFileSync(target, read(file)); continue }
    const { outputText, diagnostics } = ts.transpileModule(read(file), {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, isolatedModules: true },
    })
    if (diagnostics?.length) throw new Error(`transpile ${relative(ROOT, file)}: ${diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; ')}`)
    const rewritten = outputText
      .replace(/((?:from|import)\s*\(?\s*['"])(\.[^'"]*)(['"])/g, (m, pre, spec, q) => (/\.(js|mjs|json|css)$/.test(spec) ? m : `${pre}${spec}.js${q}`))
      .replace(/(from\s*['"]\.[^'"]*\.json['"])/g, '$1 with { type: "json" }')
    writeFileSync(target, rewritten)
    count++
  }
  return count
}

async function buildStarter() {
  const ROOT = SOURCES.starter
  const pkg = readJSON(join(ROOT, 'package.json'))
  const BASE = join(ROOT, 'stories', 'base-ui')
  const COMPONENTS_DIR = join(BASE, 'components')
  const figmaNodes = readJSON(join(BASE, 'spec', 'figma-nodes.json'))
  const barrelSrc = read(join(COMPONENTS_DIR, 'index.ts'))
  const barrelNames = new Set()
  for (const m of barrelSrc.matchAll(/export\s+\{([^}]*)\}\s+from/g)) for (const raw of m[1].split(',')) if (raw.trim()) barrelNames.add(raw.trim().split(/\s+as\s+/).pop())

  const transpiled = transpileStarterSpecs(ROOT)
  const specMod = await import(pathToFileURL(join(CACHE_DIR, 'spec', 'index.js')).href)
  const { categoryOf } = await import(pathToFileURL(join(CACHE_DIR, 'spec', 'categories.js')).href)
  const SPECS = specMod.SPECS
  const tokensUsed = specMod.tokensUsed
  const bySlug = new Map(SPECS.map((s) => [s.slug, s]))

  const storyFiles = readdirSync(BASE).filter((f) => f.endsWith('.stories.tsx'))
  const storyFor = (name) => storyFiles.find((f) => lettersOnly(f.replace(/\.stories\.tsx$/, '')) === lettersOnly(name)) ?? null
  const dirs = readdirSync(COMPONENTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'shared').map((d) => d.name)
  const wrapperOf = (dir) => {
    const files = readdirSync(join(COMPONENTS_DIR, dir)).filter((f) => f.endsWith('.tsx') && !/\.(figma|stories)\.tsx$/.test(f))
    if (files.length !== 1) throw new Error(`starter: expected one wrapper in components/${dir}, found ${files.length}`)
    return join(COMPONENTS_DIR, dir, files[0])
  }
  const exportsOf = (src) => [...src.matchAll(/^export\s+(?:function|const)\s+(\w+)/gm)].map((m) => m[1])

  const entries = []
  const idOf = (slug) => `starter:${slug}`

  for (const spec of SPECS) {
    const notes = []
    const dir = spec.dir ?? spec.slug
    const wrapper = wrapperOf(dir)
    const wrapperSrc = read(wrapper)
    const exportName = exportsOf(wrapperSrc).find((n) => lettersOnly(n) === lettersOnly(spec.name)) ?? null
    const sub = STARTER_SUB_SPECS[spec.slug] ?? null
    if (sub && !bySlug.has(sub.parent)) throw new Error(`starter: sub-spec ${spec.slug} points at unknown parent ${sub.parent}`)
    if (!sub && !exportName) warn(`starter: ${spec.name} has no matching export in ${relTo(ROOT, wrapper)}`)

    // Story: own file, else the nearest ancestor's.
    let storyFile = storyFor(spec.name)
    for (let s = sub; !storyFile && s; s = STARTER_SUB_SPECS[s.parent] ?? null) storyFile = storyFor(bySlug.get(s.parent).name)
    if (sub) notes.push(`sub-spec rendered via ${sub.via}${storyFile ? `; stories in ${storyFile}` : ''}`)

    let category
    try { category = categoryOf(spec.name) } catch { category = 'uncategorized'; warn(`starter: ${spec.name} has no category in spec/categories.ts`) }

    const propAxes = spec.axes.filter((a) => a.kind === 'prop')
    const props = [
      ...propAxes.map((a) => ({ name: a.prop ?? a.id, type: a.values.map((v) => `'${v.code}'`).join(' | '), values: a.values.map((v) => v.code), required: false })),
      // figmaProps.code names the React prop (or `children`); skip codes that describe JSX ('<Select.Item>…') rather than a prop.
      ...(spec.figmaProps ?? []).filter((p) => p.code && /^[A-Za-z_$][\w$]*$/.test(p.code) && !propAxes.some((a) => (a.prop ?? a.id) === p.code)).map((p) => ({ name: p.code, type: p.kind === 'boolean' ? 'boolean' : p.kind === 'text' ? 'string' : 'ReactNode', required: false })),
    ]
    const variants = Object.fromEntries(spec.axes.map((a) => [a.id, a.values.map((v) => v.code)]))
    // State axes: interaction states by value; a true/false state axis (checked, selected, open…) is one state named after the axis.
    const isFlag = (a) => a.values.every((v) => v.code === 'true' || v.code === 'false')
    const states = sortStr(unique(spec.axes.filter((a) => a.kind === 'state').flatMap((a) => (isFlag(a) ? [a.id] : a.values.map((v) => v.code)))))

    const figmaFile = join(COMPONENTS_DIR, dir, `${spec.slug}.figma.tsx`)
    const codeConnect = existsSync(figmaFile)
    let nodeId = figmaNodes.nodes[spec.name]?.id ?? null
    if (!nodeId && codeConnect) {
      const m = read(figmaFile).match(/node-id=(\d+)-(\d+)/)
      if (m) { nodeId = `${m[1]}:${m[2]}`; notes.push('node id taken from the Code Connect file (not in spec/figma-nodes.json)') }
    }
    if (!nodeId) warn(`starter: ${spec.name} has no Figma node id (spec/figma-nodes.json)`)

    const dependencies = dependenciesOf(wrapper, join(COMPONENTS_DIR, dir))
    const weight = dependencies.some(isHeavyDep) ? 'heavy' : 'light'
    const providerNeeds = spec.slug === 'toast' ? ['Toast.Provider'] : sub ? sub.providerNeeds : []
    if (spec.slug === 'toast') notes.push('imperative API: Toast.useToastManager().add({ title, type }) inside <Toast.Provider> with one <Toast.Viewport />')
    const status = sub && !exportName ? 'preserved' : weight === 'heavy' ? 'rendered-lazy' : 'rendered'
    const docs = spec.docs ?? {}
    const whenToUse = (docs.usage?.length ? docs.usage : docs.summary ? [docs.summary] : []).join('\n') || undefined
    const whenNotToUse = docs.dont?.join('\n') || undefined

    entries.push({
      id: idOf(spec.slug),
      source: 'starter',
      sourceName: spec.name,
      sourceId: spec.slug,
      importPath: relTo(ROOT, wrapper),
      exportName,
      barrelExport: !!exportName && barrelNames.has(exportName),
      category,
      tier: sub ? 'part' : null,
      variants,
      props,
      states,
      a11y: docs.accessibility?.join('\n') ?? '',
      tokensUsed: tokensUsed(spec),
      specPath: relTo(ROOT, join(COMPONENTS_DIR, dir, `${spec.slug}.spec.ts`)),
      storyPath: storyFile ? relTo(ROOT, join(BASE, storyFile)) : null,
      testPath: null,
      docs: { ...(whenToUse ? { whenToUse } : {}), ...(whenNotToUse ? { whenNotToUse } : {}), ...(docs.dont?.length ? { antiPatterns: docs.dont } : {}) },
      figma: { fileKey: STARTER_FILE_KEY, nodeId, codeConnect, codeConnectPath: codeConnect ? relTo(ROOT, figmaFile) : null },
      weight,
      dependencies,
      status,
      providerNeeds,
      parent: sub ? idOf(sub.parent) : null,
      notes: notes.join('; '),
    })
  }

  // Context Menu: code without spec. Reuses Menu's popup, items and tokens.
  const cmWrapper = wrapperOf('context-menu')
  const menuSpec = bySlug.get('menu')
  entries.push({
    id: idOf('context-menu'),
    source: 'starter',
    sourceName: 'Context Menu',
    sourceId: 'context-menu',
    importPath: relTo(ROOT, cmWrapper),
    exportName: 'ContextMenu',
    barrelExport: barrelNames.has('ContextMenu'),
    category: 'Menus',
    tier: null,
    variants: {},
    props: [],
    states: [],
    a11y: '',
    tokensUsed: menuSpec ? tokensUsed(menuSpec) : [],
    specPath: null,
    storyPath: storyFor('Context Menu') ? relTo(ROOT, join(BASE, storyFor('Context Menu'))) : null,
    testPath: null,
    docs: {},
    figma: { fileKey: STARTER_FILE_KEY, nodeId: figmaNodes.nodes['Context Menu']?.id ?? null, codeConnect: false, codeConnectPath: null },
    weight: 'light',
    dependencies: dependenciesOf(cmWrapper, join(COMPONENTS_DIR, 'context-menu')),
    status: 'rendered',
    providerNeeds: [],
    parent: null,
    notes: "code without spec; category 'Menus' inferred — reuses Menu's popup, items and tokens (menu.tokens.css); opens on right-click / long-press",
  })

  const uncovered = dirs.filter((d) => !entries.some((e) => e.importPath.startsWith(`stories/base-ui/components/${d}/`)))
  if (uncovered.length) throw new Error(`starter: component folders without a registry entry: ${uncovered.join(', ')}`)

  return {
    entries,
    facts: {
      package: pkg.name,
      version: pkg.version,
      fileKey: STARTER_FILE_KEY,
      specs: SPECS.length,
      subSpecs: Object.keys(STARTER_SUB_SPECS).length,
      extraWithoutSpec: ['Context Menu'],
      componentFolders: dirs.length,
      wrapperFiles: dirs.length + 1,
      barrelExports: barrelNames.size,
      transpiledModules: transpiled,
      figmaNodes: Object.keys(figmaNodes.nodes).length,
      codeConnectFiles: walk(COMPONENTS_DIR).filter((f) => f.endsWith('.figma.tsx')).length,
      storyFiles: storyFiles.length,
      testFiles: 0,
    },
  }
}

/* --------------------------------------------------------------- self-check */

function selfCheck(all) {
  const ids = new Set()
  const problems = []
  for (const e of all) {
    const missing = REGISTRY_KEYS.filter((k) => !(k in e))
    const extra = Object.keys(e).filter((k) => !REGISTRY_KEYS.includes(k))
    if (missing.length) problems.push(`${e.id}: missing keys ${missing.join(', ')}`)
    if (extra.length) problems.push(`${e.id}: unexpected keys ${extra.join(', ')}`)
    if (ids.has(e.id)) problems.push(`duplicate id ${e.id}`)
    ids.add(e.id)
    if (!e.id.startsWith(`${e.source}:`)) problems.push(`${e.id}: id prefix does not match source '${e.source}'`)
    if (!/^(dsn|starter):[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) problems.push(`${e.id}: id is not kebab-case`)
    if (!['rendered', 'rendered-lazy', 'preserved'].includes(e.status)) problems.push(`${e.id}: bad status ${e.status}`)
    if (!['light', 'heavy'].includes(e.weight)) problems.push(`${e.id}: bad weight ${e.weight}`)
    if (![null, 'atom', 'molecule', 'organism', 'part'].includes(e.tier)) problems.push(`${e.id}: bad tier ${e.tier}`)
    const root = SOURCES[e.source]
    for (const key of ['importPath', 'specPath', 'storyPath', 'testPath']) if (e[key] && !existsSync(join(root, e[key]))) problems.push(`${e.id}: ${key} does not exist: ${e[key]}`)
    if (e.figma.codeConnectPath && !existsSync(join(root, e.figma.codeConnectPath))) problems.push(`${e.id}: codeConnectPath does not exist`)
    if (e.figma.codeConnect !== Boolean(e.figma.codeConnectPath)) problems.push(`${e.id}: codeConnect flag disagrees with codeConnectPath`)
  }
  for (const e of all) if (e.parent && !ids.has(e.parent)) problems.push(`${e.id}: parent ${e.parent} does not exist`)
  if (problems.length) throw new Error(`self-check failed:\n  ${problems.join('\n  ')}`)
}

/* ------------------------------------------------------------------ outputs */

const TYPES_TS = `/* Generated by scripts/build-registry.mjs — do not edit by hand. */

export type RegistrySource = 'dsn' | 'starter'
export type RegistryTier = 'atom' | 'molecule' | 'organism' | 'part' | null
export type RegistryWeight = 'light' | 'heavy'
/** preserved: DSN AppShell (100vh + hard-coded id), hooks/utilities, sub-parts; rendered-lazy: heavy. */
export type RegistryStatus = 'rendered' | 'rendered-lazy' | 'preserved'

export interface RegistryProp {
  name: string
  type: string
  values?: string[]
  required?: boolean
}

export interface RegistryDocs {
  whenToUse?: string
  whenNotToUse?: string
  antiPatterns?: string[]
}

export interface RegistryFigma {
  fileKey: string
  nodeId: string | null
  codeConnect: boolean
  codeConnectPath: string | null
}

export interface RegistryEntry {
  id: string // 'dsn:button' | 'starter:button' (kebab-case)
  source: RegistrySource
  sourceName: string // 'Button'
  sourceId: string // DSN: ds-index key / folder name; Starter: spec id (slug)
  importPath: string // relative to the repo root, e.g. 'src/components/atoms/Button/Button.tsx'
  exportName: string | null // named export in that file (null for sub-parts rendered by a parent)
  barrelExport: boolean
  category: string // DSN: Storybook group when derivable from the story title, else tier; Starter: spec category
  tier: RegistryTier
  variants: Record<string, string[]>
  props: RegistryProp[]
  states: string[]
  a11y: string
  tokensUsed: string[]
  specPath: string | null
  storyPath: string | null
  testPath: string | null
  docs: RegistryDocs
  figma: RegistryFigma
  weight: RegistryWeight
  dependencies: string[] // bare specifiers imported by the implementation file
  status: RegistryStatus
  providerNeeds: string[] // ['Toast.Provider'] for Starter Toast, ['Command'] for DSN Command parts, …
  parent: string | null // registry id of the parent for sub-parts
  notes: string
}

export interface RegistryCounts {
  entries: number
  components: number
  parts: number
  withSpec: number
  withStories: number
  withTests: number
  withCodeConnect: number
  heavy: number
  rendered: number
  renderedLazy: number
  preserved: number
}

export interface RegistrySourceInfo {
  label: string
  package: string
  version: string
  root: string
  relativeToApp: string
  fileKey: string
  file: string
  counts: RegistryCounts
  facts: Record<string, unknown>
}

export interface RegistryManifest {
  generatedAt: string
  generator: string
  sourcesManifest: string
  sources: Record<RegistrySource, RegistrySourceInfo>
  warnings: string[]
}
`

function counts(entries) {
  return {
    entries: entries.length,
    components: entries.filter((e) => !e.parent).length,
    parts: entries.filter((e) => e.parent).length,
    withSpec: entries.filter((e) => e.specPath).length,
    withStories: entries.filter((e) => e.storyPath).length,
    withTests: entries.filter((e) => e.testPath).length,
    withCodeConnect: entries.filter((e) => e.figma.codeConnect).length,
    heavy: entries.filter((e) => e.weight === 'heavy').length,
    rendered: entries.filter((e) => e.status === 'rendered').length,
    renderedLazy: entries.filter((e) => e.status === 'rendered-lazy').length,
    preserved: entries.filter((e) => e.status === 'preserved').length,
  }
}

const yn = (v) => (v ? 'yes' : 'no')
const REUSED = { rendered: 'source import', 'rendered-lazy': 'lazy', preserved: 'preserved' }
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')

function matrixTable(entries) {
  const rows = [...entries].sort((a, b) => a.sourceName.localeCompare(b.sourceName))
  const lines = [
    '| Source asset | Reused how | Unified equivalent or preserved alternative | Implementation status | Design parity |',
    '|---|---|---|---|---|',
  ]
  for (const e of rows) {
    const asset = `**${cell(e.sourceName)}** \`${e.id}\` — ${[e.tier, e.category].filter(Boolean).join(' · ')}${e.parent ? ` (part of \`${e.parent}\`)` : ''}`
    const impl = `renderer no · tests in source ${yn(e.testPath)} · stories ${yn(e.storyPath)}`
    const parity = `Code Connect ${yn(e.figma.codeConnect)} · node ${e.figma.nodeId ?? '—'} · file ${e.figma.fileKey} · live parity unverified`
    lines.push(`| ${asset} | ${REUSED[e.status]} | tbd | ${impl} | ${parity} |`)
  }
  return lines.join('\n')
}

function coverageMatrix(generatedAt, dsn, starter) {
  const block = (label, r) => {
    const c = counts(r.entries)
    return [
      `### ${label}`,
      '',
      `- Components: **${c.entries}** (${c.components} top-level, ${c.parts} parts with a parent)`,
      `- With spec: ${c.withSpec} · with stories: ${c.withStories} · with tests: ${c.withTests} · with Code Connect: ${c.withCodeConnect}`,
      `- Heavy (lazy): ${c.heavy} · preserved: ${c.preserved} · rendered from source: ${c.rendered}`,
      `- Figma file: \`${r.facts.fileKey}\` · package: \`${r.facts.package}@${r.facts.version}\``,
    ].join('\n')
  }
  return [
    '# Coverage matrix — DSN × DS Starter Pack',
    '',
    `Generated ${generatedAt} by \`node scripts/build-registry.mjs\` from the registry in \`src/library/generated/\`. Do not edit by hand; the hand-written overlaps file (unified equivalents) comes later and will replace the \`tbd\` column.`,
    '',
    '## Summary',
    '',
    block('DSN (`ds-ngr`)', dsn),
    '',
    block('DS Starter Pack', starter),
    '',
    'Legend — **Reused how**: `source import` = rendered straight from the source repo; `lazy` = heavy dependency or size, loaded on demand; `preserved` = kept as reference only (DSN AppShell, sub-parts that need a parent). **Implementation status**: `renderer` is `no` until the unified tool registers a renderer for the id; `tests in source` / `stories` refer to the source repo. **Design parity**: Code Connect presence and the Figma node id are read from the repos; live parity against Figma is never verified by this script.',
    '',
    '## DSN',
    '',
    matrixTable(dsn.entries),
    '',
    '## DS Starter Pack',
    '',
    matrixTable(starter.entries),
    '',
  ].join('\n')
}

/* --------------------------------------------------------------------- main */

async function main() {
  for (const [label, root] of Object.entries(SOURCES)) if (!existsSync(root)) throw new Error(`${label} source repo not found: ${root}`)
  const dsn = buildDsn()
  const starter = await buildStarter()
  const all = [...dsn.entries, ...starter.entries]
  selfCheck(all)

  const generatedAt = new Date().toISOString()
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(DOCS_DIR, { recursive: true })
  const manifest = {
    generatedAt,
    generator: 'scripts/build-registry.mjs',
    sourcesManifest: 'docs/sources.md5',
    sources: Object.fromEntries(
      [['dsn', 'DSN (ds-ngr)', dsn], ['starter', 'DS Starter Pack', starter]].map(([key, label, r]) => [key, {
        label,
        package: r.facts.package,
        version: r.facts.version,
        root: SOURCES[key],
        relativeToApp: posix(relative(APP_ROOT, SOURCES[key])),
        fileKey: r.facts.fileKey,
        file: `src/library/generated/${key}.json`,
        counts: counts(r.entries),
        facts: r.facts,
      }]),
    ),
    warnings,
  }
  writeFileSync(join(OUT_DIR, 'dsn.json'), JSON.stringify(dsn.entries, null, 2) + '\n')
  writeFileSync(join(OUT_DIR, 'starter.json'), JSON.stringify(starter.entries, null, 2) + '\n')
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  writeFileSync(join(OUT_DIR, 'registry.types.ts'), TYPES_TS)
  writeFileSync(join(DOCS_DIR, 'coverage-matrix.md'), coverageMatrix(generatedAt, dsn, starter))
  if (!process.argv.includes('--keep-cache')) rmSync(join(APP_ROOT, '.cache'), { recursive: true, force: true }) // scratch only

  const c1 = counts(dsn.entries), c2 = counts(starter.entries)
  console.log(`DSN:     ${c1.entries} entries (${c1.components} components + ${c1.parts} parts) — spec ${c1.withSpec}, stories ${c1.withStories}, tests ${c1.withTests}, Code Connect ${c1.withCodeConnect}, heavy ${c1.heavy}, preserved ${c1.preserved}`)
  console.log(`         public exports ${dsn.facts.publicComponents}, ds-index ${dsn.facts.dsIndexComponents} (+ meta ${dsn.facts.dsIndexMetaEntries.join(', ')}), synthesized ${dsn.facts.synthesized.join(', ')}, folders ${dsn.facts.componentFolders}, non-component exports ${dsn.facts.nonComponentExports.join(', ')}`)
  console.log(`Starter: ${c2.entries} entries (${starter.facts.specs} specs + ${starter.facts.extraWithoutSpec.join(', ')}; ${c2.parts} sub-specs with parent) — spec ${c2.withSpec}, stories ${c2.withStories}, tests ${c2.withTests}, Code Connect ${c2.withCodeConnect}, heavy ${c2.heavy}, preserved ${c2.preserved}`)
  if (warnings.length) console.log(`Warnings (${warnings.length}):\n  ${warnings.join('\n  ')}`)
  console.log(`Self-check passed (${all.length} entries). Wrote ${relative(APP_ROOT, OUT_DIR)}/{dsn,starter,manifest}.json, registry.types.ts and docs/coverage-matrix.md in ${((Date.now() - started) / 1000).toFixed(1)} s.`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
