import { Link, useNavigate } from 'react-router'
import { ArrowRight, FileText, PackageCheck, LayoutDashboard, Presentation, RotateCcw, FlaskConical } from 'lucide-react'
import { act, useIsClient, usePaths, usePresenter, useProject, useSystem } from '@/state/hooks'
import { nagarro } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Btn, Chip, Panel } from '@/shell/ui'
import { AnimatedNumber, Reveal, Stagger } from '@/motion'
import { aiReadableCount, componentsInFigma, driftItems, readiness, valuesWithCodeName, checksPassing, lastEval, health } from '@/state/selectors'
import { HANDOVER_ITEMS } from '@/fixtures/demo-brand/system'

export function DemoOutcome() {
  const navigate = useNavigate()
  const sys = useSystem()
  const project = useProject()
  const r = usePaths()
  const client = useIsClient()
  const presenter = usePresenter()
  const before = sys.journey.before
  const base = sys.baseline
  const vc = valuesWithCodeName(sys)
  const ev = lastEval(sys)
  const checks = checksPassing(sys)
  const drift = driftItems(sys)
  const inFigma = componentsInFigma(sys).length
  const readable = aiReadableCount(sys)
  const rd = readiness(sys)
  const rows: { label: string; before: string; after: number; afterLabel: string; pct: number }[] = [
    { label: 'Values with a code name', before: `${(before?.totalValues ?? base.totalValues) - (before?.valuesWithoutCodeName ?? base.valuesWithoutCodeName)} / ${before?.totalValues ?? base.totalValues}`, after: vc.named, afterLabel: `/ ${vc.total}`, pct: Math.round((vc.named / Math.max(1, vc.total)) * 100) },
    { label: 'Drift items', before: String(before?.driftItems ?? 12), after: drift, afterLabel: '', pct: Math.max(4, Math.round(100 - (drift / Math.max(1, before?.driftItems ?? 12)) * 100)) },
    { label: 'Components AI can read', before: `${before?.aiReadable ?? 0} / ${before?.totalComponents ?? base.componentsInFigma}`, after: readable, afterLabel: `/ ${inFigma}`, pct: Math.round((readable / Math.max(1, inFigma)) * 100) },
    { label: 'AI readiness', before: `${before?.readiness ?? 2} / 5`, after: rd, afterLabel: '/ 5', pct: rd * 20 },
  ]

  return (
    <div className="page">
      <PageHead
        title={client ? 'Where your system stands now' : 'The outcome'}
        lead={client ? 'What changed during the guided demo, what you keep, and what happens next.' : 'Close on the improvement and the next step. The numbers are live from the session; the baseline is the assessment.'}
        eyebrow={
          <Chip tone="dashed" icon={<FlaskConical style={{ width: 12 }} />}>
            Local fictional simulation
          </Chip>
        }
        actions={
          <Btn
            variant="secondary"
            onClick={() => {
              act().restartGuide(true)
              navigate(r.home + '?guide=meeting')
            }}
          >
            <RotateCcw /> Run again with a fresh system
          </Btn>
        }
        noTabs
      />

      <div className="outcome-hero fi-dark fi-wash fi-grain">
        <div className="fi-image fi-image--dark-1" style={{ opacity: 0.7 }} />
        <div className="outcome-hero__grid">
          <Reveal>
            <div className="stack" style={{ gap: 8 }}>
              <span className="xs" style={{ color: 'var(--n-white-70)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Health
              </span>
              <span className="big-number">
                <AnimatedNumber value={health(sys)} suffix="%" />
              </span>
              <span className="small" style={{ color: 'var(--n-white-70)' }}>
                {checks.passing} / {checks.total} checks · eval {ev?.onSystem ?? '–'}%
              </span>
            </div>
          </Reveal>
          <div className="outcome-rows">
            {rows.map((row, i) => (
              <Reveal key={row.label} index={i + 1}>
                <div className="outcome-row">
                  <span className="outcome-row__label">{row.label}</span>
                  <span className="outcome-row__before">{row.before}</span>
                  <span className="outcome-row__bar">
                    <span className="m-grow" style={{ width: `${row.pct}%`, animationDelay: `${i * 120}ms` }} />
                  </span>
                  <span className="outcome-row__after">
                    <AnimatedNumber value={row.after} /> <span className="muted">{row.afterLabel}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid--side">
        <Panel title={client ? 'What you keep' : 'What the client keeps'}>
          <Stagger className="stack" style={{ gap: 6 }}>
            {HANDOVER_ITEMS.map((it) => (
              <div key={it.id} className="row small" style={{ gap: 10 }}>
                <PackageCheck style={{ width: 16, color: 'var(--n-ok)', flexShrink: 0 }} />
                <span>
                  <strong>{it.label}</strong> <span className="muted">· {it.detail}</span>
                </span>
              </div>
            ))}
          </Stagger>
        </Panel>
        <div className="stack">
          <Panel tight title={client ? 'What happens next' : 'Next action'}>
            <div className="stack" style={{ gap: 8 }}>
              <Link to={r.report} className="btn btn--secondary">
                <FileText /> Open the report
              </Link>
              <Link to={r.handover} className="btn btn--secondary">
                <PackageCheck /> Open the handover
              </Link>
              <Link to={r.home} className="btn">
                <LayoutDashboard /> Back to the workspace <ArrowRight />
              </Link>
              {presenter && (
                <Link to={nagarro(project.slug).meeting} className="btn btn--mint">
                  <Presentation /> Prepare the readout
                </Link>
              )}
            </div>
          </Panel>
          {client && (
            <Panel tight title="What we need from your team">
              <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Read access to the repository and the Figma file</li>
                <li>A named design-system owner and a 60-minute readout</li>
                <li>Decisions on what leads for tokens and components</li>
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
