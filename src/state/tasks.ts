// Real async work (file reads, Figma REST, model calls, document parsing) with the same Job shape
// as the simulations, so ProgressPanel and useJob/useTask show both. No timers: a task is a chain
// of awaited stages. Tasks never reject; callers read the outcome.

import { writeJobs } from './jobs'

export interface TaskStage {
  label: string
  detail?: string
  run: (signal: AbortSignal) => Promise<void> | void
}

export type TaskOutcome = { status: 'done' } | { status: 'failed'; error: string } | { status: 'cancelled' }

interface Running {
  controller: AbortController
  done: Promise<TaskOutcome>
}

const running = new Map<string, Running>()

/** `<owner>:draft:<name>` — the same shape as jobKey() so useJob(name) finds project tasks. */
export function taskKey(owner: string, name: string) {
  return `${owner}:draft:${name}`
}

export function runTask(id: string, label: string, stages: TaskStage[]): Promise<TaskOutcome> {
  cancelTask(id)
  const controller = new AbortController()
  writeJobs((jobs) => {
    jobs[id] = { id, label, stageIndex: 0, stages: stages.map((s) => ({ label: s.label, detail: s.detail })), status: 'running', kind: 'task' }
  })
  const done = (async (): Promise<TaskOutcome> => {
    try {
      for (let i = 0; i < stages.length; i++) {
        if (controller.signal.aborted) throw new DOMException('cancelled', 'AbortError')
        writeJobs((jobs) => {
          if (jobs[id]) jobs[id].stageIndex = i
        })
        await stages[i].run(controller.signal)
      }
      if (controller.signal.aborted) throw new DOMException('cancelled', 'AbortError')
      writeJobs((jobs) => {
        if (jobs[id]) {
          jobs[id].status = 'done'
          jobs[id].stageIndex = stages.length - 1
        }
      })
      return { status: 'done' }
    } catch (e) {
      const cancelled = controller.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')
      const error = cancelled ? 'cancelled' : e instanceof Error ? e.message : String(e)
      writeJobs((jobs) => {
        if (jobs[id]) {
          jobs[id].status = cancelled ? 'cancelled' : 'failed'
          if (!cancelled) jobs[id].error = error
        }
      })
      return cancelled ? { status: 'cancelled' } : { status: 'failed', error }
    } finally {
      if (running.get(id)?.controller === controller) running.delete(id)
    }
  })()
  running.set(id, { controller, done })
  return done
}

export function cancelTask(id: string) {
  running.get(id)?.controller.abort()
}

export function cancelTasksWithPrefix(prefix: string) {
  for (const id of Array.from(running.keys())) if (id.startsWith(prefix)) cancelTask(id)
}

export function cancelAllTasks() {
  for (const id of Array.from(running.keys())) cancelTask(id)
}

export function isTaskRunning(id: string) {
  return running.has(id)
}

/** Await every running task (and tasks they start), for tests. */
export async function settleTasks(prefix?: string) {
  for (let round = 0; round < 100; round++) {
    const pending = Array.from(running.entries()).filter(([id]) => !prefix || id.startsWith(prefix)).map(([, r]) => r.done)
    if (!pending.length) return
    await Promise.all(pending)
  }
}
