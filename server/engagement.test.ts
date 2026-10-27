// The Engagement calendar reads Marketing Studio's own files: its front matter subset, both folder
// layouts (a checkout or one brand), posts only, and images only from inside a folder's assets.
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { assetPath, coerce, listPosts, parseFolders, parseFrontmatter, type StudioIO } from './engagement'

const POST = `---
id: nd-01-li
type: post
title: "The system \\"says\\" no"
status: scheduled
brand: me
surface: linkedin
format: video
mode: nagarro
scheduled_date: 2026-11-03T09:30:00+00:00
posted_at: null
first_comment: "Link in the comments"
assets: [assets/nd-01-li/cover.png, assets/nd-01-li/clip.webm]
trypost: { post_id: 12, synced_at: null }
---

We asked for a screen in a colour our design system does not have.
`

function memIO(files: Record<string, string>): StudioIO {
  const norm = (p: string) => resolve(p)
  const all = Object.keys(files).map(norm)
  return {
    readdir: async (d) => {
      const dir = norm(d) + '/'
      const names = new Set(all.filter((f) => f.startsWith(dir)).map((f) => f.slice(dir.length).split('/')[0]))
      if (!names.size) throw new Error('ENOENT')
      return [...names]
    },
    readFile: async (p) => Buffer.from(files[Object.keys(files).find((k) => norm(k) === norm(p))!] ?? ''),
    isDir: async (p) => all.some((f) => f.startsWith(norm(p) + '/')),
    realpath: async (p) => norm(p),
  }
}

describe('front matter', () => {
  it('reads the subset Marketing Studio writes', () => {
    const { meta, body } = parseFrontmatter(POST)
    expect(meta).toMatchObject({ id: 'nd-01-li', type: 'post', title: 'The system "says" no', status: 'scheduled', posted_at: null, assets: ['assets/nd-01-li/cover.png', 'assets/nd-01-li/clip.webm'], trypost: { post_id: 12, synced_at: null } })
    expect(body.startsWith('We asked')).toBe(true)
    expect(coerce('[a, "b, c", 3]')).toEqual(['a', 'b, c', 3])
    expect(parseFrontmatter('no front matter').meta).toEqual({})
  })

  it('reads the folders setting, with names and ~', () => {
    expect(parseFolders('Raquel=~/Claude/ms; Hugo = /data/hugo', '/Users/r')).toEqual([
      { person: 'Raquel', path: '/Users/r/Claude/ms' },
      { person: 'Hugo', path: '/data/hugo' },
    ])
    expect(parseFolders(undefined)).toEqual([])
  })
})

describe('reading folders', () => {
  const io = memIO({
    '/ms/brands/me/content/nd-01-li.md': POST,
    '/ms/brands/me/content/an-idea.md': '---\nid: an-idea\ntype: idea\ntitle: An idea\n---\nIdea body',
    '/ms/brands/me/assets/nd-01-li/cover.png': 'png',
    '/hugo/content/h-01-li.md': '---\nid: h-01-li\ntype: post\ntitle: Hugo’s post\nstatus: published\nsurface: linkedin\nformat: text\nposted_at: 2026-10-20T10:00:00+01:00\n---\nText',
  })
  const folders = [
    { person: 'Raquel', path: '/ms' },
    { person: 'Hugo', path: '/hugo' },
    { person: 'Rui', path: '/nowhere' },
  ]

  it('lists posts (not ideas) from a checkout and from a brand folder, with who and where', async () => {
    const out = await listPosts(folders, io)
    expect(out.posts.map((p) => [p.id, p.person, p.workspace])).toEqual([
      ['nd-01-li', 'Raquel', 'brands/me'],
      ['h-01-li', 'Hugo', ''],
    ])
    expect(out.posts[0]).toMatchObject({ status: 'scheduled', scheduledDate: '2026-11-03T09:30:00+00:00', file: 'brands/me/content/nd-01-li.md', firstComment: 'Link in the comments' })
    expect(out.folders).toEqual([
      { person: 'Raquel', path: '/ms', found: true, posts: 1 },
      { person: 'Hugo', path: '/hugo', found: true, posts: 1 },
      { person: 'Rui', path: '/nowhere', found: false, posts: 0 },
    ])
  })

  it('serves only images inside the folder’s assets', async () => {
    expect(await assetPath(folders, 0, 'brands/me', 'assets/nd-01-li/cover.png', io)).toBe(resolve('/ms/brands/me/assets/nd-01-li/cover.png'))
    for (const [w, p] of [
      ['brands/me', 'assets/../content/nd-01-li.md'],
      ['brands/me', 'content/nd-01-li.md'],
      ['brands/../..', 'assets/x.png'],
      ['brands/me', 'assets/nd-01-li/clip.webm'],
    ]) await expect(assetPath(folders, 0, w, p, io)).rejects.toThrow()
    await expect(assetPath(folders, 9, 'brands/me', 'assets/a.png', io)).rejects.toThrow()
  })
})
