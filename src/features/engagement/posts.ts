// Engagement data: Nuno Almeida's Starter Pack posts (a read-once FigJam snapshot), drafts made in
// the workspace, and the hand-off to Hugo França's Marketing Studio. Nothing here posts anywhere.

import snapshot from '@/fixtures/posts.snapshot.json'
import nagarroDesign from '@/fixtures/posts.nagarro-design.json'
import type { PostDraft, PostFormat, PostKind, PostStatus } from '@/state/types'
import type { SocialCut } from '@/fixtures/social-cuts'

export interface BoardPost extends Omit<PostDraft, 'createdAt' | 'updatedAt'> {
  /** Where it lives: a FigJam card (Nuno's posts), the repository (shared drafts) or this browser (drafts made here). */
  origin: 'figjam' | 'shared' | 'workspace'
  /** Its cover picture and filmed clip, under media/ (made by npm run covers and npm run clips; not committed). */
  cover?: string
  clip?: string
  /** The FigJam card holding its video, carousel or picture. */
  figjam?: string
  media?: string
}

const FILE = snapshot.source.file
export const FIGJAM_BOARD = `https://www.figma.com/board/${FILE}/DS-Practice?node-id=${snapshot.source.page.replace(':', '-')}`
export const figjamUrl = (node: string) => `https://www.figma.com/board/${FILE}/DS-Practice?node-id=${node.replace(':', '-')}`
export const SNAPSHOT = snapshot.source

export const SNAPSHOT_POSTS: BoardPost[] = snapshot.posts.map((p) => ({
  id: p.id,
  title: p.title,
  format: p.format as PostFormat,
  kind: p.kind as PostKind,
  surface: p.surface as 'company' | 'personal',
  byline: p.byline,
  status: p.status as PostStatus,
  text: p.text,
  notes: p.notes,
  origin: 'figjam',
  figjam: figjamUrl(p.node),
  media: p.media,
}))

/** Drafts for the Nagarro Design page, shared through the repository (src/fixtures/posts.nagarro-design.json). */
export const SHARED_POSTS: BoardPost[] = nagarroDesign.posts.map((p) => ({
  id: p.id,
  title: p.title,
  format: p.format as PostFormat,
  kind: p.kind as PostKind,
  surface: p.surface as 'company' | 'personal',
  byline: p.byline,
  status: p.status as PostStatus,
  text: p.text,
  notes: p.notes,
  cutId: p.cutId,
  origin: 'shared',
  cover: `/${p.cover}`,
  clip: `/media/clips/${p.cutId}.webm`,
}))

export const FORMAT_LABEL: Record<PostFormat, string> = { video: 'Video', carousel: 'Carousel', image: 'Picture', article: 'Article', idea: 'Idea' }
export const FORMAT_ORDER: PostFormat[] = ['video', 'carousel', 'image', 'article', 'idea']
export const KIND_LABEL: Record<PostKind, string> = { 'show-the-work': 'Show the work', 'point-of-view': 'Point of view', 'field-notes': 'Field notes', 'lesson-learned': 'Lesson learned', insight: 'Insight' }
export const STATUS_LABEL: Record<PostStatus, string> = { idea: 'Idea', draft: 'Draft', 'in-review': 'In review', approved: 'Approved', posted: 'Posted' }
export const SURFACE_LABEL = { company: 'Nagarro Design page', personal: 'Own account' } as const

/** A first draft from a social cut: its hook, what the clip shows, and its notes. Written to be edited. */
export function draftFromCut(cut: SocialCut): Omit<PostDraft, 'id' | 'createdAt' | 'updatedAt'> {
  const shown = cut.shots.slice(0, -1).map((s) => s.caption.replace(/[.:]$/, ''))
  const close = cut.shots[cut.shots.length - 1]?.caption ?? ''
  return {
    title: cut.title,
    format: 'video',
    kind: 'show-the-work',
    surface: 'company',
    byline: 'Nagarro Design page',
    status: 'draft',
    text: `${cut.hook}\n\nIn the clip: ${shown.join('; ')}.\n\n${close}\n\n#designsystems #ai #designops`,
    notes: cut.notes,
    cutId: cut.id,
  }
}

/** A Marketing Studio id: lower case words joined by hyphens, as its scripts expect. */
export function studioId(title: string) {
  return (
    'nd-' +
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48)
  )
}

/**
 * The commands that put a post into Marketing Studio as an idea, with its own new_idea.py (so its
 * schema checks apply), then draft it with the marketeer plugin. Company posts use the studio's
 * nagarro mode (its Nagarro overlay decides what may be claimed); personal ones its personal mode.
 */
export function studioCommands(post: Pick<PostDraft, 'title' | 'text' | 'notes' | 'surface'>, folder: string) {
  const id = studioId(post.title)
  const mode = post.surface === 'company' ? 'nagarro' : 'personal'
  const body = [post.text || post.title, post.notes && `Where the facts come from: ${post.notes}`].filter(Boolean).join('\n\n')
  const title = post.title.replace(/(["\\$`])/g, '\\$1')
  // ~ only expands outside quotes: keep it bare and quote the rest.
  const quoted = (p: string) => `"${p.replace(/(["\\$`])/g, '\\$1')}"`
  const dir = folder.startsWith('~/') ? `~/${quoted(folder.slice(2))}` : quoted(folder)
  return {
    id,
    shell: `cd ${dir}\npython3 scripts/new_idea.py ${id} --title "${title}" --mode ${mode} --surfaces linkedin <<'POST_BODY'\n${body}\nPOST_BODY`,
    claude: `/marketeer:write-social-post ${id}`,
  }
}
