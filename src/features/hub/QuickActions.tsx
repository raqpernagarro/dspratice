// The hub's front door: the four things a colleague comes here to do, and what is in progress.
import { Link } from 'react-router'
import { Target, MonitorPlay, Library, Presentation } from 'lucide-react'
import { useStore } from '@/state/store'
import { nagarro, practice } from '@/app/routes'
import { relTime } from '@/state/selectors'

const ACTIONS = [
  { to: practice.opportunityStart, icon: Target, title: 'Respond to a request', what: 'RFP, questionnaire, brief or notes → a traceable first draft from our own material.', testid: 'qa-respond' },
  { to: practice.demos, icon: MonitorPlay, title: 'Run a demo', what: 'Client-safe demos with presenter notes, plus the AI-readiness scorecard.', testid: 'qa-demo' },
  { to: practice.knowledge, icon: Library, title: 'Find material', what: 'Approved decks, offerings, methods and case studies, with what each one says.', testid: 'qa-knowledge' },
  { to: practice.presentations, icon: Presentation, title: 'Build a deck', what: "On Carolina's Nagarro Master Slides: brief, plan, slides, speaker notes.", testid: 'qa-deck' },
]

export function QuickActions() {
  const projects = useStore((s) => s.projects)
  const recent = Object.values(projects)
    .flatMap((p) => Object.values(p.opportunities ?? {}).map((o) => ({ p, o })))
    .sort((a, b) => b.o.updatedAt - a.o.updatedAt)
    .slice(0, 3)
  return (
    <section className="stack" aria-label="Quick actions">
      <div className="grid grid--4 quick-actions">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className="tile quick-action" data-testid={a.testid}>
            <a.icon />
            <strong>{a.title}</strong>
            <span className="small muted">{a.what}</span>
          </Link>
        ))}
      </div>
      {recent.length > 0 && (
        <p className="small muted">
          In progress:{' '}
          {recent.map(({ p, o }, i) => (
            <span key={o.id}>
              {i > 0 && ' · '}
              <Link to={nagarro(p.slug).opportunity(o.id, o.step)}>{o.title}</Link> ({p.client.name}, {relTime(o.updatedAt)})
            </span>
          ))}
        </p>
      )}
    </section>
  )
}
