import type { GuideActions } from '../actions'
import { ensureSession, type Ctx } from '../ctx'
import { activeScope, newGuideState } from '../scope'

export function guideSlice(ctx: Ctx): GuideActions {
  const { set } = ctx
  const withGuide = (fn: (g: NonNullable<ReturnType<typeof ensureSession>>['guide'], s: Parameters<Parameters<Ctx['set']>[0]>[0]) => void) =>
    set((s) => {
      const sess = ensureSession(s, activeScope().projectId, ctx.now())
      if (sess) fn(sess.guide, s)
    })
  return {
    startGuide: (mode, chapterId) =>
      withGuide((g) => {
        const resume = g.status === 'paused' || (g.status === 'running' && !chapterId)
        g.mode = mode
        g.status = 'running'
        g.startedAt = g.startedAt ?? ctx.now()
        g.finishedAt = undefined
        if (chapterId) {
          g.chapterId = chapterId
          g.stepIndex = 0
        } else if (!resume || !g.chapterId) {
          g.chapterId = null
          g.stepIndex = 0
        }
      }),
    setGuideChapter: (chapterId, stepIndex = 0) =>
      withGuide((g) => {
        g.chapterId = chapterId
        g.stepIndex = stepIndex
        if (g.status === 'idle' || g.status === 'finished') g.status = 'running'
      }),
    setGuideStep: (stepIndex) =>
      withGuide((g) => {
        g.stepIndex = Math.max(0, stepIndex)
        if (g.chapterId) {
          const done = (g.completedSteps[g.chapterId] ??= [])
          for (let i = 0; i < stepIndex; i += 1) if (!done.includes(i)) done.push(i)
        }
      }),
    completeGuideChapter: (chapterId) =>
      withGuide((g) => {
        if (!g.completedChapters.includes(chapterId)) g.completedChapters.push(chapterId)
      }),
    pauseGuide: (paused) =>
      withGuide((g, s) => {
        if (g.status === 'running' && paused) g.status = 'paused'
        if (g.status === 'paused' && !paused) g.status = 'running'
        s.ui.motionPaused = paused
      }),
    endGuide: () =>
      withGuide((g, s) => {
        g.status = 'idle'
        s.ui.motionPaused = false
      }),
    finishGuide: () =>
      withGuide((g, s) => {
        g.status = 'finished'
        g.finishedAt = ctx.now()
        s.ui.motionPaused = false
      }),
    restartGuide: (fresh) => {
      const scope = activeScope()
      if (fresh) ctx.get().resetDemoSession(scope.projectId)
      withGuide((g, s) => {
        const keep = { mode: g.mode, meetingChapters: g.meetingChapters, autoplay: g.autoplay, notesOpen: g.notesOpen, presenting: g.presenting }
        Object.assign(g, newGuideState(keep.mode), keep, { status: 'running', startedAt: ctx.now() })
        s.ui.motionPaused = false
      })
    },
    setGuideAutoplay: (on, seconds) =>
      withGuide((g) => {
        g.autoplay.on = on
        if (seconds) g.autoplay.seconds = seconds
      }),
    setGuideNotesOpen: (open) =>
      withGuide((g) => {
        g.notesOpen = open
      }),
    setGuidePresenting: (on) =>
      withGuide((g) => {
        g.presenting = on
      }),
    setMeetingChapters: (ids) =>
      withGuide((g) => {
        g.meetingChapters = ids
      }),
  }
}
