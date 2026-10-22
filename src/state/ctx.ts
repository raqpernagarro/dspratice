// What every slice gets: immer-style set/get plus the four helpers that enforce the write rule.
//
// Rule: an action captures `activeScope()` once when it starts and passes that scope to every
// setSys/log call, including the ones inside timer callbacks. Snapshots (publish, session) are taken
// from get() outside the producer and cloned with cloneSys().

import type { AppState } from './store'
import type { HistoryEvent, Scope, SystemState, Toast } from './types'
import { cloneSys, effectiveActingAs, newGuideState } from './scope'
import { uid } from './sim'

export type Set = (fn: (s: AppState) => void) => void
export type Get = () => AppState

export interface Ctx {
  set: Set
  get: Get
  toast: (t: Omit<Toast, 'id'>) => void
  log: (scope: Scope, text: string, entity?: HistoryEvent['entity'], simulated?: boolean, actor?: string) => void
  setSys: (scope: Scope, fn: (sys: SystemState, s: AppState) => void) => void
  readSys: (scope: Scope) => SystemState
  now: () => number
  /** Project-level activity (internal), capped at 50. */
  activity: (projectId: string, text: string, entity?: HistoryEvent['entity'], actor?: string) => void
  /** Practice-level knowledge log, capped at 50. */
  practiceLog: (text: string, sourceId?: string, actor?: string) => void
  /** The name of the person the user is acting as, for "by …" fields. */
  actorName: () => string
}

/** Creates the session lazily so a client page can start acting before the presenter clicks anything. */
export function ensureSession(s: AppState, projectId: string, now: number) {
  const p = s.projects[projectId]
  if (!p) return null
  if (!p.session) {
    const base = p.published?.state ?? p.draft
    p.session = { baseVersion: p.published?.version ?? 0, startedAt: now, state: cloneSys(base), guide: newGuideState(p.clientExperience.guidanceDefault === 'full' ? 'full' : 'meeting') }
  }
  return p.session
}

export function makeCtx(set: Set, get: Get): Ctx {
  const now = () => Date.now()
  const toast: Ctx['toast'] = (t) =>
    set((s) => {
      s.sim.toasts.push({ id: uid('t'), ...t })
      if (s.sim.toasts.length > 4) s.sim.toasts.shift()
    })
  const setSys: Ctx['setSys'] = (scope, fn) => {
    const p0 = get().projects[scope.projectId]
    if (!p0) return
    if (scope.layer === 'session' && !p0.session) set((s) => void ensureSession(s, scope.projectId, now()))
    set((s) => {
      const p = s.projects[scope.projectId]
      if (!p) return
      const sys = scope.layer === 'session' ? p.session?.state : p.draft
      if (sys) fn(sys, s)
    })
  }
  const readSys: Ctx['readSys'] = (scope) => {
    const p = get().projects[scope.projectId]
    if (!p) throw new Error(`Unknown project ${scope.projectId}`)
    return (scope.layer === 'session' ? (p.session?.state ?? p.published?.state) : undefined) ?? p.draft
  }
  const log: Ctx['log'] = (scope, text, entity, simulated = false, actor) =>
    setSys(scope, (sys, s) => {
      const who = actor ?? sys.people.find((p) => p.id === effectiveActingAs(s, scope))?.name ?? 'You'
      sys.history.unshift({ id: uid('h'), ts: now(), actor: who, text, entity, simulated })
      if (sys.history.length > 200) sys.history.pop()
    })
  const actorName = () => {
    const s = get()
    const id = s.ui.actingAs
    for (const p of Object.values(s.projects)) {
      const hit = p.draft.people.find((x) => x.id === id)
      if (hit) return hit.name
    }
    return 'Nagarro'
  }
  const activity: Ctx['activity'] = (projectId, text, entity = { type: 'project', id: projectId }, actor) =>
    set((s) => {
      const p = s.projects[projectId]
      if (!p) return
      p.activity.unshift({ id: uid('h'), ts: now(), actor: actor ?? actorName(), text, entity })
      if (p.activity.length > 50) p.activity.pop()
    })
  const practiceLog: Ctx['practiceLog'] = (text, sourceId, actor) =>
    set((s) => {
      s.practice.knowledge.activity.unshift({ id: uid('k'), ts: now(), actor: actor ?? actorName(), text, sourceId })
      if (s.practice.knowledge.activity.length > 50) s.practice.knowledge.activity.pop()
    })
  return { set, get, toast, log, setSys, readSys, now, activity, practiceLog, actorName }
}
