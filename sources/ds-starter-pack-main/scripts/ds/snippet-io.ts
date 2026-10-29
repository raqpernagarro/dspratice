import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ComponentSpec } from '../../stories/base-ui/spec'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Specs named on the command line (by name or slug); all when none are named. */
export function pickSpecs(specs: ComponentSpec[], args: string[]) {
  const names = args.filter((a) => !a.startsWith('--'))
  const out = specs.filter((s) => !names.length || names.includes(s.name) || names.includes(s.slug))
  if (!out.length) throw new Error(`No spec named ${names.join(', ')}`)
  return out
}

export function writeSnippet(name: string, code: string) {
  const dir = resolve(root, 'scripts/ds/.out')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `${name}.js`)
  writeFileSync(file, code)
  console.log(`wrote ${relative(root, file)} (${(code.length / 1024).toFixed(1)} KB)`)
}
