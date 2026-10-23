#!/usr/bin/env node
// tools.mjs — runs the practice's own tools (the DS Configurator, the DSN site, Presentation
// Studio) on this machine, so the hub can open them. You run it; the hub never starts anything.
//
//   npm run tools                         where each tool is, and whether it is running
//   npm run tools -- copy <tool|all>      copy a tool out of ../demo tools, once
//   npm run tools -- start <tool…|all>    start tools; Ctrl+C stops them
//
// Tools: starter, dsn, studio (src/fixtures/tool-servers.json). Every tool writes into its own
// folder when used, so it runs from your clone in sources/ or a copy in tool-copies/, never from
// ../demo tools (read-only; scripts/check-sources.mjs proves it). On a Mac the copy is an APFS
// clone: under a minute for all three, and no extra disk until files change.
import { constants, cpSync, existsSync, mkdirSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { connect } from 'node:net'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bin, locations, pick, readServers, runDirFor, startArgs } from './lib/tools-lib.mjs'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const servers = readServers(appRoot)
const [command = 'status', ...ids] = process.argv.slice(2)
const rel = (p) => relative(appRoot, p) || '.'

/** True when something accepts a connection on the port. */
function listening(port, host = 'localhost', timeoutMs = 800) {
  return new Promise((done) => {
    const socket = connect({ port, host })
    const end = (ok) => {
      socket.destroy()
      done(ok)
    }
    socket.setTimeout(timeoutMs, () => end(false))
    socket.once('connect', () => end(true))
    socket.once('error', () => end(false))
  })
}

async function status() {
  console.log('\nPractice tools · where each one runs from\n')
  for (const s of servers) {
    const { runFrom, dir } = runDirFor(appRoot, s)
    const where = { sources: `your clone, ${rel(dir)}`, copy: `copy, ${rel(dir)}`, original: 'only the read-only original: run copy first', missing: `not on this machine: ask ${s.owner} for ${s.repo}` }[runFrom]
    const installed = dir && runFrom !== 'original' ? (existsSync(resolve(dir, 'node_modules')) ? 'installed' : 'installs on first start') : ''
    const up = (await listening(s.port)) ? 'running' : 'not running'
    console.log(`  ${s.id.padEnd(8)} ${s.name.padEnd(20)} ${`http://localhost:${s.port}`.padEnd(24)} ${up.padEnd(12)} ${where}${installed ? ` · ${installed}` : ''}`)
  }
  console.log('\nCopy once:  npm run tools -- copy all\nStart:      npm run tools -- start <tool>   (starter, dsn, studio or all)\n')
}

function copy(list) {
  for (const s of list) {
    const loc = locations(appRoot, s)
    if (existsSync(resolve(loc.sources, 'package.json'))) {
      console.log(`${s.id}: runs from your clone in ${rel(loc.sources)}; no copy needed.`)
      continue
    }
    if (existsSync(resolve(loc.copy, 'package.json'))) {
      console.log(`${s.id}: already copied to ${rel(loc.copy)}. Delete that folder first to start from a fresh copy.`)
      continue
    }
    if (!existsSync(resolve(loc.original, 'package.json'))) {
      console.log(`${s.id}: ${s.from} is not on this machine. Ask ${s.owner} for access to ${s.repo}.`)
      continue
    }
    const t = Date.now()
    console.log(`${s.id}: copying ../demo tools/${s.dir} → ${rel(loc.copy)} …`)
    // On macOS `cp -c` clones every file (APFS): about 15s for the Starter Pack and almost no extra
    // disk. Node's cpSync copies file by file, measured at 254s and ~2 GB for the same folder, so it
    // is only the fallback. Both keep node_modules links relative, pointing inside the copy.
    mkdirSync(dirname(loc.copy), { recursive: true })
    const cloned = process.platform === 'darwin' && spawnSync('cp', ['-cR', loc.original, loc.copy], { stdio: 'inherit' }).status === 0
    if (!cloned) cpSync(loc.original, loc.copy, { recursive: true, mode: constants.COPYFILE_FICLONE, verbatimSymlinks: true, filter: (src) => !src.endsWith('.DS_Store') })
    console.log(`${s.id}: copied in ${((Date.now() - t) / 1000).toFixed(1)}s. It writes ${s.writes.join(' and ')} — into the copy only.`)
  }
}

async function start(list) {
  const children = []
  for (const s of list) {
    const { runFrom, dir } = runDirFor(appRoot, s)
    if (runFrom === 'missing') {
      console.log(`${s.id}: ${s.from} is not on this machine. Ask ${s.owner} for access to ${s.repo}.`)
      continue
    }
    if (runFrom === 'original') {
      console.log(`${s.id}: only the read-only original exists. Run first:  npm run tools -- copy ${s.id}`)
      continue
    }
    if (await listening(s.port)) {
      console.log(`${s.id}: something already answers at http://localhost:${s.port}; leaving it as it is.`)
      continue
    }
    for (const port of s.alsoPorts ?? []) {
      if (await listening(port)) console.log(`${s.id}: port ${port} is taken by another app, and ${s.name} needs it too (see "needs" in src/fixtures/tool-servers.json). Stop that app, then start ${s.id} again.`)
    }
    if (!existsSync(resolve(dir, 'node_modules'))) {
      console.log(`${s.id}: installing dependencies in ${rel(dir)} (first start only) …`)
      const [cmd, ...args] = s.install
      const res = spawnSync(bin(cmd), args, { cwd: dir, stdio: 'inherit' })
      if (res.status !== 0) {
        console.log(`${s.id}: install failed; fix the error above and start it again.`)
        continue
      }
    }
    const [cmd, ...args] = startArgs(s)
    console.log(`${s.id}: starting ${s.name} from ${rel(dir)} → http://localhost:${s.port}`)
    const child = spawn(bin(cmd), args, { cwd: dir, env: { ...process.env, PORT: String(s.port), BROWSER: 'none' }, stdio: ['ignore', 'pipe', 'pipe'] })
    const prefix = (chunk) => String(chunk).split('\n').filter(Boolean).map((l) => `[${s.id}] ${l}`).join('\n') + '\n'
    child.stdout.on('data', (c) => process.stdout.write(prefix(c)))
    child.stderr.on('data', (c) => process.stderr.write(prefix(c)))
    child.on('exit', (code) => console.log(`${s.id}: stopped${code ? ` (exit ${code})` : ''}.`))
    children.push(child)
  }
  if (!children.length) return
  console.log('\nLeave this terminal open while you use the tools. Ctrl+C stops them all.\n')
  const stop = () => {
    for (const c of children) if (c.exitCode === null) c.kill('SIGINT')
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

try {
  if (command === 'status') await status()
  else if (command === 'copy') copy(pick(servers, ids))
  else if (command === 'start') await start(pick(servers, ids))
  else {
    console.log('Usage: npm run tools [-- copy <tool|all> | -- start <tool…|all>]')
    process.exitCode = 1
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e))
  process.exitCode = 1
}
