/** Builds the Figma plugin into figma-plugin/dist (npm run plugin:build). */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const root = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(root, 'dist')
fs.mkdirSync(dist, { recursive: true })

await build({
  entryPoints: [path.join(root, 'src/code.ts')],
  bundle: true,
  outfile: path.join(dist, 'code.js'),
  // Figma's plugin sandbox runs older JS; transpile modern syntax down.
  target: 'es2017',
  format: 'iife',
  logLevel: 'info',
})
fs.copyFileSync(path.join(root, 'src/ui.html'), path.join(dist, 'ui.html'))
console.log('Plugin built → figma-plugin/dist')

/**
 * --install: copy the plugin outside this repo. Figma Desktop can't read files inside
 * cloud-synced folders (OneDrive / iCloud live under ~/Library/CloudStorage, and macOS blocks
 * Figma from opening them), so it loads the plugin from a local folder instead.
 */
if (process.argv.includes('--install')) {
  const target = path.join(os.homedir(), 'Figma Plugins', 'DS Configurator')
  fs.mkdirSync(path.join(target, 'dist'), { recursive: true })
  for (const file of ['manifest.json', 'dist/code.js', 'dist/ui.html']) {
    fs.copyFileSync(path.join(root, file), path.join(target, file))
  }
  console.log(`Installed → ${target}`)
  console.log(`In Figma Desktop: Plugins → Development → Import plugin from manifest… → ${path.join(target, 'manifest.json')}`)
}
