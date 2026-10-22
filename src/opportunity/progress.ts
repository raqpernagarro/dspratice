// How far a response to a client request really is. A step counts as done because of what it
// produced (a request, a confirmed context, checked answers…), never because someone opened it.

import { activeRequirements, currentResponse } from './selectors.ts'
import type { Opportunity, OpportunityStep } from './types.ts'

export const STEP_ORDER: OpportunityStep[] = ['request', 'context', 'requirements', 'sources', 'response', 'export']

export type StepStatus = 'done' | 'started' | 'todo'

const after = (o: Pick<Opportunity, 'furthest'>, step: OpportunityStep) => (o.furthest ? STEP_ORDER.indexOf(o.furthest) > STEP_ORDER.indexOf(step) : false)

/** Requirements a person still has to check against the current draft. */
export function uncheckedRequirements(o: Pick<Opportunity, 'requirements' | 'responses' | 'checked'>) {
  const r = currentResponse(o)
  if (!r) return activeRequirements(o)
  return activeRequirements(o).filter((req) => {
    const c = o.checked?.[req.id]
    return !c || c.version !== r.version
  })
}

export function isShared(o: Pick<Opportunity, 'publishedOutputIds' | 'deckIds' | 'exportedAt'>) {
  return o.publishedOutputIds.length > 0 || o.deckIds.length > 0 || Boolean(o.exportedAt)
}

export function stepStatus(o: Opportunity, step: OpportunityStep): StepStatus {
  const hasResponse = o.responses.length > 0
  switch (step) {
    case 'request':
      return o.request ? 'done' : 'todo'
    case 'context':
      return o.context.confirmedAt ? 'done' : 'todo'
    case 'requirements':
      if (!activeRequirements(o).length) return 'todo'
      return hasResponse || o.sourceSelection.updatedAt || after(o, 'requirements') ? 'done' : 'started'
    case 'sources':
      if (!o.sourceSelection.included.length) return 'todo'
      return hasResponse || after(o, 'sources') ? 'done' : 'started'
    case 'response':
      if (!hasResponse) return 'todo'
      return uncheckedRequirements(o).length ? 'started' : 'done'
    case 'export':
      return isShared(o) ? 'done' : 'todo'
  }
}

export interface OpportunityProgress {
  done: number
  total: number
  /** The first step that is not done yet, or null when everything is. */
  next: OpportunityStep | null
  statuses: Record<OpportunityStep, StepStatus>
}

export function opportunityProgress(o: Opportunity): OpportunityProgress {
  const statuses = Object.fromEntries(STEP_ORDER.map((s) => [s, stepStatus(o, s)])) as Record<OpportunityStep, StepStatus>
  const done = STEP_ORDER.filter((s) => statuses[s] === 'done').length
  const next = STEP_ORDER.find((s) => statuses[s] !== 'done') ?? null
  return { done, total: STEP_ORDER.length, next, statuses }
}
