import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search } from 'lucide-react'
import { Callout, Chip, Panel, cx } from '@/shell/ui'
import { ProgressPanel } from '@/shell/ProgressPanel'
import { ApprovalChip, AudienceChip, ScopeChip, SourceBadge, TemplateNote } from '@/shell/provenance'
import { Details } from '@/motion'
import { act, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useRegistry, useVisibleSources } from '@/knowledge/hooks'
import { isVisibleTo } from '@/knowledge/selectors'
import { findEvidence, oppTask } from '@/state/flows/opportunity'
import { activeRequirements } from '@/opportunity/selectors'
import { practice } from '@/app/routes'
import type { KnowledgeSource, Opportunity } from '@/state/types'

const REASONS = ['Not relevant', 'Outdated', 'Not client-safe', 'Prefer another source', 'Other']

export function SourcesStep({ o }: { o: Opportunity }) {
  const project = useProject()
  const visible = useVisibleSources(project.id)
  const hiddenCount = useRegistry().filter((s) => !isVisibleTo(s, project.id)).length
  const projects = useStore((s) => s.projects)
  const conflicts = useStore((s) => s.practice.knowledge.conflicts)
  const job = useStore((s) => s.sim.jobs[oppTask(project.id, o.id, 'evidence')])
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  const sel = o.sourceSelection
  const excluded = new Map(sel.excluded.map((e) => [e.sourceId, e.reason]))
  const hits = useMemo(() => {
    const m = new Map<string, { n: number; best: string }>()
    for (const r of activeRequirements(o)) for (const e of r.evidence) {
      const cur = m.get(e.sourceId)
      m.set(e.sourceId, { n: (cur?.n ?? 0) + 1, best: cur?.best ?? e.why })
    }
    return m
  }, [o])
  const searched = activeRequirements(o).some((r) => r.evidence.length) || sel.recommended.length > 0
  const readable = visible.filter((s) => s.availability === 'available' && s.docId)
  const recommended = readable.filter((s) => sel.recommended.includes(s.id))
  const others = visible.filter((s) => !sel.recommended.includes(s.id))
  const included = new Set(sel.included)

  const toggle = (s: KnowledgeSource, on: boolean, reason?: string) => {
    const inc = on ? [...sel.included.filter((x) => x !== s.id), s.id] : sel.included.filter((x) => x !== s.id)
    const exc = on ? sel.excluded.filter((e) => e.sourceId !== s.id) : [...sel.excluded.filter((e) => e.sourceId !== s.id), { sourceId: s.id, reason }]
    act().setSourceSelection(project.id, o.id, { included: inc, excluded: exc })
  }

  const Row = ({ s }: { s: KnowledgeSource }) => {
    const on = included.has(s.id)
    const disabled = s.availability !== 'available' || !s.docId
    const h = hits.get(s.id)
    return (
      <div className={cx('source-row', !on && 'is-excluded')} data-testid={`source-${s.id}`}>
        <label className="toggle">
          <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => (e.target.checked ? toggle(s, true) : setReasonFor(s.id))} aria-label={`Use ${s.title}`} />
        </label>
        <div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <strong className="small">{s.title}</strong>
            <ApprovalChip approval={s.approval} title={s.approvalNote} />
            <AudienceChip audience={s.audience} />
            <ScopeChip source={s} clientName={s.scope.kind === 'client' ? projects[s.scope.projectId]?.client.name : undefined} />
            <SourceBadge source={s} />
          </div>
          <div className="xs muted">
            {h ? `Matches ${h.n} requirement${h.n > 1 ? 's' : ''} · ${h.best}` : disabled ? s.availabilityMessage ?? 'Read it first' : 'No match found for this request'}
            {excluded.get(s.id) ? ` · excluded: ${excluded.get(s.id)}` : ''}
          </div>
          {reasonFor === s.id && (
            <div className="row" style={{ gap: 6, marginTop: 6 }}>
              <span className="xs">Why exclude it?</span>
              {REASONS.map((r) => (
                <button key={r} className="btn btn--ghost btn--sm" onClick={() => {
                  toggle(s, false, r)
                  setReasonFor(null)
                }}>{r}</button>
              ))}
            </div>
          )}
        </div>
        <Link className="xs" to={practice.knowledgeSource(s.id)}>Inspect</Link>
      </div>
    )
  }

  if (!searched || job?.status === 'running')
    return (
      <ProgressPanel
        title="Find relevant Nagarro material"
        explain={`Searches the ${readable.length} readable sources this client may use (practice material, ${project.client.name}'s own sources, and other clients' material only when approved for reuse) for every requirement. Keyword and topic matching, no model.`}
        stages={['Finding evidence in your sources']}
        job={job}
        mode={<TemplateNote />}
        action={<button className="btn btn--primary" onClick={() => findEvidence(project.id, o.id)} disabled={job?.status === 'running'} data-testid="find-evidence"><Search /> Find relevant Nagarro material</button>}
      />
    )

  const internalOn = recommended.filter((s) => included.has(s.id) && s.audience === 'internal')
  const outdatedOn = readable.filter((s) => included.has(s.id) && s.approval === 'outdated')
  const approvedOn = readable.filter((s) => included.has(s.id) && s.approval === 'approved')
  const openConflicts = Object.values(conflicts).filter((c) => c.status === 'open')
  return (
    <div className="stack">
      <div className="row row--between">
        <span className="small muted">{sel.included.length} sources selected · {approvedOn.length} approved</span>
        <button className="btn btn--ghost btn--sm" onClick={() => findEvidence(project.id, o.id)}>Search again</button>
      </div>
      {!approvedOn.length && <Callout tone="warn">No approved source is selected, so no answer can be marked "supported by a source". Approve sources in the knowledge library, or select an approved one.</Callout>}
      {outdatedOn.length > 0 && <Callout tone="warn">{outdatedOn.map((s) => `"${s.title}"`).join(', ')} {outdatedOn.length > 1 ? 'are' : 'is'} marked outdated. Answers from {outdatedOn.length > 1 ? 'them' : 'it'} become recommendations with a caveat, never "supported".</Callout>}
      {internalOn.length > 0 && <Callout tone="info">{internalOn.length} selected source{internalOn.length > 1 ? 's are' : ' is'} internal-only. They can inform the draft, but their citations are removed from anything published to the client.</Callout>}
      {openConflicts.length > 0 && <Callout tone="info">The library knows {openConflicts.length} places where our material disagrees (e.g. "{openConflicts[0].topic}"). If the draft touches them, it says so.</Callout>}
      <Panel title="Recommended for this request">{recommended.length ? recommended.map((s) => <Row key={s.id} s={s} />) : <p className="muted small">Nothing matched. Add or read sources in the knowledge library.</p>}</Panel>
      <Details summary={`Other sources this client may use (${others.length})`}>
        <div>{others.map((s) => <Row key={s.id} s={s} />)}</div>
      </Details>
      <p className="xs muted">
        Other clients' material is never listed unless someone approved it for reuse. <Link to={`${practice.knowledgeAdd}?return=${encodeURIComponent(location.pathname)}`}>Add a source to the library</Link>
        {hiddenCount > 0 && <> {' · '}<Chip tone="outline" title="Client-scoped material from other engagements">{hiddenCount} source{hiddenCount > 1 ? 's' : ''} from other clients hidden</Chip></>}
      </p>
    </div>
  )
}
