// Projects: what you left unfinished, then every project in this browser, each with a live preview of
// its system. Projects are not shared between people (NDA), so there is no team view.

import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Chip } from '@/shell/ui'
import { useInProgress } from './work'
import { EditCardSheet, ProjectTile, boardItems } from './ProjectTile'
import { NewProjectSheet } from './ClientPortfolio'

export function MyWork() {
  const projects = useStore((s) => s.projects)
  const items = useInProgress()
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const all = boardItems(projects)

  return (
    <div className="page">
      <PageHead
        noTabs
        title="My work"
        lead="Pick up where you left off, or open a project. Projects stay in this browser."
        actions={
          <button className="btn btn--primary" onClick={() => setCreating(true)} data-testid="new-project">
            <Plus /> New project
          </button>
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
              {projects.northwind?.opportunities?.['opp-northwind-rfp'] && (
                <Link className="btn btn--secondary btn--sm" to={practice.opportunityEntry('opp-northwind-rfp')}>
                  Open the Northwind sample
                </Link>
              )}
            </span>
          </div>
        )}
      </section>

      <section aria-labelledby="mine-title" className="stack">
        <h2 id="mine-title" className="section-title">
          Projects
        </h2>
        {all.length ? (
          <div className="ptile-grid" data-testid="my-projects">
            {all.map((i) => (
              <ProjectTile key={i.key} item={i} onEdit={setEditing} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No projects yet.</strong>
            <span className="muted">Start one with New project, or from a job on Home.</span>
          </div>
        )}
      </section>

      {editing && <EditCardSheet projectId={editing} onClose={() => setEditing(null)} />}
      {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
    </div>
  )
}
