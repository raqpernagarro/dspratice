// Demos: what we show clients. Prepare a client meeting (a presentation, a demo, your notes) leads;
// below it, ready-made demos to present now. Presenting always opens the client demo; notes stay in a
// second window. Social cuts live in Engagement.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ExternalLink, Play } from 'lucide-react'
import { useStore } from '@/state/store'
import { client, practice } from '@/app/routes'
import { AreaTabs } from '@/shell/nav'
import { Panel } from '@/shell/ui'
import { usePresentDemo, storyFits } from '@/shell/present'
import { MINI_DEMOS, type MiniDemo } from '@/fixtures/demos'

export function DemosStage() {
  const projects = useStore((s) => s.projects)
  const present = usePresentDemo()
  const navigate = useNavigate()
  const demoUrl = import.meta.env.VITE_DEMO_URL as string | undefined
  const published = Object.values(projects).filter((p) => p.published)
  const [projectId, setProjectId] = useState(projects['demo-brand']?.published ? 'demo-brand' : (published[0]?.id ?? ''))
  const project = projects[projectId]
  const open = (d: MiniDemo) => {
    const p = project ?? projects['demo-brand']
    if (!p) return
    if (d.page && d.page(client(p.slug)).startsWith('/nagarro')) return navigate(d.page(client(p.slug)))
    if (d.chapters) return present(p.id, { guide: 'custom', chapters: d.chapters })
    if (d.story) return present(p.id, { guide: d.story })
    if (d.page) return present(p.id, { path: d.page(client(p.slug)) })
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
          <p className="demos-hero__lead">Get ready for a client meeting: a presentation, a demo and your notes, one at a time. Or present a ready-made demo now.</p>
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
            <Link className="btn btn--mint" to={practice.meetingPrep(project?.slug)} data-testid="demos-prepare">
              Prepare a client meeting <ArrowRight />
            </Link>
          </div>
          {project && !fits && <p className="small demos-hero__note">{project.client.name}’s demo version can be explored, not narrated: the story chapters run on Demo Brand.</p>}
        </div>
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
              </div>
            </article>
          ))}
        </div>
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
