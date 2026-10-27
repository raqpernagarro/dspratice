import { useEffect } from 'react'
import { Link } from 'react-router'
import { Play, Layers, Shapes, GitPullRequest, BookOpen, Compass } from 'lucide-react'
import { usePaths, useProject, useSystem } from '@/state/hooks'
import { driftItems, health, openFindings, relTime, readiness } from '@/state/selectors'
import { Panel, Chip, SeverityChip, FindingStatusChip, DemoData } from '@/shell/ui'
import { AnimatedNumber, Reveal, Stagger } from '@/motion'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsBadge, DsButton, DsInput, DsToggle } from '@/demo-system/components'
import { Hl, Kicker } from '@/shell/story'
import { demoText } from '@/features/demo/steps'
import { MINI_DEMOS } from '@/fixtures/demos'

export function ClientHome() {
  const sys = useSystem()
  const project = useProject()
  const r = usePaths()
  const h = health(sys)
  const drift = driftItems(sys)
  const open = openFindings(sys).sort((a, b) => sev(a.severity) - sev(b.severity)).slice(0, 4)
  const prs = sys.pullRequests.slice(0, 4)
  const rd = readiness(sys)
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
      </section>

      <p className="glance-line" aria-label={`${name} at a glance`}>
        <span>
          <strong>
            <AnimatedNumber value={h} suffix="%" />
          </strong>{' '}
          of checks pass
        </span>
        <span>
          <strong>
            <AnimatedNumber value={drift} />
          </strong>{' '}
          places where Figma and code differ
        </span>
        <span>
          <strong>
            <AnimatedNumber value={rd} />
          </strong>{' '}
          of 5 for AI readability
        </span>
        <DemoData>Sample figures</DemoData>
      </p>

      <section className="stack" aria-labelledby="pick-title">
        <h2 id="pick-title" className="section-title">
          Pick what to see
        </h2>
        <div className="mini-grid mini-grid--compact">
          {MINI_DEMOS.filter((d) => d.audience === 'client' && d.id !== 'explore').map((d, k) => (
            <Link key={d.id} className={`mini mini--${k % 3} mini--link`} to={d.chapters ? `${r.home}?guide=custom&chapters=${d.chapters.join(',')}` : d.story ? `${r.home}?guide=${d.story}` : (d.page?.(r) ?? r.home)} data-testid={`pick-${d.id}`}>
              <span className="mini__min">About {d.minutes} min</span>
              <span className="mini__title">{d.title}</span>
              <span className="mini__shows">{d.shows}</span>
            </Link>
          ))}
        </div>
      </section>

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
