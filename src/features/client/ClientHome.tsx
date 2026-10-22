import { useEffect } from 'react'
import { Link } from 'react-router'
import { Play, Layers, Shapes, GitPullRequest, BookOpen, Compass } from 'lucide-react'
import { usePaths, useProject, useSystem } from '@/state/hooks'
import { driftItems, health, openFindings, relTime, checksPassing, readiness, valuesWithCodeName } from '@/state/selectors'
import { Panel, Chip, SeverityChip, FindingStatusChip, DemoData } from '@/shell/ui'
import { AnimatedNumber, Reveal, Stagger } from '@/motion'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsBadge, DsButton, DsInput, DsToggle } from '@/demo-system/components'
import { Hl, Kicker, ProcessStrip } from '@/shell/story'
import { TOUR, demoText } from '@/features/demo/steps'

export function ClientHome() {
  const sys = useSystem()
  const project = useProject()
  const r = usePaths()
  const h = health(sys)
  const drift = driftItems(sys)
  const open = openFindings(sys).sort((a, b) => sev(a.severity) - sev(b.severity)).slice(0, 4)
  const prs = sys.pullRequests.slice(0, 4)
  const checks = checksPassing(sys)
  const rd = readiness(sys)
  const vc = valuesWithCodeName(sys)
  const merged = sys.findings.filter((f) => f.status === 'merged').length
  const guide = project.session?.guide
  const guiding = guide?.status === 'running' || guide?.status === 'paused'
  const name = sys.theme.name
  useEffect(() => {
    document.title = `${name} · Client demo · Nagarro`
  }, [name])

  return (
    <div className="page">
      <section className="story-dark" data-demo-focus="demo-intro" aria-labelledby="demo-title">
        <Kicker>Client demo · {demoText('{intro}', name, project.client.fictional)}</Kicker>
        <h1 id="demo-title" className="story-dark__title">
          How design, code and AI tools <Hl>stay on one system</Hl>.
        </h1>
        <p className="story-dark__lead">
          {project.client.fictional ? `${name} is a fictional company` : name} with a design system in Figma and in code. In the next few minutes we follow one small inconsistency from the moment it is found to the moment AI tools stop repeating it, then look at what an engagement could leave behind.
        </p>
        {!guiding && (
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Link to={`${r.home}?guide=meeting`} className="btn btn--mint">
              <Play /> Start the guided demo
            </Link>
            <Link to={r.components} className="btn btn--on-dark-ghost">
              <Compass /> Explore on your own
            </Link>
          </div>
        )}
        <ProcessStrip dark compact label="The story" steps={TOUR.map((c) => ({ title: c.title }))} />
      </section>

      <Panel title={`${name} at a glance`} actions={<DemoData>Sample figures, not measurements</DemoData>}>
        <Stagger className="grid grid--3">
          <div className="stat">
            <span className="stat__label">Checks passing</span>
            <span className="stat__value">
              <AnimatedNumber value={h} suffix="%" />
            </span>
            <span className="stat__hint">
              {checks.passing} of {checks.total} automated checks
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Needs attention</span>
            <span className="stat__value">
              <AnimatedNumber value={drift} />
            </span>
            <span className="stat__hint">places where Figma and code differ, in {openFindings(sys).length} findings</span>
          </div>
          <div className="stat">
            <span className="stat__label">Readable by AI tools</span>
            <span className="stat__value">
              <AnimatedNumber value={rd} /> <span className="muted" style={{ fontSize: 18 }}>/ 5</span>
            </span>
            <span className="stat__hint">
              {vc.named} of {vc.total} values have a code name
            </span>
          </div>
        </Stagger>
      </Panel>

      <div className="grid grid--2">
        <Reveal>
          <Panel title="What needs attention" actions={<Link to={r.changes} className="small">All findings →</Link>}>
            {open.length === 0 ? (
              <div className="empty">Nothing open: Figma and code agree.</div>
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
              <div className="empty">No changes yet. The guided demo creates the first one.</div>
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
                    <Chip tone={p.status === 'merged' ? 'ok' : p.status === 'waiting_review' || p.status === 'approved' ? 'warn' : 'info'}>{p.status === 'merged' ? 'approved and merged' : p.status === 'waiting_review' || p.status === 'approved' ? 'waiting for the owner' : p.status.replace('_', ' ')}</Chip>
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
            <span className="tile__desc">{sys.components.length} components, each with guidance and checks</span>
          </Link>
          <Link to={r.foundations} className="tile">
            <Shapes />
            <span className="tile__title">Foundations</span>
            <span className="tile__desc">Colour, type, spacing, radius, shadows, themes</span>
          </Link>
          <Link to={r.guides} className="tile">
            <BookOpen />
            <span className="tile__title">How we work</span>
            <span className="tile__desc">How the system, Figma, code and AI tools stay connected</span>
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <Panel title={`A few of ${name}’s components`} flush>
          <DemoScope brand={sys.theme.activeBrand} mode={sys.theme.designedFirst} style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <DsButton>Primary</DsButton>
            <DsButton variant="secondary">Secondary</DsButton>
            <DsBadge tone="success">Active</DsBadge>
            <DsToggle />
            <DsInput />
          </DemoScope>
        </Panel>
      </Reveal>

    </div>
  )
}

function sev(sv: string) {
  return { error: 0, warn: 1, info: 2 }[sv] ?? 3
}
