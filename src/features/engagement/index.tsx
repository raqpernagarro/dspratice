// Engagement: advocating design at Nagarro. Posts (Nuno Almeida's Starter Pack posts from FigJam,
// and drafts made here from our demos' social cuts) and Hugo França's Marketing Studio, which plans,
// drafts and scores them. The workspace never posts: a person does, by hand.

import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, Check, Clapperboard, Copy, ExternalLink, Send, Trash2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Chip, Field, Panel, Segmented, Sheet } from '@/shell/ui'
import { probe } from '@/integrations/tools'
import { SOCIAL_CUTS, socialCut } from '@/fixtures/social-cuts'
import { Calendar } from './Calendar'
import type { PostKind, PostStatus } from '@/state/types'
import { FIGJAM_BOARD, FORMAT_LABEL, FORMAT_ORDER, KIND_LABEL, SNAPSHOT, SNAPSHOT_POSTS, STATUS_LABEL, SURFACE_LABEL, studioCommands, type BoardPost } from './posts'

const TRYPOST = 'http://localhost:8000'
const FOLDER_KEY = 'unified-ds-tool:marketing-studio-folder'

function useStudioFolder() {
  const [folder, setFolder] = useState(() => {
    try {
      return localStorage.getItem(FOLDER_KEY) ?? '~/Claude/marketing-studio'
    } catch {
      return '~/Claude/marketing-studio'
    }
  })
  const save = (v: string) => {
    setFolder(v)
    try {
      localStorage.setItem(FOLDER_KEY, v)
    } catch {
      /* a convenience only */
    }
  }
  return [folder, save] as const
}

function CopyBlock({ text, label, testid }: { text: string; label: string; testid?: string }) {
  const [done, setDone] = useState(false)
  return (
    <div className="copy-block">
      <pre className="copy-block__code" data-testid={testid}>
        {text}
      </pre>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => {
          void navigator.clipboard?.writeText(text)
          setDone(true)
        }}
      >
        {done ? <Check /> : <Copy />} {done ? 'Copied' : label}
      </button>
    </div>
  )
}

function SendSheet({ post, onClose }: { post: BoardPost; onClose: () => void }) {
  const [folder, setFolder] = useStudioFolder()
  const cmd = studioCommands(post, folder)
  return (
    <Sheet title="Send to Marketing Studio" onClose={onClose} wide>
      <p className="small muted">
        Marketing Studio keeps every idea and draft as a file. This adds “{post.title}” as an idea with the studio’s own script, so its checks apply, in {post.surface === 'company' ? 'its Nagarro mode (company page rules)' : 'its personal mode'}. Then its writing skill drafts it for LinkedIn. Nothing is posted: you approve on its board and post by hand.
      </p>
      <Field label="Your Marketing Studio folder" hint="Where you unzipped it, inside your home folder (see the Marketing Studio tab).">
        <input className="input" value={folder} onChange={(e) => setFolder(e.target.value)} data-testid="studio-folder" />
      </Field>
      <p className="small">
        <strong>1.</strong> In Terminal:
      </p>
      <CopyBlock text={cmd.shell} label="Copy the command" testid="studio-command" />
      <p className="small">
        <strong>2.</strong> In Claude Code, opened in that folder:
      </p>
      <CopyBlock text={cmd.claude} label="Copy" />
      <p className="small muted">
        <strong>3.</strong> Then <code>python3 scripts/trypost_sync.py push</code> puts the drafts on the TryPost board at {TRYPOST}.
      </p>
    </Sheet>
  )
}

function EditSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const post = useStore((s) => s.practice.posts?.find((p) => p.id === id))
  const [title, setTitle] = useState(post?.title ?? '')
  const [text, setText] = useState(post?.text ?? '')
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft')
  const [surface, setSurface] = useState(post?.surface ?? 'company')
  if (!post) return null
  return (
    <Sheet
      title="Edit the draft"
      onClose={onClose}
      wide
      actions={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            data-testid="save-post"
            onClick={() => {
              act().updatePost(id, { title, text, status, surface, byline: surface === 'company' ? SURFACE_LABEL.company : post.byline === SURFACE_LABEL.company ? '' : post.byline })
              onClose()
            }}
          >
            Save
          </button>
        </>
      }
    >
      <Field label="Title">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="grid grid--2">
        <Field label="Where it goes">
          <select className="select" value={surface} onChange={(e) => setSurface(e.target.value as 'company' | 'personal')}>
            <option value="company">{SURFACE_LABEL.company}</option>
            <option value="personal">{SURFACE_LABEL.personal}</option>
          </select>
        </Field>
        <Field label="Status">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as PostStatus)} data-testid="post-status">
            {(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="The post, as it will be pasted" hint="Lead with the claim, keep it under the “…see more” cut, end on a question.">
        <textarea className="input" rows={10} value={text} onChange={(e) => setText(e.target.value)} data-testid="post-text" />
      </Field>
      <p className="xs muted">Where the facts come from: {post.notes}</p>
    </Sheet>
  )
}

function PostCard({ post, onSend, onEdit }: { post: BoardPost; onSend: (p: BoardPost) => void; onEdit?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const cut = post.cutId ? socialCut(post.cutId) : undefined
  return (
    <article className="post" data-testid={`post-${post.id}`}>
      <div className={`post__media post__media--${post.format}${post.cover ? ' post__media--cover' : ''}`} style={post.cover ? { backgroundImage: `url("${post.cover}")` } : undefined}>
        <span className="post__format">{FORMAT_LABEL[post.format]}</span>
        {post.media && <span className="post__media-text">{post.media}</span>}
        {post.figjam && (
          <a className="post__media-link" href={post.figjam} target="_blank" rel="noreferrer">
            Open in FigJam <ExternalLink />
          </a>
        )}
        {post.clip && (
          <a className="post__media-link" href={post.clip} target="_blank" rel="noreferrer">
            <Clapperboard /> The filmed clip
          </a>
        )}
        {post.cover && (
          <a className="post__media-link" href={post.cover} target="_blank" rel="noreferrer">
            The cover <ExternalLink />
          </a>
        )}
        {cut && !post.clip && (
          <Link className="post__media-link" to={`${practice.engagement}/cuts/${cut.id}`}>
            <Clapperboard /> Play the cut
          </Link>
        )}
      </div>
      <div className="post__body">
        <strong className="post__title">{post.title}</strong>
        <span className="xs muted">
          {SURFACE_LABEL[post.surface]}
          {post.byline && post.byline !== SURFACE_LABEL.company ? ` · ${post.byline}` : ''}
          {post.origin === 'workspace' ? ' · made here' : post.origin === 'shared' ? ' · shared' : ''}
        </span>
        <div className="ptile__chips" style={{ padding: 0 }}>
          <Chip tone="outline">{KIND_LABEL[post.kind]}</Chip>
          <Chip tone={post.status === 'posted' ? 'ok' : post.status === 'idea' ? 'default' : 'warn'}>{STATUS_LABEL[post.status]}</Chip>
        </div>
        {post.text ? (
          <>
            <p className={`post__text${open ? ' is-open' : ''}`}>{post.text}</p>
            <button type="button" className="link-arrow post__more" onClick={() => setOpen(!open)}>
              {open ? 'Show less' : 'Read the post'}
            </button>
          </>
        ) : (
          <p className="post__text is-open muted">Not written yet. {post.notes}</p>
        )}
        {open && post.notes && post.text && <p className="xs muted">Where the facts come from: {post.notes}</p>}
        <div className="row post__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => onSend(post)} data-testid={`send-${post.id}`}>
            <Send /> Send to Marketing Studio
          </button>
          {onEdit && (
            <>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => onEdit(post.id)}>
                Edit
              </button>
              <button type="button" className="icon-btn" aria-label={`Delete ${post.title}`} onClick={() => act().deletePost(post.id)}>
                <Trash2 />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

function PostsTab() {
  const drafts = useStore((s) => s.practice.posts) ?? []
  const [params, setParams] = useSearchParams()
  const [surface, setSurface] = useState<'all' | 'company' | 'personal'>('all')
  const [kind, setKind] = useState<PostKind | ''>('')
  const [sending, setSending] = useState<BoardPost | null>(null)
  const [editing, setEditing] = useState<string | null>(params.get('draft'))
  useEffect(() => {
    if (params.get('draft')) {
      const next = new URLSearchParams(params)
      next.delete('draft')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const mine: BoardPost[] = drafts.map((d) => ({ ...d, origin: 'workspace' }))
  const keep = (p: BoardPost) => (surface === 'all' || p.surface === surface) && (!kind || p.kind === kind)
  const groups = useMemo(() => FORMAT_ORDER.map((f) => ({ f, posts: SNAPSHOT_POSTS.filter((p) => p.format === f && keep(p)) })).filter((g) => g.posts.length), [surface, kind])

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="board-filters">
        <Segmented ariaLabel="Where it goes" value={surface} onChange={setSurface} options={[{ id: 'all', label: 'All' }, { id: 'company', label: 'Nagarro Design page' }, { id: 'personal', label: 'Own accounts' }]} />
        <select className="select" value={kind} onChange={(e) => setKind(e.target.value as PostKind | '')} aria-label="Kind of post" data-testid="post-kind">
          <option value="">Any kind</option>
          {(Object.keys(KIND_LABEL) as PostKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </div>

      <section className="stack" aria-labelledby="drafts-title">
        <h2 id="drafts-title" className="section-title">
          Drafts made here <span className="muted">{mine.filter(keep).length}</span>
        </h2>
        {mine.filter(keep).length ? (
          <div className="post-grid" data-testid="drafts">
            {mine.filter(keep).map((p) => (
              <PostCard key={p.id} post={p} onSend={setSending} onEdit={setEditing} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No drafts yet.</strong>
            <span className="muted">Open a social cut in Demos and choose “Make a post”: it starts a draft from the cut’s hook and notes.</span>
            <Link className="btn btn--secondary btn--sm" to={practice.demos}>
              Go to Demos
            </Link>
          </div>
        )}
      </section>

      <section className="stack" aria-labelledby="nuno-title">
        <div className="row row--between" style={{ alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h2 id="nuno-title" className="section-title">
            Starter Pack posts <span className="muted">{SNAPSHOT_POSTS.length}</span>
          </h2>
          <span className="xs muted">
            By {SNAPSHOT.author}, status as of {SNAPSHOT.statusAsOf}. Read once from{' '}
            <a href={FIGJAM_BOARD} target="_blank" rel="noreferrer">
              the FigJam board
            </a>
            ; the videos and pictures stay there.
          </span>
        </div>
        {groups.map((g) => (
          <div key={g.f} className="stack">
            <h3 className="post-group">
              {FORMAT_LABEL[g.f]}
              {g.f === 'idea' ? 's, not written yet' : g.posts.length > 1 ? 's' : ''} · {g.posts.length}
            </h3>
            <div className="post-grid">
              {g.posts.map((p) => (
                <PostCard key={p.id} post={p} onSend={setSending} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {sending && <SendSheet post={sending} onClose={() => setSending(null)} />}
      {editing && <EditSheet id={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function StudioTab() {
  const [up, setUp] = useState<boolean | null>(null)
  const [folder, setFolder] = useStudioFolder()
  const check = () => {
    setUp(null)
    void probe(TRYPOST, '/').then(setUp)
  }
  useEffect(check, [])
  return (
    <div className="grid grid--2" style={{ alignItems: 'start' }}>
      <div className="stack">
        <Panel title="Marketing Studio, by Hugo França" tight>
          <p className="small">A personal content system for advocating our work. It finds topics, suggests and scores ideas, drafts in your voice for LinkedIn, Instagram, X, Viva Engage and Substack, and keeps track of what still needs to go out.</p>
          <ul className="small tight-list">
            <li>
              <strong>The files are the truth:</strong> every idea and draft is a Markdown file in its brands/me folder.
            </li>
            <li>
              <strong>TryPost</strong> is the board where you see, edit and approve drafts, on this machine at {TRYPOST}.
            </li>
            <li>
              <strong>The marketeer plugin</strong> for Claude Code writes, scores, reviews and repurposes.
            </li>
            <li>
              <strong>It never publishes.</strong> You post by hand and mark it posted.
            </li>
          </ul>
          <p className="small muted">For posts on the Nagarro Design page, use its Nagarro mode: its Nagarro overlay file says what may be named and claimed. Fill that file in before the first company post.</p>
        </Panel>
        <Panel title="The week" tight>
          <ol className="small tight-list">
            <li>
              Monday, in Claude Code in the studio folder: <code>/marketeer:run monday</code> plans the week and suggests ideas.
            </li>
            <li>Approve ideas on the TryPost board (drag from Unassigned to To Do).</li>
            <li>
              <code>/marketeer:run draft</code> drafts what you approved, scores and reviews it, and pushes it to TryPost.
            </li>
            <li>Post by hand, then mark it posted. Our demos’ social cuts are ready-made material for show-the-work posts.</li>
          </ol>
        </Panel>
      </div>
      <div className="stack">
        <Panel
          title="On this machine"
          tight
          actions={
            <button type="button" className="btn btn--secondary btn--sm" onClick={check}>
              Check again
            </button>
          }
        >
          <p className="small" data-testid="trypost-status">
            TryPost at {TRYPOST}: <strong>{up === null ? 'checking…' : up ? 'running' : 'not running'}</strong>
          </p>
          {up && (
            <a className="btn btn--primary btn--sm" href={TRYPOST} target="_blank" rel="noreferrer">
              <ExternalLink /> Open the TryPost board
            </a>
          )}
          <Field label="Your Marketing Studio folder" hint="Used in the commands this workspace gives you.">
            <input className="input" value={folder} onChange={(e) => setFolder(e.target.value)} />
          </Field>
        </Panel>
        {up === false && (
          <Panel title="Set it up (about 30 minutes, once)" tight>
            <p className="small muted">For a Mac with Apple Silicon. Full steps in INSTALL.md inside the zip.</p>
            <ol className="small tight-list" data-testid="studio-install">
              <li>
                Unzip <code>demo tools/Install-Marketing-Studio/marketing-studio.zip</code> into your home folder, for example ~/Claude/marketing-studio (not Desktop or Downloads: Docker only sees your home folder).
              </li>
              <li>
                Install Docker through Colima and start it: <code>brew install colima docker docker-compose</code>, then <code>colima start --cpu 4 --memory 6</code>.
              </li>
              <li>
                In the folder: <code>sh trypost/setup.sh</code> (5 to 15 minutes the first time), then <code>sh trypost/create-user.sh</code> and <code>sh trypost/make-channels.sh</code>.
              </li>
              <li>In TryPost, generate an API key and paste it into trypost/.env. Never share that file.</li>
              <li>
                Fill in your brand in brands/me (voice, pillars, five of your own posts), then <code>claude</code> and <code>/plugin</code> to check marketeer is there.
              </li>
            </ol>
          </Panel>
        )}
      </div>
    </div>
  )
}

function CutsTab() {
  return (
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>
        Short captioned clips of our demos, zoomed for phones, for posts. Each one plays on the real client demo and can be filmed as a video with npm run clips.
      </p>
      <ul className="continue-list" data-testid="social-cuts">
        {SOCIAL_CUTS.map((c) => (
          <li key={c.id}>
            <Link to={`${practice.engagement}/cuts/${c.id}`} className="continue-item">
              <Chip tone="outline">4:5 · {c.shots.reduce((t, x) => t + x.seconds, 0)}s</Chip>
              <span className="continue-item__main">
                <strong>{c.title}</strong>
                <span className="small muted">{c.hook}</span>
              </span>
              <ArrowRight className="continue-item__arrow" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

type Tab = 'calendar' | 'posts' | 'cuts' | 'studio' | 'trypost'

export function EngagementPage() {
  const [params, setParams] = useSearchParams()
  const [trypost, setTrypost] = useState(false)
  useEffect(() => {
    void probe(TRYPOST, '/').then(setTrypost)
  }, [])
  const asked = params.get('tab') as Tab | null
  const tab: Tab = asked && ['posts', 'cuts', 'studio', 'trypost'].includes(asked) && (asked !== 'trypost' || trypost) ? asked : 'calendar'
  return (
    <div className="page">
      <PageHead title="Engagement" lead="What the practice plans and publishes to advocate design at Nagarro, and the tools to make it. Nothing is posted from here." />
      <Segmented
        ariaLabel="Engagement"
        value={tab}
        onChange={(t) => setParams(t === 'calendar' ? {} : { tab: t }, { replace: true })}
        options={[
          { id: 'calendar', label: 'Calendar' },
          { id: 'posts', label: 'Posts' },
          { id: 'cuts', label: 'Social cuts' },
          { id: 'studio', label: 'Marketing Studio' },
          ...(trypost ? [{ id: 'trypost' as Tab, label: 'TryPost' }] : []),
        ]}
      />
      {tab === 'calendar' && <Calendar />}
      {tab === 'posts' && <PostsTab />}
      {tab === 'cuts' && <CutsTab />}
      {tab === 'studio' && <StudioTab />}
      {tab === 'trypost' && <iframe className="trypost-frame" src={TRYPOST} title="TryPost: Marketing Studio’s board" data-testid="trypost-frame" />}
    </div>
  )
}
