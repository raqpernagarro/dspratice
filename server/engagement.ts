// Engagement calendar: reads Marketing Studio's post files (Hugo França's tool; the files are its
// source of truth) from the folders set in MARKETING_STUDIO_FOLDERS, one per person:
//
//   MARKETING_STUDIO_FOLDERS="Raquel=~/Claude/marketing-studio; Hugo=~/OneDrive - Nagarro/Marketing/hugo"
//
// A folder is a Marketing Studio checkout (posts in brands/<brand>/content/*.md) or one brand folder
// (posts in content/*.md). Only these folders are read; media is served only from their assets/.
// The front matter is the subset Marketing Studio writes (scripts/lib/frontmatter.py): scalars,
// "quoted" strings, [a, b] lists and one-level { k: v } maps.

import { homedir } from 'node:os'
import { extname, resolve, sep } from 'node:path'

export interface StudioFolder {
  person: string
  path: string
}

export interface StudioPost {
  id: string
  person: string
  /** Index of the folder it came from (for assets). */
  folder: number
  /** Marketing Studio workspace, relative to the folder ('' when the folder is a brand). */
  workspace: string
  title: string
  status: string
  surface: string
  format: string
  scheduledDate: string | null
  postedAt: string | null
  firstComment: string
  /** Workspace-relative media paths (assets/<id>/<file>). */
  assets: string[]
  body: string
  file: string
}

export interface StudioIO {
  readdir: (dir: string) => Promise<string[]>
  readFile: (p: string) => Promise<Buffer>
  isDir: (p: string) => Promise<boolean>
  realpath: (p: string) => Promise<string>
}

export const IMAGE_TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }

export function parseFolders(raw: string | undefined, home = homedir()): StudioFolder[] {
  return (raw ?? '')
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const at = part.indexOf('=')
      const person = at > 0 ? part.slice(0, at).trim() : 'Me'
      const p = (at > 0 ? part.slice(at + 1) : part).trim().replace(/^["']|["']$/g, '')
      return { person, path: p.startsWith('~/') ? resolve(home, p.slice(2)) : resolve(p) }
    })
}

// ---- front matter (the subset Marketing Studio writes) ----

function unescape(inner: string) {
  return inner.replace(/\\(n|"|\\)/g, (_m, c: string) => (c === 'n' ? '\n' : c))
}

function splitTop(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of s) {
    if (quote) {
      cur += ch
      if (ch === quote && cur[cur.length - 2] !== '\\') quote = ''
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    if (ch === '[' || ch === '{') depth++
    if (ch === ']' || ch === '}') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map((x) => x.trim())
}

export function coerce(raw: string): unknown {
  const s = raw.trim()
  if (s === '' || ['null', '~', 'none'].includes(s.toLowerCase())) return null
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return unescape(s.slice(1, -1))
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1)
  if (s.startsWith('[') && s.endsWith(']')) return splitTop(s.slice(1, -1)).map(coerce)
  if (s.startsWith('{') && s.endsWith('}')) {
    const o: Record<string, unknown> = {}
    for (const pair of splitTop(s.slice(1, -1))) {
      const i = pair.indexOf(':')
      if (i > 0) o[pair.slice(0, i).trim()] = coerce(pair.slice(i + 1))
    }
    return o
  }
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true'
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  return s
}

export function parseFrontmatter(text: string): { meta: Record<string, unknown>; body: string } {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') return { meta: {}, body: text }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (end < 0) return { meta: {}, body: text }
  const meta: Record<string, unknown> = {}
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || line.trimStart().startsWith('#') || /^\s/.test(line)) continue
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = coerce(line.slice(i + 1))
  }
  return { meta, body: lines.slice(end + 1).join('\n').replace(/^\n+/, '') }
}

// ---- reading the folders ----

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v))

async function workspacesOf(folder: string, io: StudioIO): Promise<string[]> {
  if (await io.isDir(resolve(folder, 'brands'))) {
    const brands = await io.readdir(resolve(folder, 'brands')).catch(() => [])
    const out: string[] = []
    for (const b of brands) if (!b.startsWith('.') && (await io.isDir(resolve(folder, 'brands', b, 'content')))) out.push(`brands/${b}`)
    return out
  }
  return (await io.isDir(resolve(folder, 'content'))) ? [''] : []
}

export async function listPosts(folders: StudioFolder[], io: StudioIO): Promise<{ folders: { person: string; path: string; found: boolean; posts: number }[]; posts: StudioPost[] }> {
  const posts: StudioPost[] = []
  const report: { person: string; path: string; found: boolean; posts: number }[] = []
  for (const [index, f] of folders.entries()) {
    const workspaces = await workspacesOf(f.path, io).catch(() => [])
    let count = 0
    for (const ws of workspaces) {
      const dir = resolve(f.path, ws, 'content')
      const files = (await io.readdir(dir).catch(() => [])).filter((n) => n.endsWith('.md')).sort()
      for (const name of files) {
        const { meta, body } = parseFrontmatter((await io.readFile(resolve(dir, name))).toString('utf8'))
        if (meta.type !== 'post') continue
        posts.push({
          id: str(meta.id) || name.replace(/\.md$/, ''),
          person: f.person,
          folder: index,
          workspace: ws,
          title: str(meta.title) || name,
          status: str(meta.status) || 'draft',
          surface: str(meta.surface),
          format: str(meta.format),
          scheduledDate: str(meta.scheduled_date) || null,
          postedAt: str(meta.posted_at) || null,
          firstComment: str(meta.first_comment),
          assets: Array.isArray(meta.assets) ? meta.assets.map(str).filter(Boolean) : [],
          body: body.slice(0, 6000),
          file: [ws, 'content', name].filter(Boolean).join('/'),
        })
        count++
      }
    }
    report.push({ person: f.person, path: f.path, found: workspaces.length > 0, posts: count })
  }
  return { folders: report, posts }
}

/** The absolute path of one image asset, only inside <folder>/<workspace>/assets. Throws on anything else. */
export async function assetPath(folders: StudioFolder[], index: number, workspace: string, rel: string, io: StudioIO): Promise<string> {
  const f = folders[index]
  if (!f) throw new Error('no-folder')
  if (!/^(brands\/[^/\\]+)?$/.test(workspace) || workspace.split('/').includes('..')) throw new Error('bad-workspace')
  if (!rel.startsWith('assets/') || rel.split(/[\\/]/).includes('..') || !IMAGE_TYPES[extname(rel).toLowerCase()]) throw new Error('bad-path')
  const base = resolve(f.path, workspace, 'assets') + sep
  const abs = resolve(f.path, workspace, rel)
  if (!abs.startsWith(base)) throw new Error('bad-path')
  const real = await io.realpath(abs)
  const realBase = (await io.realpath(resolve(f.path, workspace, 'assets'))) + sep
  if (!real.startsWith(realBase)) throw new Error('bad-path')
  return real
}
