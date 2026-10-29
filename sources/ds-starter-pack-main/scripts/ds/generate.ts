/**
 * Generates, from the component specs (stories/base-ui/spec):
 * - components/<slug>/<slug>.tokens.css   token bindings as CSS (overridable, per variant)
 * - spec/anatomy.generated.json           expected Figma bindings per variant (Figma build / rebind input)
 *
 *   npm run ds:generate            write files
 *   npm run ds:generate -- --check fail if any file is out of date (CI)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SPECS, componentCss, expectedAnatomy } from '../../stories/base-ui/spec'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const check = process.argv.includes('--check')
const stale: string[] = []

function write(path: string, content: string) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (current === content) return
  if (check) stale.push(relative(root, path))
  else {
    writeFileSync(path, content)
    console.log(`wrote ${relative(root, path)}`)
  }
}

for (const spec of SPECS) {
  const header = `/* Generated from ${spec.slug}.spec.ts by \`npm run ds:generate\`. Do not edit. */\n\n`
  write(resolve(root, `stories/base-ui/components/${spec.dir ?? spec.slug}/${spec.slug}.tokens.css`), componentCss(spec, header))
}

write(resolve(root, 'stories/base-ui/spec/anatomy.generated.json'), JSON.stringify(SPECS.map(expectedAnatomy), null, 1) + '\n')

if (check && stale.length) {
  console.error(`Out of date (run npm run ds:generate):\n  ${stale.join('\n  ')}`)
  process.exit(1)
}
if (!check) console.log('specs → generated files up to date')
