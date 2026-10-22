#!/usr/bin/env node
// check-demo-build.mjs — fails the client-safe demo build (dist-demo/) if internal material is in
// it: the knowledge library's content and registry, opportunities and requests, other clients'
// names, internal planning, presenter notes, keys. Run automatically by `npm run build:demo`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', process.argv[2] ?? 'dist-demo')
const FORBIDDEN = [
  // knowledge library: registry ids, document schema, distinctive content
  'knowledge-doc@1', 'src-offer-deck', 'src-battle-card', 'CONTOSO-ISOLATION-MARKER', 'Battle card', 'Authority engine', 'Problem bank', 'Seller training', 'Understanding Charter',
  // opportunities and requests
  'opp-northwind-rfp', 'Request for proposal: AI-native', 'generation packet', 'figma-text@1',
  // other clients and internal planning
  'ASSA ABLOY', 'Vorwerk', 'Ajman', 'AJIO', 'Jerónimo', 'AstraZeneca', 'Charter Communications', 'Pragathi', 'Prototyping Tool (internal only)',
  // presenter notes and meeting preparation (src/internal/presenterNotes.ts, the notes window)
  'PRESENTER_NOTES', 'Open with the problem, not the tool', 'Never promise another stack', 'Keep this window off the shared screen', 'Before the meeting',
  // integrations and secrets
  'ANTHROPIC_API_KEY', 'FIGMA_TOKEN', '/api/generate',
]
const hits = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(js|css|html|json|txt|map|md)$/.test(name)) {
      const text = readFileSync(p, 'utf8')
      for (const f of FORBIDDEN) if (text.includes(f)) hits.push(`${p.slice(root.length + 1)}: "${f}"`)
    }
  }
}
try {
  walk(root)
} catch (e) {
  console.error(`No build at ${root}. Run vite build --mode demo first.`)
  process.exit(1)
}
if (hits.length) {
  console.error(`Demo build leak check FAILED (${hits.length}):\n  ${hits.join('\n  ')}`)
  process.exit(1)
}
console.log(`Demo build leak check passed: none of ${FORBIDDEN.length} internal markers found in ${root}.`)
