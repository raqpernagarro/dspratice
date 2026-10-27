import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import { Home, Layers, GitPullRequest, Sparkles, Shield, Search, Menu, RotateCcw, Play, Gauge, BookOpen, Building2, Compass, Wrench, PackageCheck, Presentation, Library, Target, MonitorPlay, Hammer, MoreHorizontal, ArrowLeft, NotebookPen, Info, UserRound, Megaphone } from 'lucide-react'
import { useIntegrationStatus } from '@/integrations/status'
import { useStore } from '@/state/store'
import { Toasts } from './Toasts'
import { CommandPalette } from './CommandPalette'
import { DemoBar } from './DemoBar'
import { MenuButton, MenuItem } from './Menu'
import { usePresentDemo } from './present'
import { practice } from '@/app/routes'
import { setSimSpeed } from '@/state/sim'
import { cx } from './ui'
import { activeNav, navFor } from './useWorkspace'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { sessionIsStale } from '@/state/scope'
import { PageTransition, WorkspaceWipe } from '@/motion'
import type { Workspace } from '@/state/types'

const ICONS = { home: Home, clients: Building2, library: Layers, changes: GitPullRequest, ai: Sparkles, presentations: Presentation, guides: BookOpen, settings: Shield, explore: Compass, improve: Wrench, evidence: PackageCheck, knowledge: Library, opportunities: Target, demos: MonitorPlay, tools: Hammer, scorecard: Gauge, engagement: Megaphone } as const

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
  const stale = sessionIsStale(project)
  const present = usePresentDemo()
  const returnTo = useStore((s) => s.ui.returnTo)
  const inProject = location.pathname.startsWith(practice.projects + '/')
  const people = sys.people.filter((p) => !p.isAgent)

  const backToPreparation = () => {
    act().exitPresenter()
    act().setReturnTo(null)
    navigate(returnTo || practice.home)
  }
  const openNotes = () => window.open(practice.presenterNotes(project.slug), 'ds-presenter-notes', 'width=520,height=760')

  const actingAsMenu = (
    <label className="hdr-menu__field">
      <span>
        <UserRound style={{ width: 14 }} /> Acting as
      </span>
      <select className="select" value={actingAs} onChange={(e) => setActingAs(e.target.value)}>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.count ? `${p.role} (${p.name})` : `${p.name} · ${p.role}`}
          </option>
        ))}
      </select>
      <small>Shows what each role is allowed to do, for example who can merge.</small>
    </label>
  )

  return (
    <div className={cx('shell', client && 'shell--client', presenter && 'shell--presenter')} data-workspace={workspace}>
      <WorkspaceWipe token={wipes.current} />
      <header className="shell__top">
        <button className="icon-btn shell__menu-btn" onClick={() => setSideOpen(!sideOpen)} aria-label="Menu">
          <Menu />
        </button>
        <Link to={client ? r.home : practice.home} className="shell__brand" title={client ? 'Demo overview' : 'Home'}>
          <img src="/brand/nagarro-logo.svg" alt="Nagarro" />
          <span className="shell__brand-divider" />
          <span className="shell__crumb">{client ? <><strong>{sys.theme.name}</strong> design system</> : <><strong>Design</strong> <span className="shell__product">Workspace</span></>}</span>
        </Link>
        {client && (
          <span className="demo-notice" title="A fictional company's design system, with sample figures. Actions that would reach GitHub or Figma are simulated.">
            Demonstration · fictional company · sample figures
          </span>
        )}

        <div className="shell__spacer" />
        <button className="btn btn--on-dark-ghost btn--sm" onClick={() => setCmdkOpen(true)} title="Search (⌘K)">
          <Search /> <span className="hide-md">Search</span> <kbd>⌘K</kbd>
        </button>

        {!client && !inProject && (
          <button className="btn btn--mint btn--sm" onClick={() => present()} title="Opens the client demo as presenter. You can come back here at any time." data-testid="header-present">
            <MonitorPlay /> <span className="hide-md">Present client demo</span>
          </button>
        )}
        {!client && (
          <MenuButton label={<span className="sr-only">More</span>} icon={<MoreHorizontal />} testid="header-more">
            {(close) => (
              <>
                {actingAsMenu}
                <MenuItem icon={<Gauge style={{ width: 14 }} />} title={`Simulation speed: ${speed}×`} detail="Simulated checks and scans run faster at 3×." onClick={() => setSpeed(speed === 1 ? 3 : 1)} />
                <MenuItem
                  icon={<Info style={{ width: 14 }} />}
                  title="About this tool"
                  detail="What works, what needs a key, what is simulated"
                  onClick={() => {
                    close()
                    navigate(practice.about)
                  }}
                />
                <MenuItem
                  icon={<RotateCcw style={{ width: 14 }} />}
                  title="Reset sample data…"
                  detail="Puts every project back to the shipped samples"
                  danger
                  onClick={() => {
                    close()
                    setConfirmReset(true)
                  }}
                />
              </>
            )}
          </MenuButton>
        )}

        {client && !guideActive && project.published && (
          <Link to={`${r.home}?guide=meeting`} className="btn btn--mint btn--sm" title="Walk through the story chapter by chapter">
            <Play /> <span className="hide-md">Start the guided demo</span>
          </Link>
        )}
        {client && presenter && import.meta.env.VITE_TARGET !== 'demo' && (
          <button className="btn btn--on-dark-ghost btn--sm" onClick={openNotes} title="Opens your notes in a separate window. Share this tab only; the notes stay private." data-testid="open-notes">
            <NotebookPen /> <span className="hide-md">Presenter notes</span>
          </button>
        )}
        {client && presenter && (
          <MenuButton label={<span className="sr-only">Demo options</span>} icon={<MoreHorizontal />} testid="demo-more">
            {(close) => (
              <>
                {actingAsMenu}
                <MenuItem
                  icon={<RotateCcw style={{ width: 14 }} />}
                  title="Reset the demo…"
                  detail={`Back to the prepared version (v${project.published?.version ?? 1}). Your preparation is untouched.`}
                  danger
                  onClick={() => {
                    close()
                    setConfirmSession(true)
                  }}
                />
              </>
            )}
          </MenuButton>
        )}
        {client && presenter && import.meta.env.VITE_TARGET !== 'demo' && (
          <button className="btn btn--on-dark btn--sm" onClick={backToPreparation} title="Leave the demo and return to the page you opened it from" data-testid="back-to-preparation">
            <ArrowLeft /> <span className="hide-md">Back to preparation</span>
          </button>
        )}
      </header>

      {sideOpen && <div className="shell__scrim" onClick={() => setSideOpen(false)} />}
      <nav className={cx('shell__side', sideOpen && 'is-open')} aria-label="Primary">
        {nav
          .filter((item) => item.group !== 'foot')
          .map((item) => {
            const Icon = ICONS[item.icon]
            const isActive = active?.to === item.to
            return (
              <Link key={item.to} to={item.to} className={cx('nav__label', isActive && 'is-active')} aria-current={isActive ? 'page' : undefined}>
                <Icon />
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            )
          })}
        <div className="nav__foot">
          {nav
            .filter((item) => item.group === 'foot')
            .map((item) => {
              const Icon = ICONS[item.icon]
              const isActive = active?.to === item.to
              return (
                <Link key={item.to} to={item.to} className={cx('nav__label', isActive && 'is-active')} aria-current={isActive ? 'page' : undefined}>
                  <Icon />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              )
            })}
          {!client && (
            <span className="nav__note" title={integrations.offline ? 'Static build: no local server' : `AI drafting: ${integrations.model.configured ? 'on' : 'off (templates)'} · Figma REST: ${integrations.figma.configured ? 'on' : 'off'}`}>
              Sample clients and figures are fictional. Everything runs on this machine.
            </span>
          )}
          {client && presenter && stale && <span className="nav__note nav__note--warn">A newer version was prepared. Reset the demo to show it.</span>}
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
            <h4>Reset the sample data?</h4>
            <p className="muted small">Every project goes back to the shipped samples: drafts, client demo versions, demos in progress and journeys. Projects, requests and sources you added are removed. Nothing outside this browser is affected.</p>
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
                Reset sample data
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmSession && (
        <div className="sheet-scrim" onClick={() => setConfirmSession(false)} role="presentation">
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h4>Reset the demo?</h4>
            <p className="muted small">The demo goes back to the prepared version (v{project.published?.version}). Everything clicked during this meeting (assessment, fixes, merges) is cleared. Your preparation in the workspace is untouched.</p>
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
                Reset the demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
