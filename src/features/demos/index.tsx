// Demos: what we show in meetings and on social media. Ready-made mini-demos on the client demo,
// a demo built for one meeting from a sentence (no model), saved playlists per project, and the
// social cuts filmed from them. Presenting always opens the client demo; notes stay in a second
// window (Prepare a meeting).

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowDown, ArrowRight, ArrowUp, Clapperboard, ExternalLink, Play, Save, Trash2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { client, practice } from '@/app/routes'
import { AreaTabs } from '@/shell/nav'
import { Chip, Panel } from '@/shell/ui'
import { usePresentDemo, storyFits } from '@/shell/present'
import { TOUR, TOUR_BY_ID, pathMinutes } from '@/features/demo/steps'
import { MINI_DEMOS, type MiniDemo } from '@/fixtures/demos'
import { SOCIAL_CUTS } from '@/fixtures/social-cuts'
import { suggestDemo } from './build'

const TRY = ['How AI stays on their design system', 'Figma and code drift apart', 'A second brand and dark mode']

export function DemosStage() {
  const projects = useStore((s) => s.projects)
  const present = usePresentDemo()
  const navigate = useNavigate()
  const demoUrl = import.meta.env.VITE_DEMO_URL as string | undefined
  const published = Object.values(projects).filter((p) => p.published)
  const [projectId, setProjectId] = useState(projects['demo-brand']?.published ? 'demo-brand' : (published[0]?.id ?? ''))
  const project = projects[projectId]
  const [text, setText] = useState('')
  const [asked, setAsked] = useState('')
  const suggestion = useMemo(() => suggestDemo(asked), [asked])
  const [playlist, setPlaylist] = useState<string[]>([])
  const [name, setName] = useState('')

  const open = (d: MiniDemo) => {
    const p = project ?? projects['demo-brand']
    if (!p) return
    if (d.page && d.page(client(p.slug)).startsWith('/nagarro')) return navigate(d.page(client(p.slug)))
    if (d.chapters) return present(p.id, { guide: 'custom', chapters: d.chapters })
    if (d.story) return present(p.id, { guide: d.story })
    if (d.page) return present(p.id, { path: d.page(client(p.slug)) })
  }
  const ask = (q: string) => {
    setText(q)
    setAsked(q.trim())
    setPlaylist(suggestDemo(q).chapters)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }
  const toggle = (id: string) => setPlaylist((pl) => (pl.includes(id) ? pl.filter((x) => x !== id) : [...pl, id].sort((a, b) => TOUR.findIndex((s) => s.id === a) - TOUR.findIndex((s) => s.id === b))))
  const move = (k: number, by: -1 | 1) =>
    setPlaylist((pl) => {
      const next = [...pl]
      const j = k + by
      if (j < 0 || j >= next.length) return pl
      ;[next[k], next[j]] = [next[j], next[k]]
      return next
    })
  const saved = project?.clientExperience.playlists ?? []
  const save = () => {
    if (!project || !playlist.length) return
    act().setClientExperience(project.id, { playlists: [{ id: `pl-${Date.now().toString(36)}`, name: name.trim() || asked || 'Meeting demo', chapters: playlist, savedAt: Date.now() }, ...saved] })
    setName('')
  }
  const fits = storyFits(project)
  useEffect(() => {
    document.title = 'Demos · Workspace · Nagarro Design'
  }, [])

  return (
    <div className="page demos">
      <AreaTabs />
      <section className="demos-hero" aria-labelledby="demos-title">
        <div className="demos-hero__art" aria-hidden="true" />
        <div className="demos-hero__inner">
          <p className="home-hero__kicker">Demos</p>
          <h1 id="demos-title" className="demos-hero__title">Show it working.</h1>
          <p className="demos-hero__lead">Ready-made demos, or one built for your meeting. Present in one click; your notes stay in a second window.</p>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <label className="demos-hero__on">
              <span>Present on</span>
              <select className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Present on" data-testid="demos-project">
                {published.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.client.name}
                    {p.client.fictional ? ' (fictional)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <Link className="btn btn--on-dark-ghost btn--sm" to={practice.meetingPrep(project?.slug)}>
              Prepare a meeting: notes and timing
            </Link>
          </div>
          {project && !fits && <p className="small demos-hero__note">{project.client.name}’s demo version can be explored, not narrated: the story chapters run on Demo Brand.</p>}
        </div>
      </section>

      <section className="stack" aria-labelledby="build-title">
        <h2 id="build-title" className="section-title">
          Build a demo for this meeting
        </h2>
        <form className="ask ask--panel" onSubmit={submit} aria-label="What should this meeting show?">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What should this meeting show? For example: Figma and code drift apart" aria-label="What should this meeting show?" data-testid="demo-ask" />
          <button className="ask__send" type="submit" aria-label="Suggest a demo">
            <ArrowRight />
          </button>
        </form>
        <div className="ask__try">
          <span>Try</span>
          {TRY.map((t) => (
            <button key={t} type="button" onClick={() => ask(t)}>
              {t}
            </button>
          ))}
        </div>
        {asked && (
          <div className="build" data-testid="demo-build">
            {suggestion.demos.length > 0 && (
              <div className="stack">
                <p className="ask__who">Ready-made demos that fit</p>
                <div className="build__ready">
                  {suggestion.demos.map((d) => (
                    <button key={d.id} type="button" className="jrow" onClick={() => open(d)}>
                      <span className="jrow__main">
                        <strong className="jrow__title">{d.title}</strong>
                        <span className="jrow__outcome">{d.shows}</span>
                      </span>
                      <Play className="jrow__arrow" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="stack">
              <p className="ask__who">{suggestion.chapters.length ? `Or this playlist${suggestion.matched.length ? `, because you wrote: ${suggestion.matched.slice(0, 4).join(', ')}` : ''}` : 'Nothing matched those words: pick the chapters yourself'}</p>
              <div className="playlist">
                <ol className="playlist__chosen" data-testid="playlist">
                  {playlist.map((id, k) => (
                    <li key={id} className="playlist__item">
                      <span className="jrow__n">{String(k + 1).padStart(2, '0')}</span>
                      <span className="playlist__title">{TOUR_BY_ID[id]?.title}</span>
                      <button type="button" className="icon-btn" onClick={() => move(k, -1)} aria-label={`Move ${TOUR_BY_ID[id]?.title} earlier`} disabled={k === 0}>
                        <ArrowUp />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => move(k, 1)} aria-label={`Move ${TOUR_BY_ID[id]?.title} later`} disabled={k === playlist.length - 1}>
                        <ArrowDown />
                      </button>
                      <button type="button" className="icon-btn" onClick={() => toggle(id)} aria-label={`Remove ${TOUR_BY_ID[id]?.title}`}>
                        <Trash2 />
                      </button>
                    </li>
                  ))}
                  {!playlist.length && <li className="small muted">No chapters yet. Add them from the list.</li>}
                </ol>
                <div className="playlist__all">
                  <span className="xs muted">The story’s chapters</span>
                  {TOUR.map((s) => (
                    <label key={s.id} className="row small" style={{ gap: 8 }}>
                      <input type="checkbox" checked={playlist.includes(s.id)} onChange={() => toggle(s.id)} data-testid={`playlist-toggle-${s.id}`} /> {s.n}. {s.title}
                    </label>
                  ))}
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--primary" disabled={!playlist.length || !project || !fits} onClick={() => project && present(project.id, { guide: 'custom', chapters: playlist })} data-testid="present-playlist">
                  <Play /> Present this · about {pathMinutes('custom', playlist)} min
                </button>
                <input className="input" style={{ width: 220 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name it, e.g. Contoso kickoff" aria-label="Playlist name" />
                <button type="button" className="btn btn--secondary" disabled={!playlist.length || !project} onClick={save} data-testid="save-playlist">
                  <Save /> Save for {project?.client.name ?? 'this project'}
                </button>
              </div>
            </div>
          </div>
        )}
        {saved.length > 0 && (
          <div className="stack">
            <p className="ask__who">Saved for {project?.client.name}</p>
            <ul className="continue-list" data-testid="saved-playlists">
              {saved.map((pl) => (
                <li key={pl.id} className="continue-item">
                  <Chip tone="outline">{pl.chapters.length} chapters</Chip>
                  <span className="continue-item__main">
                    <strong>{pl.name}</strong>
                    <span className="small muted">{pl.chapters.map((c) => TOUR_BY_ID[c]?.title).filter(Boolean).join(' → ')}</span>
                  </span>
                  <button type="button" className="btn btn--mint btn--sm" disabled={!fits} onClick={() => project && present(project.id, { guide: 'custom', chapters: pl.chapters })}>
                    <Play /> Present
                  </button>
                  <button type="button" className="icon-btn" aria-label={`Delete ${pl.name}`} onClick={() => project && act().setClientExperience(project.id, { playlists: saved.filter((x) => x.id !== pl.id) })}>
                    <Trash2 />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="stack" aria-labelledby="ready-title">
        <h2 id="ready-title" className="section-title">
          Ready-made demos
        </h2>
        <div className="mini-grid">
          {MINI_DEMOS.filter((d) => d.audience === 'client').map((d, k) => (
            <article key={d.id} className={`mini mini--${k % 3}`} data-testid={`mini-${d.id}`}>
              <span className="mini__min">About {d.minutes} min</span>
              <h3 className="mini__title">{d.title}</h3>
              <p className="mini__shows">{d.shows}</p>
              <details className="small mini__tips">
                <summary>Tips</summary>
                <ul>
                  {d.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </details>
              <div className="row mini__actions">
                <button type="button" className="btn btn--mint btn--sm" onClick={() => open(d)} disabled={Boolean((d.chapters || d.story) && !fits)} data-testid={`present-${d.id}`}>
                  <Play /> Present
                </button>
                {d.cut && (
                  <Link className="btn btn--on-dark-ghost btn--sm" to={`${practice.demos}/cut/${d.cut}`}>
                    <Clapperboard /> Social cut
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="stack" aria-labelledby="cuts-title">
        <h2 id="cuts-title" className="section-title">
          Social cuts
        </h2>
        <p className="small muted" style={{ marginTop: -8 }}>
          Short captioned clips of the demos, zoomed for phones, for posts on the Nagarro Design page and our own accounts. Each one plays on the real client demo and can be filmed as a video.
        </p>
        <ul className="continue-list" data-testid="social-cuts">
          {SOCIAL_CUTS.map((c) => (
            <li key={c.id}>
              <Link to={`${practice.demos}/cut/${c.id}`} className="continue-item">
                <Chip tone="outline">4:5 · {c.shots.reduce((t, s) => t + s.seconds, 0)}s</Chip>
                <span className="continue-item__main">
                  <strong>{c.title}</strong>
                  <span className="small muted">{c.hook}</span>
                </span>
                <ArrowRight className="continue-item__arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack" aria-labelledby="internal-title">
        <h2 id="internal-title" className="section-title">
          For colleagues
        </h2>
        <div className="grid grid--2">
          {MINI_DEMOS.filter((d) => d.audience === 'internal').map((d) => (
            <Panel key={d.id} title={d.title} tight>
              <p className="small">{d.shows}</p>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => open(d)}>
                Open <ArrowRight />
              </button>
            </Panel>
          ))}
          <Panel title="How we answer a client request" tight>
            <p className="small">The response steps on the Northwind sample, from the RFP to a checked draft and a deck.</p>
            <Link className="btn btn--secondary btn--sm" to={practice.opportunitiesFor('northwind')}>
              Open the sample <ArrowRight />
            </Link>
          </Panel>
        </div>
      </section>

      <Panel title="Showing the demo outside a meeting" tight>
        <p className="small muted">A client-safe copy of the demo can be built as a separate site (see docs/demo-build.md). It is not published: that needs the practice lead’s go-ahead and marketing’s approval of the scorecard.</p>
        {demoUrl && (
          <a className="btn btn--secondary btn--sm" href={demoUrl} target="_blank" rel="noreferrer">
            <ExternalLink /> Open the demo site
          </a>
        )}
      </Panel>
    </div>
  )
}

export { CutPage, CutRecord } from './CutPlayer'
