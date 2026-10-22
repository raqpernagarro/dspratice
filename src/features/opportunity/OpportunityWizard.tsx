// The seven-step workflow. The URL is the view (…/opportunities/:id/:step), the store is the save point.
import { useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Check } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, cx } from '@/shell/ui'
import { GenerationBadge } from '@/shell/provenance'
import { act, usePaths, useProject } from '@/state/hooks'
import { practice } from '@/app/routes'
import type { OpportunityStep } from '@/state/types'
import { STEPS, WIZARD_STEPS, blocker, reachable, taskLabel, SUGGESTED } from './steps'
import { useOpportunity } from './hooks'
import { RequestStep, ContextStep, RequirementsStep } from './EarlySteps'
import { SourcesStep } from './SourcesStep'
import { ResponseStep } from './ResponseStep'
import { ExportStep } from './ExportStep'

export function OpportunityWizard() {
  const { step: raw } = useParams()
  const navigate = useNavigate()
  const project = useProject()
  const r = usePaths()
  const o = useOpportunity()
  const step = (WIZARD_STEPS.includes(raw as OpportunityStep) ? raw : 'request') as OpportunityStep
  useEffect(() => {
    if (o && o.step !== step) act().updateOpportunity(project.id, o.id, { step })
  }, [o, step, project.id])
  if (!o) return <Navigate to={r.opportunities} replace />
  const idx = WIZARD_STEPS.indexOf(step)
  const n = idx + 2
  const max = reachable(o)
  const go = (s: OpportunityStep) => navigate(r.opportunity(o.id, s))
  const block = blocker(o, step)
  const next = WIZARD_STEPS[idx + 1]
  const meta = STEPS[n - 1]
  const resp = o.responses[0]

  return (
    <div className="page">
      <PageHead
        screen="opportunity"
        noTabs
        crumbs={[{ label: 'Clients and engagements', to: practice.clients }, { label: project.client.name, to: r.home }, { label: 'Opportunities', to: r.opportunities }, { label: o.title }]}
        title={o.title}
        lead={`Step ${n} of 7 · ${meta.label}. ${meta.lead}`}
        eyebrow={
          <>
            <Chip tone="outline">{taskLabel(o.task)}</Chip>
            {o.request && <Chip tone="outline">Request v{o.request.current}</Chip>}
            {resp && <GenerationBadge mode={resp.generatedBy.mode} model={resp.generatedBy.model} />}
          </>
        }
      />
      <div className="opp-wizard">
        <aside className="stack">
          <ol className="steps opp-wizard__steps" aria-label="Steps">
            {STEPS.map((s, i) => {
              const sn = i + 1
              const done = sn < n
              const disabled = i > 0 && i > max
              return (
                <li key={s.id} className={cx('step', done && 'is-done', sn === n && 'is-active')}>
                  <button className="step__btn" disabled={disabled} title={disabled ? 'Finish the previous step first' : undefined} onClick={() => (i === 0 ? navigate(r.opportunities) : go(s.id as OpportunityStep))} data-testid={`opp-step-${s.id}`}>
                    <span className="step__dot">{done ? <Check /> : sn}</span>
                    <span className="step__title">{s.label}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="panel panel--tight hide-sm">
            <div className="small" style={{ fontWeight: 500, marginBottom: 6 }}>Shortcuts</div>
            <ul className="list">
              {SUGGESTED.map((a) => (
                <li key={a.label} className="list__item">
                  <Link to={r.opportunity(o.id, a.step)} className="small">{a.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <section className="stack" style={{ minWidth: 0 }}>
          {step === 'request' && <RequestStep o={o} />}
          {step === 'context' && <ContextStep o={o} />}
          {step === 'requirements' && <RequirementsStep o={o} />}
          {step === 'sources' && <SourcesStep o={o} />}
          {step === 'response' && <ResponseStep o={o} />}
          {step === 'export' && <ExportStep o={o} />}
          <div className="row row--between wizard__foot">
            <button className="btn btn--ghost" onClick={() => (idx > 0 ? go(WIZARD_STEPS[idx - 1]) : navigate(r.opportunities))} data-testid="opp-back">
              Back
            </button>
            {next && (
              <button className="btn btn--primary" disabled={Boolean(block)} title={block} onClick={() => go(next)} data-testid="opp-continue">
                {step === 'sources' ? 'Continue to the draft' : step === 'response' ? 'Continue to export' : 'Continue'}
              </button>
            )}
          </div>
          {block && next && <p className="xs muted" style={{ textAlign: 'right' }}>{block}</p>}
        </section>
      </div>
    </div>
  )
}
