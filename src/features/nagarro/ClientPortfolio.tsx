// Projects: design-system work for each client or prospect, with where each one stands and what to do next.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { nagarro, practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Chip, Field, Panel, Sheet } from '@/shell/ui'
import { demoVersionLabel } from '@/shell/ProjectHeader'
import { journeySummary } from '@/state/journeyProgress'
import { opportunityProgress } from '@/opportunity/progress'
import type { Project } from '@/state/types'

function nextStep(p: Project): string {
  if (p.engagement.needsSpecialist) return `Needs a specialist: ${p.engagement.needsSpecialist}`
  const openRequests = Object.values(p.opportunities ?? {}).filter((o) => opportunityProgress(o).next).length
  if (openRequests) return `${openRequests} client request${openRequests > 1 ? 's' : ''} in progress`
  for (const kind of ['improve', 'new'] as const) {
    const j = journeySummary(p.draft, kind)
    if (j.started && !j.complete) return `Resume: ${j.resumeLabel.toLowerCase()}`
  }
  if (!p.published) return 'Prepare a first client demo version'
  return p.engagement.nextReview && p.engagement.nextReview !== 'Not set' ? `Next review ${p.engagement.nextReview}` : 'Nothing waiting'
}

function journeyLabel(p: Project): string {
  const imp = journeySummary(p.draft, 'improve')
  const nw = journeySummary(p.draft, 'new')
  if (imp.started) return `Improve · ${imp.done} of ${imp.total}${imp.complete ? ' · done' : ''}`
  if (nw.started) return `New system · ${nw.done} of ${nw.total}${nw.complete ? ' · done' : ''}`
  return 'Not started'
}

export function NewProjectSheet({ onClose, onCreated }: { onClose: () => void; onCreated?: (slug: string) => void }) {
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const navigate = useNavigate()
  const create = () => {
    const slug = act().createProspect({ name, sector })
    onClose()
    if (onCreated) onCreated(slug)
    else navigate(nagarro(slug).home)
  }
  return (
    <Sheet
      title="New project"
      onClose={onClose}
      actions={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={!name.trim()} onClick={create} data-testid="create-project">
            Create the project
          </button>
        </>
      }
    >
      <p className="small muted">A project holds one client’s or prospect’s design-system work: set-up journeys, their system, requests and presentations. It stays in this browser.</p>
      <Field label="Client or prospect">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Retail" autoFocus data-testid="project-name" />
      </Field>
      <Field label="Sector" hint="Optional. Used as context in drafts and decks.">
        <input className="input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Retail" />
      </Field>
    </Sheet>
  )
}

export function ClientPortfolio() {
  const projects = useStore((s) => s.projects)
  const [creating, setCreating] = useState(false)
  const list = Object.values(projects)

  return (
    <div className="page">
      <PageHead
        title="Projects"
        lead="Design-system work for each client or prospect: the set-up journeys, their system, and the version the client demo shows. Sample projects are fictional."
        actions={
          <button className="btn btn--primary" onClick={() => setCreating(true)} data-testid="new-project">
            <Plus /> New project
          </button>
        }
      />

      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Package</th>
                <th>Set-up journey</th>
                <th>Client demo</th>
                <th>Next step</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={nagarro(p.slug).home} onClick={() => act().selectProject(p.id)}>
                      <strong>{p.client.name}</strong>
                    </Link>
                    <div className="xs muted">
                      {p.client.sector}
                      {p.client.fictional ? ' · sample' : ''}
                    </div>
                  </td>
                  <td>
                    <Chip tone="outline">{p.engagement.package}</Chip>
                  </td>
                  <td className="small">{journeyLabel(p)}</td>
                  <td className="small">{demoVersionLabel(p)}</td>
                  <td className="small">{nextStep(p)}</td>
                  <td className="num">
                    <Link to={nagarro(p.slug).home} className="btn btn--sm btn--secondary" onClick={() => act().selectProject(p.id)}>
                      Open <ArrowRight />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="small muted">
        Not sure which kind of engagement fits a client? <Link to={practice.guide('which-path')}>Which path fits a client</Link> explains the 2-week AI audit, DS Build, DS Accelerate, DS Scale and Support.
      </p>

      {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
    </div>
  )
}
