/**
 * Collect: story.md + roadmap.md + live facts from the repo + screenshots → Deck (slides.json).
 * Nothing here knows how a slide looks; that's the renderers' job.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

import { chromium, type Page } from 'playwright'

import { SPECS } from '../../stories/base-ui/spec'
import { CATEGORIES } from '../../stories/base-ui/spec/categories'
import { parseRoadmap, parseStory, type StorySlide } from './markdown'
import type { Deck, Fact, Image, Slide } from './slides'

export interface CollectOptions {
  root: string
  /** Where images are written: <outDir>/images. */
  outDir: string
  /** Scratch space: Storybook and configurator builds, test results. */
  cacheDir: string
  /** Run the test suite for the test facts (else reuse the last results, if any). */
  tests: boolean
  /** Rebuild Storybook and the configurator and take screenshots (else reuse the last images). */
  screenshots: boolean
}

export async function collect(opts: CollectOptions): Promise<Deck> {
  const { root } = opts
  mkdirSync(join(opts.outDir, 'images'), { recursive: true })
  mkdirSync(opts.cacheDir, { recursive: true })

  const story = parseStory(readFileSync(join(root, 'pitch/story.md'), 'utf8'))
  const roadmap = parseRoadmap(readFileSync(join(root, 'pitch/roadmap.md'), 'utf8'))
  const facts = readFacts(opts)
  const images = await takeScreenshots(story, opts)

  const fill = (text: string) =>
    text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
      if (!(name in facts.text)) throw new Error(`story.md: unknown fact {{${name}}}. Known: ${Object.keys(facts.text).join(', ')}`)
      return facts.text[name]
    })

  const slides = story.map((s): Slide => {
    const title = fill(s.title)
    const d = s.directive
    if (d?.name === 'facts') return { kind: 'facts', title, facts: facts.list }
    if (d?.name === 'gallery') return { kind: 'gallery', title, images: d.ids.map((id) => images[id]).filter(Boolean) }
    if (d?.name === 'configurator') return images.configurator ? { kind: 'screenshot', title, image: images.configurator } : { kind: 'gallery', title, images: [] }
    if (d?.name === 'roadmap') {
      const items = roadmap.filter((r) => (d.which === 'done' ? r.status === 'done' : r.status !== 'done'))
      return { kind: 'roadmap', title, items: items.map((r) => ({ ...r, text: fill(r.text) })) }
    }
    if (s.layout === 'title') return { kind: 'title', title, subtitle: s.subtitle && fill(s.subtitle) }
    const blocks = s.blocks.map((b) => (b.type === 'paragraph' ? { ...b, text: fill(b.text) } : { ...b, items: b.items.map(fill) }))
    if (s.layout === 'statement') return { kind: 'statement', title, text: blocks.map((b) => (b.type === 'paragraph' ? b.text : b.items.join(' '))).join(' ') }
    return { kind: 'content', title, subtitle: s.subtitle && fill(s.subtitle), blocks }
  })

  return { title: story[0]?.title ?? 'Pitch deck', builtAt: new Date().toISOString(), commit: git(root, 'rev-parse', '--short', 'HEAD'), slides }
}

// ─── Facts ──────────────────────────────────────────────────────────────────

interface Facts {
  /** Values for {{name}} in story.md. */
  text: Record<string, string>
  /** The {{facts}} slide. */
  list: Fact[]
}

function readFacts(opts: CollectOptions): Facts {
  const { root } = opts
  const tokens = JSON.parse(readFileSync(join(root, 'stories/base-ui/tokens/figma-semantic.json'), 'utf8'))
  const tokenNames = new Set(Object.values(tokens.modes as Record<string, object>).flatMap((m) => Object.keys(m)))
  const brands = 1 + Object.keys(tokens.brands ?? {}).length

  const parity = runParity(root)
  const tests = runTests(opts)
  const a11yGate = /a11y:\s*\{[^}]*test:\s*'error'/.test(readFileSync(join(root, '.storybook/preview.tsx'), 'utf8'))

  const commits = git(root, 'rev-list', '--count', 'HEAD')
  const since = new Date(git(root, 'log', '--reverse', '--format=%cI').split('\n')[0]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const text: Record<string, string> = {
    components: String(SPECS.length),
    categories: String(Object.keys(CATEGORIES).length),
    tokens: String(tokenNames.size),
    brands: String(brands),
    parity: parity.ok ? `${parity.total} / ${parity.total} components match` : `${parity.matched} / ${parity.total} components match`,
    stories: tests ? String(tests.total) : 'n/a',
    tests: tests ? `${tests.passed} / ${tests.total} pass` : 'not run',
    commits,
    since,
  }

  const list: Fact[] = [
    { value: text.components, label: 'components', note: `in React and Figma, in ${text.categories} categories` },
    { value: text.tokens, label: 'semantic tokens', note: 'the same names in Figma and code, Light and Dark' },
    { value: `${parity.matched}/${parity.total}`, label: 'Figma–code parity', note: parity.ok ? 'every variant bound as the spec says' : 'some components differ' },
    { value: tests ? `${tests.passed}/${tests.total}` : 'n/a', label: 'stories pass their tests', note: 'each one rendered in a real browser' },
    { value: a11yGate ? (tests && tests.passed === tests.total ? '0' : `${tests ? tests.total - tests.passed : '?'}`) : 'off', label: 'accessibility problems', note: a11yGate ? 'checked on every story; any problem fails the tests' : 'reported, not enforced' },
    { value: text.brands, label: 'brands', note: 'themes switch without touching components' },
  ]
  return { text, list }
}

function runParity(root: string) {
  const r = spawnSync('npm', ['run', '-s', 'ds:parity'], { cwd: root, encoding: 'utf8' })
  const out = `${r.stdout}\n${r.stderr}`
  const matched = (out.match(/✓ bindings match/g) ?? []).length
  const failed = (out.match(/✗/g) ?? []).length
  return { ok: r.status === 0, matched, total: r.status === 0 ? matched : matched + failed }
}

function runTests({ root, cacheDir, tests }: CollectOptions): { passed: number; total: number } | undefined {
  const file = join(cacheDir, 'vitest.json')
  if (tests) {
    console.log('  running the tests…')
    // Exit code is ignored on purpose: failures are a fact the deck reports, not a build error.
    spawnSync('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${file}`], { cwd: root, encoding: 'utf8' })
  }
  if (!existsSync(file)) return undefined
  const r = JSON.parse(readFileSync(file, 'utf8'))
  return { passed: r.numPassedTests, total: r.numTotalTests }
}

const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()

// ─── Screenshots ────────────────────────────────────────────────────────────

const STORY_PREFIX = 'base-ui-components-'

async function takeScreenshots(story: StorySlide[], opts: CollectOptions): Promise<Record<string, Image>> {
  const ids = story.flatMap((s) => (s.directive?.name === 'gallery' ? s.directive.ids : []))
  const wantsConfigurator = story.some((s) => s.directive?.name === 'configurator')
  const images: Record<string, Image> = {}

  if (!opts.screenshots) {
    for (const id of [...ids, ...(wantsConfigurator ? ['configurator'] : [])]) {
      const meta = join(opts.outDir, 'images', `${id}.json`)
      if (existsSync(meta)) images[id] = JSON.parse(readFileSync(meta, 'utf8'))
    }
    return images
  }

  rmSync(join(opts.outDir, 'images'), { recursive: true, force: true })
  mkdirSync(join(opts.outDir, 'images'))
  const storybookDir = join(opts.cacheDir, 'storybook')
  const editorDir = join(opts.cacheDir, 'configurator')
  console.log('  building Storybook…')
  run(opts.root, 'npx', ['storybook', 'build', '--quiet', '-o', storybookDir])
  if (wantsConfigurator) {
    console.log('  building the configurator…')
    run(opts.root, 'npx', ['vite', 'build', '--config', 'semantic-editor/vite.config.ts', '--outDir', editorDir, '--emptyOutDir', '--base', './', '--logLevel', 'warn'])
  }

  const index = JSON.parse(readFileSync(join(storybookDir, 'index.json'), 'utf8')).entries as Record<string, { title: string; name: string }>
  const sb = await serve(storybookDir)
  const ed = wantsConfigurator ? await serve(editorDir) : undefined
  const browser = await chromium.launch()
  try {
    // Wide and tall, so no story is cut off; the clip below trims to what the story drew.
    const page = await browser.newPage({ viewport: { width: 2400, height: 2400 }, deviceScaleFactor: 2 })
    for (const id of ids) {
      const entry = index[STORY_PREFIX + id]
      if (!entry) throw new Error(`story.md: no story "${id}". Example ids: ${Object.keys(index).slice(0, 3).map((k) => k.replace(STORY_PREFIX, '')).join(', ')}`)
      await page.goto(`${sb.url}/iframe.html?id=${STORY_PREFIX}${id}&viewMode=story`)
      await settle(page, '#storybook-root > *')
      const clip = (await page.evaluate(TIGHT_BOX)) as { x: number; y: number; width: number; height: number }
      const caption = `${entry.title.split('/').pop()} · ${entry.name}`
      images[id] = await save(page, opts.outDir, id, caption, clip)
    }
    if (ed) {
      await page.setViewportSize({ width: 1600, height: 1000 })
      await page.goto(`${ed.url}/index.html`)
      await settle(page, '#root > *')
      images.configurator = await save(page, opts.outDir, 'configurator', 'DS Configurator', { x: 0, y: 0, width: 1600, height: 1000 })
    }
  } finally {
    await browser.close()
    sb.server.close()
    ed?.server.close()
  }
  return images
}

/**
 * Tight box around what a story drew. Layout wrappers span the full width, so only what's visible
 * counts: text (by its own box, not its element's), replaced elements, and elements with a
 * background, border or shadow. A string, so the bundler can't add helpers the page doesn't have.
 */
const TIGHT_BOX = `(() => {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity
  const add = (x) => {
    if (!x.width || !x.height) return
    l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom)
  }
  const root = document.querySelector('#storybook-root')
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    add(range.getBoundingClientRect())
  }
  for (const el of root.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden') continue
    const border = ['Top', 'Right', 'Bottom', 'Left'].reduce((sum, side) => sum + parseFloat(cs['border' + side + 'Width']), 0)
    const painted = /^(IMG|svg|INPUT|TEXTAREA|SELECT|CANVAS|VIDEO)$/.test(el.tagName) || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || border > 0 || cs.boxShadow !== 'none'
    if (painted) add(el.getBoundingClientRect())
  }
  const pad = 16
  return { x: Math.max(0, l - pad), y: Math.max(0, t - pad), width: r - l + pad * 2, height: b - t + pad * 2 }
})()`

async function settle(page: Page, selector: string) {
  await page.waitForSelector(selector)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}

async function save(page: Page, outDir: string, id: string, caption: string, clip: { x: number; y: number; width: number; height: number }): Promise<Image> {
  const file = `images/${id}.png`
  await page.screenshot({ path: join(outDir, file), clip })
  const image: Image = { file, caption, width: Math.round(clip.width), height: Math.round(clip.height) }
  // Kept next to the PNG so a build without screenshots can reuse both.
  writeFileSync(join(outDir, 'images', `${id}.json`), JSON.stringify(image))
  return image
}

function run(cwd: string, cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { cwd, stdio: ['ignore', 'ignore', 'inherit'] })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (exit ${r.status})`)
}

const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }

/** A tiny static file server on a free port, for the built Storybook and configurator. */
function serve(dir: string): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
    let file = resolve(dir, `.${path}`)
    if (!file.startsWith(dir) || !existsSync(file)) return void res.writeHead(404).end()
    if (!extname(file)) file = join(file, 'index.html')
    try {
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
    } catch {
      res.writeHead(404).end()
    }
  })
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${(server.address() as { port: number }).port}`, server })))
}
