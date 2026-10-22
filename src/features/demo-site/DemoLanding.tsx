// The public demo site's front page (client-safe build only): the big idea and three ways in.
import { Link } from 'react-router'
import { ArrowRight, Gauge, MonitorPlay, Compass } from 'lucide-react'
import { client } from '@/app/routes'

const OFFICIAL = 'https://www.nagarro.com/en/services/design-studio/ai-ready-design-systems'

export function DemoTop() {
  return (
    <header className="demo-top">
      <Link to="/" className="demo-top__brand"><img src="/brand/nagarro-logo.svg" alt="Nagarro" height={22} /></Link>
      <nav className="row" style={{ gap: 16 }}>
        <Link to="/scorecard">Scorecard</Link>
        <Link to={client('demo-brand').home}>Demo</Link>
        <a href={OFFICIAL} target="_blank" rel="noreferrer">Talk to us</a>
      </nav>
    </header>
  )
}

export function DemoLanding() {
  const c = client('demo-brand')
  const ways = [
    { to: `${c.home}?guide=meeting`, icon: MonitorPlay, title: 'Watch it work', what: 'A guided walkthrough on a fictional brand: one contract for Figma, code and AI; a rule that becomes a fix; AI that builds with the real components.', cta: 'Start the walkthrough', testid: 'demo-guided' },
    { to: c.home, icon: Compass, title: 'Explore the control panel', what: 'The design-system control panel a client team keeps in its own repository: components, tokens, changes, checks and AI channels.', cta: 'Open the control panel', testid: 'demo-panel' },
    { to: '/scorecard', icon: Gauge, title: 'Score your own system', what: 'Ten questions, five minutes: where your design system stands for AI, and a first step that fits. Nothing you answer leaves this page.', cta: 'Take the scorecard', testid: 'demo-scorecard' },
  ]
  return (
    <div className="demo-site">
      <DemoTop />
      <section className="demo-hero">
        <p className="demo-hero__kicker">AI-ready design systems · Nagarro</p>
        <h1>AI will build your interfaces anyway.<br />Make sure it builds yours.</h1>
        <p className="demo-hero__lead">One foundation, shared by people and AI: tokens, components and rules that AI tools read and follow, so generated UI stays on-brand and accessible.</p>
      </section>
      <section className="demo-ways">
        {ways.map((w) => (
          <Link key={w.title} to={w.to} className="demo-way" data-testid={w.testid}>
            <w.icon />
            <h2>{w.title}</h2>
            <p>{w.what}</p>
            <span className="demo-way__cta">{w.cta} <ArrowRight /></span>
          </Link>
        ))}
      </section>
      <footer className="demo-foot">
        <span>A demo on a fictional brand (Demo Brand). Every number in it is demo data.</span>
        <a href={OFFICIAL} target="_blank" rel="noreferrer">nagarro.com · AI-ready design systems</a>
      </footer>
    </div>
  )
}
