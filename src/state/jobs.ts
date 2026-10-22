// The one writer of s.sim.jobs, shared by the timer-based simulations (sim.ts) and the real async
// tasks (tasks.ts) so every progress panel reads the same Job shape through useJob/useTask.

import type { Job } from './types'

export type JobSetter = (fn: (jobs: Record<string, Job>) => void) => void

let setter: JobSetter | null = null

export function bindJobSetter(fn: JobSetter) {
  setter = fn
}

export function writeJobs(fn: (jobs: Record<string, Job>) => void) {
  setter?.(fn)
}
