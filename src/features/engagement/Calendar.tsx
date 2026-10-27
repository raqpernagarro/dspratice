// Engagement › Calendar: what we plan and publish, by day, by whom, on which network, drawn from
// Marketing Studio's post files (the folders in MARKETING_STUDIO_FOLDERS). Three states, as in
// TryPost: Draft (no date), Planned (a date, not published), Published. Nothing is invented: with
// no folder set, the tray holds Nuno Almeida's Starter Pack posts from the FigJam snapshot.

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Chip, Segmented, Sheet } from '@/shell/ui'
import { initials } from '@/state/card'
import { studioAssetUrl, studioPosts, type StudioFolderReport, type StudioPost } from '@/integrations/api'
import { SNAPSHOT, SNAPSHOT_POSTS } from './posts'

type State = 'draft' | 'planned' | 'published'

export interface CalItem {
  key: string
  title: string
  person: string
  surface: string
  format: string
  state: State
  date: Date | null
  thumb?: string
  body: string
  firstComment: string
  file: string
  source: 'studio' | 'snapshot'
  media: string[]
}

const NETWORK: Record<string, string> = { linkedin: 'LinkedIn', instagram: 'Instagram', x: 'X', viva: 'Viva Engage', substack: 'Substack' }
const NET_SHORT: Record<string, string> = { linkedin: 'in', instagram: 'IG', x: 'X', viva: 'VE', substack: 'S' }
const STATE_LABEL: Record<State, string> = { draft: 'Draft', planned: 'Planned', published: 'Published' }
const IMAGE = /\.(png|jpe?g|gif|webp)$/i
const DAY = 24 * 60 * 60 * 1000

/** Marketing Studio's statuses folded into TryPost's three. */
export function toItem(p: StudioPost): CalItem {
  const published = p.status === 'published' || Boolean(p.postedAt)
  const when = p.postedAt ?? p.scheduledDate
  const date = when && !Number.isNaN(Date.parse(when)) ? new Date(when) : null
  const image = p.assets.find((a) => IMAGE.test(a))
  return {
    key: `${p.folder}:${p.file}`,
    title: p.title,
    person: p.person,
    surface: p.surface,
    format: p.format,
    state: published ? 'published' : date ? 'planned' : 'draft',
    date,
    thumb: image ? studioAssetUrl(p, image) : undefined,
    body: p.body,
    firstComment: p.firstComment,
    file: p.file,
    source: 'studio',
    media: p.assets,
  }
}

function snapshotItems(): CalItem[] {
  return SNAPSHOT_POSTS.filter((p) => p.text).map((p) => ({ key: `snap:${p.id}`, title: p.title, person: SNAPSHOT.author, surface: 'linkedin', format: p.format, state: 'draft', date: null, body: p.text, firstComment: '', file: `FigJam card · ${p.byline}`, source: 'snapshot', media: [] }))
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return new Date(x.getTime() - ((x.getDay() + 6) % 7) * DAY)
}

function Thumb({ it, big }: { it: CalItem; big?: boolean }) {
  return it.thumb ? (
    <img className={big ? 'cal-thumb cal-thumb--big' : 'cal-thumb'} src={it.thumb} alt="" loading="lazy" />
  ) : (
    <span className={`${big ? 'cal-thumb cal-thumb--big' : 'cal-thumb'} cal-thumb--net`} aria-hidden="true">
      {NET_SHORT[it.surface] ?? '·'}
    </span>
  )
}

function Card({ it, onOpen, big }: { it: CalItem; onOpen: (it: CalItem) => void; big?: boolean }) {
  return (
    <button type="button" className={`cal-card cal-card--${it.state}${big ? ' cal-card--big' : ''}`} onClick={() => onOpen(it)} data-testid="cal-card">
      <Thumb it={it} big={big} />
      <span className="cal-card__main">
        <span className="cal-card__title">{it.title}</span>
        <span className="cal-card__meta">
          {it.date && it.date.getHours() + it.date.getMinutes() > 0 ? `${String(it.date.getHours()).padStart(2, '0')}:${String(it.date.getMinutes()).padStart(2, '0')} · ` : ''}
          {NETWORK[it.surface] ?? it.surface}
        </span>
      </span>
      <span className="cal-avatar" title={it.person}>
        {initials(it.person)}
      </span>
    </button>
  )
}

export function Calendar() {
  const [data, setData] = useState<{ state: 'loading' | 'ready' | 'offline'; folders: StudioFolderReport[]; posts: StudioPost[] }>({ state: 'loading', folders: [], posts: [] })
  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [person, setPerson] = useState('')
  const [surface, setSurface] = useState('')
  const [state, setState] = useState<State | ''>('')
  const [open, setOpen] = useState<CalItem | null>(null)

  useEffect(() => {
    const ctl = new AbortController()
    studioPosts(ctl.signal).then(
      (r) => setData({ state: 'ready', folders: r.folders, posts: r.posts }),
      () => setData({ state: 'offline', folders: [], posts: [] }),
    )
    return () => ctl.abort()
  }, [])

  const configured = data.folders.length > 0
  const items = useMemo(() => (configured ? data.posts.map(toItem) : snapshotItems()), [configured, data.posts])
  const people = [...new Set(items.map((i) => i.person))].sort()
  const networks = [...new Set(items.map((i) => i.surface).filter(Boolean))].sort()
  const shown = items.filter((i) => (!person || i.person === person) && (!surface || i.surface === surface) && (!state || i.state === state))
  const dated = shown.filter((i) => i.date).sort((a, b) => a.date!.getTime() - b.date!.getTime())
  const tray = shown.filter((i) => !i.date)

  const today = new Date()
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeek(view === 'month' ? monthStart : anchor)
  const days = Array.from({ length: view === 'month' ? 42 : 7 }, (_, i) => new Date(gridStart.getTime() + i * DAY + 2 * 60 * 60 * 1000))
  const shift = (by: number) => setAnchor((a) => (view === 'month' ? new Date(a.getFullYear(), a.getMonth() + by, 1) : new Date(a.getTime() + by * 7 * DAY)))
  const label = view === 'month' ? anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : `Week of ${gridStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const counts = { draft: items.filter((i) => i.state === 'draft').length, planned: items.filter((i) => i.state === 'planned').length, published: items.filter((i) => i.state === 'published').length }

  return (
    <div className="stack" style={{ gap: 18 }}>
      {data.state === 'offline' && <p className="small" style={{ color: 'var(--n-warn)' }}>The local server is not running, so Marketing Studio’s folders cannot be read. Start the workspace with npm run dev.</p>}
      {data.state === 'ready' && !configured && (
        <div className="cal-setup" data-testid="cal-setup">
          <strong>Connect Marketing Studio to see the calendar</strong>
          <span className="small muted">
            Add each person’s Marketing Studio folder to <code>.env.local</code>, then restart the workspace. A shared folder (for example on OneDrive) lets everyone see each other’s posts:
          </span>
          <code className="code-inline">MARKETING_STUDIO_FOLDERS="Raquel=~/Claude/marketing-studio; Hugo=~/OneDrive - Nagarro/Marketing Studio/hugo"</code>
          <span className="xs muted">Until then, the tray below holds Nuno Almeida’s Starter Pack posts (FigJam snapshot, status as of {SNAPSHOT.statusAsOf}); they have no dates yet.</span>
        </div>
      )}
      {configured && (
        <div className="row xs muted" style={{ gap: 14, flexWrap: 'wrap' }} data-testid="cal-folders">
          {data.folders.map((f) => (
            <span key={f.person + f.path} title={f.path}>
              {f.person}: {f.found ? `${f.posts} post${f.posts === 1 ? '' : 's'}` : 'folder not found'}
            </span>
          ))}
        </div>
      )}

      <div className="cal-toolbar">
        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft />
          </button>
          <strong className="cal-toolbar__label" data-testid="cal-label">
            {label}
          </strong>
          <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight />
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAnchor(new Date())}>
            Today
          </button>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person" data-testid="cal-person">
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select className="select" value={surface} onChange={(e) => setSurface(e.target.value)} aria-label="Network">
            <option value="">Every network</option>
            {networks.map((n) => (
              <option key={n} value={n}>
                {NETWORK[n] ?? n}
              </option>
            ))}
          </select>
          <select className="select" value={state} onChange={(e) => setState(e.target.value as State | '')} aria-label="Status" data-testid="cal-state">
            <option value="">Draft, planned, published</option>
            {(['draft', 'planned', 'published'] as State[]).map((s) => (
              <option key={s} value={s}>
                {STATE_LABEL[s]} ({counts[s]})
              </option>
            ))}
          </select>
          <Segmented ariaLabel="View" value={view} onChange={setView} options={[{ id: 'month', label: 'Month' }, { id: 'week', label: 'Week' }]} />
        </div>
      </div>

      <div className={`cal cal--${view}`} role="grid" aria-label={label} data-testid="cal-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="cal__dow" role="columnheader">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const list = dated.filter((i) => sameDay(i.date!, d))
          const out = view === 'month' && d.getMonth() !== anchor.getMonth()
          return (
            <div key={d.toISOString()} className={`cal__day${out ? ' is-out' : ''}${sameDay(d, today) ? ' is-today' : ''}`} role="gridcell" data-day={d.toISOString().slice(0, 10)}>
              <span className="cal__date">{d.getDate()}</span>
              {(view === 'month' ? list.slice(0, 3) : list).map((it) => (
                <Card key={it.key} it={it} onOpen={setOpen} big={view === 'week'} />
              ))}
              {view === 'month' && list.length > 3 && (
                <button type="button" className="cal__more" onClick={() => setOpen(list[3])}>
                  +{list.length - 3} more
                </button>
              )}
            </div>
          )
        })}
      </div>

      <section className="stack" aria-labelledby="tray-title">
        <h3 id="tray-title" className="section-title">
          Not scheduled <span className="muted">{tray.length}</span>
        </h3>
        {tray.length ? (
          <div className="cal-tray" data-testid="cal-tray">
            {tray.map((it) => (
              <Card key={it.key} it={it} onOpen={setOpen} big />
            ))}
          </div>
        ) : (
          <p className="small muted">Every post has a date.</p>
        )}
      </section>

      {open && (
        <Sheet title={open.title} onClose={() => setOpen(null)} wide>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Chip tone={open.state === 'published' ? 'ok' : open.state === 'planned' ? 'info' : 'default'}>{STATE_LABEL[open.state]}</Chip>
            <Chip tone="outline">{NETWORK[open.surface] ?? open.surface}</Chip>
            {open.format && <Chip tone="outline">{open.format}</Chip>}
            <span className="small muted">
              {open.person}
              {open.date ? ` · ${open.date.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ' · no date yet'}
            </span>
          </div>
          {open.thumb && <img className="cal-sheet__img" src={open.thumb} alt="" />}
          <p className="cal-sheet__body">{open.body || 'No text yet.'}</p>
          {open.firstComment && (
            <p className="small">
              <strong>First comment:</strong> {open.firstComment}
            </p>
          )}
          {open.media.length > 0 && <p className="xs muted">Media: {open.media.join(', ')}</p>}
          <p className="xs muted">
            {open.source === 'studio' ? `File: ${open.file}` : open.file}. Edit it in Marketing Studio; this calendar only reads.
          </p>
        </Sheet>
      )}
    </div>
  )
}
