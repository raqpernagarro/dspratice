// Makes every chapter of the client demo safe to enter directly. Entering a chapter first runs the
// actions of the chapters it depends on (assessment, proposed fix, pull request…) and drains their
// simulated timers, so no chapter opens on a missing state or a disabled button.

import { useStore } from '@/state/store'
import { activeScope, jobPrefix, resolveView } from '@/state/scope'
import { settleJobs } from '@/state/sim'
import type { SystemState } from '@/state/types'
import { TOUR_BY_ID, type TourStep } from './steps'

function sysNow(): SystemState {
  const s = useStore.getState()
  const scope = activeScope()
  return resolveView(s, scope.projectId, scope.layer) ?? s.projects[scope.projectId].draft
}

const settle = () => settleJobs(jobPrefix(activeScope()))

/** Performs a chapter's action ("Show me"). With `instant`, runs every timed part at once. */
export function runChapterAction(step: TourStep, instant = step.instant ?? false) {
  if (!step.skip) return
  const actingAs = useStore.getState().ui.actingAs
  for (let i = 0; i < 4; i += 1) {
    const sys = sysNow()
    if (step.expect?.(sys)) break
    step.skip(useStore.getState(), sys)
    if (!instant) return
    settle()
  }
  // A merge may have needed the owner's role; give the presenter their own role back.
  if (useStore.getState().ui.actingAs !== actingAs) useStore.getState().setActingAs(actingAs)
}

/** Brings the demo to the state a chapter starts from. Returns true when something had to be set up. */
export function prepareChapter(id: string): boolean {
  const step = TOUR_BY_ID[id]
  if (!step) return false
  let changed = false
  const seen = new Set<string>()
  const ensure = (sid: string) => {
    const s = TOUR_BY_ID[sid]
    if (!s || seen.has(sid)) return
    seen.add(sid)
    s.needs.forEach(ensure)
    if (s.expect && !s.expect(sysNow())) {
      s.enter?.(useStore.getState(), sysNow())
      runChapterAction(s, true)
      changed = true
    }
  }
  step.needs.forEach(ensure)
  if (step.enter) {
    const before = sysNow()
    step.enter(useStore.getState(), before)
    if (sysNow() !== before) changed = true
  }
  settle()
  return changed
}
