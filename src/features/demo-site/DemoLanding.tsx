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
    { to: `${c.home}?guide=meeting`, icon: MonitorPlay, title: 'Watch it work', what: 'A guided story on a fictional company: one inconsistency in its design system, what it affects, the fix reviewed in code and Figma, and AI that stays on the system.', cta: 'Start the guided story', testid: 'demo-guided' },
    { to: c.home, icon: Compass, title: 'Explore the example system', what: 'The design system of a fictional company: components, tokens, findings, changes and the files AI tools read.', cta: 'Explore the system', testid: 'demo-panel' },
    { to: '/scorecard', icon: Gauge, title: 'Score your own system', what: 'Ten questions, about five minutes: where your design system stands for AI, and a first step that fits. Nothing you answer leaves this page.', cta: 'Take the scorecard', testid: 'demo-scorecard' },
  ]
  return (
    <div className="demo-site">
      <DemoTop />
      <section className="demo-hero">
        <p className="demo-hero__kicker">AI-ready design systems · Nagarro</p>
        <h1>AI will build your interfaces anyway.<br />Make sure it builds yours.</h1>
        <p className="demo-hero__lead">One foundation shared by people and AI tools: tokens, components and rules that AI tools read and follow, so what they generate stays on-brand and accessible.</p>
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
        <span>A demonstration on a fictional company (Demo Brand). Every figure in it is sample data.</span>
        <a href={OFFICIAL} target="_blank" rel="noreferrer">nagarro.com · AI-ready design systems</a>
      </footer>
    </div>
  )
}
