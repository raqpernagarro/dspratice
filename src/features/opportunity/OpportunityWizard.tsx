// The response to one client request, step by step. The URL is the view (/nagarro/opportunities/:id/:step)
// and the store is the save point. A step is ticked when its work is done, never because it was opened.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Check, FileText } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, Sheet, cx } from '@/shell/ui'
import { act, useProject } from '@/state/hooks'
import { practice } from '@/app/routes'
import { opportunityProgress, STEP_ORDER } from '@/opportunity/progress'
import type { OpportunityStep } from '@/state/types'
import { STEPS, WIZARD_STEPS, blocker, reachable, stepMeta, taskLabel } from './steps'
import { useOpportunity, useRequestText } from './hooks'
import { RequestStep, ContextStep, RequirementsStep, RequestView } from './EarlySteps'
import { SourcesStep } from './SourcesStep'
import { ResponseStep } from './ResponseStep'
import { ExportStep } from './ExportStep'
import type { Opportunity } from '@/state/types'

const CONTINUE_LABEL: Partial<Record<OpportunityStep, string>> = {
  request: 'Continue: confirm the context',
  context: 'Continue: what they ask for',
  requirements: 'Continue: choose the sources',
  sources: 'Continue: draft the response',
  response: 'Continue: share and present',
}

/** The original request, one click away from every step. */
function RequestSheet({ o, onClose }: { o: Opportunity; onClose: () => void }) {
  const { text, loading } = useRequestText(o)
  const cur = o.request?.versions.find((v) => v.version === o.request!.current)
  return (
    <Sheet title="The request, as received" onClose={onClose} wide>
      {cur && (
        <p className="xs muted">
          Version {cur.version} · {cur.format}
          {cur.filename ? ` · ${cur.filename}` : ''} · added {new Date(cur.importedAt).toLocaleDateString('en-GB')}. The original is never changed; highlighted passages are the requirements listed from it.
        </p>
      )}
      {loading ? <p className="muted">Loading…</p> : <RequestView text={text} o={o} />}
    </Sheet>
  )
}

export function OpportunityWizard() {
  const { step: raw } = useParams()
  const navigate = useNavigate()
  const project = useProject()
  const o = useOpportunity()
  const [showRequest, setShowRequest] = useState(false)
  const step = (WIZARD_STEPS.includes(raw as OpportunityStep) ? raw : 'request') as OpportunityStep
  useEffect(() => {
    // Remember where the person is, for "Continue where you left off". This is not progress.
    if (o && o.step !== step) act().updateOpportunity(project.id, o.id, { step })
  }, [o, step, project.id])
  if (!o) return <Navigate to={practice.opportunities} replace />
  const idx = WIZARD_STEPS.indexOf(step)
  const max = reachable(o)
  const prog = opportunityProgress(o)
  const go = (s: OpportunityStep) => navigate(practice.opportunity(o.id, s))
  const block = blocker(o, step)
  const next = WIZARD_STEPS[idx + 1]
  const meta = stepMeta(step)
  const proceed = () => {
    if (!next) return
    const furthest = o.furthest && STEP_ORDER.indexOf(o.furthest) >= idx ? o.furthest : step
    if (furthest !== o.furthest) act().updateOpportunity(project.id, o.id, { furthest })
    go(next)
  }

  return (
    <div className="page">
      <PageHead
        noTabs
        crumbs={[{ label: 'Opportunities', to: practice.opportunities }, { label: project.client.name, to: practice.opportunitiesFor(project.slug) }, { label: o.title }]}
        title={o.title}
        lead={`Step ${idx + 1} of ${WIZARD_STEPS.length} · ${meta.title}. ${meta.lead}`}
        eyebrow={
          <>
            <Chip tone="outline">{taskLabel(o.task)}</Chip>
            <span className="xs muted">
              {prog.done} of {prog.total} steps done
            </span>
          </>
        }
        actions={
          o.request ? (
            <button className="btn btn--secondary" onClick={() => setShowRequest(true)} data-testid="view-request">
              <FileText /> View the request
            </button>
          ) : undefined
        }
      />
      <div className="opp-wizard">
        <aside className="stack">
          <ol className="steps opp-wizard__steps" aria-label="Steps">
            {STEPS.slice(1).map((s, i) => {
              const id = s.id as OpportunityStep
              const status = prog.statuses[id]
              const disabled = i + 1 > max
              const current = id === step
              return (
                <li key={s.id} className={cx('step', status === 'done' && 'is-done', status === 'started' && 'is-started', current && 'is-active')}>
                  <button className="step__btn" disabled={disabled} aria-current={current ? 'step' : undefined} title={disabled ? 'Finish the earlier steps first' : status === 'started' ? 'Started, not finished' : undefined} onClick={() => go(id)} data-testid={`opp-step-${s.id}`}>
                    <span className="step__dot">{status === 'done' ? <Check /> : i + 1}</span>
                    <span className="step__title">{s.label}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="xs muted hide-sm">A step is ticked when its work is done. Opening a later step does not tick earlier ones.</p>
        </aside>
        <section className="stack" style={{ minWidth: 0 }}>
          {step === 'request' && <RequestStep o={o} />}
          {step === 'context' && <ContextStep o={o} />}
          {step === 'requirements' && <RequirementsStep o={o} />}
          {step === 'sources' && <SourcesStep o={o} />}
          {step === 'response' && <ResponseStep o={o} />}
          {step === 'export' && <ExportStep o={o} />}
          <div className="row row--between wizard__foot">
            <button className="btn btn--ghost" onClick={() => (idx > 0 ? go(WIZARD_STEPS[idx - 1]) : navigate(practice.opportunities))} data-testid="opp-back">
              {idx > 0 ? `Back: ${stepMeta(WIZARD_STEPS[idx - 1]).label.toLowerCase()}` : 'Back to opportunities'}
            </button>
            {next && (
              <button className="btn btn--primary" disabled={Boolean(block)} title={block} onClick={proceed} data-testid="opp-continue">
                {CONTINUE_LABEL[step] ?? 'Continue'}
              </button>
            )}
          </div>
          {block && next && <p className="xs muted" style={{ textAlign: 'right' }}>{block}</p>}
        </section>
      </div>
      {showRequest && <RequestSheet o={o} onClose={() => setShowRequest(false)} />}
    </div>
  )
}
