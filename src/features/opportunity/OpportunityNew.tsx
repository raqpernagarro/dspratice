import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHead } from '@/shell/PageHead'
import { Callout, Field, Panel, cx } from '@/shell/ui'
import { act } from '@/state/hooks'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'
import { opportunityProgress } from '@/opportunity/progress'
import { TASKS } from './steps'
import type { TaskType } from '@/state/types'

export function OpportunityNew() {
  const [params] = useSearchParams()
  const slug = params.get('project') ?? undefined
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const list = Object.values(projects)
  const [projectId, setProjectId] = useState<string>(slug ? (list.find((p) => p.slug === slug)?.id ?? '') : '')
  const [newClient, setNewClient] = useState(false)
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [title, setTitle] = useState('')
  const [task, setTask] = useState<TaskType>('rfp')
  if (slug && !list.some((p) => p.slug === slug)) return <Navigate to={practice.clients} replace />
  const canCreate = title.trim() && (newClient ? name.trim() : projectId)

  const create = () => {
    let pid = projectId
    if (newClient) pid = act().createProspect({ name, sector })
    const id = act().createOpportunity(pid, { title, task })
    navigate(practice.opportunity(id, 'request'))
  }

  return (
    <div className="page page--narrow">
      <PageHead title="Respond to a client request" lead="Say who the request is from and what they need back. Next you add the request itself: paste it or upload the file." noTabs crumbs={[{ label: 'Opportunities', to: practice.opportunities }, { label: 'New request' }]} />
      <Panel title="Which client or prospect?">
        {!newClient ? (
          <div className="stack">
            <select className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={Boolean(slug)} data-testid="opp-client">
              <option value="">Choose a client or prospect</option>
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.client.name}
                  {p.client.fictional ? ' (sample)' : ''}
                </option>
              ))}
            </select>
            {!slug && (
              <button className="btn btn--ghost btn--sm" onClick={() => setNewClient(true)} data-testid="new-prospect">
                + A new client or prospect
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid--2">
            <Field label="Client or prospect name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Insurance" data-testid="prospect-name" />
            </Field>
            <Field label="Sector">
              <input className="input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Insurance" />
            </Field>
            <Callout tone="info">This creates a project for them in this browser only. Their requests and uploaded files stay here.</Callout>
            <button className="btn btn--ghost btn--sm" onClick={() => setNewClient(false)}>Choose an existing client instead</button>
          </div>
        )}
      </Panel>
      <Panel title="Give it a name">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Store operations design system RFP" data-testid="opp-title" aria-label="Name of the request" />
        <p className="xs muted">Use the client’s own title if the request has one, so colleagues recognise it.</p>
      </Panel>
      <Panel title="What kind of response is needed?">
        <div className="grid grid--2">
          {TASKS.map((t) => (
            <button key={t.id} className={cx('choice', task === t.id && 'is-selected')} onClick={() => setTask(t.id)} aria-pressed={task === t.id} data-testid={`task-${t.id}`}>
              <span className="choice__body">
                <span className="choice__title">{t.label}</span>
                <span className="choice__desc">{t.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </Panel>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn--primary" disabled={!canCreate} onClick={create} data-testid="create-opportunity">
          Create and add the request
        </button>
      </div>
    </div>
  )
}

/** `/nagarro/opportunities/:id` resumes at the first step that is not done yet. */
export function OpportunityEntry() {
  const { id } = useParams()
  const o = useStore((s) => Object.values(s.projects).find((p) => p.opportunities?.[id ?? ''])?.opportunities[id ?? ''])
  if (!o) return <Navigate to={practice.opportunities} replace />
  return <Navigate to={practice.opportunity(o.id, opportunityProgress(o).next ?? 'export')} replace />
}
