// Projects › Team board: every client and prospect the practice works on, as calm cards: where it
// stands, what kind of work, who is on it, where its files live. A portfolio, not a task list: tasks
// stay in Jira. Sample projects and work shared through src/fixtures/team-board.json sit side by side.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { nagarro, practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Field, Segmented, Sheet } from '@/shell/ui'
import { STATUS_LABEL, TAG_LABEL, TEAM, flag } from '@/state/card'
import type { ProjectStatus, ProjectTag } from '@/state/types'
import { EditCardSheet, ProjectTile, boardItems } from './ProjectTile'

export function NewProjectSheet({ onClose, onCreated }: { onClose: () => void; onCreated?: (slug: string) => void }) {
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('opportunity')
  const navigate = useNavigate()
  const create = () => {
    const slug = act().createProspect({ name, sector })
    if (status !== 'opportunity') act().updateCard(slug, { status })
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
      <p className="small muted">A project holds one client’s or prospect’s work: set-up journeys, their system, requests and presentations. It appears on the team board and stays in this browser.</p>
      <Field label="Client or prospect">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Retail" autoFocus data-testid="project-name" />
      </Field>
      <Field label="Sector" hint="Optional. Used as context in drafts and decks.">
        <input className="input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Retail" />
      </Field>
      <Field label="Where it stands" hint="An opportunity becomes a project when the work is won. You can change it on the card later.">
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          <option value="opportunity">Opportunity: we are pitching or responding</option>
          <option value="in-progress">In progress: the work has started</option>
        </select>
      </Field>
    </Sheet>
  )
}

const STATUS_ORDER: ProjectStatus[] = ['opportunity', 'in-progress', 'delivered', 'paused']

export function ClientPortfolio() {
  const projects = useStore((s) => s.projects)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'columns'>('grid')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [tag, setTag] = useState<ProjectTag | ''>('')
  const [who, setWho] = useState('')
  const [country, setCountry] = useState('')
  const [q, setQ] = useState('')
  const all = boardItems(projects)
  const countries = [...new Set(all.map((i) => i.card.country).filter(Boolean))].sort() as string[]
  const shown = all.filter(
    (i) =>
      (status === 'all' || i.card.status === status) &&
      (!tag || i.card.tags.includes(tag)) &&
      (!who || i.card.peopleIds.includes(who)) &&
      (!country || i.card.country === country) &&
      (!q || `${i.name} ${i.title ?? ''} ${i.sector}`.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div className="page">
      <PageHead
        title="Team board"
        lead="Every client and prospect the practice works on: where it stands, who is on it and where its files live. Tasks stay in Jira."
        actions={
          <button className="btn btn--primary" onClick={() => setCreating(true)} data-testid="new-project">
            <Plus /> New project
          </button>
        }
      />

      <div className="board-filters" role="group" aria-label="Filter the board">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" aria-label="Search clients" data-testid="board-search" />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | 'all')} aria-label="Status" data-testid="board-status">
          <option value="all">Any status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className="select" value={tag} onChange={(e) => setTag(e.target.value as ProjectTag | '')} aria-label="Kind of work" data-testid="board-tag">
          <option value="">Any kind of work</option>
          {(Object.keys(TAG_LABEL) as ProjectTag[]).map((t) => (
            <option key={t} value={t}>
              {TAG_LABEL[t]}
            </option>
          ))}
        </select>
        <select className="select" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Person" data-testid="board-person">
          <option value="">Anyone</option>
          {TEAM.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="select" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
          <option value="">Any country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {flag(c)} {c}
            </option>
          ))}
        </select>
        <Segmented ariaLabel="View" value={view} onChange={setView} options={[{ id: 'grid', label: 'Cards' }, { id: 'columns', label: 'By status' }]} />
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <strong>Nothing matches these filters.</strong>
          <span className="muted">Clear a filter to see more of the board.</span>
        </div>
      ) : view === 'grid' ? (
        <div className="ptile-grid" data-testid="board-grid">
          {shown.map((i) => (
            <ProjectTile key={i.key} item={i} onEdit={setEditing} />
          ))}
        </div>
      ) : (
        <div className="board-columns" data-testid="board-columns">
          {STATUS_ORDER.map((s) => {
            const col = shown.filter((i) => i.card.status === s)
            return (
              <section key={s} className="board-col" aria-label={STATUS_LABEL[s]}>
                <h3 className="board-col__title">
                  {STATUS_LABEL[s]} <span className="muted">{col.length}</span>
                </h3>
                {col.map((i) => (
                  <ProjectTile key={i.key} item={i} onEdit={setEditing} />
                ))}
              </section>
            )
          })}
        </div>
      )}

      <p className="small muted">
        Sample projects are fictional. To share real work with the whole team, add it to src/fixtures/team-board.json (only while the repository is private). Not sure which package fits a client? <Link to={practice.guide('which-path')}>Which path fits a client</Link>.
      </p>

      {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
      {editing && <EditCardSheet projectId={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
