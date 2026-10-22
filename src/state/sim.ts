// One job runner for every simulated async action. Timers live in a module Map (not in the store),
// so they survive route changes but never persist. Nothing here touches the network.
//
// Jobs are keyed by the scope that started them (`<projectId>:<layer>:<name>`, see scope.ts) so a
// presenter's client session and an internal draft never share a timer. `settleJobs()` drains every
// pending timer synchronously, which lets a guide chapter fast-forward a cascade in one call.

import { writeJobs } from './jobs'
export { bindJobSetter } from './jobs'

export interface StageDef {
  label: string
  detail?: string
  ms: number
  onEnter?: () => void
  onDone?: () => void
}

interface Pending {
  timer: ReturnType<typeof setTimeout>
  /** Runs what the timer would have run; used by settleJobs(). */
  fire: () => void
}

const timers = new Map<string, Pending>()
let speed = 1
const setJobs: typeof writeJobs | null = writeJobs

export function setSimSpeed(multiplier: number) {
  speed = multiplier
}

function schedule(id: string, ms: number, fn: () => void) {
  const fire = () => {
    timers.delete(id)
    fn()
  }
  const timer = setTimeout(fire, ms)
  timers.set(id, { timer, fire })
}

export function runJob(id: string, label: string, stages: StageDef[], onComplete?: () => void) {
  cancelJob(id)
  setJobs?.((jobs) => {
    jobs[id] = { id, label, stageIndex: 0, stages: stages.map((s) => ({ label: s.label, detail: s.detail })), status: 'running', kind: 'sim' }
  })
  let i = 0
  const step = () => {
    const stage = stages[i]
    if (!stage) {
      setJobs?.((jobs) => {
        if (jobs[id]) jobs[id].status = 'done'
      })
      timers.delete(id)
      onComplete?.()
      return
    }
    setJobs?.((jobs) => {
      if (jobs[id]) jobs[id].stageIndex = i
    })
    stage.onEnter?.()
    schedule(id, Math.max(60, stage.ms / speed), () => {
      stage.onDone?.()
      i += 1
      step()
    })
  }
  step()
}

export function cancelJob(id: string) {
  const p = timers.get(id)
  if (p) {
    clearTimeout(p.timer)
    timers.delete(id)
    setJobs?.((jobs) => {
      if (jobs[id] && jobs[id].status === 'running') jobs[id].status = 'cancelled'
    })
  }
}

export function cancelAllJobs() {
  for (const id of Array.from(timers.keys())) cancelJob(id)
}

/** Cancel every job whose id starts with the prefix (e.g. `demo-brand:session:`). */
export function cancelJobsWithPrefix(prefix: string) {
  for (const id of Array.from(timers.keys())) if (id.startsWith(prefix)) cancelJob(id)
}

export function isRunning(id: string) {
  return timers.has(id)
}

/**
 * Fire every pending timer in order until nothing is pending. Callbacks may schedule more work
 * (checks → parity re-run); the loop is bounded so a runaway cascade cannot hang the page.
 * With `prefix`, only jobs under that scope are settled.
 */
export function settleJobs(prefix?: string) {
  let guard = 0
  while (guard++ < 1000) {
    const next = Array.from(timers.entries()).find(([id]) => !prefix || id.startsWith(prefix))
    if (!next) return
    const [, p] = next
    clearTimeout(p.timer)
    p.fire()
  }
}

/** Delay helper for one-off simulated waits (reuses the same scaling and cancellation). */
export function after(id: string, ms: number, fn: () => void) {
  cancelJob(id)
  schedule(id, Math.max(40, ms / speed), fn)
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}
