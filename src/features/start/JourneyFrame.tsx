// The frame around each step of "Improve an existing system": where you are in the eight steps,
// what the step needs and produces, when a specialist should run it, and Back / Continue. A step
// is ticked when its work is done; opening it only moves the resume point.

import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Users } from 'lucide-react'
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
          <span className="kicker__n">{String(n).padStart(2, '0')}</span>
          <span>
            Improve an existing system · step {n} of {IMPROVE_STEPS.length}
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
        <dl className="brief">
          <div>
            <dt>You need</dt>
            <dd>{brief.need}</dd>
          </div>
          <div>
            <dt>You get</dt>
            <dd>{brief.get}</dd>
          </div>
          <div>
            <dt>Then</dt>
            <dd>{brief.then}</dd>
          </div>
        </dl>
        {meta.specialist && (
          <Callout tone="info" icon={<Users />}>
            <strong>Needs a specialist.</strong> {meta.specialist} Where the practice has a default, it is marked “Recommended”.
          </Callout>
        )}
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
