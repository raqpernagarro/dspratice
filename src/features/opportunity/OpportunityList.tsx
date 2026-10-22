import { Link, useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, Empty, Panel, Progress } from '@/shell/ui'
import { GenerationBadge } from '@/shell/provenance'
import { usePaths, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { nagarro, practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { STEPS, SUGGESTED, stepNumber, taskLabel } from './steps'
import type { Opportunity, Project } from '@/state/types'

function Row({ o, p, showClient }: { o: Opportunity; p: Project; showClient?: boolean }) {
  const navigate = useNavigate()
  const r = nagarro(p.slug)
  const n = stepNumber(o.step)
  const live = p.clientExperience.publishedOutputs.find((x) => x.opportunityId === o.id && !x.retractedAt)
  const resp = o.responses[0]
  return (
    <tr className="is-clickable" onClick={() => navigate(r.opportunity(o.id, o.step))} data-testid={`opp-row-${o.id}`}>
      <td>
        <strong>{o.title}</strong>
        <div className="xs muted">{taskLabel(o.task)}</div>
      </td>
      {showClient && <td className="small">{p.client.name}{!p.client.fictional ? '' : <span className="xs muted"> · sample</span>}</td>}
      <td style={{ minWidth: 160 }}>
        <Progress value={(n / STEPS.length) * 100} />
        <div className="xs muted">Step {n} of {STEPS.length} · {STEPS[n - 1]?.label}</div>
      </td>
      <td>{resp ? <GenerationBadge mode={resp.generatedBy.mode} model={resp.generatedBy.model} /> : <span className="muted small">—</span>}</td>
      <td>{live ? <Chip tone="mint">Shared · v{live.responseVersion}</Chip> : <span className="muted small">Not shared</span>}</td>
      <td className="small muted">{relTime(o.updatedAt)}</td>
    </tr>
  )
}

export function OpportunityTable({ items, showClient }: { items: { o: Opportunity; p: Project }[]; showClient?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Opportunity</th>
            {showClient && <th>Client</th>}
            <th>Progress</th>
            <th>Draft</th>
            <th>Client workspace</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ o, p }) => (
            <Row key={o.id} o={o} p={p} showClient={showClient} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SuggestedActions({ to }: { to?: (step: Opportunity['step']) => string }) {
  return (
    <Panel title="What you can do here" tight>
      <ul className="list">
        {SUGGESTED.map((a) => (
          <li key={a.label} className="list__item">
            <div className="list__body">
              {to ? <Link to={to(a.step)} className="list__title">{a.label}</Link> : <span className="list__title">{a.label}</span>}
              <span className="list__meta">{a.what}</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function OpportunityList() {
  const project = useProject()
  const r = usePaths()
  const items = Object.values(project.opportunities ?? {}).sort((a, b) => b.updatedAt - a.updatedAt)
  const latest = items[0]
  return (
    <div className="page">
      <PageHead
        screen="opportunity"
        title="Opportunities"
        crumbs={[{ label: 'Clients and engagements', to: practice.clients }, { label: project.client.name, to: r.home }, { label: 'Opportunities' }]}
        lead={`Requests from ${project.client.name} that need a response: RFPs, questionnaires, proposals, approaches, discovery questions, summaries and meeting narratives. Each one runs through the same seven steps.`}
        eyebrow={<Chip tone="ink">Internal only</Chip>}
        actions={
          <Link className="btn btn--primary" to={r.opportunityNew} data-testid="new-opportunity">
            <Plus /> New opportunity
          </Link>
        }
      />
      <div className="grid grid--side">
        <Panel flush>{items.length ? <OpportunityTable items={items.map((o) => ({ o, p: project }))} /> : <Empty>No opportunities yet for {project.client.name}. Create one and paste the request; the rest is guided.</Empty>}</Panel>
        <SuggestedActions to={latest ? (step) => r.opportunity(latest.id, step) : undefined} />
      </div>
    </div>
  )
}

export function OpportunitiesPractice() {
  const projects = useStore((s) => s.projects)
  const items = Object.values(projects)
    .flatMap((p) => Object.values(p.opportunities ?? {}).map((o) => ({ o, p })))
    .sort((a, b) => b.o.updatedAt - a.o.updatedAt)
  return (
    <div className="page">
      <PageHead
        screen="opportunity"
        title="Opportunities"
        lead="Every open request across clients and prospects. Answer an RFP, draft a proposal, recommend an approach or prepare discovery questions, grounded in the knowledge library. Zero model tokens unless you choose an AI action."
        eyebrow={<Chip tone="ink">Internal only</Chip>}
        actions={
          <Link className="btn btn--primary" to={practice.opportunityStart} data-testid="new-opportunity">
            <Plus /> Respond to a request
          </Link>
        }
      />
      <div className="grid grid--side">
        <Panel flush>{items.length ? <OpportunityTable items={items} showClient /> : <Empty>No opportunities yet. Start with "Respond to a request".</Empty>}</Panel>
        <SuggestedActions />
      </div>
    </div>
  )
}
