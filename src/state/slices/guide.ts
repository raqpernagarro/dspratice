import type { GuideActions } from '../actions'
import { ensureSession, type Ctx } from '../ctx'
import { activeScope, newGuideState } from '../scope'
import { pauseSim, resumeSim } from '../sim'

export function guideSlice(ctx: Ctx): GuideActions {
  const { set } = ctx
  const withGuide = (fn: (g: NonNullable<ReturnType<typeof ensureSession>>['guide'], s: Parameters<Parameters<Ctx['set']>[0]>[0]) => void) =>
    set((s) => {
      const sess = ensureSession(s, activeScope().projectId, ctx.now())
      if (sess) fn(sess.guide, s)
    })
  return {
    // Starting the guide begins at the first chapter of the path, or at the chapter named.
    startGuide: (mode, chapterId) => {
      resumeSim()
      withGuide((g, s) => {
        g.mode = mode
        g.status = 'running'
        g.startedAt = ctx.now()
        g.finishedAt = undefined
        g.chapterId = chapterId ?? null
        g.stepIndex = 0
        if (!chapterId) g.completedChapters = []
        s.ui.motionPaused = false
      })
    },
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
    pauseGuide: (paused) => {
      if (paused) pauseSim()
      else resumeSim()
      withGuide((g, s) => {
        if (g.status === 'running' && paused) g.status = 'paused'
        if (g.status === 'paused' && !paused) g.status = 'running'
        s.ui.motionPaused = paused
      })
    },
    endGuide: () => {
      resumeSim()
      withGuide((g, s) => {
        g.status = 'idle'
        s.ui.motionPaused = false
      })
    },
    finishGuide: () => {
      resumeSim()
      withGuide((g, s) => {
        g.status = 'finished'
        g.finishedAt = ctx.now()
        s.ui.motionPaused = false
      })
    },
    restartGuide: (fresh) => {
      resumeSim()
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
