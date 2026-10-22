#!/usr/bin/env node
// typecheck.mjs — runs the full TypeScript build when the DSN and Starter Pack sources sit in
// ../demo tools (the layout the lib projects expect), otherwise the core check that leaves the two
// source-dependent preview frames out. Either way the app's own code is fully type-checked.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const full = existsSync(resolve(root, '../demo tools/DSN-main/src/index.ts')) && existsSync(resolve(root, '../demo tools/ds-starter-pack-main/stories/base-ui'))
const tsc = resolve(root, 'node_modules/typescript/bin/tsc')
const args = full ? ['-b'] : ['-p', 'tsconfig.core.json', '--noEmit']
if (!full) console.log('typecheck: library sources not in ../demo tools; checking the core app (preview frames for DSN and the Starter Pack are skipped).')
const res = spawnSync(process.execPath, [tsc, ...args], { cwd: root, stdio: 'inherit' })
process.exit(res.status ?? 1)
