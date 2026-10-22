import { Link } from 'react-router'
import { ArrowRight, Play } from 'lucide-react'
import { useStore } from '@/state/store'
import { usePaths, useProject, useSys } from '@/state/hooks'
import { practice } from '@/app/routes'

const PACKAGES = [
  { name: '2-week AI audit', dur: '2 weeks', text: 'Assessment scan, readout, AI-readiness score, one pilot component made AI-ready.', ink: true },
  { name: 'DS Build', dur: '12–20 weeks', text: 'Start new: template, wizard, Figma library, control panel, handover.' },
  { name: 'DS Accelerate', dur: '8–14 weeks', text: 'Bring your system: adapt it to the contract, resolve drift, publish channels.' },
  { name: 'DS Scale', dur: '16–24 weeks', text: 'Multi-brand, multi-platform; token architecture and migration.' },
  { name: 'Support', dur: 'ongoing', text: 'Panel and adapter upgrades, periodic reviews, release evals.' },
]

export function LandingPage() {
  const r = usePaths()
  const project = useProject()
  const count = useSys((s) => s.components.length)
  return (
    <div className="landing">
      <section className="fi-dark fi-wash fi-grain">
        <div className="fi-image fi-image--dark-1" style={{ opacity: 0.85 }} />
        <header className="landing__nav">
          <img src="/brand/nagarro-logo.svg" alt="Nagarro" />
          <span className="divider-v" />
          <span style={{ fontSize: 14, color: 'var(--n-white-70)' }}>Design Systems practice</span>
          <nav>
            <Link to={r.guides}>Handbook</Link>
            <Link to={r.home}>Control panel</Link>
            <Link to={`/share/${project.slug}`}>Client view</Link>
            <Link to={practice.home}>Practice view</Link>
          </nav>
        </header>
        <div className="hero">
          <div>
            <span className="chip chip--outline" style={{ color: 'var(--n-white-70)', borderColor: 'var(--n-white-30)', marginBottom: 20 }}>
              AI-ready design systems · demo on a fictional brand
            </span>
            <h1>AI will build your interfaces anyway. Make sure it builds yours.</h1>
            <p className="hero__lead">
              One contract feeds every tool. A control panel inside your repository shows your real components, tokens and guidance, suggests fixes from rules you can read, and turns every change into a reviewed pull request and a Figma change set. Agents propose; people decide.
            </p>
            <div className="hero__actions">
              <Link to={r.meeting} className="btn btn--on-dark btn--lg" onClick={() => undefined}>
                <Play /> Watch the 10-minute demo
              </Link>
              <Link to={r.journeyNew()} className="btn btn--on-dark-ghost btn--lg">
                Open the control panel <ArrowRight />
              </Link>
            </div>
          </div>
          <div className="hero__art">
            <img src="/brand/fi-ribbon-2.png" alt="" aria-hidden="true" style={{ mixBlendMode: "screen" }} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__inner">
          <div className="section__head">
            <h2>Two ways in. One panel you keep.</h2>
            <p>Start new from the template, or bring the system you have. Both end on the same control panel, in your repository, with a handover you can run without us.</p>
          </div>
          <div className="paths">
            <Link to={r.journeyNew()} className="path-card path-card--ink" onClick={() => useStore.getState().chooseEntryPath('new')}>
              <span className="chip chip--mint" style={{ alignSelf: 'flex-start' }}>
                Path A · DS Build
              </span>
              <h3>Start new</h3>
              <ol>
                <li>Use the template</li>
                <li>Set-up wizard: name, brands, modes, look</li>
                <li>Send the configuration to Figma (3-way review)</li>
                <li>Open the control panel on the same repository</li>
                <li>Handover</li>
              </ol>
              <span className="row" style={{ marginTop: 'auto', fontWeight: 500 }}>
                Begin the wizard <ArrowRight style={{ width: 16 }} />
              </span>
            </Link>
            <Link to={r.journeyImprove(2)} className="path-card" style={{ border: 'var(--n-hairline) solid var(--n-line-strong)' }} onClick={() => useStore.getState().chooseEntryPath('bring')}>
              <span className="chip chip--ink" style={{ alignSelf: 'flex-start' }}>
                Path B · 2-week AI audit → Accelerate / Scale
              </span>
              <h3>Bring your system</h3>
              <ol>
                <li>Connect the repository and Figma, read-only</li>
                <li>Assessment scan</li>
                <li>Readout: agree what leads and who owns</li>
                <li>Adapt it to the contract</li>
                <li>Control panel and handover</li>
              </ol>
              <span className="row" style={{ marginTop: 'auto', fontWeight: 500 }}>
                Connect read-only <ArrowRight style={{ width: 16 }} />
              </span>
            </Link>
          </div>
          <p className="muted small">
            Supported profile today: React + JSON tokens + Figma variables. Other stacks get tokens and rules only. We say so on the Connect screen rather than promising any stack.
          </p>
        </div>
      </section>

      <section className="section section--ink fi-dark fi-wash">
        <div className="fi-image fi-image--dark-2" style={{ opacity: 0.5 }} />
        <div className="section__inner">
          <div className="section__head">
            <h2>What clients can’t do alone</h2>
            <p>Every AI tool wants the system in its own format. Keeping eight of them in sync, proving the output stays on-system, and governing agents that change the system is the work.</p>
          </div>
          <div className="cards-row">
            {[
              ['Make a messy system readable by agents', 'Code names on every value, usage guidance that says when not to, a closed vocabulary.'],
              ['Keep 8+ agent formats in sync', 'Figma Specs and Make, Storybook MCP, Claude Design, v0 registry, DESIGN.md, AGENTS.md and skills, all from one contract.'],
              ['Prove AI output stays on-system', 'A release eval with a gate, next to the CI checks, across tools and models.'],
              ['Govern agents that change the system', 'Trust levels per action. Agents suggest; mechanical fixes auto-apply with undo; people merge.'],
            ].map(([t, d]) => (
              <div className="card-col" key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__inner">
          <div className="section__head">
            <h2>What we sell, and when</h2>
            <p>The next step depends on where you are. No system, or one too broken to build on: Build. A system worth keeping: audit first, then Accelerate or Scale.</p>
          </div>
          <div className="packages">
            {PACKAGES.map((p) => (
              <div key={p.name} className={`package ${p.ink ? 'package--ink' : ''}`}>
                <h4>{p.name}</h4>
                <span className="dur">{p.dur}</span>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 12 }}>
            <Link to={r.guide('which-path')} className="btn btn--secondary">
              Which path fits a client? <ArrowRight />
            </Link>
            <Link to={r.guides} className="btn btn--ghost">
              Read the handbook
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section__inner">
          <div className="cards-row">
            <div className="card-col">
              <span className="kicker">
                <strong>{count} components</strong> in the demo system, 16 rendered live
              </span>
              <p>Built from the Starter Pack count. Every one has guidance, tokens and a Figma link, or a finding that says what is missing.</p>
            </div>
            <div className="card-col">
              <span className="kicker">
                <strong>3 token grammars</strong> mapped through explicit adapters
              </span>
              <p>DSN, the Starter Pack and a client-style kit. Mapped, not renamed: the board’s decision.</p>
            </div>
            <div className="card-col">
              <span className="kicker">
                <strong>10 rules</strong> you can read, from real audit scripts
              </span>
              <p>Every suggestion in the panel cites its rule, source script and evidence. Rules can be switched off in the contract.</p>
            </div>
            <div className="card-col">
              <span className="kicker">
                <strong>Local demo</strong> · nothing leaves this browser
              </span>
              <p>GitHub, Figma, scans and agents are simulated with realistic fixtures and are labelled as such on every screen.</p>
              <Link to="/client/demo-brand?guide=meeting" className="btn btn--sm" style={{ alignSelf: 'flex-start' }}>
                <Play /> Start the guided demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="fi-dark" style={{ marginTop: 'auto' }}>
        <div className="landing__foot">
          <div>Design Systems practice · AI-ready design systems</div>
          <div>Demo Brand, Northwind Retail, Contoso Bank and Fabrikam Health are fictional.</div>
          <div>© 2026 Nagarro</div>
        </div>
      </footer>
    </div>
  )
}
