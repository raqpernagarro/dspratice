import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router'
import { Home, Layers, GitPullRequest, Sparkles, Shield, Search, Menu, RotateCcw, Play, Gauge, BookOpen, Building2, Compass, Wrench, FlaskConical, PackageCheck, Presentation, ExternalLink, LogOut, Library, Target, MonitorPlay, Hammer, Radio } from 'lucide-react'
import { useIntegrationStatus } from '@/integrations/status'
import { useStore } from '@/state/store'
import { Toasts } from './Toasts'
import { CommandPalette } from './CommandPalette'
import { DemoBar } from './DemoBar'
import { WorkspaceSwitch } from './WorkspaceSwitch'
import { ProjectPicker } from './ProjectPicker'
import { setSimSpeed } from '@/state/sim'
import { cx } from './ui'
import { activeNav, navFor } from './useWorkspace'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { hasUnpublishedChanges, sessionIsStale } from '@/state/scope'
import { PageTransition, WorkspaceWipe } from '@/motion'
import type { Workspace } from '@/state/types'

const ICONS = { home: Home, clients: Building2, library: Layers, changes: GitPullRequest, ai: Sparkles, presentations: Presentation, guides: BookOpen, settings: Shield, explore: Compass, improve: Wrench, evidence: PackageCheck, knowledge: Library, opportunities: Target, demos: MonitorPlay, tools: Hammer, scorecard: Gauge } as const

export function AppShell({ workspace, bare, children }: { workspace: Workspace; bare?: boolean; children?: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const project = useProject()
  const sys = useSystem()
  const r = usePaths()
  const sideOpen = useStore((s) => s.ui.sideOpen)
  const setSideOpen = useStore((s) => s.setSideOpen)
  const setCmdkOpen = useStore((s) => s.setCmdkOpen)
  const actingAs = useStore((s) => s.ui.actingAs)
  const setActingAs = useStore((s) => s.setActingAs)
  const speed = useStore((s) => s.ui.simSpeed)
  const setSpeed = useStore((s) => s.setSimSpeed)
  const presenter = useStore((s) => s.ui.presenter)
  const motionPaused = useStore((s) => s.ui.motionPaused)
  const guideActive = Boolean(project.session?.guide && (project.session.guide.status === 'running' || project.session.guide.status === 'paused'))
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmSession, setConfirmSession] = useState(false)
  const wipes = useRef(0)
  const lastWs = useRef(workspace)
  if (lastWs.current !== workspace) {
    lastWs.current = workspace
    wipes.current += 1
  }

  useEffect(() => {
    setSideOpen(false)
    window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    setSimSpeed(speed)
  }, [speed])

  const integrations = useIntegrationStatus((s) => s.status)
  useEffect(() => {
    if (workspace === 'nagarro') void useIntegrationStatus.getState().refresh()
  }, [workspace])

  useEffect(() => {
    document.documentElement.classList.toggle('motion-paused', motionPaused)
  }, [motionPaused])

  const client = workspace === 'client'
  const nav = navFor(workspace, r)
  const active = activeNav(nav, location.pathname)
  const dirty = hasUnpublishedChanges(project)
  const stale = sessionIsStale(project)

  const openClient = () => {
    const to = act().openClientExperience(project.id)
    if (to) navigate(to)
    else act().pushToast({ kind: 'warn', title: 'Publish first', detail: `${project.client.name} opens in the client workspace once a version is published.` })
  }

  return (
    <div className={cx('shell', client && 'shell--client', presenter && 'shell--presenter')} data-workspace={workspace}>
      <WorkspaceWipe token={wipes.current} />
      <header className="shell__top">
        <button className="icon-btn shell__menu-btn" onClick={() => setSideOpen(!sideOpen)} aria-label="Menu">
          <Menu />
        </button>
        <Link to={r.home} className="shell__brand" title="Home">
          <img src="/brand/nagarro-logo.svg" alt="Nagarro" />
          <span className="shell__brand-divider" />
          <span className="shell__crumb">
            <strong>{client ? sys.theme.name : 'Design systems'}</strong> · {client ? 'design system' : 'accelerator'}
          </span>
        </Link>

        {import.meta.env.VITE_TARGET !== 'demo' && <WorkspaceSwitch workspace={workspace} />}
        {!client && <ProjectPicker />}
        {client && presenter && (
          <span className="presenter-badge" title="You opened this from the Nagarro workspace. Presenter notes and tools are visible to you only.">
            Presenter
          </span>
        )}

        <div className="shell__spacer" />
        <button className="btn btn--on-dark-ghost btn--sm" onClick={() => setCmdkOpen(true)} title="Search (⌘K)">
          <Search /> <span className="hide-sm">Search</span> <kbd>⌘K</kbd>
        </button>
        {(!client || presenter) && (
          <label className="row xs hide-sm" style={{ color: 'var(--n-white-70)', gap: 6 }} title="Switch who you act as to see permission gates">
            <span>Acting as</span>
            <select className="select" value={actingAs} onChange={(e) => setActingAs(e.target.value)} style={{ width: 'auto', padding: '4px 8px', background: 'var(--n-white-10)', color: 'var(--n-white)', borderColor: 'var(--n-white-30)', fontSize: 12 }}>
              {sys.people
                .filter((p) => !p.isAgent)
                .map((p) => (
                  <option key={p.id} value={p.id} style={{ color: '#000' }}>
                    {p.count ? `${p.role} (${p.name})` : `${p.name} · ${p.role}`}
                  </option>
                ))}
            </select>
          </label>
        )}
        {!client && (
          <button className="btn btn--on-dark-ghost btn--sm hide-sm" onClick={() => setSpeed(speed === 1 ? 3 : 1)} title="Simulation speed">
            <Gauge /> {speed}×
          </button>
        )}
        {!client && (
          <button className="btn btn--mint btn--sm" onClick={openClient} title={dirty ? 'Opens the published version; the draft has unpublished changes' : 'Open the client experience for the selected engagement'}>
            <ExternalLink /> <span className="hide-sm">Open client experience</span>
          </button>
        )}
        {client && !guideActive && project.published && (
          <Link to={`${r.home}?guide=meeting`} className="btn btn--mint btn--sm" title="Start the guided walkthrough">
            <Play /> <span className="hide-sm">Start the guide</span>
          </Link>
        )}
        {client && presenter && (
          <>
            <button className="icon-btn" onClick={() => setConfirmSession(true)} title="Reset the demo session to the published version" aria-label="Reset the demo session">
              <RotateCcw />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                act().exitPresenter()
                navigate(r.home)
              }}
              title="Exit presenter mode"
              aria-label="Exit presenter mode"
            >
              <LogOut />
            </button>
          </>
        )}
        {!client && (
          <button className="icon-btn" onClick={() => setConfirmReset(true)} title="Reset every project to the sample data" aria-label="Reset all demo data">
            <RotateCcw />
          </button>
        )}
      </header>

      {sideOpen && <div className="shell__scrim" onClick={() => setSideOpen(false)} />}
      <nav className={cx('shell__side', sideOpen && 'is-open')} aria-label="Primary">
        {nav.map((item, i) => {
          const Icon = ICONS[item.icon]
          const isActive = active?.to === item.to
          const heading = item.group && item.group !== nav[i - 1]?.group ? <div className="nav__heading">{item.group}</div> : null
          return (
            <div key={item.to}>
              {heading}
              <NavLink to={item.to} className={cx('nav__label', isActive && 'is-active')} aria-current={isActive ? 'page' : undefined}>
                <Icon />
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            </div>
          )
        })}
        <div className="nav__foot">
          <span className="row xs" style={{ gap: 6 }}>
            <FlaskConical style={{ width: 12 }} /> Sample data · local simulation
          </span>
          {!client && (
            <span className="row xs" style={{ gap: 6 }} title="Integrations on this machine. Keys stay on the local server.">
              <Radio style={{ width: 12 }} />
              {integrations.offline ? 'Static build: no local server' : `Model: ${integrations.model.configured ? integrations.model.model : 'templates only'} · Figma REST: ${integrations.figma.configured ? 'on' : 'off'}`}
            </span>
          )}
          <span>{client ? `${project.client.name} · fictional client` : `${project.client.name} · ${project.engagement.package}`}</span>
          {!client && <span>Contract v{sys.contract.version} · {project.published ? `published v${project.published.version}` : 'not published'}</span>}
          {client && presenter && stale && <span style={{ color: 'var(--n-amber, #e8b04b)' }}>A newer version was published · reset the session to show it</span>}
        </div>
      </nav>

      <main className="shell__main" id="main">
        {bare ? children : <PageTransition>{children ?? <Outlet />}</PageTransition>}
      </main>

      <Toasts />
      <CommandPalette />
      {client && <DemoBar />}

      {confirmReset && (
        <div className="sheet-scrim" onClick={() => setConfirmReset(false)} role="presentation">
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h4>Reset all demo data?</h4>
            <p className="muted small">Every project (drafts, published versions, demo sessions, journeys) is reseeded from the sample data. Nothing outside this browser is affected.</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setConfirmReset(false)}>
                Keep going
              </button>
              <button
                className="btn btn--danger"
                onClick={() => {
                  act().resetAll()
                  setConfirmReset(false)
                }}
              >
                Reset everything
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmSession && (
        <div className="sheet-scrim" onClick={() => setConfirmSession(false)} role="presentation">
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h4>Reset the demo session?</h4>
            <p className="muted small">The client experience goes back to published v{project.published?.version}. Everything done in this session (assessment, proposals, merges) is discarded. Internal draft changes are untouched.</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setConfirmSession(false)}>
                Keep going
              </button>
              <button
                className="btn btn--danger"
                onClick={() => {
                  act().resetDemoSession(project.id)
                  setConfirmSession(false)
                  navigate(r.home)
                }}
              >
                Reset session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
