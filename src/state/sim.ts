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
  /** null while the simulation is paused. */
  timer: ReturnType<typeof setTimeout> | null
  /** When it is due, and what is left of the wait while paused. */
  due: number
  remaining?: number
  /** Runs what the timer would have run; used by settleJobs(). */
  fire: () => void
}

const timers = new Map<string, Pending>()
let speed = 1
let paused = false
const setJobs: typeof writeJobs | null = writeJobs

export function setSimSpeed(multiplier: number) {
  speed = multiplier
}

function schedule(id: string, ms: number, fn: () => void) {
  const fire = () => {
    timers.delete(id)
    fn()
  }
  if (paused) {
    timers.set(id, { timer: null, due: Date.now() + ms, remaining: ms, fire })
    return
  }
  const timer = setTimeout(fire, ms)
  timers.set(id, { timer, due: Date.now() + ms, fire })
}

/**
 * Holds every simulated timer where it is (a scan stage, running checks), so a presenter can stop
 * on a meaningful state and talk. Resume picks up with the time that was left.
 */
export function pauseSim() {
  if (paused) return
  paused = true
  const now = Date.now()
  for (const p of timers.values()) {
    if (p.timer) clearTimeout(p.timer)
    p.timer = null
    p.remaining = Math.max(0, p.due - now)
  }
}

export function resumeSim() {
  if (!paused) return
  paused = false
  const now = Date.now()
  for (const p of timers.values()) {
    const ms = p.remaining ?? 0
    p.due = now + ms
    p.remaining = undefined
    p.timer = setTimeout(p.fire, ms)
  }
}

export function isSimPaused() {
  return paused
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
    if (p.timer) clearTimeout(p.timer)
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
    if (p.timer) clearTimeout(p.timer)
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
