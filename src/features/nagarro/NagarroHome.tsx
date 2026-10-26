// The hub's front door: one question and one card per journey. A journey earns a card only when
// real use shows the need. Below it, work already in progress.

import { Link } from 'react-router'
import { ArrowRight, BookOpen, Info } from 'lucide-react'
import { useStore } from '@/state/store'
import { nagarro, practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { journeySummary, improveSlug } from '@/state/journeyProgress'
import { conversationItems } from '@/features/conversations/items'
import { Chip } from '@/shell/ui'

const JOURNEYS = [
  {
    to: practice.conversations,
    title: 'Prepare a client conversation',
    what: 'Proposal, presentation, demo',
    testid: 'journey-conversation',
  },
  {
    to: practice.start,
    title: 'Start a project',
    what: 'New or existing design system',
    testid: 'journey-project',
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
  // Requests and decks come from the same list as Prepare a client conversation; journeys are added here.
  const items: ContinueItem[] = conversationItems(projects).filter((i) => !i.done)
  for (const p of Object.values(projects)) {
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
        to: kind === 'new' ? r.journeyNew() : r.journeyImprove(improveSlug(j.resume)),
        at: p.draft.journey[kind].startedAt ?? 0,
      })
    }
  }
  return items.sort((a, b) => b.at - a.at).slice(0, 4)
}

export function NagarroHome() {
  const items = useInProgress()
  const projects = useStore((s) => s.projects)

  return (
    <div className="page home">
      <header className="home__head">
        <h1 id="home-title" className="home__title">
          What do you need to do?
        </h1>
        <p className="home__lead">Choose the job. The hub takes you through it with the practice’s material and tools.</p>
      </header>

      <section aria-label="Journeys" className="journey-grid">
        {JOURNEYS.map((j, i) => (
          <Link key={j.testid} to={j.to} className="journey-card" data-testid={j.testid}>
            <span className="journey-card__n" aria-hidden="true">
              {i + 1}
            </span>
            <strong className="journey-card__title">{j.title}</strong>
            <span className="journey-card__what">{j.what}</span>
          </Link>
        ))}
        <p className="journey-more">More journeys as real needs appear</p>
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
            <span className="muted">Choose a job above. To see a finished example first, open the Northwind sample request: it goes from the RFP to a reviewed draft and a deck.</span>
            {projects.northwind && (
              <Link className="btn btn--secondary btn--sm" to={practice.opportunitiesFor('northwind')}>
                Open the Northwind sample
              </Link>
            )}
          </div>
        )}
      </section>

      <p className="row small muted home__foot">
        <BookOpen style={{ width: 14 }} /> New to design systems or AI? <Link to={practice.guides}>Read the guides</Link>
        <span aria-hidden="true">·</span>
        <Info style={{ width: 14 }} /> <Link to={practice.about}>What works, what needs a key, what is simulated</Link>
      </p>
    </div>
  )
}
