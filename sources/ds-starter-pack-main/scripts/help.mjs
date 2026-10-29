/**
 * Lists the project's npm commands with a short description.
 * Run: npm run help
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { scripts } = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))

const groups = [
  ['Storybook', {
    storybook: 'Start Storybook at http://localhost:6006',
    test: 'Render every story in a headless browser, with accessibility checks',
    typecheck: 'Type-check the components, Storybook and configurator (and their config files)',
    'build-storybook': 'Build static Storybook into storybook-static/',
  }],
  ['Component specs', {
    'ds:generate': 'Specs → <slug>.tokens.css + expected Figma anatomy (--check: fail if stale)',
    'ds:ai-docs': 'Specs → llms.txt + docs/ai/*.md, guidance for AI agents (--check: fail if stale)',
    'ds:parity': 'Compare Figma bindings (figma-components.json) with the specs',
    'ds:code-connect': 'Specs → Figma Code Connect files (<slug>.figma.tsx + .figma.js; --check: fail if stale)',
    'ds:contrast': 'Check text / icon contrast of every variant, all brands and modes (--report: docs/contrast-report.md)',
    'ds:figma-runtime': 'Write the shared Figma runtime snippet (run once per bridge session)',
    'ds:figma-icons': 'Write a Figma snippet that loads the library icons (scripts/ds/figma/icons.json)',
    'ds:figma-build': 'Write a Figma snippet that builds + binds a component set (-- <Name> [--replace])',
    'ds:figma-bind': 'Write a Figma snippet that binds layers per spec (-- <Name> [--check])',
    'ds:figma-scan': 'Write a Figma snippet that scans every component set\'s bindings',
    'ds:apply-project': 'Apply a configurator project file (<name>.dsproject.json) to this repo as ds.project.json',
    'ds:anatomy': 'Import a saved scan result into figma-components.json (-- <file>)',
  }],
  ['Semantic editor', {
    'editor:dev': 'Start the theme editor at http://localhost:4175',
    'editor:build': 'Build the editor into semantic-editor/dist',
    'docs:build': 'Build the read-only docs site (no editing) into semantic-editor/dist-docs',
    'ds:reset': 'Back to the starter system (Base UI look): deletes ds.project.json and every version, and clears the editor\u2019s saved state',
  }],
  ['Figma → code (read-only)', {
    'figma:sync-semantics': 'Pull Figma variables → stories/base-ui/tokens/figma-semantic.css',
    'figma:sync-from': 'Pull all variables as JSON → variables-github-action/tokens_new/',
  }],
  ['Code → Figma (writes to Figma)', {
    'figma:sync-to': 'Push variables-github-action/tokens/*.json into Figma (needs write-scoped token)',
    'figma:shared-overlay': 'Generate plugin code for overlay variables (.figma-shared-overlay.js)',
  }],
  ['Token specs', {
    'figma:component-spec': 'Regenerate component-button-token-spec.json',
    'figma:export-components': 'Write REST token JSON for components and overlays',
    'figma:build-rebind-map': 'Run component-spec + export-components',
  }],
  ['Pitch deck', {
    'pitch:build': 'Build pitch/dist/pitch-deck.html + .pdf (--skip-tests, --skip-screenshots for speed)',
  }],
  ['Base UI content', {
    'sync:docs': 'Download Base UI docs from base-ui.com',
    'generate:demos': 'Rebuild official demos from the synced docs',
    'generate:stories': 'Rebuild .stories.tsx / .mdx files for each component',
  }],
]

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const width = Math.max(...Object.keys(scripts).map((k) => k.length))
const listed = new Set(['help'])

console.log(`\n${bold('Commands')} ${dim('— run with: npm run <name>')}`)
for (const [title, cmds] of groups) {
  const rows = Object.entries(cmds).filter(([name]) => name in scripts)
  if (!rows.length) continue
  console.log(`\n${bold(title)}`)
  for (const [name, desc] of rows) {
    listed.add(name)
    console.log(`  ${name.padEnd(width)}  ${desc}`)
  }
}

const other = Object.keys(scripts).filter((name) => !listed.has(name))
if (other.length) {
  console.log(`\n${bold('Other')}`)
  for (const name of other) console.log(`  ${name.padEnd(width)}  ${dim(scripts[name])}`)
}
console.log()
