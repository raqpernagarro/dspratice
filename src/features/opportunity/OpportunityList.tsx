// Opportunities: every client request that needs a response, across projects. One list, filtered
// by project, so a request always sits under the same parent.

import { Link, useNavigate, useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel, Progress } from '@/shell/ui'
import { ProcessStrip } from '@/shell/story'
import { GenerationBadge } from '@/shell/provenance'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { opportunityProgress } from '@/opportunity/progress'
import { STEPS, stepMeta, taskLabel } from './steps'
import type { Opportunity, Project } from '@/state/types'

function Row({ o, p }: { o: Opportunity; p: Project }) {
  const navigate = useNavigate()
  const prog = opportunityProgress(o)
  const shown = p.clientExperience.publishedOutputs.find((x) => x.opportunityId === o.id && !x.retractedAt)
  const resp = o.responses[0]
  const to = practice.opportunity(o.id, prog.next ?? 'export')
  return (
    <tr className="is-clickable" onClick={() => navigate(to)} data-testid={`opp-row-${o.id}`}>
      <td>
        <Link to={to} onClick={(e) => e.stopPropagation()}>
          <strong>{o.title}</strong>
        </Link>
        <div className="xs muted">{taskLabel(o.task)}</div>
      </td>
      <td className="small">
        {p.client.name}
        {p.client.fictional && <span className="xs muted"> · sample</span>}
      </td>
      <td style={{ minWidth: 190 }}>
        <Progress value={(prog.done / prog.total) * 100} />
        <div className="xs muted">
          {prog.done} of {prog.total} steps done{prog.next ? ` · Next: ${stepMeta(prog.next).next.toLowerCase()}` : ''}
        </div>
      </td>
      <td>{resp ? <GenerationBadge mode={resp.generatedBy.mode} model={resp.generatedBy.model} /> : <span className="muted small">No draft yet</span>}</td>
      <td>{shown ? <Chip tone="mint">In the client demo · v{shown.responseVersion}</Chip> : <span className="muted small">Not shown</span>}</td>
      <td className="small muted">{relTime(o.updatedAt)}</td>
    </tr>
  )
}

export function OpportunitiesPractice() {
  const projects = useStore((s) => s.projects)
  const [params, setParams] = useSearchParams()
  const filter = params.get('project') ?? ''
  const filtered = Object.values(projects).filter((p) => !filter || p.slug === filter)
  const items = filtered.flatMap((p) => Object.values(p.opportunities ?? {}).map((o) => ({ o, p }))).sort((a, b) => b.o.updatedAt - a.o.updatedAt)
  const projectName = filter ? Object.values(projects).find((p) => p.slug === filter)?.client.name : undefined

  return (
    <div className="page">
      <PageHead
        title="Opportunities"
        lead="Client requests that need a response: RFPs, questionnaires, briefs. Each one goes from the original request to a checked draft, then into a presentation or the client demo. Drafts quote the knowledge library and spend no AI tokens unless you choose an AI action."
        actions={
          <Link className="btn btn--primary" to={filter ? `${practice.opportunityStart}?project=${filter}` : practice.opportunityStart} data-testid="new-opportunity">
            <Plus /> Respond to a client request
          </Link>
        }
      />

      <ProcessStrip compact label="How a response comes together" steps={STEPS.slice(1).map((s) => ({ title: s.label }))} />

      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <label className="row small" style={{ gap: 8 }}>
          Project
          <select
            className="select"
            style={{ width: 'auto' }}
            value={filter}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              if (e.target.value) next.set('project', e.target.value)
              else next.delete('project')
              setParams(next, { replace: true })
            }}
            aria-label="Filter by project"
            data-testid="opp-filter"
          >
            <option value="">All projects</option>
            {Object.values(projects).map((p) => (
              <option key={p.id} value={p.slug}>
                {p.client.name}
              </option>
            ))}
          </select>
        </label>
        <span className="small muted">
          {items.length} request{items.length === 1 ? '' : 's'}
          {projectName ? ` for ${projectName}` : ''}
        </span>
      </div>

      <Panel flush>
        {items.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Project</th>
                  <th>Progress</th>
                  <th>Draft</th>
                  <th>Client demo</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ o, p }) => (
                  <Row key={o.id} o={o} p={p} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ border: 0 }}>
            <strong>{projectName ? `No requests for ${projectName} yet.` : 'No requests yet.'}</strong>
            <span className="muted">When a client sends an RFP, a questionnaire or a brief, start a response here. You paste or upload the request; the workspace lists what it asks for and drafts answers from approved material.</span>
          </div>
        )}
      </Panel>
    </div>
  )
}
