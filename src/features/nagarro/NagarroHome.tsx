import { Link, useNavigate } from 'react-router'
import { ArrowRight, Play, GitPullRequest, Radio, Sparkles, AlertTriangle, Layers, Palette, Shapes, SlidersHorizontal, BookOpen, FileText, Shield, Bot, RotateCcw, Upload } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { hasUnpublishedChanges } from '@/state/scope'
import { nagarro, practice } from '@/app/routes'
import { driftItems, forYouToday, health, lastEval, openPRs, relTime, staleChannels, checksPassing, aiReadableCount, componentsInFigma, guidancePct } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Panel, DemoData, Chip, Btn } from '@/shell/ui'
import { AnimatedNumber, Reveal, Stagger } from '@/motion'
import { FontStatus } from '@/shell/FontStatus'
import { LivePreview } from '@/features/govern/LivePreview'
import { QuickActions } from '@/features/hub/QuickActions'

export function NagarroHome() {
  const navigate = useNavigate()
  const project = useProject()
  const sys = useSystem()
  const projects = useStore((s) => s.projects)
  const r = usePaths()
  const h = health(sys)
  const drift = driftItems(sys)
  const prs = openPRs(sys)
  const ev = lastEval(sys)
  const items = forYouToday(sys, r)
  const stale = staleChannels(sys)
  const checks = checksPassing(sys)
  const recent = sys.history.slice(0, 5)
  const pendingProposals = sys.agentProposals.filter((p) => p.status === 'pending').length
  const avgGuidance = Math.round(sys.components.reduce((n, c) => n + guidancePct(c), 0) / Math.max(1, sys.components.length))
  const unpublished = hasUnpublishedChanges(project)
  const guide = project.session?.guide
  const sessionLabel = !project.session || !guide || guide.status === 'idle' ? 'not started' : guide.status === 'finished' ? 'completed' : `${guide.status} · ${guide.completedChapters.length} chapter${guide.completedChapters.length === 1 ? '' : 's'} done`

  const openClientExperience = () => {
    const to = act().openClientExperience(project.id)
    if (to) navigate(to)
    else act().pushToast({ kind: 'warn', title: 'Publish first', detail: 'The client experience opens once a version is published.' })
  }

  return (
    <div className="page">
      <PageHead
        title="Nagarro design systems hub"
        lead={
          <>
            Win work, run demos and deliver from one place. Below the quick actions: the {project.client.name} control panel with health, drift, pending decisions and the client experience.
            <br />
            <span className="row xs muted" style={{ marginTop: 6 }}>
              <span>
                Draft · {unpublished ? 'unpublished changes' : 'matches'} {project.published ? `v${project.published.version}` : '(nothing published yet)'}
              </span>
              {unpublished && (
                <Btn size="sm" variant="secondary" onClick={() => act().publishProject(project.id)}>
                  <Upload /> Publish
                </Btn>
              )}
            </span>
          </>
        }
        eyebrow={<DemoData>Demo data · clients are fictional</DemoData>}
        actions={
          <Btn variant="mint" size="lg" onClick={openClientExperience} title={project.published ? undefined : 'Publish a version first'}>
            <Play /> Open client experience
          </Btn>
        }
      />

      <QuickActions />

      <Stagger className="grid grid--4">
        <Panel tight>
          <div className="stat">
            <span className="stat__label">System health</span>
            <span className="stat__value" style={{ color: h >= 90 ? 'var(--n-ok)' : h >= 75 ? 'var(--n-warn)' : 'var(--n-err)' }}>
              <AnimatedNumber value={h} suffix="%" />
            </span>
            <span className="stat__hint">
              {checks.passing} / {checks.total} checks passing
            </span>
          </div>
        </Panel>
        <Panel tight>
          <div className="stat">
            <span className="stat__label">Drift items</span>
            <span className="stat__value">
              <AnimatedNumber value={drift} />
            </span>
            <span className="stat__hint">
              <Link to={r.changes}>{sys.findings.filter((f) => f.status === 'open').length} open findings</Link>
            </span>
          </div>
        </Panel>
        <Panel tight>
          <div className="stat">
            <span className="stat__label">Pending decisions</span>
            <span className="stat__value">
              <AnimatedNumber value={prs.filter((p) => p.status === 'waiting_review' || p.status === 'approved').length + pendingProposals} />
            </span>
            <span className="stat__hint">
              {prs.length} open PR{prs.length === 1 ? '' : 's'} · {pendingProposals} agent proposal{pendingProposals === 1 ? '' : 's'}
            </span>
          </div>
        </Panel>
        <Panel tight>
          <div className="stat">
            <span className="stat__label">AI readiness</span>
            <span className="stat__value" style={{ color: ev && ev.onSystem >= ev.gate ? 'var(--n-ok)' : 'var(--n-warn)' }}>
              <AnimatedNumber value={ev?.onSystem ?? 0} suffix="%" />
            </span>
            <span className="stat__hint">
              {ev?.version} eval · {aiReadableCount(sys)} / {componentsInFigma(sys).length} components agent-readable
            </span>
          </div>
        </Panel>
      </Stagger>

      <Reveal>
        <div className="grid grid--side">
          <Panel title="Needs a decision" actions={<Link to={r.changes} className="small">All changes →</Link>}>
            {items.length === 0 ? (
              <div className="empty">Nothing needs you. Channels are fresh, no reviews waiting.</div>
            ) : (
              <Stagger className="list">
                {items.map((it) => (
                  <Link key={it.id} to={it.to} className="list__item list__item--link">
                    {it.kind === 'pr' ? <GitPullRequest style={{ width: 16, color: 'var(--n-ai)' }} /> : it.kind === 'channel' ? <Radio style={{ width: 16, color: 'var(--n-warn)' }} /> : it.kind === 'warn' ? <AlertTriangle style={{ width: 16, color: 'var(--n-warn)' }} /> : <Sparkles style={{ width: 16, color: 'var(--n-info)' }} />}
                    <div className="list__body">
                      <span className="list__title">{it.text}</span>
                    </div>
                    <ArrowRight style={{ width: 14, color: 'var(--n-fg-subtle)' }} />
                  </Link>
                ))}
              </Stagger>
            )}
          </Panel>
          <Panel title="Recent activity" tight actions={<Link to={r.audit} className="small">Audit trail →</Link>}>
            <div className="list">
              {recent.map((hh) => (
                <div key={hh.id} className="list__item" style={{ padding: '8px 0' }}>
                  <div className="list__body">
                    <span className="list__title" style={{ fontWeight: 400 }}>
                      {hh.text}
                    </span>
                    <span className="list__meta">
                      {hh.actor} · {relTime(hh.ts)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Reveal>

      <Reveal>
        <Panel title="Client systems" actions={<Link to={practice.clients} className="small">Portfolio and presenter guide →</Link>}>
          <div className="client-strip">
            {Object.values(projects).map((p) => {
              const ph = health(p.draft)
              const selected = p.id === project.id
              return (
                <Link key={p.id} to={nagarro(p.slug).home} className="client-strip__item" aria-current={selected ? 'true' : undefined} style={selected ? { boxShadow: 'inset 0 0 0 2px var(--n-mint)' } : undefined}>
                  <span className="client-strip__name">{p.client.name}</span>
                  <span className="row xs muted">
                    <Chip tone="outline">{p.engagement.package}</Chip>
                    <Chip tone={selected ? 'mint' : 'default'}>{p.engagement.stage}</Chip>
                  </span>
                  <span className="client-strip__health" style={{ color: ph >= 90 ? 'var(--n-ok)' : ph >= 80 ? 'var(--n-fg)' : 'var(--n-err)' }}>
                    {ph}%
                  </span>
                  <span className="row xs muted">
                    {driftItems(p.draft)} drift · review {p.engagement.nextReview}
                  </span>
                </Link>
              )
            })}
          </div>
        </Panel>
      </Reveal>

      <Reveal>
        <div className="section__head" style={{ paddingTop: 8 }}>
          <h2 style={{ fontSize: 'var(--n-h3)' }}>Explore the system</h2>
          <p className="small">Components, tokens and foundations of {sys.theme.name}, the configurator with its live preview, and what agents receive.</p>
        </div>
      </Reveal>
      <Stagger className="grid grid--4">
        <Link to={r.components} className="tile">
          <Layers />
          <span className="tile__title">Components</span>
          <span className="tile__desc">
            {sys.components.length} in the contract · guidance {avgGuidance}% complete
          </span>
        </Link>
        <Link to={r.tokens} className="tile">
          <Palette />
          <span className="tile__title">Tokens</span>
          <span className="tile__desc">{sys.tokens.length} tokens in three tiers · brands and modes</span>
        </Link>
        <Link to={r.foundations} className="tile">
          <Shapes />
          <span className="tile__title">Foundations</span>
          <span className="tile__desc">Colour, typography, radius, spacing, shadows, icons, themes, density</span>
        </Link>
        <Link to={r.brands} className="tile">
          <SlidersHorizontal />
          <span className="tile__title">Configurator</span>
          <span className="tile__desc">Brands, modes, presets, live preview on real components</span>
        </Link>
      </Stagger>

      <Reveal>
        <div className="grid grid--2">
          <Panel title="Live preview" tight actions={<Link to={r.brands} className="small">Open the configurator →</Link>}>
            <LivePreview compact />
          </Panel>
          <div className="stack">
            <Stagger className="grid grid--2">
              <Link to={r.report} className="tile tile--sm">
                <FileText />
                <span className="tile__title">Reports</span>
                <span className="tile__desc">Assessment, before/after, share link</span>
              </Link>
              <Link to={r.changes} className="tile tile--sm">
                <GitPullRequest />
                <span className="tile__title">Changes</span>
                <span className="tile__desc">Findings, pull requests, Figma change sets</span>
              </Link>
              <Link to={r.contract} className="tile tile--sm">
                <Shield />
                <span className="tile__title">Governance</span>
                <span className="tile__desc">Contract, roles, trust levels, audit trail</span>
              </Link>
              <Link to={r.channels} className="tile tile--sm">
                <Bot />
                <span className="tile__title">AI readiness</span>
                <span className="tile__desc">
                  {stale.length ? `${stale.length} channel${stale.length > 1 ? 's' : ''} stale` : 'channels fresh'} · evals · agent inbox
                </span>
              </Link>
            </Stagger>
            <Panel tight title="Handbook and service" actions={<Link to={r.guides} className="small">Open →</Link>}>
              <div className="row small">
                <BookOpen style={{ width: 14, color: 'var(--n-fg-muted)' }} />
                <span className="muted">AI Audit · DS Build · DS Accelerate · DS Scale · Support. Which path fits which client, and where the tool comes from.</span>
              </div>
              <div className="row">
                <Link to={r.guide('which-path')} className="chip chip--outline">
                  Which path fits a client
                </Link>
                <Link to={r.meeting} className="chip chip--outline">
                  Presenter guide
                </Link>
                <Link to={r.journeyNew()} className="chip chip--outline">
                  Start a system
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <Panel tight title="Setup" actions={<span className="xs muted">Nagarro workspace only</span>}>
          <div className="row row--between" style={{ gap: 16 }}>
            <FontStatus />
            <span className="small muted">
              Adapter {project.engagement.adapterVersion} · contract v{sys.contract.version} · client session {sessionLabel}
            </span>
            <Btn variant="ghost" size="sm" onClick={() => act().resetAll()}>
              <RotateCcw /> Reset demo data
            </Btn>
          </div>
        </Panel>
      </Reveal>
    </div>
  )
}
