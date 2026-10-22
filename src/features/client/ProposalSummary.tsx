// The client's view of what Nagarro explicitly published. Reads published outputs only: never
// drafts, opportunities, internal notes or the knowledge library.
import { useState } from 'react'
import { PageHead } from '@/shell/PageHead'
import { Empty, Panel } from '@/shell/ui'
import { MarkdownLite } from '@/shell/markdown'
import { Details } from '@/motion'
import { useProject } from '@/state/hooks'
import type { StatementKind } from '@/state/types'

const CLIENT_LABEL: Record<StatementKind, string> = { supported: "From Nagarro's approach", recommendation: 'Our recommendation', assumption: 'To confirm with you', 'open-question': 'Open point' }

export function ProposalSummary() {
  const project = useProject()
  const outputs = (project.clientExperience.publishedOutputs ?? []).filter((o) => !o.retractedAt)
  const [idx, setIdx] = useState(0)
  const out = outputs[idx]
  return (
    <div className="page">
      <PageHead screen="proposalSummary" title="Proposal summary" lead="What your Nagarro team has shared from the proposal work: our understanding, the proposed approach, and the points to confirm together." />
      {!out ? (
        <Empty>Nothing has been shared here yet.</Empty>
      ) : (
        <div className="stack" data-testid="client-published-summary">
          {outputs.length > 1 && (
            <select className="select" style={{ maxWidth: 360 }} value={idx} onChange={(e) => setIdx(Number(e.target.value))} aria-label="Summary">
              {outputs.map((o, i) => <option key={o.id} value={i}>{o.title}</option>)}
            </select>
          )}
          <h2 style={{ margin: 0 }}>{out.title}</h2>
          {out.sections.map((s, i) => (
            <Panel key={i} title={s.heading} actions={<span className="xs muted">{CLIENT_LABEL[s.kind]}</span>}>
              <MarkdownLite text={s.body} />
              {s.sources.length > 0 && <p className="xs muted">Source: {s.sources.join(', ')}</p>}
            </Panel>
          ))}
          <p className="xs muted">Shared by {out.publishedBy} on {new Date(out.publishedAt).toLocaleDateString('en-GB')}.</p>
          <Details summary="How this was prepared">
            <p className="small">Prepared by Nagarro's design-systems practice from your request and Nagarro's approved material, and selected for you by {out.publishedBy}.{out.generatedByMode === 'model' ? ' A drafting model helped prepare a first version; everything shown here was reviewed by a person.' : ''}</p>
          </Details>
        </div>
      )}
    </div>
  )
}
