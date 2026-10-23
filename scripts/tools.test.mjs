// @vitest-environment node
// npm run tools: a tool runs from your clone, then a copy, and never from ../demo tools.
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { bin, pick, readServers, runDirFor, startArgs } from './lib/tools-lib.mjs'

const app = '/ws/app'
const server = { id: 'starter', dir: 'sp', port: 4175, start: ['npx', 'vite', '--port', '{port}'] }
const has = (...paths) => (p) => paths.includes(p)

describe('tools script', () => {
  it('prefers your clone, then the copy, and reports the read-only original as such', () => {
    const src = resolve(app, 'sources/sp/package.json')
    const copy = resolve(app, 'tool-copies/sp/package.json')
    const orig = resolve(app, '../demo tools/sp/package.json')
    expect(runDirFor(app, server, has(src, copy, orig))).toEqual({ runFrom: 'sources', dir: resolve(app, 'sources/sp') })
    expect(runDirFor(app, server, has(copy, orig))).toEqual({ runFrom: 'copy', dir: resolve(app, 'tool-copies/sp') })
    expect(runDirFor(app, server, has(orig)).runFrom).toBe('original')
    expect(runDirFor(app, server, has()).runFrom).toBe('missing')
  })

  it('fills the port into the start command and picks tools by id', () => {
    expect(startArgs(server)).toEqual(['npx', 'vite', '--port', '4175'])
    expect(startArgs(server, 5000)).toContain('5000')
    expect(bin('npm', 'win32')).toBe('npm.cmd')
    expect(bin('node', 'win32')).toBe('node')
    const servers = readServers(resolve(import.meta.dirname, '..'))
    expect(pick(servers, []).map((s) => s.id)).toEqual(['starter', 'dsn', 'studio'])
    expect(pick(servers, ['all'])).toHaveLength(3)
    expect(pick(servers, ['dsn']).map((s) => s.id)).toEqual(['dsn'])
    expect(() => pick(servers, ['nope'])).toThrow(/No tool called "nope"/)
  })
})
