// The guide bar of the client demo. It is on the shared screen, so it only ever says what is
// happening and why it matters; presenter notes live in a separate window (see NotesWindow).
// Entering any chapter sets up what it depends on, so Back, Next and the chapter list never lead
// to a dead end.

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, FastForward, Pause, Play, RotateCcw, X, ChevronUp, ChevronDown, Timer, ListOrdered, Check } from 'lucide-react'
import { useStore } from '@/state/store'
import { TOUR, TOUR_BY_ID, pathFor, pathMinutes, demoText, type TourStep } from '@/features/demo/steps'
import { prepareChapter, runChapterAction } from '@/features/demo/prepare'
import { openDemoChannel, type DemoMessage } from '@/features/demo/channel'
import { focusDemoTarget, Collapse } from '@/motion'
import { act, usePaths, usePresenter, useProject, useSystem } from '@/state/hooks'
import { MenuButton } from './Menu'
import { cx } from './ui'

export function DemoBar() {
  const project = useProject()
  const guide = project.session?.guide
  const sys = useSystem()
  const r = usePaths()
  const presenter = usePresenter()
  const motionPaused = useStore((s) => s.ui.motionPaused)
  const navigate = useNavigate()
  const location = useLocation()
  const mode = guide?.mode ?? 'meeting'
  const path = pathFor(mode, guide?.meetingChapters)
  // Unknown ids (e.g. chapters saved by an older version) fall back to the start of the path.
  const step: TourStep | undefined = (guide?.chapterId ? TOUR_BY_ID[guide.chapterId] : undefined) ?? path[0]
  const index = step ? path.findIndex((s) => s.id === step.id) : -1
  const active = Boolean(guide && (guide.status === 'running' || guide.status === 'paused'))
  const paused = guide?.status === 'paused' || motionPaused
  const lastNavStep = useRef<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [setupNote, setSetupNote] = useState<string | null>(null)
  const prevReady = useRef(false)
  const channel = useRef<ReturnType<typeof openDemoChannel>>(null)

  const ready = step?.expect ? step.expect(sys) : true
  const last = step ? !path.some((s) => s.n > step.n) : false

  // First chapter when the guide starts without one.
  useEffect(() => {
    if (active && guide && (!guide.chapterId || !TOUR_BY_ID[guide.chapterId]) && path[0]) act().setGuideChapter(path[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, guide?.chapterId])

  // Navigate + focus when the chapter changes.
  useEffect(() => {
    if (!active || !step) return
    if (lastNavStep.current === step.id) return
    lastNavStep.current = step.id
    const target = step.route(sys, r)
    if (location.pathname + location.search !== target) navigate(target)
    const t = setTimeout(() => focusDemoTarget(step.focus), 450)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step?.id])

  // Focus the target when the route settles on the chapter's screen.
  useEffect(() => {
    if (!active || !step) return
    const target = step.route(sys, r).split('?')[0]
    if (location.pathname === target) {
      const t = setTimeout(() => focusDemoTarget(step.focus), 350)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, active, step?.id])

  // A short flash when the chapter's action completes (cause → effect).
  useEffect(() => {
    if (ready && !prevReady.current && step?.expect) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 900)
      focusDemoTarget(step.focus)
      prevReady.current = ready
      return () => clearTimeout(t)
    }
    prevReady.current = ready
  }, [ready, step])

  useEffect(() => {
    if (!setupNote) return
    const t = setTimeout(() => setSetupNote(null), 6000)
    return () => clearTimeout(t)
  }, [setupNote])

  const goto = (id: string) => {
    const target = TOUR_BY_ID[id]
    if (!target || !step) return
    if (target.n > step.n) act().completeGuideChapter(step.id)
    // Moving forward without doing this chapter's action still counts it as done for the story.
    const setUp = prepareChapter(target.id)
    setSetupNote(setUp && target.setupNote ? target.setupNote : null)
    lastNavStep.current = null
    act().setGuideChapter(target.id)
  }
  // Next and Back follow the chosen path. From a chapter outside it (opened from the list), they
  // go to the nearest chapter of the path in that direction.
  const next = () => {
    if (!step) return
    if (last) return finishAndGo()
    const n = path.find((s) => s.n > step.n) ?? TOUR[TOUR.length - 1]
    goto(n.id)
  }
  const back = () => {
    if (!step) return
    const prev = [...path].reverse().find((s) => s.n < step.n) ?? [...TOUR].reverse().find((s) => s.n < step.n)
    if (prev) goto(prev.id)
  }
  const finishAndGo = () => {
    if (!step) return
    act().completeGuideChapter(step.id)
    act().finishGuide()
    navigate(r.outcome)
  }
  const showMe = () => step && runChapterAction(step)

  // Presenter notes window: send where we are, take its commands.
  const broadcast = () =>
    channel.current?.post({ type: 'state', slug: project.slug, chapterId: active ? (step?.id ?? null) : null, mode, chapters: mode === 'custom' ? guide?.meetingChapters : undefined, status: guide?.status ?? 'idle', ready, client: project.client.name })
  const handlers = useRef({ next, back, goto, showMe, broadcast })
  handlers.current = { next, back, goto, showMe, broadcast }
  useEffect(() => {
    if (!presenter) return
    const ch = openDemoChannel((m: DemoMessage) => {
      if (m.type !== 'cmd') return
      const h = handlers.current
      if (m.action === 'next') h.next()
      if (m.action === 'back') h.back()
      if (m.action === 'goto' && m.chapterId) h.goto(m.chapterId)
      if (m.action === 'show') h.showMe()
      if (m.action === 'pause') act().pauseGuide(true)
      if (m.action === 'resume') act().pauseGuide(false)
      if (m.action === 'start') {
        lastNavStep.current = null
        act().startGuide(m.mode ?? 'meeting')
      }
      if (m.action === 'hello') h.broadcast()
    })
    channel.current = ch
    return () => ch?.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenter])
  useEffect(() => {
    handlers.current.broadcast()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, guide?.status, ready, mode, active])

  // Autoplay (presenter only): counts down once a chapter is ready; never performs the action itself.
  useEffect(() => {
    if (!active || !guide?.autoplay.on || paused || !step || !ready) {
      setCountdown(null)
      return
    }
    let remaining = guide.autoplay.seconds
    setCountdown(remaining)
    const id = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        handlers.current.next()
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, guide?.autoplay.on, guide?.autoplay.seconds, paused, step?.id, ready])

  // Keyboard: ←/→ chapters, Space pauses, Esc collapses the details. Ignored while typing.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey)) return
      if (e.key === 'ArrowRight') handlers.current.next()
      else if (e.key === 'ArrowLeft') handlers.current.back()
      else if (e.key === ' ' && t?.tagName !== 'BUTTON') {
        e.preventDefault()
        act().pauseGuide(useStore.getState().projects[project.id]?.session?.guide.status !== 'paused')
      } else if (e.key === 'Escape' && guide?.notesOpen) act().setGuideNotesOpen(false)
      else return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, guide?.notesOpen, project.id])

  if (!active || !step || !guide) return null
  const shownIndex = index >= 0 ? index + 1 : null

  return (
    <div className={cx('demobar', flash && 'is-flash', paused && 'is-paused')} role="region" aria-label="Guided demo">
      <div className="demobar__main">
        <div className="demobar__body">
          <p className="kicker demobar__kicker">
            <span className="kicker__n">{String(step.n).padStart(2, '0')}</span>
            <span>{step.title}</span>
            {shownIndex && (
              <span className="demobar__pos">
                {shownIndex} of {path.length}
              </span>
            )}
          </p>
          <p className="demobar__headline">
            {step.headline.before}
            <span className="em-hl">{step.headline.hl}</span>
            {step.headline.after}
          </p>
        </div>
        <div className="demobar__actions">
          <button className="icon-btn" onClick={back} disabled={step.n === 1} aria-label="Previous chapter" title="Previous chapter (←)">
            <ChevronLeft />
          </button>
          <button className="icon-btn" onClick={() => act().pauseGuide(guide.status !== 'paused')} aria-label={paused ? 'Resume' : 'Pause'} title={paused ? 'Resume (Space)' : 'Pause on this state (Space)'} aria-pressed={paused}>
            {paused ? <Play /> : <Pause />}
          </button>
          {!ready && step.skip && (
            <button className="btn btn--on-dark-ghost btn--sm" onClick={showMe} data-testid="demo-show-me">
              <FastForward /> Show me
            </button>
          )}
          {!last ? (
            <button className="btn btn--mint btn--sm" onClick={next} data-testid="demo-next" title="Next chapter (→)">
              Next <ChevronRight />
              {countdown !== null && <span className="demobar__count">{countdown}s</span>}
            </button>
          ) : (
            <button className="btn btn--mint btn--sm" onClick={finishAndGo} data-testid="demo-finish">
              Finish <Check />
            </button>
          )}
          <MenuButton label={<span className="hide-md">Chapters</span>} icon={<ListOrdered />} testid="demo-chapters">
            {(close) => (
              <>
                <div className="ws-switch__label">
                  {mode === 'full' ? 'Full path' : mode === 'custom' ? `This meeting’s demo · ${path.length} chapters` : 'Short path'} · about {pathMinutes(mode, guide.meetingChapters)} min
                </div>
                {(mode === 'custom' ? [...path, ...TOUR.filter((c) => !path.includes(c))] : TOUR).map((c) => (
                  <button
                    key={c.id}
                    role="menuitem"
                    className={cx('ws-switch__item', c.id === step.id && 'is-active')}
                    onClick={() => {
                      close()
                      goto(c.id)
                    }}
                    data-testid={`demo-chapter-${c.id}`}
                  >
                    <span className="kicker__n" style={{ fontSize: 13 }}>
                      {String(c.n).padStart(2, '0')}
                    </span>
                    <span>
                      <strong>{c.title}</strong>
                      <small>{guide.completedChapters.includes(c.id) ? 'Seen' : mode === 'meeting' && !c.short ? 'Optional, full path only' : mode === 'custom' && !path.includes(c) ? 'Not in this demo' : ' '}</small>
                    </span>
                  </button>
                ))}
                <div className="ws-switch__foot row" style={{ gap: 8 }}>
                  <button className="btn btn--secondary btn--sm" onClick={() => act().startGuide(mode === 'full' ? 'meeting' : 'full', step.id)}>
                    Switch to the {mode === 'full' ? 'short' : 'full'} path
                  </button>
                </div>
              </>
            )}
          </MenuButton>
          <button className="icon-btn" onClick={() => act().setGuideNotesOpen(!guide.notesOpen)} aria-label={guide.notesOpen ? 'Hide details' : 'Show details'} aria-expanded={guide.notesOpen} title="What this shows and why it matters">
            {guide.notesOpen ? <ChevronDown /> : <ChevronUp />}
          </button>
          <button className="icon-btn" onClick={() => act().endGuide()} aria-label="Close the guide" title="Close the guide (you can explore freely; your place is kept)">
            <X />
          </button>
        </div>
      </div>

      <div className="demobar__progress" aria-hidden="true">
        {path.map((s) => (
          <span key={s.id} className={cx('demobar__pip', s.id === step.id && 'is-current', guide.completedChapters.includes(s.id) && 'is-done')} />
        ))}
      </div>

      {setupNote && (
        <p className="demobar__setup" role="status">
          {setupNote}
        </p>
      )}

      <Collapse open={guide.notesOpen}>
        <div className="demobar__notes">
          <div className="demobar__note">
            <span className="demobar__note-h">What this shows</span>
            <span>{demoText(step.clientSay, sys.theme.name, project.client.fictional)}</span>
          </div>
          <div className="demobar__note">
            <span className="demobar__note-h">Why it matters</span>
            <span>{demoText(step.why, sys.theme.name, project.client.fictional)}</span>
          </div>
          <div className="demobar__tools">
            <button className="btn btn--on-dark-ghost btn--sm" onClick={() => act().restartGuide(false)} title="Back to chapter 1; everything done so far stays on screen">
              <RotateCcw /> Start again
            </button>
            {presenter && (
              <button className="btn btn--on-dark-ghost btn--sm" onClick={() => act().restartGuide(true)} title="Back to the prepared version and chapter 1. Your preparation in the hub is untouched.">
                <RotateCcw /> Reset the demo
              </button>
            )}
            {presenter && (
              <label className="toggle xs" title="Moves to the next chapter a few seconds after the current one is done">
                <input type="checkbox" checked={guide.autoplay.on} onChange={(e) => act().setGuideAutoplay(e.target.checked)} />
                <Timer style={{ width: 12 }} /> Autoplay
                {guide.autoplay.on && (
                  <select className="select demobar__select" value={guide.autoplay.seconds} onChange={(e) => act().setGuideAutoplay(true, Number(e.target.value) as 5 | 8 | 12 | 20)} aria-label="Seconds per chapter">
                    {[5, 8, 12, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}s
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
            <span className="xs demobar__keys">← → chapters · Space pause · Esc hide details</span>
          </div>
        </div>
      </Collapse>
    </div>
  )
}
