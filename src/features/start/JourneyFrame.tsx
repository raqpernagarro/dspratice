// The frame around each step of "Improve an existing system": where you are in the eight steps,
// what the step needs and produces, when a specialist should run it, and Back / Continue. A step
// is ticked when its work is done; opening it only moves the resume point.

import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Users } from 'lucide-react'
import { practice } from '@/app/routes'
import { experience } from '@/fixtures/experiences'
import { CommandLine } from '@/features/tools/ExperienceFrame'
import { act, usePaths, useSystem } from '@/state/hooks'
import { IMPROVE_STEPS, type ImproveStep } from '@/app/routes'
import { IMPROVE_META, improveStepStates } from '@/state/journeyProgress'
import { ProcessStrip } from '@/shell/story'
import { Btn, Callout } from '@/shell/ui'

export const IMPROVE_BRIEF: Record<ImproveStep, { need: string; get: string; then: string }> = {
  goals: { need: 'What the client wants from the work, the products it serves and who will own the system.', get: 'A short brief that the assessment and the readout refer back to.', then: 'Connect their repository and Figma file.' },
  connect: { need: 'Links to the client’s repository and Figma file. View access is enough.', get: 'What can be read: components, tokens, Figma variables and documentation.', then: 'Run the assessment.' },
  assess: { need: 'A connected repository and Figma file.', get: 'A baseline: values without code names, where Figma and code differ, contrast problems, how readable the system is for AI tools.', then: 'Review the findings.' },
  findings: { need: 'The assessment.', get: 'Each inconsistency with the side to fix (Figma, code or both) and the rule behind it.', then: 'Agree the plan with the client.' },
  plan: { need: 'The findings, the client’s design-system owner and a practice specialist in the session.', get: 'Four decisions recorded in the system contract: which side leads, the naming, and who owns the system.', then: 'Map the client’s names onto the contract.' },
  mapping: { need: 'The agreed plan.', get: 'Each client token name mapped onto the contract, kept as an alias, or left separate.', then: 'Review and share.' },
  review: { need: 'The decisions so far.', get: 'One summary to check, the assessment report, and a new version for the client demo.', then: 'Handover.' },
  handover: { need: 'The work done during the engagement.', get: 'An example of what the client keeps at the end of an engagement.', then: 'Back to the project.' },
}

/** The real tool to use at each step, where one exists (src/fixtures/experiences.ts). The hub's own
 *  steps still record the work; these are where it is done on the client's real files. */
export const IMPROVE_TOOLS: Partial<Record<ImproveStep, { tool?: string; title?: string; why: string; cmd?: string }[]>> = {
  connect: [
    { title: 'Export the client’s Figma variables', why: 'Run the DS Starter Pack’s Figma plugin in the client’s file and choose Export variables. Install it once from the Starter copy, then in Figma Desktop: Plugins › Development › Import plugin from manifest.', cmd: 'cd tool-copies/ds-starter-pack-main && npm run plugin:install' },
    { tool: 'starter-import', why: 'Open the exported .variables.json in the DS Configurator to see the client’s collections, modes and brands on real components.' },
  ],
  assess: [{ tool: 'dsn-components', why: 'Check what already exists before anyone builds something new.' }],
  findings: [{ tool: 'dsn-create', why: 'When a finding needs a component the system does not have, draft options and compare them before adding one.' }],
  handover: [{ title: 'Apply the changes in Figma', why: 'The client imports the change file with the same Figma plugin: it saves a version first, shows every change for review, and importing twice changes nothing.' }],
}

function RealTools({ step }: { step: ImproveStep }) {
  const items = IMPROVE_TOOLS[step]
  if (!items?.length) return null
  return (
    <section className="real-tools" aria-label="Use the real tool" data-testid="real-tools">
      <strong className="small">Use the real tool</strong>
      <ul>
        {items.map((it) => {
          const e = it.tool ? experience(it.tool) : undefined
          return (
            <li key={it.tool ?? it.title}>
              {e ? <Link to={practice.tool(e.id)}>{e.name}</Link> : <strong>{it.title}</strong>}
              <span className="small muted">{it.why}</span>
              {it.cmd && <CommandLine cmd={it.cmd} />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function useImproveNav(step: ImproveStep) {
  const navigate = useNavigate()
  const r = usePaths()
  const i = IMPROVE_STEPS.indexOf(step)
  const next = IMPROVE_STEPS[i + 1] as ImproveStep | undefined
  const prev = IMPROVE_STEPS[i - 1] as ImproveStep | undefined
  return {
    next,
    prev,
    /** Marks this step done and moves on (or back to the project after the last step). */
    complete: () => {
      act().markJourneyStep('improve', i + 1, true)
      navigate(next ? r.journeyImprove(next) : r.home)
    },
    go: (s: ImproveStep) => navigate(r.journeyImprove(s)),
  }
}

export function ImproveFrame({ step, children }: { step: ImproveStep; children: ReactNode }) {
  const sys = useSystem()
  const r = usePaths()
  const states = improveStepStates(sys)
  const nav = useImproveNav(step)
  const meta = IMPROVE_META[step]
  const brief = IMPROVE_BRIEF[step]
  const n = IMPROVE_STEPS.indexOf(step) + 1

  useEffect(() => {
    act().setJourneyProgress('improve', { currentStep: n })
  }, [n])

  return (
    <>
      <div className="page journey-head">
        <p className="kicker">
          <span>
            Improve a design system · step {n} of {IMPROVE_STEPS.length} · {meta.label}
          </span>
        </p>
        <ProcessStrip
          compact
          label="Improve journey"
          steps={IMPROVE_STEPS.map((s) => ({
            title: IMPROVE_META[s].label,
            state: s === step ? 'current' : states[s] === 'done' ? 'done' : 'todo',
            to: r.journeyImprove(s),
            badge: IMPROVE_META[s].specialist ? <span className="process__text">With a specialist</span> : undefined,
          }))}
        />
        <p className="small muted journey-brief">
          <strong>You get:</strong> {brief.get} <span aria-hidden="true">·</span> <strong>You need:</strong> {brief.need}
        </p>
        {meta.specialist && (
          <Callout tone="info" icon={<Users />}>
            <strong>Needs a specialist.</strong> {meta.specialist} Where the practice has a default, it is marked “Recommended”.
          </Callout>
        )}
        <RealTools step={step} />
      </div>
      {children}
      <div className="page journey-foot">
        <Btn variant="ghost" onClick={() => (nav.prev ? nav.go(nav.prev) : undefined)} disabled={!nav.prev}>
          <ArrowLeft /> {nav.prev ? IMPROVE_META[nav.prev].label : 'Back'}
        </Btn>
        <span className="small muted">{states[step] === 'done' ? 'This step is done.' : 'Not done yet. You can come back to it at any time.'}</span>
        {nav.next && (
          <Btn variant="ghost" onClick={() => nav.go(nav.next!)}>
            {states[step] === 'done' ? 'Next' : 'Skip for now'}: {IMPROVE_META[nav.next].label} <ArrowRight />
          </Btn>
        )}
      </div>
    </>
  )
}
