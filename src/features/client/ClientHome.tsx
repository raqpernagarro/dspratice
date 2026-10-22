import { Link } from 'react-router'
import { ArrowRight, Play, CalendarCheck, Layers, Shapes, GitPullRequest, BookOpen, PackageCheck, FileText } from 'lucide-react'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { driftItems, health, openFindings, openPRs, relTime, checksPassing, readiness, valuesWithCodeName } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Panel, Chip, SeverityChip, FindingStatusChip, Btn } from '@/shell/ui'
import { AnimatedNumber, Details, Reveal, Stagger } from '@/motion'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsBadge, DsButton, DsInput, DsToggle } from '@/demo-system/components'

export function ClientHome() {
  const sys = useSystem()
  const project = useProject()
  const r = usePaths()
  const h = health(sys)
  const drift = driftItems(sys)
  const open = openFindings(sys).sort((a, b) => sev(a.severity) - sev(b.severity)).slice(0, 4)
  const prs = sys.pullRequests.slice(0, 4)
  const waiting = openPRs(sys).filter((p) => p.status === 'waiting_review' || p.status === 'approved')
  const checks = checksPassing(sys)
  const rd = readiness(sys)
  const vc = valuesWithCodeName(sys)
  const merged = sys.findings.filter((f) => f.status === 'merged').length
  const scanned = sys.journey.scan.status === 'done'
  const guided = r.home + '?guide=meeting'
  const next = !scanned
    ? { title: 'Run the assessment', text: 'Ten minutes, read-only. It gives you the baseline every later number refers to.', to: guided, cta: 'See how it works' }
    : waiting.length
      ? { title: `Review pull request #${waiting[0].number}`, text: 'All checks pass; your design-system owner approves and merges.', to: r.pr(waiting[0].number), cta: 'Open the pull request' }
      : open.length
        ? { title: `Decide on “${open[0].title}”`, text: 'Propose the suggested fix, dismiss with a reason, or ask us.', to: r.finding(open[0].id), cta: 'Open the finding' }
        : { title: 'Book the readout', text: 'Agree what leads for tokens and components, name an owner, choose the package.', to: r.handover, cta: 'Open the handover' }

  return (
    <div className="page">
      <PageHead
        title={`${sys.theme.name}: your system today`}
        lead="A plain view of where your design system stands, what needs attention, and the recommended next step. Technical detail is available where you want it."
        actions={
          <>
            <Btn variant="secondary" onClick={() => act().pushToast({ kind: 'sim', title: 'Readout booking is simulated', detail: `In an engagement this opens the calendar of your Nagarro contact, ${project.engagement.owner}.` })}>
              <CalendarCheck /> Book a readout
            </Btn>
            <Link to={guided} className="btn btn--mint btn--lg">
              <Play /> Start the guided demo
            </Link>
          </>
        }
      />

      <Stagger className="grid grid--3">
        <Panel tight className="fi-dark fi-wash" style={{ color: 'var(--n-white)' }}>
          <div className="stat">
            <span className="stat__label" style={{ color: 'var(--n-white-70)' }}>
              Health
            </span>
            <span className="stat__value">
              <AnimatedNumber value={h} suffix="%" />
            </span>
            <span className="stat__hint" style={{ color: 'var(--n-white-70)' }}>
              {checks.passing} of {checks.total} checks passing
            </span>
          </div>
        </Panel>
        <Panel tight>
          <div className="stat">
            <span className="stat__label">Needs attention</span>
            <span className="stat__value">
              <AnimatedNumber value={drift} />
            </span>
            <span className="stat__hint">drift items across {openFindings(sys).length} open findings</span>
          </div>
        </Panel>
        <Panel tight>
          <div className="stat">
            <span className="stat__label">AI readiness</span>
            <span className="stat__value">
              <AnimatedNumber value={rd} /> <span className="muted" style={{ fontSize: 18 }}>/ 5</span>
            </span>
            <span className="stat__hint">
              {vc.named} / {vc.total} values named
            </span>
          </div>
        </Panel>
      </Stagger>

      <Reveal>
        <Panel ink>
          <div className="row row--between" style={{ gap: 16 }}>
            <div className="stack" style={{ gap: 4 }}>
              <span className="xs" style={{ color: 'var(--n-mint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Recommended next step
              </span>
              <strong style={{ fontFamily: 'var(--n-font-display)', fontSize: 22, fontWeight: 500 }}>{next.title}</strong>
              <span className="muted">{next.text}</span>
            </div>
            <Link to={next.to} className="btn btn--on-dark">
              {next.cta} <ArrowRight />
            </Link>
          </div>
        </Panel>
      </Reveal>

      <div className="grid grid--2">
        <Reveal>
          <Panel title="What needs attention" actions={<Link to={r.changes} className="small">All findings →</Link>}>
            {open.length === 0 ? (
              <div className="empty">Nothing open. Your system is in sync.</div>
            ) : (
              <Stagger className="list">
                {open.map((f) => (
                  <Link key={f.id} to={r.finding(f.id)} className="list__item list__item--link">
                    <div className="list__body">
                      <span className="list__title">{f.title}</span>
                      <span className="list__meta">{f.componentIds.map((id) => sys.components.find((c) => c.id === id)?.name).join(', ') || 'Tokens'} · fix in {f.fixSide === 'both' ? 'Figma and code' : f.fixSide === 'figma' ? 'Figma' : 'code'}</span>
                    </div>
                    <SeverityChip severity={f.severity} />
                  </Link>
                ))}
              </Stagger>
            )}
          </Panel>
        </Reveal>
        <Reveal index={1}>
          <Panel title="Changes" actions={<Link to={r.changesTab('prs')} className="small">All changes →</Link>}>
            {prs.length === 0 ? (
              <div className="empty">No changes yet. The guided demo creates the first pull request.</div>
            ) : (
              <Stagger className="list">
                {prs.map((p) => (
                  <Link key={p.number} to={r.pr(p.number)} className="list__item list__item--link">
                    <GitPullRequest style={{ width: 16, color: p.status === 'merged' ? 'var(--n-ai)' : 'var(--n-ok)' }} />
                    <div className="list__body">
                      <span className="list__title">
                        #{p.number} · {p.title}
                      </span>
                      <span className="list__meta">{relTime(p.createdAt)}</span>
                    </div>
                    <Chip tone={p.status === 'merged' ? 'ok' : p.status === 'waiting_review' || p.status === 'approved' ? 'warn' : 'info'}>{p.status === 'merged' ? 'approved and merged' : p.status === 'waiting_review' || p.status === 'approved' ? 'needs your review' : p.status.replace('_', ' ')}</Chip>
                  </Link>
                ))}
              </Stagger>
            )}
            {merged > 0 && (
              <span className="xs muted">
                {merged} finding{merged > 1 ? 's' : ''} resolved so far. <FindingStatusChip status="merged" />
              </span>
            )}
          </Panel>
        </Reveal>
      </div>

      <Reveal>
        <div className="grid grid--3">
          <Link to={r.components} className="tile">
            <Layers />
            <span className="tile__title">Components</span>
            <span className="tile__desc">{sys.components.length} components with usage guidance and checks</span>
          </Link>
          <Link to={r.foundations} className="tile">
            <Shapes />
            <span className="tile__title">Foundations</span>
            <span className="tile__desc">Colour, type, spacing, radius, shadows, themes</span>
          </Link>
          <Link to={r.guides} className="tile">
            <BookOpen />
            <span className="tile__title">Documentation</span>
            <span className="tile__desc">How the system, Figma, code and AI stay connected</span>
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <Panel title="A few of your components" flush>
          <DemoScope brand={sys.theme.activeBrand} mode={sys.theme.designedFirst} style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <DsButton>Primary</DsButton>
            <DsButton variant="secondary">Secondary</DsButton>
            <DsBadge tone="success">Active</DsBadge>
            <DsToggle />
            <DsInput />
          </DemoScope>
        </Panel>
      </Reveal>

      <Reveal>
        <div className="grid grid--2">
          <Panel tight title="What happens next">
            <ol className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Readout: we walk through the findings and agree what leads for tokens and components.</li>
              <li>Adaptation: your names stay; the adapter maps them to the shared contract.</li>
              <li>First changes as pull requests, reviewed in Figma and code.</li>
              <li>Handover: repository, Figma library, panel, checks, AI channels, a named owner.</li>
            </ol>
            <div className="row">
              <Link to={r.handover} className="btn btn--secondary btn--sm">
                <PackageCheck /> Handover
              </Link>
              <Link to={r.report} className="btn btn--secondary btn--sm">
                <FileText /> Report
              </Link>
            </div>
          </Panel>
          <Panel tight title="What we need from your team">
            <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Read access to the repository and the Figma file</li>
              <li>A named design-system owner (approves merges, sets agent trust levels)</li>
              <li>Sixty minutes for the readout; decisions on what leads</li>
            </ul>
            <Details summary="Technical details">
              <p className="small muted">
                Supported profile: React + JSON tokens + Figma variables. Other stacks get tokens and rules first. Every change is a branch and a pull request with five checks; Figma changes go through the sync plugin’s three-way review. Nothing is written without an approved pull request.
              </p>
            </Details>
          </Panel>
        </div>
      </Reveal>
    </div>
  )
}

function sev(sv: string) {
  return { error: 0, warn: 1, info: 2 }[sv] ?? 3
}
