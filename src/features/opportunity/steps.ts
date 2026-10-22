// The guided steps after the request is created, in plain words, and what each needs before you can continue.
import type { Opportunity, OpportunityStep, TaskType } from '@/state/types'
import { activeRequirements } from '@/opportunity/selectors'

export const STEPS: { id: OpportunityStep | 'choose'; label: string; title: string; lead: string; next: string }[] = [
  { id: 'choose', label: 'New request', title: 'Respond to a client request', lead: 'Which client it is for and what they need back.', next: 'Create the request' },
  { id: 'request', label: 'Request', title: 'Add the request', lead: 'Paste or upload what the client sent. The original is kept exactly as it arrived, and you can open it from every step.', next: 'Add the request' },
  { id: 'context', label: 'Context', title: 'Confirm the context', lead: 'Who it is for and what they expect back. Prefilled from the project; correct anything that is off.', next: 'Confirm the context' },
  { id: 'requirements', label: 'What they ask', title: 'Check what they ask for', lead: 'The hub listed every question and requirement in the request. Fix the wording, remove what is not a real ask, add what it missed.', next: 'Check what they ask for' },
  { id: 'sources', label: 'Sources', title: 'Choose the sources', lead: 'The Nagarro material the draft may quote. The most relevant are ticked; untick anything that does not belong.', next: 'Choose the sources' },
  { id: 'response', label: 'Draft response', title: 'Review the draft', lead: 'Each answer quotes the passage it is built on. Check that the passage really answers the question, then mark it checked.', next: 'Check the draft answers' },
  { id: 'export', label: 'Share and present', title: 'Share and present', lead: 'Download the response, show a summary in the client demo, or turn it into a presentation.', next: 'Share or present it' },
]

export function stepMeta(step: OpportunityStep) {
  return STEPS.find((s) => s.id === step)!
}

export const WIZARD_STEPS = STEPS.slice(1).map((s) => s.id as OpportunityStep)

/** Position among the six steps after creation (1–6). */
export function stepNumber(step: OpportunityStep) {
  return WIZARD_STEPS.indexOf(step) + 1
}

export const TASKS: { id: TaskType; label: string; blurb: string }[] = [
  { id: 'rfp', label: 'Answer an RFP or questionnaire', blurb: 'The client sent questions or requirements. We answer each one, with evidence.' },
  { id: 'proposal', label: 'Draft a proposal', blurb: 'Our understanding, the approach, the offering, assumptions and next steps.' },
  { id: 'approach', label: 'Recommend an engagement approach', blurb: 'How we would run the work, phase by phase, and what the client gets at each step.' },
  { id: 'discovery', label: 'Prepare discovery questions', blurb: 'What we need to ask before we can scope.' },
  { id: 'governance', label: 'Explain a governance model', blurb: 'How decisions, ownership and changes work in the design system.' },
  { id: 'summary', label: 'Write an executive summary', blurb: 'One page for decision-makers.' },
  { id: 'meeting', label: 'Prepare a meeting narrative', blurb: 'A storyline for a meeting, then a deck on the Nagarro Master Slides.' },
]

export function taskLabel(t: TaskType) {
  return TASKS.find((x) => x.id === t)?.label ?? t
}

/** Why you cannot continue from a step yet (undefined = you can). */
export function blocker(o: Opportunity, step: OpportunityStep): string | undefined {
  switch (step) {
    case 'request':
      return o.request ? undefined : 'Add the request first.'
    case 'context':
      return o.context.confirmedAt ? undefined : 'Confirm the context first.'
    case 'requirements':
      return activeRequirements(o).length ? undefined : 'List what they ask for first.'
    case 'sources':
      return o.sourceSelection.included.length ? undefined : 'Choose at least one source.'
    case 'response':
      return o.responses.length ? undefined : 'Draft the response first.'
    default:
      return undefined
  }
}

export function reachable(o: Opportunity): number {
  let n = 0
  for (const s of WIZARD_STEPS) {
    n++
    if (blocker(o, s)) break
  }
  return n
}

export const SUGGESTED: { label: string; what: string; step: OpportunityStep }[] = [
  { label: 'List what they ask for', what: 'Every question and requirement in the request.', step: 'requirements' },
  { label: 'Find matching material', what: 'Which approved sources speak to it.', step: 'sources' },
  { label: 'Draft the answers', what: 'A first answer to every requirement, with its source.', step: 'response' },
  { label: 'See what is missing', what: 'Open questions and assumptions to confirm.', step: 'response' },
  { label: 'Recommend an approach', what: 'Which Nagarro offering fits, and why.', step: 'response' },
  { label: 'Prepare a presentation', what: 'Turn the reviewed response into a deck.', step: 'export' },
]
