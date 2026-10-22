import { useState } from 'react'
import { Link } from 'react-router'
import { Play } from 'lucide-react'
import { act, useJob, usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, DemoData, Panel, Progress, SimBadge, Stat } from '@/shell/ui'
import { relTime } from '@/state/selectors'

export function EvalsPage() {
  const sys = useSystem()
  const r = usePaths()
  const ev = sys.evals[0]
  const job = useJob('eval')
  const running = job?.status === 'running'
  const [showFailures, setShowFailures] = useState(false)
  const last5 = sys.evals.slice(0, 5).reverse()

  return (
    <div className="page">
      <PageHead
       
        title={`Release check ${ev.version}: ${ev.onSystem}% of AI output on the system`}
        lead={`${ev.prompts} test prompts per AI tool, scored on whether the output uses the system’s tokens, components and rules. A release passes at ${ev.gate}%. It runs on every release, next to the code checks.`}
        eyebrow={<DemoData>Example values</DemoData>}
        actions={
          <Btn onClick={() => act().runReleaseEval()} loading={running}>
            <Play /> {running ? job?.stages[job.stageIndex]?.label : 'Run the eval for the next release'}
          </Btn>
        }
      />

      <div className="grid grid--side">
        <Panel title="Tool + model" actions={<Chip tone={ev.onSystem >= ev.gate ? 'ok' : 'err'}>{ev.onSystem >= ev.gate ? 'above the gate' : 'below the gate'}</Chip>}>
          <table className="table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Model</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ev.perTool.map((t) => (
                <tr key={t.tool}>
                  <td>{t.tool}</td>
                  <td className="small muted">{t.model}</td>
                  <td style={{ width: 220 }}>
                    <div className="row">
                      <div style={{ flex: 1 }}>
                        <Progress value={t.score} mint={t.score >= ev.gate} />
                      </div>
                      <strong style={{ width: 40, textAlign: 'right' }}>{t.score}%</strong>
                    </div>
                  </td>
                </tr>
              ))}
              {!ev.perTool.length && (
                <tr>
                  <td colSpan={3} className="muted small">
                    Per-tool detail is kept for the latest release only.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="row row--between">
            <span className="small muted">
              {ev.failures.length} failure{ev.failures.length === 1 ? '' : 's'} · {relTime(ev.date)}
            </span>
            {ev.failures.length > 0 && (
              <Btn variant="secondary" size="sm" onClick={() => setShowFailures(!showFailures)}>
                {showFailures ? 'Hide' : 'See'} {ev.failures.length} failure{ev.failures.length === 1 ? '' : 's'}
              </Btn>
            )}
          </div>
          {showFailures &&
            ev.failures.map((f, i) => (
              <Callout key={i} tone="err">
                <strong>{f.tool}</strong> · “{f.prompt}” · {f.reason} ·{' '}
                <Link to={`${r.contract}#${f.rule}`}>rule: {f.rule}</Link>
              </Callout>
            ))}
        </Panel>

        <div className="stack">
          <Panel title="Last 5 releases" tight>
            <div className="stack" style={{ gap: 6 }}>
              {last5.map((e) => (
                <div key={e.id} className="row" style={{ gap: 10 }}>
                  <span className="xs muted" style={{ width: 52 }}>
                    {e.version}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Progress value={e.onSystem} mint={e.onSystem >= e.gate} />
                  </div>
                  <span className="small" style={{ width: 36, textAlign: 'right' }}>
                    {e.onSystem}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel tight>
            <Stat label="Gate" value={`${ev.gate}%`} small hint="A release below the gate blocks the publisher." />
          </Panel>
          <SimBadge detail="Scores derive from the current state (an open hover collision and stale channels lower them). No model is run." />
        </div>
      </div>
    </div>
  )
}
