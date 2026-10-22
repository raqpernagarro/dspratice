// Practice-wide destinations that get their full pages in later phases. Each one is honest about
// what exists today and links to the working parts.

import { Link } from 'react-router'
import { PageHead } from '@/shell/PageHead'
import { SimBadge } from '@/shell/ui'
import { FontStatus } from '@/shell/FontStatus'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'

export function PracticeLibrary() {
  const r = usePaths()
  const sys = useSystem()
  const project = useProject()
  return (
    <div className="page">
      <PageHead title="System library" lead="The components, tokens and foundations the practice reuses across engagements. The two source libraries (DSN and the DS Starter Pack) are integrated in the next phase; until then the library shows the selected engagement's system." eyebrow={<span className="chip">Practice-wide</span>} noTabs />
      <div className="panel">
        <h3>{project.client.name} · {sys.components.length} components in the contract</h3>
        <p className="muted">Open the engagement's system pages to browse components, tokens and foundations with the live preview.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--primary" to={r.components}>
            Components
          </Link>
          <Link className="btn btn--secondary" to={r.tokens}>
            Tokens
          </Link>
          <Link className="btn btn--secondary" to={r.foundations}>
            Foundations
          </Link>
        </div>
      </div>
      <div className="panel">
        <h3>Coming in phase 2</h3>
        <p className="muted">Real DSN (105 components) and DS Starter Pack (56 specs) implementations rendered in isolated preview frames, a coverage matrix, and the overlap table that records where the two libraries disagree.</p>
      </div>
    </div>
  )
}

export function PracticeSettings() {
  const projects = useStore((s) => s.projects)
  const r = usePaths()
  return (
    <div className="page">
      <PageHead title="Settings" lead="Practice-wide people and rules, the font check, and the reset. Project settings (contract, trust levels, brands, audit trail) live on each engagement." eyebrow={<span className="chip">Practice-wide</span>} />
      <div className="panel">
        <h3>Typography</h3>
        <FontStatus />
      </div>
      <div className="panel">
        <h3>Projects</h3>
        <ul className="list">
          {Object.values(projects).map((p) => (
            <li key={p.id} className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
              <span>
                <strong>{p.client.name}</strong> · {p.engagement.package} · {p.published ? `published v${p.published.version}` : 'not published'}
              </span>
              <button className="btn btn--secondary btn--sm" onClick={() => act().resetProject(p.id)}>
                Reset this project
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h3>Project settings for the selected engagement</h3>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--secondary btn--sm" to={r.contract}>
            Contract
          </Link>
          <Link className="btn btn--secondary btn--sm" to={r.trust}>
            Trust levels
          </Link>
          <Link className="btn btn--secondary btn--sm" to={r.brands}>
            Brands and modes
          </Link>
          <Link className="btn btn--secondary btn--sm" to={r.audit}>
            Audit trail
          </Link>
          <Link className="btn btn--secondary btn--sm" to={practice.people}>
            People and roles
          </Link>
        </div>
      </div>
    </div>
  )
}

const IMPROVE_STEPS: Record<number, { title: string; what: string }> = {
  1: { title: 'Context', what: 'Client, stack, pains, goals and the package hypothesis. Captured in the journey shell (phase 3).' },
  3: { title: 'Inventory', what: 'Component and token counts from the connected repository and Figma file. Arrives with the journey shell (phase 3).' },
  8: { title: 'Review', what: 'A summary of every decision with its factual status before publishing. Arrives with the journey shell (phase 3).' },
}

export function JourneyStepPlaceholder({ journey, step }: { journey: 'new' | 'improve'; step: number }) {
  const r = usePaths()
  const meta = IMPROVE_STEPS[step] ?? { title: `Step ${step}`, what: 'This step arrives with the journey shell.' }
  const next = journey === 'improve' ? [2, 4, 5, 6, 7, 9].find((n) => n > step) : undefined
  return (
    <div className="page">
      <PageHead title={`${step} · ${meta.title}`} lead={meta.what} eyebrow={<SimBadge detail="Placeholder" />} />
      <div className="row" style={{ gap: 8 }}>
        {next && (
          <Link className="btn btn--primary" to={r.journeyImprove(next)}>
            Continue to step {next}
          </Link>
        )}
        <Link className="btn btn--secondary" to={r.home}>
          Back to the engagement
        </Link>
      </div>
    </div>
  )
}
