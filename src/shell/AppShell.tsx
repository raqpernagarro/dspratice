import { useEffect, useRef, type ReactNode } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import { Home, Layers, GitPullRequest, Sparkles, Shield, Search, Menu, Play, Gauge, BookOpen, Building2, Compass, Wrench, PackageCheck, Presentation, Library, Target, MonitorPlay, Hammer, ArrowLeft, NotebookPen, Megaphone } from 'lucide-react'
import { useIntegrationStatus } from '@/integrations/status'
import { useStore } from '@/state/store'
import { Toasts } from './Toasts'
import { CommandPalette } from './CommandPalette'
import { DemoBar } from './DemoBar'
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
  const speed = useStore((s) => s.ui.simSpeed)
  const presenter = useStore((s) => s.ui.presenter)
  const motionPaused = useStore((s) => s.ui.motionPaused)
  const guideActive = Boolean(project.session?.guide && (project.session.guide.status === 'running' || project.session.guide.status === 'paused'))
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
  const returnTo = useStore((s) => s.ui.returnTo)

  const backToPreparation = () => {
    act().exitPresenter()
    act().setReturnTo(null)
    navigate(returnTo || practice.home)
  }
  const openNotes = () => window.open(practice.presenterNotes(project.slug), 'ds-presenter-notes', 'width=520,height=760')

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

    </div>
  )
}
