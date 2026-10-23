// @vitest-environment node
// The local API: keys never reach the browser, local reads stay inside the allowlist, model calls
// need a key and are validated, Figma REST needs a token.
import { describe, expect, it, vi } from 'vitest'
import { routeRequest, type ApiEnv, type Deps } from './local-api'

const env = (over: Partial<ApiEnv> = {}): ApiEnv => ({ model: 'claude-opus-5-5', fallbacks: true, workspaceRoot: '/ws', roots: ['gtm'], files: ['offer.html'], ...over })
const deps = (over: Partial<Deps> = {}): Deps => ({
  fetch: vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch,
  readFile: vi.fn(async () => Buffer.from('# Battle card')),
  stat: vi.fn(async () => ({ size: 13, mtimeMs: 1 })),
  realpath: vi.fn(async (p: string) => p),
  generate: vi.fn(async () => ({ data: { ok: 1 }, model: 'claude-opus-5-5', usage: { inputTokens: 10, outputTokens: 5 } })),
  ...over,
})
const call = (method: string, path: string, body: unknown, e = env(), d = deps()) => routeRequest(method, new URL(`http://localhost${path}`), body, e, d)

describe('local API', () => {
  it('reports what is configured as booleans and never echoes a key', async () => {
    const r = await call('GET', '/api/status', null, env({ apiKey: 'sk-ant-secret', figmaToken: 'figd_secret' }))
    expect(r.status).toBe(200)
    expect(JSON.stringify(r.body)).not.toMatch(/secret/)
    expect(r.body).toMatchObject({ model: { configured: true }, figma: { configured: true } })
  })

  it('refuses model calls without a key and validates the payload', async () => {
    expect((await call('POST', '/api/generate', { kind: 'compose', system: 's', user: 'u' })).body).toMatchObject({ code: 'not-configured' })
    const d = deps()
    expect((await call('POST', '/api/generate', { kind: 'other', system: 's', user: 'u' }, env({ apiKey: 'k' }), d)).status).toBe(400)
    const ok = await call('POST', '/api/generate', { kind: 'compose', system: 's', user: 'u' }, env({ apiKey: 'k' }), d)
    expect(ok.body).toMatchObject({ ok: true, usage: { inputTokens: 10 } })
    expect(JSON.stringify(ok.body)).not.toContain('"k"')
  })

  it('reads allowlisted files and blocks traversal and other folders', async () => {
    expect((await call('GET', '/api/local/read?path=gtm/battle-card.md', null)).body).toMatchObject({ ok: true, text: '# Battle card' })
    expect((await call('GET', '/api/local/read?path=offer.html', null)).status).toBe(200)
    for (const bad of ['gtm/../../etc/passwd', '../secret.md', '/etc/passwd', 'other/notes.md', 'gtm/%2e%2e/x']) {
      const r = await call('GET', `/api/local/read?path=${encodeURIComponent(bad)}`, null)
      expect(r.status, bad).toBeGreaterThanOrEqual(400)
    }
    const escaped = await call('GET', '/api/local/read?path=gtm/link.md', null, env(), deps({ realpath: vi.fn(async () => '/elsewhere/link.md') }))
    expect(escaped.status).toBeGreaterThanOrEqual(400)
  })

  it('needs a Figma token for REST and validates ids', async () => {
    expect((await call('GET', '/api/figma/file?key=abcdefghij12', null)).status).toBeGreaterThanOrEqual(400)
    expect((await call('GET', '/api/figma/projects?teamId=abc', null, env({ figmaToken: 't' }))).status).toBe(400)
  })

  it('says where each practice tool would run from: own clone, then copy, never the original', async () => {
    const servers = [{ id: 'starter', dir: 'sp' }, { id: 'dsn', dir: 'dsn' }, { id: 'studio', dir: 'st' }, { id: 'gone', dir: 'x' }]
    const present = new Set(['/ws/app/sources/sp/package.json', '/ws/app/sources/sp/node_modules', '/ws/demo tools/sp/package.json', '/ws/app/tool-copies/dsn/package.json', '/ws/demo tools/dsn/package.json', '/ws/demo tools/st/package.json'])
    const d = deps({
      readFile: vi.fn(async () => Buffer.from(JSON.stringify(servers))),
      stat: vi.fn(async (p: string) => {
        if (!present.has(p)) throw new Error('ENOENT')
        return { size: 1, mtimeMs: 1 }
      }),
    })
    const r = await call('GET', '/api/tools', null, env({ appRoot: '/ws/app' }), d)
    expect(r.body).toEqual({
      ok: true,
      tools: {
        starter: { runFrom: 'sources', installed: true },
        dsn: { runFrom: 'copy', installed: false },
        studio: { runFrom: 'original', installed: false },
        gone: { runFrom: 'missing', installed: false },
      },
    })
    expect((await call('GET', '/api/tools', null)).body).toMatchObject({ code: 'not-configured' })
  })

  it('reads the set-up the DS Configurator saved in the copy, and says when there is none yet', async () => {
    const servers = [{ id: 'starter', dir: 'sp' }]
    const files: Record<string, string> = { '/ws/app/src/fixtures/tool-servers.json': JSON.stringify(servers), '/ws/app/tool-copies/sp/ds.project.json': '{"format":"ds-configurator/project"}' }
    const present = new Set(['/ws/app/tool-copies/sp/package.json', '/ws/app/tool-copies/sp/ds.project.json'])
    const d = deps({
      readFile: vi.fn(async (p: string) => Buffer.from(files[p] ?? '')),
      stat: vi.fn(async (p: string) => {
        if (!present.has(p)) throw new Error('ENOENT')
        return { size: 40, mtimeMs: 7 }
      }),
    })
    const ok = await call('GET', '/api/tools/starter/project', null, env({ appRoot: '/ws/app' }), d)
    expect(ok.body).toEqual({ ok: true, path: 'tool-copies/sp/ds.project.json', mtime: 7, text: '{"format":"ds-configurator/project"}' })
    present.delete('/ws/app/tool-copies/sp/ds.project.json')
    expect((await call('GET', '/api/tools/starter/project', null, env({ appRoot: '/ws/app' }), d)).body).toMatchObject({ code: 'not-saved' })
    present.delete('/ws/app/tool-copies/sp/package.json')
    expect((await call('GET', '/api/tools/starter/project', null, env({ appRoot: '/ws/app' }), d)).body).toMatchObject({ code: 'no-copy' })
  })
})
