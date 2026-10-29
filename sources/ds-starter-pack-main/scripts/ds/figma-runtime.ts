/** Writes scripts/ds/.out/runtime.js: run it once per bridge session before other DS snippets. */
import { RUNTIME_INSTALL } from './figma-snippets'
import { writeSnippet } from './snippet-io'

writeSnippet('runtime', RUNTIME_INSTALL)
