// Chapter 8 of the client demo: an example of what an engagement leaves with the client, what changed
// during this demo (sample figures), the proposal summary when one was added, and the next
// conversation. Client-facing: nothing internal is shown here.

import { Link, useNavigate } from 'react-router'
import { PackageCheck, RotateCcw, Gauge, FileText } from 'lucide-react'
import { act, usePaths, usePresenter, useProject, useSystem } from '@/state/hooks'
import { Btn, DemoData, Panel } from '@/shell/ui'
import { Hl, Kicker } from '@/shell/story'
import { AnimatedNumber, Details, Reveal } from '@/motion'
import { aiReadableCount, componentsInFigma, driftItems, readiness, valuesWithCodeName } from '@/state/selectors'
import { HANDOVER_ITEMS } from '@/fixtures/demo-brand/system'
import { useEffect } from 'react'

export function DemoOutcome() {
  const navigate = useNavigate()
  const sys = useSystem()
  const project = useProject()
  const r = usePaths()
  const presenter = usePresenter()
  const before = sys.journey.before
  const base = sys.baseline
  const vc = valuesWithCodeName(sys)
  const drift = driftItems(sys)
  const inFigma = componentsInFigma(sys).length
  const readable = aiReadableCount(sys)
  const rd = readiness(sys)
  const summary = project.clientExperience.publishedOutputs.find((o) => !o.retractedAt)
  useEffect(() => {
    document.title = `Outcome and next step · Client demo · Nagarro`
  }, [])
  const rows: { label: string; before: string; after: number; afterLabel: string; pct: number }[] = [
    { label: 'Values with a code name', before: `${(before?.totalValues ?? base.totalValues) - (before?.valuesWithoutCodeName ?? base.valuesWithoutCodeName)} / ${before?.totalValues ?? base.totalValues}`, after: vc.named, afterLabel: `/ ${vc.total}`, pct: Math.round((vc.named / Math.max(1, vc.total)) * 100) },
    { label: 'Places where Figma and code differ', before: before ? String(before.driftItems) : '—', after: drift, afterLabel: '', pct: before ? Math.max(4, Math.round(100 - (drift / Math.max(1, before.driftItems)) * 100)) : 0 },
    { label: 'Components AI tools can read', before: before ? `${before.aiReadable} / ${before.totalComponents}` : '—', after: readable, afterLabel: `/ ${inFigma}`, pct: Math.round((readable / Math.max(1, inFigma)) * 100) },
    { label: 'Readable by AI tools (1–5)', before: before ? `${before.readiness} / 5` : '—', after: rd, afterLabel: '/ 5', pct: rd * 20 },
  ]

  return (
    <div className="page">
      <section className="story-dark" aria-labelledby="outcome-title">
        <Kicker n="08">Outcome and next step</Kicker>
        <h1 id="outcome-title" className="story-dark__title">
          What an engagement could <Hl>leave behind</Hl>.
        </h1>
        <p className="story-dark__lead">This is an example. What an engagement delivers is agreed with each client; these are the parts most engagements leave with the client’s own team, so the system keeps working after we step back.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Btn
            variant="secondary"
            onClick={() => {
              act().restartGuide(false)
              navigate(r.home + '?guide=meeting')
            }}
          >
            <RotateCcw /> Start the story again
          </Btn>
          {presenter && (
            <Btn
              variant="secondary"
              onClick={() => {
                act().restartGuide(true)
                navigate(r.home)
              }}
              title="Back to the prepared version, for the next meeting"
            >
              <RotateCcw /> Reset the demo
            </Btn>
          )}
        </div>
      </section>

      <div className="grid grid--2">
        <Panel title="What the client keeps (example)">
          <div className="stack" style={{ gap: 8 }}>
            {HANDOVER_ITEMS.map((it) => (
              <div key={it.id} className="row small" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <PackageCheck style={{ width: 16, color: 'var(--n-ok)', flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>{it.label}</strong> <span className="muted">· {it.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <Link to={r.handover} className="small">
            See the example handover
          </Link>
        </Panel>
        <Panel title="During this demo" actions={<DemoData>Sample data</DemoData>}>
          <div className="outcome-rows outcome-rows--light">
            {rows.map((row, i) => (
              <Reveal key={row.label} index={i}>
                <div className="outcome-row">
                  <span className="outcome-row__label">{row.label}</span>
                  <span className="outcome-row__before">{row.before}</span>
                  <span className="outcome-row__bar">
                    <span className="m-grow" style={{ width: `${row.pct}%` }} />
                  </span>
                  <span className="outcome-row__after">
                    <AnimatedNumber value={row.after} /> <span className="muted">{row.afterLabel}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <span className="xs muted">{before ? 'Before: when the assessment ran in this demo. Now: after the changes made since.' : 'Run the assessment (chapter 2) to see a before-and-after.'}</span>
        </Panel>
      </div>

      {summary && (
        <Panel title="Proposal summary" actions={<Link className="btn btn--secondary btn--sm" to={r.proposalSummary}><FileText /> Open the summary</Link>}>
          <p className="small">
            <strong>{summary.title}</strong> · {summary.sections.length} section{summary.sections.length > 1 ? 's' : ''}: our understanding, the approach we propose and the points to confirm together.
          </p>
        </Panel>
      )}

      <section className="panel next-talk" data-demo-focus="outcome-next" aria-labelledby="next-title">
        <div className="stack" style={{ gap: 8 }}>
          <Kicker>The next conversation</Kicker>
          <h2 id="next-title" style={{ margin: 0 }}>A short assessment of your own system</h2>
          <p className="small">In a 2-week AI audit we read your Figma file and code without changing them, measure where they disagree and how well AI tools can read them, and agree the priorities with you in a readout. You keep the assessment whatever you decide next.</p>
          <Link to={r.scorecard} className="btn btn--secondary btn--sm" style={{ alignSelf: 'flex-start' }}>
            <Gauge /> Not sure where you stand? Try the scorecard together
          </Link>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <strong className="small">What we would need from your team</strong>
          <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>View access to the repository and the Figma file</li>
            <li>The person who owns, or will own, the design system</li>
            <li>An hour for the readout</li>
          </ul>
          <Details summary="Technical details">
            <p className="small muted">The assessment reads React components, JSON tokens and Figma variables today. Other stacks start with tokens and rules, planned with a specialist. Every change in an engagement is a reviewed pull request, and Figma changes are reviewed in Figma before they are applied.</p>
          </Details>
        </div>
      </section>
    </div>
  )
}
