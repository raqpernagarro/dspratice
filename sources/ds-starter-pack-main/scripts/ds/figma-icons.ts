/**
 * Writes scripts/ds/.out/icons.js: starts importing the library icons in scripts/ds/figma/icons.json
 * (in the background; ~40 s). Run it again to see the status; build snippets need them loaded.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { RUNTIME_GUARD } from './figma-snippets'
import { root, writeSnippet } from './snippet-io'

const { sets } = JSON.parse(readFileSync(resolve(root, 'scripts/ds/figma/icons.json'), 'utf8'))
writeSnippet('icons', `${RUNTIME_GUARD}\nreturn loadIcons(${JSON.stringify(sets)});\n`)
