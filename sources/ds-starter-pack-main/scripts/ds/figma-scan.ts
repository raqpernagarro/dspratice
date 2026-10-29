/**
 * Figma → repo anatomy, without the plugin export:
 *
 *   npm run ds:figma-scan                → scripts/ds/.out/scan.js (run it with figma_execute)
 *   npm run ds:anatomy -- <result file>  → writes stories/base-ui/tokens/figma-components.json
 *
 * figma_execute saves results too large to show in a file; pass that file to ds:anatomy.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { RUNTIME_GUARD } from './figma-snippets'
import { root, writeSnippet } from './snippet-io'

const [command, file] = process.argv.slice(2)
if (command === 'import') {
  const raw = JSON.parse(readFileSync(resolve(file), 'utf8'))
  const result = raw.result ?? raw
  const anatomy = result.anatomy ?? result
  if (!Array.isArray(anatomy)) throw new Error('No anatomy array in that file')
  writeFileSync(resolve(root, 'stories/base-ui/tokens/figma-components.json'), JSON.stringify(anatomy))
  if (Array.isArray(result.textStyles)) {
    writeFileSync(resolve(root, 'stories/base-ui/tokens/figma-text-styles.json'), JSON.stringify(result.textStyles, null, 1) + '\n')
    console.log(`figma-text-styles.json ← ${result.textStyles.length} text styles`)
  }
  console.log(`figma-components.json ← ${anatomy.map((c: { name: string; variants: unknown[] }) => `${c.name} (${c.variants.length})`).join(', ')}`)
} else {
  // Padding keeps the result above figma_execute's inline limit, so it always lands in a file.
  writeSnippet('scan', `${RUNTIME_GUARD}\nreturn { anatomy: await scanSets(), textStyles: await textStyleTable(), pad: 'x'.repeat(200000) };\n`)
}
