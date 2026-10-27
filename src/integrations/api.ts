// The browser side of the local server (server/local-api.ts). Every call is same-origin /api/…;
// keys stay on the server. "not-configured" and "offline" are normal states, not failures:
// the hub keeps working on templates, uploads and the bundled knowledge snapshot.

export class IntegrationError extends Error {
  constructor(public code: string, message: string, public status = 0) {
    super(message)
  }
}

async function call<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new IntegrationError('offline', 'The local server is not running, so this needs `npm run dev`.')
  }
  const text = await res.text()
  let body: { ok?: boolean; code?: string; error?: string } & Record<string, unknown>
  try {
    body = JSON.parse(text)
  } catch {
    throw new IntegrationError('offline', 'The local server is not running (this looks like a static build).', res.status)
  }
  if (!res.ok || body.ok === false) throw new IntegrationError(body.code ?? 'error', body.error ?? `Request failed (${res.status})`, res.status)
  return body as T
}

export interface IntegrationStatus {
  model: { configured: boolean; model?: string; fallbacks?: boolean }
  figma: { configured: boolean }
  localRead: { configured: boolean; roots: string[] }
  offline?: boolean
}

export const OFFLINE_STATUS: IntegrationStatus = { model: { configured: false }, figma: { configured: false }, localRead: { configured: false, roots: [] }, offline: true }

export async function getStatus(): Promise<IntegrationStatus> {
  try {
    return await call<IntegrationStatus>('/api/status')
  } catch {
    return OFFLINE_STATUS
  }
}

export interface GenerateResult<T> { data: T; model: string; usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number } }

export function generate<T>(payload: { kind: 'compose' | 'improve' | 'route'; system: string; user: string }, signal?: AbortSignal) {
  return call<GenerateResult<T>>('/api/generate', { method: 'POST', body: JSON.stringify(payload), signal })
}

export function readLocal(path: string, signal?: AbortSignal) {
  return call<{ text: string; md5: string; mtime: number; bytes: number }>(`/api/local/read?path=${encodeURIComponent(path)}`, { signal })
}

export function hashLocal(paths: string[]) {
  return call<{ hashes: Record<string, { md5: string; mtime: number } | null> }>('/api/local/hash', { method: 'POST', body: JSON.stringify({ paths }) })
}

export interface FigmaFileInfo { name: string; version: string; lastModified: string; editorType?: string; pages: { id: string; name: string; frames: { id: string; name: string; type: string }[] }[] }

export function figmaFile(key: string, signal?: AbortSignal) {
  return call<FigmaFileInfo>(`/api/figma/file?key=${encodeURIComponent(key)}&depth=2`, { signal })
}

export function figmaNodes(key: string, ids: string[], signal?: AbortSignal) {
  return call<{ name: string; version: string; lastModified: string; nodes: Record<string, import('@/knowledge/extract/figmaText').RestNode | null> }>(`/api/figma/nodes?key=${encodeURIComponent(key)}&ids=${encodeURIComponent(ids.join(','))}`, { signal })
}

export function figmaProjects(teamId: string) {
  return call<{ name?: string; projects: { id: string; name: string }[] }>(`/api/figma/projects?teamId=${encodeURIComponent(teamId)}`)
}

export function figmaProjectFiles(projectId: string) {
  return call<{ name?: string; files: { key: string; name: string; last_modified?: string; thumbnail_url?: string }[] }>(`/api/figma/project-files?projectId=${encodeURIComponent(projectId)}`)
}

/** The ds.project.json the DS Configurator saved in your clone or copy (see GET /api/tools/starter/project). */
export function readStarterProject() {
  return call<{ path: string; mtime: number; text: string }>('/api/tools/starter/project')
}
