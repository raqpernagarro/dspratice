// Pure helpers for scripts/tools.mjs (tested in scripts/tools.test.mjs). The server list is the
// app's own src/fixtures/tool-servers.json, so the hub and this script never disagree.
//
// Where a tool runs from, in order (server/local-api.ts toolFiles() uses the same rules):
//   1. sources/<dir>      your own clone (npm run setup -- --clone-sources), yours to change
//   2. tool-copies/<dir>  a copy of ../demo tools/<dir> made by `npm run tools -- copy`
//   3. never ../demo tools/<dir> itself: it is read-only and scripts/check-sources.mjs checks it
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function readServers(appRoot) {
  return JSON.parse(readFileSync(resolve(appRoot, 'src/fixtures/tool-servers.json'), 'utf8'))
}

export function locations(appRoot, server) {
  return {
    sources: resolve(appRoot, 'sources', server.dir),
    copy: resolve(appRoot, 'tool-copies', server.dir),
    original: resolve(appRoot, '..', 'demo tools', server.dir),
  }
}

/** { runFrom, dir } where runFrom is 'sources' | 'copy' | 'original' | 'missing'. */
export function runDirFor(appRoot, server, exists = (p) => existsSync(p)) {
  const loc = locations(appRoot, server)
  for (const kind of ['sources', 'copy', 'original']) {
    if (exists(resolve(loc[kind], 'package.json'))) return { runFrom: kind, dir: loc[kind] }
  }
  return { runFrom: 'missing', dir: null }
}

/** The start command with the port filled in, as [command, ...args]. */
export function startArgs(server, port = server.port) {
  return server.start.map((a) => a.replaceAll('{port}', String(port)))
}

/** On Windows npm and npx are .cmd shims. */
export function bin(cmd, platform = process.platform) {
  return platform === 'win32' && (cmd === 'npm' || cmd === 'npx') ? `${cmd}.cmd` : cmd
}

/** Resolves ids from the command line ("all" or nothing means every tool). Unknown ids throw. */
export function pick(servers, ids) {
  if (!ids.length || ids.includes('all')) return servers
  return ids.map((id) => {
    const s = servers.find((x) => x.id === id)
    if (!s) throw new Error(`No tool called "${id}". Tools: ${servers.map((x) => x.id).join(', ')}.`)
    return s
  })
}
