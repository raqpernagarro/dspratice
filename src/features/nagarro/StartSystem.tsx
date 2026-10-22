// "Start a new design system" and "Improve an existing system" from Home: choose the project the
// work belongs to (or create it), then continue in that project's journey where it left off.

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Plus } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { nagarro, practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { ProcessStrip } from '@/shell/story'
import { Panel } from '@/shell/ui'
import { IMPROVE_META, IMPROVE_PHASES, NEW_PHASES, NEW_STEPS, improveSlug, journeySummary } from '@/state/journeyProgress'
import { NewProjectSheet } from './ClientPortfolio'

const COPY = {
  new: {
    title: 'Start a new design system',
    lead: 'For a client who has no design system yet. You set up brands, light and dark modes and a starting look, choose where the code and the Figma file live, and send the result to Figma. Most of it takes an hour; nothing needs a specialist.',
    need: 'The client’s brand colour and logo name, the kind of product, and (later) the repository and Figma file links.',
    get: 'A configured starting system you can preview on real components, and a change file for the Figma variables plugin.',
  },
  improve: {
    title: 'Improve an existing design system',
    lead: 'For a client who already has a system in Figma and code. You record their goals, connect their files read-only, assess where design, code and AI disagree, and agree a plan. Two steps need a practice specialist.',
    need: 'The client’s goals and the links to their repository and Figma file. Nothing is written to them.',
    get: 'An assessment with findings, a plan agreed with the client, and a version you can show in the client demo.',
  },
}

export function StartSystem() {
  const [params] = useSearchParams()
  const kind = params.get('journey') === 'new' ? 'new' : 'improve'
  const projects = useStore((s) => s.projects)
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const c = COPY[kind]
  const phases = kind === 'new' ? NEW_PHASES.map((p) => ({ title: p.label, text: p.steps.map((n) => NEW_STEPS[n - 1].label).join(' · ') })) : IMPROVE_PHASES.map((p) => ({ title: p.label, text: p.steps.map((s) => IMPROVE_META[s].label).join(' · ') }))

  const go = (slug: string) => {
    const p = Object.values(useStore.getState().projects).find((x) => x.slug === slug)
    if (!p) return
    act().selectProject(p.id)
    const j = journeySummary(p.draft, kind)
    const r = nagarro(slug)
    navigate(kind === 'new' ? r.journeyNew(j.started ? j.resume : 1) : r.journeyImprove(improveSlug(j.started ? j.resume : 1)))
  }

  return (
    <div className="page">
      <PageHead
        title={c.title}
        lead={c.lead}
        crumbs={[{ label: 'Projects', to: practice.projects }, { label: c.title }]}
        actions={
          <Link className="btn btn--ghost" to={practice.startSystem(kind === 'new' ? 'improve' : 'new')}>
            {kind === 'new' ? 'The client already has a system?' : 'No system yet? Start a new one'}
          </Link>
        }
      />
      <ProcessStrip label="The journey" steps={phases} />
      <div className="grid grid--2">
        <Panel title="What you need">
          <p className="small">{c.need}</p>
        </Panel>
        <Panel title="What you get">
          <p className="small">{c.get}</p>
        </Panel>
      </div>
      <Panel
        title="Which project is it for?"
        actions={
          <button className="btn btn--primary btn--sm" onClick={() => setCreating(true)} data-testid="start-new-project">
            <Plus /> New project
          </button>
        }
      >
        <ul className="pick-list">
          {Object.values(projects).map((p) => {
            const j = journeySummary(p.draft, kind)
            return (
              <li key={p.id}>
                <button className="pick-list__item" onClick={() => go(p.slug)} data-testid={`start-${p.slug}`}>
                  <span>
                    <strong>{p.client.name}</strong>
                    <span className="xs muted">
                      {p.client.sector}
                      {p.client.fictional ? ' · sample' : ''}
                    </span>
                  </span>
                  <span className="small muted">{j.complete ? 'Journey done · review it' : j.started ? `${j.done} of ${j.total} done · resume at ${j.resumeLabel.toLowerCase()}` : 'Not started'}</span>
                  <ArrowRight />
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>
      {creating && <NewProjectSheet onClose={() => setCreating(false)} onCreated={go} />}
    </div>
  )
}
