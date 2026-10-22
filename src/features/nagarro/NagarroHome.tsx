// The hub's front door. It answers four questions before anything else: what this tool is for, who
// it is for, what you can do here, and where to start. Then it shows work already in progress.

import { Link } from 'react-router'
import { ArrowRight, BookOpen, Info } from 'lucide-react'
import { useStore } from '@/state/store'
import { nagarro, practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { opportunityProgress } from '@/opportunity/progress'
import { journeySummary, improveSlug } from '@/state/journeyProgress'
import { stepMeta } from '@/features/opportunity/steps'
import { TOUR } from '@/features/demo/steps'
import { Hl, Kicker, ProcessStrip } from '@/shell/story'
import { usePresentDemo, demoScenario } from '@/shell/present'
import { Chip } from '@/shell/ui'

const TASKS = [
  {
    to: practice.opportunityStart,
    title: 'Respond to a client request',
    what: 'Paste an RFP, questionnaire or brief. You get the list of what they ask, matching material from approved sources and a first draft with the gaps marked.',
    cta: 'Start a response',
    testid: 'task-respond',
  },
  {
    to: practice.startSystem('new'),
    title: 'Start a new design system',
    what: 'For a client without a system. Set up brands, light and dark modes and a starting look, then send it to Figma.',
    cta: 'Choose a project',
    testid: 'task-new',
  },
  {
    to: practice.startSystem('improve'),
    title: 'Improve an existing system',
    what: 'Connect the client’s Figma file and code, assess where they disagree, and agree a plan with a specialist.',
    cta: 'Choose a project',
    testid: 'task-improve',
  },
  {
    to: practice.knowledge,
    title: 'Find reusable material',
    what: 'Decks, offers, methods and case studies, with who owns them and whether clients may see them.',
    cta: 'Open the library',
    testid: 'task-library',
  },
  {
    to: practice.presentations,
    title: 'Prepare a presentation',
    what: 'Build a Nagarro deck from a reviewed response or from a project: an assessment readout or a project update.',
    cta: 'Open presentations',
    testid: 'task-deck',
  },
]

interface ContinueItem {
  key: string
  kind: string
  title: string
  client: string
  status: string
  to: string
  at: number
}

function useInProgress(): ContinueItem[] {
  const projects = useStore((s) => s.projects)
  const items: ContinueItem[] = []
  for (const p of Object.values(projects)) {
    for (const o of Object.values(p.opportunities ?? {})) {
      const prog = opportunityProgress(o)
      if (!prog.next) continue
      items.push({ key: `o-${o.id}`, kind: 'Client request', title: o.title, client: p.client.name, status: `${prog.done} of ${prog.total} steps done · Next: ${stepMeta(prog.next).next.toLowerCase()}`, to: practice.opportunity(o.id, prog.next), at: o.updatedAt })
    }
    for (const d of Object.values(p.decks ?? {})) {
      if (d.stage === 'exported') continue
      const next = d.stage === 'plan' ? 'approve the plan' : d.stage === 'built' ? 'run the checks' : 'share or present it'
      items.push({ key: `d-${d.id}`, kind: 'Presentation', title: d.title, client: p.client.name, status: `${d.slides.length} slides · Next: ${next}`, to: practice.deck(d.id), at: d.builtAt })
    }
    for (const kind of ['new', 'improve'] as const) {
      const j = journeySummary(p.draft, kind)
      if (!j.started || j.complete) continue
      const r = nagarro(p.slug)
      items.push({
        key: `j-${p.id}-${kind}`,
        kind: kind === 'new' ? 'New design system' : 'Improve a system',
        title: `${p.client.name} set-up`,
        client: p.client.name,
        status: `${j.done} of ${j.total} steps done · Resume: ${j.resumeLabel.toLowerCase()}`,
        to: kind === 'new' ? r.journeyNew(j.resume) : r.journeyImprove(improveSlug(j.resume)),
        at: p.draft.journey[kind].startedAt ?? 0,
      })
    }
  }
  return items.sort((a, b) => b.at - a.at).slice(0, 6)
}

export function NagarroHome() {
  const items = useInProgress()
  const projects = useStore((s) => s.projects)
  const present = usePresentDemo()
  // The guided story is told on Demo Brand; other projects are chosen in "Prepare the meeting".
  const scenario = demoScenario(projects, 'demo-brand')

  return (
    <div className="page home">
      <section className="hero-ink" aria-labelledby="home-title">
        <Kicker>Nagarro · design systems practice</Kicker>
        <h1 id="home-title" className="hero-ink__title">
          Use what the practice <Hl>already knows</Hl>.
        </h1>
        <p className="hero-ink__lead">This hub brings together our knowledge, material and tools for design systems and AI, so you can answer a client request, start or improve a design system, and prepare a presentation or demo without waiting for an expert.</p>
        <p className="hero-ink__who">For Nagarro designers, consultants, delivery leads and sellers. It runs on this machine; the sample clients and their figures are fictional.</p>
      </section>

      <section aria-labelledby="start-title" className="stack">
        <h2 id="start-title" className="section-title">
          Where do you want to start?
        </h2>
        <div className="task-grid">
          {TASKS.map((t, i) => (
            <Link key={t.testid} to={t.to} className="task-card" data-testid={t.testid}>
              <span className="task-card__n">{String(i + 1).padStart(2, '0')}</span>
              <strong className="task-card__title">{t.title}</strong>
              <span className="task-card__what">{t.what}</span>
              <span className="task-card__cta">
                {t.cta} <ArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="continue-title" className="stack">
        <h2 id="continue-title" className="section-title">
          Continue where you left off
        </h2>
        {items.length ? (
          <ul className="continue-list" data-testid="continue-list">
            {items.map((it) => (
              <li key={it.key}>
                <Link to={it.to} className="continue-item">
                  <Chip tone="outline">{it.kind}</Chip>
                  <span className="continue-item__main">
                    <strong>{it.title}</strong>
                    <span className="small muted">
                      {it.client} · {it.status}
                    </span>
                  </span>
                  <span className="xs muted">{relTime(it.at)}</span>
                  <ArrowRight className="continue-item__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state" data-testid="continue-empty">
            <strong>Nothing in progress yet.</strong>
            <span className="muted">Pick a task above. To see a finished example first, open the Northwind sample request: it goes from the RFP to a reviewed draft and a deck.</span>
            {projects.northwind && (
              <Link className="btn btn--secondary btn--sm" to={practice.opportunitiesFor('northwind')}>
                Open the Northwind sample
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="demo-panel" aria-labelledby="demo-title">
        <div className="demo-panel__intro">
          <Kicker>Client demo</Kicker>
          <h2 id="demo-title" className="demo-panel__title">
            Show a prospect <Hl>how we work</Hl>.
          </h2>
          <p className="demo-panel__lead">A guided story on a fictional company’s design system: one inconsistency, what it affects, the fix reviewed in code and Figma, and AI that stays on the system. About 12 minutes, longer if you explore.</p>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--mint" onClick={() => present(scenario?.id, { guide: 'meeting' })} data-testid="home-present">
              Present client demo
            </button>
            <Link className="btn btn--on-dark-ghost" to={practice.meetingPrep(scenario?.slug)}>
              Prepare the meeting
            </Link>
          </div>
          {scenario && <p className="xs demo-panel__note">Opens on {scenario.client.name}{scenario.client.fictional ? ' (sample)' : ''}, the version you last prepared.</p>}
        </div>
        <ProcessStrip dark compact label="The demo story" steps={TOUR.map((c) => ({ title: c.title }))} />
      </section>

      <p className="row small muted home__foot">
        <BookOpen style={{ width: 14 }} /> New to design systems or AI? <Link to={practice.guides}>Read the guides</Link>
        <span aria-hidden="true">·</span>
        <Info style={{ width: 14 }} /> <Link to={practice.about}>What works, what needs a key, what is simulated</Link>
      </p>
    </div>
  )
}
