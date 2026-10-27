// Projects › My work: what I left unfinished, then the projects I am on. Who "I" am is a choice
// (the workspace has no sign-in), remembered in this browser.

import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Chip } from '@/shell/ui'
import { DEFAULT_ME, TEAM } from '@/state/card'
import { useInProgress } from './work'
import { EditCardSheet, ProjectTile, boardItems } from './ProjectTile'
import { NewProjectSheet } from './ClientPortfolio'

export function MyWork() {
  const projects = useStore((s) => s.projects)
  const me = useStore((s) => s.ui.me) ?? DEFAULT_ME
  const setMe = useStore((s) => s.setMe)
  const items = useInProgress()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const mine = boardItems(projects).filter((i) => i.card.peopleIds.includes(me))
  const name = TEAM.find((p) => p.id === me)?.name ?? 'you'

  return (
    <div className="page">
      <PageHead
        title="My work"
        lead="What you left unfinished, then the projects you are on. The team board shows everyone’s."
        actions={
          <>
            <label className="row small" style={{ gap: 8 }}>
              <span className="muted">Showing work for</span>
              <select className="select" value={me} onChange={(e) => setMe(e.target.value)} aria-label="Whose work" data-testid="me-select">
                {TEAM.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn--primary" onClick={() => setCreating(true)} data-testid="new-project">
              <Plus /> New project
            </button>
          </>
        }
      />

      <section aria-labelledby="continue-title" className="stack">
        <h2 id="continue-title" className="section-title">
          Continue where you left off
        </h2>
        {items.length ? (
          <ul className="continue-list" data-testid="continue-list">
            {items.map((it) => (
              <li key={it.key}>
                <Link to={it.to} className="continue-item">
                  <Chip tone="outline">{it.kind}</Chip>
                  <span className="continue-item__main">
                    <strong>{it.title}</strong>
                    <span className="small muted">
                      {it.client} · {it.status}
                    </span>
                  </span>
                  <span className="xs muted">{it.at ? relTime(it.at) : ''}</span>
                  <ArrowRight className="continue-item__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state" data-testid="continue-empty">
            <strong>Nothing in progress yet.</strong>
            <span className="muted">Pick a job on Home. To see a finished example first, open the Northwind sample request: it goes from the RFP to a reviewed draft and a deck.</span>
            <span className="row" style={{ gap: 8 }}>
              <Link className="btn btn--secondary btn--sm" to={practice.home}>
                Go to Home
              </Link>
              {projects.northwind && (
                <Link className="btn btn--secondary btn--sm" to={practice.opportunitiesFor('northwind')}>
                  Open the Northwind sample
                </Link>
              )}
            </span>
          </div>
        )}
      </section>

      <section aria-labelledby="mine-title" className="stack">
        <h2 id="mine-title" className="section-title">
          Projects {name === 'you' ? 'you are' : `${name} is`} on
        </h2>
        {mine.length ? (
          <div className="ptile-grid" data-testid="my-projects">
            {mine.map((i) => (
              <ProjectTile key={i.key} item={i} onEdit={setEditing} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No projects with {name} on them.</strong>
            <span className="muted">Add yourself to a project’s card on the team board, or start a new project.</span>
            <Link className="btn btn--secondary btn--sm" to={practice.projects}>
              Open the team board
            </Link>
          </div>
        )}
      </section>

      {editing && <EditCardSheet projectId={editing} onClose={() => setEditing(null)} />}
      {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
    </div>
  )
}
