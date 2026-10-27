// A project's Requests & decks tab: every client request and presentation for this client, newest
// first, and the two ways to add one. The practice-wide lists stay under Projects' tabs.

import { Link } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useProject } from '@/state/hooks'
import { practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Chip, Empty, Panel } from '@/shell/ui'
import { conversationItems } from './work'

export function ProjectRequests() {
  const p = useProject()
  const items = conversationItems({ [p.id]: p })
  return (
    <div className="page">
      <PageHead
        noTabs
        title="Requests & decks"
        lead={`Client requests we responded to and presentations built for ${p.client.name}.`}
        actions={
          <>
            <Link className="btn btn--secondary" to={`${practice.opportunityStart}?project=${p.slug}`} data-testid="project-new-request">
              <Plus /> New client request
            </Link>
            <Link className="btn btn--primary" to={`${practice.deckNew}?project=${p.slug}`} data-testid="project-new-deck">
              <Plus /> New presentation
            </Link>
          </>
        }
      />
      {items.length ? (
        <ul className="continue-list" data-testid="project-requests">
          {items.map((it) => (
            <li key={it.key}>
              <Link to={it.to} className="continue-item">
                <Chip tone="outline">{it.kind}</Chip>
                <span className="continue-item__main">
                  <strong>{it.title}</strong>
                  <span className="small muted">{it.status}</span>
                </span>
                <span className="xs muted">{relTime(it.at)}</span>
                <ArrowRight className="continue-item__arrow" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Panel>
          <Empty>No requests or presentations for {p.client.name} yet.</Empty>
        </Panel>
      )}
    </div>
  )
}
