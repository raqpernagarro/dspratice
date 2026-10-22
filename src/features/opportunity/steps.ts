// The seven guided steps, in plain words, and what each needs before you can continue.
import type { Opportunity, OpportunityStep, TaskType } from '@/state/types'
import { activeRequirements } from '@/opportunity/selectors'

export const STEPS: { id: OpportunityStep | 'choose'; label: string; lead: string }[] = [
  { id: 'choose', label: 'Choose the opportunity', lead: 'Which client and what they need back.' },
  { id: 'request', label: 'Add the request', lead: 'Paste or upload what the client sent. The original is kept exactly as it is.' },
  { id: 'context', label: 'Confirm the context', lead: 'Who this is for and what they expect back. Prefilled from the engagement; correct anything that is off.' },
  { id: 'requirements', label: 'Check what they ask for', lead: 'The hub listed what the request asks for. Fix the wording, remove what is not a real ask, add what it missed. The original stays beside the list.' },
  { id: 'sources', label: 'Pick the sources', lead: 'The Nagarro material the draft may use. The relevant ones are recommended; untick anything that does not belong.' },
  { id: 'response', label: 'Review the draft', lead: 'Read, correct and decide. Every statement says where it comes from, or that it is our recommendation, an assumption or an open question.' },
  { id: 'export', label: 'Export or present', lead: 'Download the response, share a summary with the client, or turn it into a presentation.' },
]

export const WIZARD_STEPS = STEPS.slice(1).map((s) => s.id as OpportunityStep)

export function stepNumber(step: OpportunityStep) {
  return STEPS.findIndex((s) => s.id === step) + 1
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
      return activeRequirements(o).length ? undefined : 'List the requirements first (Analyze this request).'
    case 'sources':
      return o.sourceSelection.included.length ? undefined : 'Pick at least one source.'
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
  { label: 'Analyze this request', what: 'List what the client actually asks for.', step: 'requirements' },
  { label: 'Find relevant Nagarro material', what: 'See which approved sources answer it.', step: 'sources' },
  { label: 'Draft responses', what: 'A first answer to every requirement.', step: 'response' },
  { label: 'Identify missing information', what: 'What we assumed and what an expert must confirm.', step: 'response' },
  { label: 'Recommend an approach', what: 'Which Nagarro offering fits, and why.', step: 'response' },
  { label: 'Prepare a presentation', what: 'Turn the reviewed response into a deck.', step: 'export' },
]
