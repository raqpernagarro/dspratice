// "Prepare a client conversation", journey 1 from Home: one question (what are you starting from?)
// and every client request and deck in one list. Each start goes to the real place for it: the
// response flow, the hub's deck builder (for what the hub knows), Presentation Studio (for an idea
// with nothing behind it yet) or the client demo.

import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Chip, Empty, Panel } from '@/shell/ui'
import { useStore } from '@/state/store'
import { relTime } from '@/state/selectors'
import { conversationItems } from './items'

export { conversationItems, type ConversationItem } from './items'

const STARTS = [
  {
    id: 'request',
    title: 'A client request',
    what: 'An RFP, questionnaire or brief. You get what they ask, matching approved material and a first draft with the gaps marked, then a deck or the client demo.',
    to: practice.opportunityStart,
    cta: 'Respond to it',
  },
  {
    id: 'project',
    title: 'A project',
    what: 'An assessment readout or a project update for a steering group, built from the project’s own data.',
    to: `${practice.deckNew}?kind=project`,
    cta: 'Build the deck',
  },
  {
    id: 'idea',
    title: 'An idea or topic',
    what: 'A pitch, a talk or a workshop opener with nothing in the hub yet. Presentation Studio drafts it on the Nagarro master slides; you edit it and export .pptx or PDF.',
    to: practice.tool('studio'),
    cta: 'Open Presentation Studio',
  },
  {
    id: 'demo',
    title: 'A live demo',
    what: 'Show how a design system and AI tools stay on one system, on a fictional company’s design system.',
    to: practice.demos,
    cta: 'Choose a demo',
  },
]

export function ConversationsPage() {
  const projects = useStore((s) => s.projects)
  const items = conversationItems(projects)

  return (
    <div className="page">
      <PageHead title="Prepare a client conversation" lead="A proposal, a presentation or a demo. Start from what you have; the hub takes it from there." />

      <section aria-labelledby="start-from" className="stack">
        <h2 id="start-from" className="section-title">
          What are you starting from?
        </h2>
        <div className="journey-grid journey-grid--four">
          {STARTS.map((s) => (
            <Link key={s.id} to={s.to} className="journey-card journey-card--compact" data-testid={`start-${s.id}`}>
              <strong className="journey-card__title">{s.title}</strong>
              <span className="journey-card__what">{s.what}</span>
              <span className="journey-card__cta">
                {s.cta} <ArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="all-title" className="stack">
        <h2 id="all-title" className="section-title">
          Every request and deck
        </h2>
        {items.length ? (
          <ul className="continue-list" data-testid="conversation-list">
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
          <Panel>
            <Empty>No client requests or decks yet. Start from one of the four above.</Empty>
          </Panel>
        )}
      </section>
    </div>
  )
}
