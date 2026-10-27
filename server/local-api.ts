// The hub's local server: a Vite plugin (dev and preview) that keeps secrets on this machine.
// The browser learns only whether each integration is configured, never a key.
//
//   GET  /api/status                       → { model, figma, localRead }
//   POST /api/generate {kind, system, user} → structured output via the Anthropic API (if a key is set);
//                                           kind: compose | improve (client requests) | route (Home's Ask AI)
//   GET  /api/figma/file?key&depth          → pages and top-level frames (Figma REST, if a token is set)
//   GET  /api/figma/nodes?key&ids           → slimmed node trees with TEXT characters
//   GET  /api/figma/projects?teamId         → a team's folders (projects)
//   GET  /api/figma/project-files?projectId → the files in a folder
//   GET  /api/local/read?path               → an allowlisted practice file (read only)
//   POST /api/local/hash {paths}            → md5 + mtime for change detection
//   GET  /api/tools                         → per practice tool: where it would run from, installed or not
//   GET  /api/tools/starter/project         → the ds.project.json the DS Configurator saved in your clone or copy
//   GET  /api/tools/probe?url               → whether a practice tool on this machine answers (localhost only)
//
// routeRequest() is plain async code with injected dependencies, so it is unit-tested without
// network or disk (server/local-api.test.ts).

import type { Plugin, Connect } from 'vite'
import { loadEnv } from 'vite'
import { createHash } from 'node:crypto'
import { readFile, stat, realpath } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'

export interface ApiEnv {
  apiKey?: string
  model: string
  fallbacks: boolean
  figmaToken?: string
  workspaceRoot: string
  roots: string[]
  /** Individual files allowed outside the root folders (relative to the workspace). */
  files: string[]
  /** The hub's own folder (holds sources/ and tool-copies/). */
  appRoot?: string
}

export type GenerateKind = 'compose' | 'improve' | 'route'
export type GenerateFn = (args: { kind: GenerateKind; system: string; user: string; env: ApiEnv }) => Promise<{ data: unknown; model: string; usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number } }>

export interface Deps {
  fetch: typeof fetch
  readFile: (p: string) => Promise<Buffer>
  stat: (p: string) => Promise<{ size: number; mtimeMs: number }>
  realpath: (p: string) => Promise<string>
  generate: GenerateFn
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export const DEFAULT_ROOTS = ['gtm', 'product-scoping', 'demo tools/ds-starter-pack-main', 'demo tools/DSN-main']
export const DEFAULT_FILES = ['AI-Ready-Design-Systems-Offering 3.html']
const TEXT_EXT = new Set(['.md', '.mdx', '.txt', '.json', '.html'])

export function envFrom(raw: Record<string, string | undefined>, workspaceRoot: string, appRoot?: string): ApiEnv {
  return {
    appRoot,
    apiKey: raw.ANTHROPIC_API_KEY?.trim() || undefined,
    model: raw.ANTHROPIC_MODEL?.trim() || 'claude-opus-5-5',
    fallbacks: (raw.ANTHROPIC_FALLBACKS ?? 'default').trim() !== 'off',
    figmaToken: raw.FIGMA_TOKEN?.trim() || undefined,
    workspaceRoot,
    roots: [...DEFAULT_ROOTS, ...(raw.KNOWLEDGE_ROOTS ?? '').split(',').map((s) => s.trim()).filter(Boolean)],
    files: DEFAULT_FILES,
  }
}

async function safePath(rel: string, env: ApiEnv, deps: Deps): Promise<string> {
  if (!rel || rel.startsWith('/') || /^[a-z]:/i.test(rel) || rel.split(/[\\/]/).includes('..') || rel.includes('node_modules')) throw new ApiError(400, 'bad-path', 'Only relative paths inside the allowed practice folders can be read.')
  if (!TEXT_EXT.has(extname(rel).toLowerCase())) throw new ApiError(400, 'bad-extension', 'Only .md, .mdx, .txt, .html and .json files are read.')
  const abs = resolve(env.workspaceRoot, rel)
  const allowed = env.roots.map((r) => resolve(env.workspaceRoot, r) + sep)
  const allowedFile = env.files.map((f) => resolve(env.workspaceRoot, f)).includes(abs)
  if (!allowedFile && !allowed.some((a) => abs.startsWith(a))) throw new ApiError(403, 'not-allowed', `Outside the allowed folders: ${env.roots.join(', ')}.`)
  let real: string
  try {
    real = await deps.realpath(abs)
  } catch {
    throw new ApiError(404, 'not-found', `No such file: ${rel}`)
  }
  if (allowedFile) return real
  const realRoots = await Promise.all(env.roots.map((r) => deps.realpath(resolve(env.workspaceRoot, r)).then((x) => x + sep).catch(() => '')))
  if (!realRoots.some((a) => a && real.startsWith(a))) throw new ApiError(403, 'not-allowed', 'The file resolves outside the allowed folders.')
  return real
}

async function figma(path: string, env: ApiEnv, deps: Deps): Promise<unknown> {
  if (!env.figmaToken) throw new ApiError(503, 'not-configured', 'No FIGMA_TOKEN in .env.local.')
  const res = await deps.fetch(`https://api.figma.com${path}`, { headers: { 'X-Figma-Token': env.figmaToken }, signal: AbortSignal.timeout(30_000) })
  if (res.status === 403) throw new ApiError(403, 'figma-forbidden', 'Figma refused access to this file or folder (check the token scopes and that the file is shared with you).')
  if (res.status === 404) throw new ApiError(404, 'figma-not-found', 'Figma has no file or folder with that key.')
  if (res.status === 429) throw new ApiError(429, 'figma-rate-limited', 'Figma rate limit reached; try again in a minute.')
  if (!res.ok) throw new ApiError(502, 'figma-error', `Figma returned ${res.status}.`)
  return res.json()
}

interface FNode { id: string; name: string; type: string; characters?: string; style?: { fontSize?: number }; absoluteBoundingBox?: { x: number; y: number }; children?: FNode[] }
export function slim(n: FNode): FNode {
  return { id: n.id, name: n.name, type: n.type, ...(n.characters ? { characters: n.characters } : {}), ...(n.style?.fontSize ? { style: { fontSize: n.style.fontSize } } : {}), ...(n.absoluteBoundingBox ? { absoluteBoundingBox: { x: n.absoluteBoundingBox.x, y: n.absoluteBoundingBox.y } } : {}), ...(n.children ? { children: n.children.map(slim) } : {}) }
}

/** Where each practice tool would run from (same rules as scripts/tools.mjs): your own clone in
 *  sources/, else a copy in tool-copies/, else only the read-only original in ../demo tools. */
export async function toolFiles(env: ApiEnv, deps: Deps): Promise<Record<string, { runFrom: 'sources' | 'copy' | 'original' | 'missing'; installed: boolean }>> {
  if (!env.appRoot) throw new ApiError(503, 'not-configured', 'The hub folder is unknown to the local server.')
  const exists = (p: string) => deps.stat(p).then(() => true, () => false)
  const servers = JSON.parse((await deps.readFile(resolve(env.appRoot, 'src/fixtures/tool-servers.json'))).toString('utf8')) as { id: string; dir: string }[]
  const out: Record<string, { runFrom: 'sources' | 'copy' | 'original' | 'missing'; installed: boolean }> = {}
  for (const s of servers) {
    const own = [['sources', resolve(env.appRoot, 'sources', s.dir)], ['copy', resolve(env.appRoot, 'tool-copies', s.dir)]] as const
    const found = (await Promise.all(own.map(async ([kind, dir]) => ((await exists(resolve(dir, 'package.json'))) ? { kind, dir } : null)))).find(Boolean)
    if (found) out[s.id] = { runFrom: found.kind, installed: await exists(resolve(found.dir, 'node_modules')) }
    else out[s.id] = { runFrom: (await exists(resolve(env.workspaceRoot, 'demo tools', s.dir, 'package.json'))) ? 'original' : 'missing', installed: false }
  }
  return out
}

export async function routeRequest(method: string, url: URL, body: unknown, env: ApiEnv, deps: Deps): Promise<{ status: number; body: unknown }> {
  const q = (k: string) => url.searchParams.get(k) ?? ''
  try {
    const route = url.pathname.replace(/^\/api/, '')
    if (method === 'GET' && route === '/status') {
      return { status: 200, body: { ok: true, model: { configured: Boolean(env.apiKey), model: env.model, fallbacks: env.fallbacks }, figma: { configured: Boolean(env.figmaToken) }, localRead: { configured: true, roots: env.roots } } }
    }
    if (method === 'POST' && route === '/generate') {
      if (!env.apiKey) throw new ApiError(503, 'not-configured', 'No ANTHROPIC_API_KEY in .env.local. The template composer still works.')
      const b = body as { kind?: string; system?: string; user?: string }
      if ((b.kind !== 'compose' && b.kind !== 'improve' && b.kind !== 'route') || typeof b.system !== 'string' || typeof b.user !== 'string') throw new ApiError(400, 'bad-request', 'Expected { kind: "compose" | "improve" | "route", system, user }.')
      if (b.kind === 'route' && b.user.length > 2_000) throw new ApiError(413, 'too-large', 'Keep the question to a sentence or two.')
      if (b.user.length > 400_000) throw new ApiError(413, 'too-large', 'The request is too large; select fewer sources.')
      const out = await deps.generate({ kind: b.kind, system: b.system, user: b.user, env })
      return { status: 200, body: { ok: true, ...out } }
    }
    if (method === 'GET' && route === '/figma/file') {
      const key = q('key')
      if (!/^[0-9a-zA-Z]{10,128}$/.test(key)) throw new ApiError(400, 'bad-request', 'A Figma file key is required.')
      const depth = Math.min(Math.max(Number(q('depth') || 2), 1), 2)
      const f = (await figma(`/v1/files/${key}?depth=${depth}`, env, deps)) as { name: string; version: string; lastModified: string; editorType?: string; document: FNode }
      return { status: 200, body: { ok: true, name: f.name, version: f.version, lastModified: f.lastModified, editorType: f.editorType, pages: (f.document.children ?? []).map((p) => ({ id: p.id, name: p.name, frames: (p.children ?? []).map((c) => ({ id: c.id, name: c.name, type: c.type })) })) } }
    }
    if (method === 'GET' && route === '/figma/nodes') {
      const key = q('key')
      const ids = q('ids').split(',').filter(Boolean)
      if (!key || !ids.length || ids.length > 20) throw new ApiError(400, 'bad-request', 'A file key and 1–20 node ids are required.')
      const r = (await figma(`/v1/files/${key}/nodes?ids=${encodeURIComponent(ids.join(','))}`, env, deps)) as { name: string; lastModified: string; version: string; nodes: Record<string, { document: FNode } | null> }
      const nodes: Record<string, FNode | null> = {}
      for (const [id, n] of Object.entries(r.nodes)) nodes[id] = n ? slim(n.document) : null
      return { status: 200, body: { ok: true, name: r.name, version: r.version, lastModified: r.lastModified, nodes } }
    }
    if (method === 'GET' && route === '/figma/projects') {
      const teamId = q('teamId')
      if (!/^\d+$/.test(teamId)) throw new ApiError(400, 'bad-request', 'A numeric team id is required.')
      return { status: 200, body: { ok: true, ...(await figma(`/v1/teams/${teamId}/projects`, env, deps) as object) } }
    }
    if (method === 'GET' && route === '/figma/project-files') {
      const projectId = q('projectId')
      if (!/^\d+$/.test(projectId)) throw new ApiError(400, 'bad-request', 'A numeric folder (project) id is required.')
      return { status: 200, body: { ok: true, ...(await figma(`/v1/projects/${projectId}/files`, env, deps) as object) } }
    }
    if (method === 'GET' && route === '/local/read') {
      const p = await safePath(q('path'), env, deps)
      const st = await deps.stat(p)
      if (st.size > 2_000_000) throw new ApiError(413, 'too-large', 'Files over 2 MB are not read.')
      const buf = await deps.readFile(p)
      return { status: 200, body: { ok: true, text: buf.toString('utf8'), md5: createHash('md5').update(buf).digest('hex'), mtime: st.mtimeMs, bytes: st.size } }
    }
    if (method === 'POST' && route === '/local/hash') {
      const paths = ((body as { paths?: string[] })?.paths ?? []).slice(0, 200)
      const hashes: Record<string, { md5: string; mtime: number } | null> = {}
      for (const rel of paths) {
        try {
          const p = await safePath(rel, env, deps)
          const st = await deps.stat(p)
          hashes[rel] = { md5: createHash('md5').update(await deps.readFile(p)).digest('hex'), mtime: st.mtimeMs }
        } catch {
          hashes[rel] = null
        }
      }
      return { status: 200, body: { ok: true, hashes } }
    }
    if (method === 'GET' && route === '/tools') {
      return { status: 200, body: { ok: true, tools: await toolFiles(env, deps) } }
    }
    if (method === 'GET' && route === '/tools/probe') {
      // Checked here so a stopped tool is a plain "down", not a refused connection in the browser
      // console. Only this machine: anything else is the browser's to check.
      let target: URL
      try {
        target = new URL(q('url'))
      } catch {
        throw new ApiError(400, 'bad-request', 'A full http(s) address is required.')
      }
      if (!/^https?:$/.test(target.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new ApiError(400, 'not-local', 'Only tools on this machine (localhost) are checked here.')
      const up = await deps.fetch(target.toString(), { method: 'HEAD', signal: AbortSignal.timeout(4000) }).then(() => true, () => false)
      return { status: 200, body: { ok: true, up } }
    }
    if (method === 'GET' && route === '/tools/starter/project') {
      const where = (await toolFiles(env, deps)).starter
      if (!where || (where.runFrom !== 'sources' && where.runFrom !== 'copy')) throw new ApiError(404, 'no-copy', 'The DS Configurator has no clone or copy here yet, so there is no saved set-up to read. Run: npm run tools -- copy starter')
      const servers = JSON.parse((await deps.readFile(resolve(env.appRoot!, 'src/fixtures/tool-servers.json'))).toString('utf8')) as { id: string; dir: string }[]
      const dir = servers.find((s) => s.id === 'starter')!.dir
      const rel = `${where.runFrom === 'sources' ? 'sources' : 'tool-copies'}/${dir}/ds.project.json`
      const abs = resolve(env.appRoot!, rel)
      let st: { size: number; mtimeMs: number }
      try {
        st = await deps.stat(abs)
      } catch {
        throw new ApiError(404, 'not-saved', `No set-up saved yet: ${rel} appears when you finish Set up system in the DS Configurator.`)
      }
      if (st.size > 2_000_000) throw new ApiError(413, 'too-large', 'The project file is over 2 MB; the hub does not read it.')
      return { status: 200, body: { ok: true, path: rel, mtime: st.mtimeMs, text: (await deps.readFile(abs)).toString('utf8') } }
    }
    throw new ApiError(404, 'not-found', `No route ${method} ${url.pathname}`)
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, body: { ok: false, code: e.code, error: e.message } }
    return { status: 500, body: { ok: false, code: 'internal', error: e instanceof Error ? e.message : String(e) } }
  }
}

/** The real model call (lazy-loads the SDK). Errors are mapped to ApiError codes. */
export const anthropicGenerate: GenerateFn = async ({ kind, system, user, env }) => {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod')
  const { ComposeSchema, ImproveSchema, RouteSchema } = await import('./schemas.ts')
  const client = new Anthropic({ apiKey: env.apiKey, timeout: 180_000, maxRetries: 1 })
  try {
    const res = await client.beta.messages.parse({
      model: env.model,
      max_tokens: kind === 'compose' ? 16_000 : kind === 'route' ? 1_000 : 8_000,
      system,
      messages: [{ role: 'user', content: [{ type: 'text', text: user, cache_control: { type: 'ephemeral' } }] }],
      output_config: { effort: kind === 'compose' ? 'medium' : 'low', format: betaZodOutputFormat(kind === 'compose' ? ComposeSchema : kind === 'route' ? RouteSchema : ImproveSchema) },
      ...(env.fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    })
    if (res.stop_reason === 'refusal') throw new ApiError(422, 'refused', `The model declined this request${res.stop_details?.category ? ` (${res.stop_details.category})` : ''}. The template draft is unchanged.`)
    if (res.stop_reason === 'max_tokens') throw new ApiError(502, 'truncated', 'The model ran out of output tokens. Select fewer sources or use "Improve with AI" per section.')
    if (!res.parsed_output) throw new ApiError(502, 'invalid-json', 'The model returned output that did not match the schema.')
    return { data: res.parsed_output, model: res.model, usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, cacheReadTokens: res.usage.cache_read_input_tokens ?? 0 } }
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (e instanceof Anthropic.AuthenticationError) throw new ApiError(401, 'auth', 'The Anthropic API key was rejected.')
    if (e instanceof Anthropic.PermissionDeniedError) throw new ApiError(403, 'forbidden', 'This key cannot use that model.')
    if (e instanceof Anthropic.NotFoundError) throw new ApiError(404, 'model-not-found', `Unknown model "${env.model}". Check ANTHROPIC_MODEL.`)
    if (e instanceof Anthropic.RateLimitError) throw new ApiError(429, 'rate-limited', 'Rate limited by the Anthropic API; try again shortly.')
    if (e instanceof Anthropic.BadRequestError) throw new ApiError(400, 'bad-request', e.message)
    if (e instanceof Anthropic.APIConnectionTimeoutError) throw new ApiError(504, 'timeout', 'The model call timed out.')
    if (e instanceof Anthropic.APIConnectionError) throw new ApiError(502, 'network', 'Could not reach the Anthropic API.')
    if (e instanceof Anthropic.APIError) throw new ApiError(502, 'overloaded', `The Anthropic API returned ${e.status ?? 'an error'}; try again shortly.`)
    throw e
  }
}

const realDeps: Deps = { fetch: (...a) => fetch(...a), readFile: (p) => readFile(p), stat: (p) => stat(p), realpath: (p) => realpath(p), generate: anthropicGenerate }

function middleware(getEnv: () => ApiEnv): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url?.startsWith('/api/')) return next()
    const url = new URL(req.url, 'http://localhost')
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', async () => {
      let body: unknown = undefined
      if (chunks.length) {
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          body = undefined
        }
      }
      const out = await routeRequest(req.method ?? 'GET', url, body, getEnv(), realDeps)
      res.statusCode = out.status
      res.setHeader('content-type', 'application/json')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify(out.body))
    })
  }
}

export function localApi(appRoot: string): Plugin {
  let env: ApiEnv
  return {
    name: 'udt-local-api',
    configResolved(config) {
      env = envFrom({ ...loadEnv(config.mode, appRoot, ''), ...process.env } as Record<string, string | undefined>, resolve(appRoot, '..'), appRoot)
    },
    configureServer(server) {
      server.middlewares.use(middleware(() => env))
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(() => env))
    },
  }
}
