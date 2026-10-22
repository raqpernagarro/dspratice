// Progress through the two set-up journeys, from what has actually been done. Opening a step only
// moves the resume point; a step is done when its input is saved or its action has finished.

import { IMPROVE_STEPS, type ImproveStep } from '@/app/routes'
import { HANDOVER_ITEMS, READOUT_DECISIONS } from '@/fixtures/demo-brand/system'
import type { SystemState } from './types'

export type JourneyKind = 'new' | 'improve'
export type StepState = 'done' | 'todo'

export interface JourneyStepMeta {
  n: number
  label: string
  /** Shown when the step needs someone with design-system experience. */
  specialist?: string
}

export const NEW_STEPS: JourneyStepMeta[] = [
  { n: 1, label: 'Name it' },
  { n: 2, label: 'Brands' },
  { n: 3, label: 'Product' },
  { n: 4, label: 'Light and dark' },
  { n: 5, label: 'Starting point' },
  { n: 6, label: 'Fine-tune the look' },
  { n: 7, label: 'Check the second mode' },
  { n: 8, label: 'Code repository' },
  { n: 9, label: 'Figma file' },
  { n: 10, label: 'Send to Figma' },
]

export const NEW_PHASES = [
  { label: 'About the product', steps: [1, 2, 3] },
  { label: 'Look and feel', steps: [4, 5, 6, 7] },
  { label: 'Where it lives', steps: [8, 9] },
  { label: 'Hand off to Figma', steps: [10] },
]

export const IMPROVE_META: Record<ImproveStep, JourneyStepMeta> = {
  goals: { n: 1, label: 'Goals' },
  connect: { n: 2, label: 'Connect' },
  assess: { n: 3, label: 'Assess' },
  findings: { n: 4, label: 'Review findings' },
  plan: { n: 5, label: 'Agree the plan', specialist: 'Choosing which side leads (Figma or code) and who owns the system shapes the whole engagement. Run this with a design-system lead from the practice.' },
  mapping: { n: 6, label: 'Map the names', specialist: 'Mapping the client’s token names onto the contract needs someone who knows both naming systems. A practice specialist reviews it with the client’s developers.' },
  review: { n: 7, label: 'Review and share' },
  handover: { n: 8, label: 'Handover' },
}

export const IMPROVE_PHASES = [
  { label: 'Understand', steps: ['goals', 'connect'] as ImproveStep[] },
  { label: 'Assess', steps: ['assess', 'findings'] as ImproveStep[] },
  { label: 'Decide', steps: ['plan', 'mapping'] as ImproveStep[] },
  { label: 'Share', steps: ['review', 'handover'] as ImproveStep[] },
]

export const improveSlug = (n: number): ImproveStep => IMPROVE_STEPS[Math.max(0, Math.min(IMPROVE_STEPS.length - 1, n - 1))]

export function newStepStates(sys: SystemState): StepState[] {
  const done = new Set(sys.journey.new.done ?? [])
  return NEW_STEPS.map((s) => (sys.journey.wizardDone || done.has(s.n) ? 'done' : 'todo'))
}

export function improveStepStates(sys: SystemState): Record<ImproveStep, StepState> {
  const j = sys.journey
  const marked = new Set(j.improve.done ?? [])
  const has = (slug: ImproveStep) => marked.has(IMPROVE_META[slug].n)
  const readoutDone = READOUT_DECISIONS.every((d) => Boolean(j.readout[d.id]))
  const handoverDone = Boolean(j.improve.completedAt) || HANDOVER_ITEMS.every((i) => j.handover[i.id])
  const state = (b: boolean): StepState => (b ? 'done' : 'todo')
  return {
    goals: state(has('goals')),
    connect: state(j.connect.status === 'detected' || has('connect')),
    assess: state(j.scan.status === 'done'),
    findings: state(has('findings')),
    plan: state(readoutDone),
    mapping: state(has('mapping')),
    review: state(has('review')),
    handover: state(handoverDone),
  }
}

export interface JourneySummary {
  kind: JourneyKind
  done: number
  total: number
  started: boolean
  complete: boolean
  /** Where "Resume" goes: the first step that is not done (or the last one opened, if later steps are done). */
  resume: number
  resumeLabel: string
}

export function journeySummary(sys: SystemState, kind: JourneyKind): JourneySummary {
  if (kind === 'new') {
    const states = newStepStates(sys)
    const done = states.filter((s) => s === 'done').length
    const firstTodo = states.findIndex((s) => s === 'todo')
    const resume = firstTodo < 0 ? NEW_STEPS.length : firstTodo + 1
    const started = done > 0 || (sys.journey.new.visited?.length ?? 0) > 0
    return { kind, done, total: NEW_STEPS.length, started, complete: firstTodo < 0, resume, resumeLabel: NEW_STEPS[resume - 1].label }
  }
  const states = improveStepStates(sys)
  const done = IMPROVE_STEPS.filter((s) => states[s] === 'done').length
  const firstTodo = IMPROVE_STEPS.findIndex((s) => states[s] === 'todo')
  const resume = firstTodo < 0 ? IMPROVE_STEPS.length : firstTodo + 1
  const started = done > 0 || (sys.journey.improve.visited?.length ?? 0) > 0
  return { kind, done, total: IMPROVE_STEPS.length, started, complete: firstTodo < 0, resume, resumeLabel: IMPROVE_META[IMPROVE_STEPS[resume - 1]].label }
}
