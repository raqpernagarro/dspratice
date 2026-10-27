// A set-up guide: a journey with no tool of its own yet. Steps and links only, never progress.

import { Link, Navigate, useParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel } from '@/shell/ui'
import { practice } from '@/app/routes'
import { JOURNEY_GROUPS, journey } from '@/fixtures/journeys'

export function JourneyGuide() {
  const { id = '' } = useParams()
  const j = journey(id)
  if (!j) return <Navigate to={practice.home} replace />
  if (j.status !== 'guide') return <Navigate to={j.to} replace />
  return (
    <div className="page page--narrow">
      <PageHead
        noTabs
        eyebrow={<Chip tone="outline">Set-up guide · no tool yet</Chip>}
        title={j.title}
        lead={j.outcome}
        crumbs={[{ label: 'Home', to: practice.home }, { label: JOURNEY_GROUPS[j.group].title }, { label: j.title }]}
      />
      {j.branch && (
        <Panel title={j.branch.question}>
          <div className="guide-branch">
            {j.branch.options.map((o) => (
              <Link key={o.label} to={o.to} className="guide-branch__opt" data-testid="guide-branch-option">
                {o.label} <ArrowRight />
              </Link>
            ))}
          </div>
        </Panel>
      )}
      <ol className="guide-steps">
        {j.steps?.map((s, i) => (
          <li key={s.title} className="guide-step">
            <span className="guide-step__n">{String(i + 1).padStart(2, '0')}</span>
            <div className="guide-step__body">
              <strong>{s.title}</strong>
              <p>{s.body}</p>
              {s.to && (
                <Link className="link-arrow" to={s.to}>
                  {s.toLabel ?? 'Open'} <ArrowRight />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="small muted">For: {j.forWho}. This journey has no tool of its own yet; the steps point at what exists.</p>
    </div>
  )
}
