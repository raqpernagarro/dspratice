#!/usr/bin/env node
// typecheck.mjs — runs the full TypeScript build when the DSN and Starter Pack sources are present
// (sources/ in this repository, or ../demo tools, the same lookup vite.config.ts uses), otherwise
// the core check that leaves the two source-dependent preview frames out. Either way the app's own
// code is fully type-checked.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const has = (name, marker) => [process.env[name === 'DSN-main' ? 'DSN_DIR' : 'STARTER_DIR'], resolve(root, 'sources', name), resolve(root, '../demo tools', name)].filter(Boolean).some((d) => existsSync(resolve(d, marker)))
const full = has('DSN-main', 'src/index.ts') && has('ds-starter-pack-main', 'stories/base-ui')
const tsc = resolve(root, 'node_modules/typescript/bin/tsc')
const args = full ? ['-b'] : ['-p', 'tsconfig.core.json', '--noEmit']
if (!full) console.log('typecheck: library sources not in sources/ or ../demo tools; checking the core app (preview frames for DSN and the Starter Pack are skipped).')
const res = spawnSync(process.execPath, [tsc, ...args], { cwd: root, stdio: 'inherit' })
process.exit(res.status ?? 1)
