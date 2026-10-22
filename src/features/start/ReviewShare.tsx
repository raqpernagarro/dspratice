// Improve journey, step 7: one place to check what was decided before it reaches the client demo.

import { Link } from 'react-router'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { act, usePaths, useProject, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Kv, Panel } from '@/shell/ui'
import { hasUnpublishedChanges } from '@/state/scope'
import { READOUT_DECISIONS } from '@/fixtures/demo-brand/system'
import { GOAL_OPTIONS } from './Goals'
import { useImproveNav } from './JourneyFrame'

export function ReviewShare() {
  const project = useProject()
  const r = usePaths()
  const journey = useSys((s) => s.journey)
  const nav = useImproveNav('review')
  const data = journey.improve.data as { goals?: string[]; owner?: string; products?: string }
  const mappingCount = Object.keys(journey.mapping.decisions).length
  const dirty = hasUnpublishedChanges(project)
  const decided = READOUT_DECISIONS.filter((d) => journey.readout[d.id])

  const rows: [string, string, boolean][] = [
    ['Goals', (data.goals ?? []).map((g) => GOAL_OPTIONS.find((o) => o.id === g)?.label ?? g).join(' · ') || 'Not recorded yet', Boolean(data.goals?.length)],
    ['Owner', data.owner || 'Not named yet', Boolean(data.owner)],
    ['Connection', journey.connect.status === 'detected' ? `${journey.connect.repoUrl} · ${journey.connect.figmaUrl}` : 'Not connected', journey.connect.status === 'detected'],
    ['Assessment', journey.scan.status === 'done' ? 'Baseline captured' : 'Not run yet', journey.scan.status === 'done'],
    ['Plan', `${decided.length} of ${READOUT_DECISIONS.length} decisions agreed`, decided.length === READOUT_DECISIONS.length],
    ['Name mapping', mappingCount ? `${mappingCount} names decided` : 'Not started', mappingCount > 0],
  ]
  const gaps = rows.filter((x) => !x[2]).map((x) => x[0].toLowerCase())

  return (
    <div className="page">
      <PageHead noTabs title="Review and share" lead="Check what was decided. When it is right, update the client demo so the next meeting shows this version." />
      <Panel title="What was decided">
        <ul className="review-list">
          {rows.map(([k, v, ok]) => (
            <li key={k} className={ok ? 'is-ok' : 'is-open'}>
              {ok ? <Check /> : <Minus />}
              <strong>{k}</strong>
              <span>{v}</span>
            </li>
          ))}
        </ul>
        {decided.length > 0 && (
          <details>
            <summary className="small">The plan, decision by decision</summary>
            <Kv rows={decided.map((d) => [d.question, d.options.find((o) => o.id === journey.readout[d.id])?.label ?? journey.readout[d.id]])} />
          </details>
        )}
      </Panel>
      {gaps.length > 0 && <Callout tone="warn">Still open: {gaps.join(', ')}. You can share now and come back, but say so in the meeting.</Callout>}
      <Panel title="Share">
        <p className="small muted">The client demo shows the version you last published. Updating it changes nothing in the client’s own files.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--secondary" to={r.report}>
            Open the assessment report
          </Link>
          <Btn
            variant={dirty || !project.published ? 'primary' : 'secondary'}
            onClick={() => {
              act().publishProject(project.id, 'After the improvement plan')
              act().markJourneyStep('improve', 7, true)
            }}
            disabled={!dirty && Boolean(project.published)}
            title={!dirty && project.published ? `The client demo already shows this (v${project.published.version})` : undefined}
          >
            {project.published ? `Update the client demo (v${project.published.version + 1})` : 'Create the client demo version (v1)'}
          </Btn>
          <Btn variant="ghost" onClick={nav.complete} data-testid="review-continue">
            Mark reviewed and continue <ArrowRight />
          </Btn>
        </div>
      </Panel>
    </div>
  )
}
