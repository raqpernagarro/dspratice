import { Link, useNavigate } from 'react-router'
import { ArrowRight, Building2, Users, FlaskConical, BookOpen, Play } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { client, practice } from '@/app/routes'
import { Reveal } from '@/motion'

/** Introduction + workspace selection. The old marketing landing stays at /landing for development. */
export function WelcomePage() {
  const navigate = useNavigate()
  const ws = useStore((s) => s.ui.lastWorkspace)
  const selected = useStore((s) => s.projects[s.selectedProjectId])
  const choose = (w: 'nagarro' | 'client') => {
    act().setLastWorkspace(w)
    act().exitPresenter()
    navigate(w === 'client' ? practice.clientEntry : practice.home)
  }
  const demoSlug = selected.published ? selected.slug : 'demo-brand'

  return (
    <div className="welcome fi-dark fi-wash fi-grain">
      <div className="fi-image fi-image--dark-1" style={{ opacity: 0.8 }} />
      <header className="landing__nav">
        <img src="/brand/nagarro-logo.svg" alt="Nagarro" />
        <span className="divider-v" />
        <span style={{ fontSize: 14, color: 'var(--n-white-70)' }}>Design systems</span>
        <nav>
          <Link to={practice.guides}>Guides</Link>
          <Link to={`${client(demoSlug).home}?guide=meeting`}>Guided walkthrough</Link>
        </nav>
      </header>

      <div className="welcome__body">
        <Reveal>
          <span className="chip chip--outline" style={{ color: 'var(--n-white-70)', borderColor: 'var(--n-white-30)' }}>
            <FlaskConical style={{ width: 12 }} /> Local demo on a fictional brand
          </span>
          <h1 className="welcome__title">One contract feeds every tool. Agents propose. People decide.</h1>
          <p className="welcome__lead">
            A design-system control panel that lives in your repository. It shows the real components, tokens and guidance, suggests fixes from rules you can read, and turns every change into a reviewed pull request and a Figma change set, so AI builds your interfaces on your system.
          </p>
        </Reveal>

        <div className="welcome__cards">
          <Reveal index={1}>
            <button className={`ws-card ${ws === 'nagarro' ? 'is-current' : ''}`} onClick={() => choose('nagarro')}>
              <span className="ws-card__icon">
                <Building2 />
              </span>
              <span className="ws-card__kicker">For Nagarro designers, developers, consultants and managers</span>
              <span className="ws-card__title">Nagarro workspace</span>
              <span className="ws-card__desc">Prepare and manage engagements: start or improve a system, review findings and changes, configure the system and its AI context, prepare meetings, open the client experience as a presenter.</span>
              <span className="ws-card__cta">
                {ws === 'nagarro' ? 'Continue to the Nagarro workspace' : 'Enter the Nagarro workspace'} <ArrowRight style={{ width: 16 }} />
              </span>
            </button>
          </Reveal>
          <Reveal index={2}>
            <button className={`ws-card ws-card--client ${ws === 'client' ? 'is-current' : ''}`} onClick={() => choose('client')}>
              <span className="ws-card__icon">
                <Users />
              </span>
              <span className="ws-card__kicker">For client teams, managers and designers</span>
              <span className="ws-card__title">Client workspace</span>
              <span className="ws-card__desc">The explorable showcase: where your system stands, explore its foundations and components, see the improvement, watch AI build on the system, and the evidence and next steps.</span>
              <span className="ws-card__cta">
                {ws === 'client' ? 'Continue to the client workspace' : 'Enter the client workspace'} <ArrowRight style={{ width: 16 }} />
              </span>
            </button>
          </Reveal>
        </div>

        <Reveal index={3}>
          <div className="welcome__foot">
            <Link to={`${client(demoSlug).home}?guide=meeting`} className="btn btn--on-dark">
              <Play /> Start the guided walkthrough
            </Link>
            <Link to={practice.guides} className="btn btn--on-dark-ghost">
              <BookOpen /> Learn the approach
            </Link>
            <span className="xs" style={{ color: 'var(--n-white-70)' }}>
              You can switch workspace later from the top bar. Demo Brand and the other clients are fictional.
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
