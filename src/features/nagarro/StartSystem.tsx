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
import { IMPROVE_META, IMPROVE_PHASES, improveSlug, journeySummary } from '@/state/journeyProgress'
import { NewProjectSheet } from './ClientPortfolio'

const COPY = {
  new: {
    title: 'Start a new design system',
    lead: 'For a client who has no design system yet. You set it up in the DS Starter Pack’s own wizard: brands, light and dark, a starting look per brand and mode, where the code and the Figma file live, and a change file for Figma. Then you record it in the project.',
    need: 'The client’s brand colour and logo name, the kind of product, and (later) the repository and Figma file links. The Starter Pack running on this machine (npm run tools).',
    get: 'A configured system on real components, ds.project.json in the Starter Pack copy, a change file for the Figma plugin, and the system recorded in the project.',
  },
  improve: {
    title: 'Improve an existing design system',
    lead: 'For a client who already has a system in Figma and code. You record their goals, connect their files read-only, assess where design, code and AI disagree, and agree a plan. Two steps need a practice specialist.',
    need: 'The client’s goals and the links to their repository and Figma file. Nothing is written to them.',
    get: 'An assessment with findings, a plan agreed with the client, and a version you can show in the client demo.',
  },
}

/** The DS Starter Pack's own set-up (semantic-editor/src/system/SetupSystem.tsx), then the hub's record. */
const STARTER_PHASES = [
  { title: 'About the product', text: 'Name it · Brands · Product' },
  { title: 'Look and feel', text: 'Light and dark · Starting point · The look, per brand and mode · Check' },
  { title: 'Where it lives', text: 'Code repository · Figma file' },
  { title: 'Hand off to Figma', text: 'A change file for the Figma plugin' },
  { title: 'Record it here', text: 'Read ds.project.json into the project' },
]

const CHOICES = [
  { kind: 'new', title: 'New design system', what: 'The client has no system yet.' },
  { kind: 'improve', title: 'Existing design system', what: 'The client already has one in Figma and code.' },
] as const

export function StartSystem() {
  const [params] = useSearchParams()
  const journey = params.get('journey')
  return journey === 'new' || journey === 'improve' ? <StartJourney kind={journey} /> : <StartChooser />
}

/** "Start a project" from Home: one question before the journey. */
function StartChooser() {
  return (
    <div className="page">
      <PageHead title="Start a project" lead="Does the client already have a design system?" crumbs={[{ label: 'Projects', to: practice.projects }, { label: 'Start a project' }]} />
      <div className="journey-grid journey-grid--choice">
        {CHOICES.map((c) => (
          <Link key={c.kind} to={practice.startSystem(c.kind)} className="journey-card" data-testid={`start-choice-${c.kind}`}>
            <strong className="journey-card__title">{c.title}</strong>
            <span className="journey-card__what">{c.what}</span>
            <span className="journey-card__cta">
              Continue <ArrowRight />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StartJourney({ kind }: { kind: 'new' | 'improve' }) {
  const projects = useStore((s) => s.projects)
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const c = COPY[kind]
  const phases = kind === 'new' ? STARTER_PHASES : IMPROVE_PHASES.map((p) => ({ title: p.label, text: p.steps.map((s) => IMPROVE_META[s].label).join(' · ') }))

  const go = (slug: string) => {
    const p = Object.values(useStore.getState().projects).find((x) => x.slug === slug)
    if (!p) return
    act().selectProject(p.id)
    const j = journeySummary(p.draft, kind)
    const r = nagarro(slug)
    navigate(kind === 'new' ? r.journeyNew() : r.journeyImprove(improveSlug(j.started ? j.resume : 1)))
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
