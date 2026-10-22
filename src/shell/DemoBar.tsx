import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, FastForward, Pause, Play, RotateCcw, X, ChevronUp, ChevronDown, Timer, Sparkles, FlaskConical } from 'lucide-react'
import { useStore } from '@/state/store'
import { TOUR, tourIndex } from '@/features/demo/steps'
import { focusDemoTarget, Collapse } from '@/motion'
import { act, usePaths, usePresenter, useProject, useSystem } from '@/state/hooks'
import { cx } from './ui'

/** The guide bar of the client experience: progress, controls, plain explanations; presenter notes only for presenters. */
export function DemoBar() {
  const project = useProject()
  const guide = project.session?.guide
  const sys = useSystem()
  const r = usePaths()
  const presenter = usePresenter()
  const motionPaused = useStore((s) => s.ui.motionPaused)
  const navigate = useNavigate()
  const location = useLocation()
  const index = tourIndex(guide?.chapterId ?? null)
  const step = TOUR[index]
  const active = Boolean(guide && (guide.status === 'running' || guide.status === 'paused'))
  const paused = guide?.status === 'paused' || motionPaused
  const lastNavStep = useRef<string | null>(guide?.chapterId ?? null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const prevReady = useRef(false)

  const ready = step?.expect ? step.expect(sys) : true
  const last = index === TOUR.length - 1

  // Navigate + focus when the chapter changes (never on mount).
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

  // Flash when the step's expectation flips true.
  useEffect(() => {
    if (ready && !prevReady.current && step?.expect) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 900)
      focusDemoTarget(step.focus)
      return () => clearTimeout(t)
    }
    prevReady.current = ready
  }, [ready, step])
  useEffect(() => {
    prevReady.current = ready
  }, [ready])

  // Autoplay (presenter tool): counts down once a step is ready; never performs the step itself.
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
        if (last) finishAndGo()
        else goto(index + 1)
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, guide?.autoplay.on, guide?.autoplay.seconds, paused, step?.id, ready])

  if (!active || !step || !guide) return null

  const goto = (n: number) => {
    const next = TOUR[Math.max(0, Math.min(TOUR.length - 1, n))]
    if (n > index) act().completeGuideChapter(step.id)
    lastNavStep.current = null
    act().setGuideChapter(next.id)
  }
  const finishAndGo = () => {
    act().completeGuideChapter(step.id)
    act().finishGuide()
    navigate(r.outcome)
  }
  const doIt = () => step.skip?.(act(), sys)

  return (
    <div className={cx('demobar', flash && 'is-flash', paused && 'is-paused')} role="region" aria-label="Guide controls">
      <div className="demobar__rail" aria-label="Progress">
        {TOUR.map((s, i) => {
          const done = guide.completedChapters.includes(s.id) || i < index
          const cur = i === index
          return (
            <button key={s.id} className={cx('demobar__dot', done && 'is-done', cur && 'is-current')} onClick={() => goto(i)} title={`${s.n} · ${s.title}`} aria-current={cur ? 'step' : undefined}>
              <span className="demobar__dot-n">{s.n}</span>
              <span className="demobar__dot-t hide-sm">{s.title}</span>
            </button>
          )
        })}
      </div>

      <div className="demobar__main">
        <button className="demobar__step" onClick={() => navigate(step.route(sys, r))} title="Go to this chapter's screen">
          {step.n}
        </button>
        <div className="demobar__body">
          <span className="demobar__title">
            {step.title} <span className="demobar__problem">· {step.problem}</span>
          </span>
          <span className="demobar__say">{presenter ? (ready || !step.hint ? step.say : `${step.hint} ${step.say}`) : step.clientSay}</span>
        </div>
        <div className="demobar__actions">
          <button className="icon-btn" onClick={() => goto(index - 1)} disabled={index === 0} aria-label="Back" title="Back">
            <ChevronLeft />
          </button>
          <button className="icon-btn" onClick={() => act().pauseGuide(guide.status !== 'paused')} aria-label={paused ? 'Resume' : 'Pause'} title={paused ? 'Resume animations and autoplay' : 'Pause animations and autoplay; keep this state on screen'}>
            {paused ? <Play /> : <Pause />}
          </button>
          {!ready && step.skip && (
            <button className="btn btn--on-dark-ghost btn--sm" onClick={doIt} title={presenter ? "Do this chapter's action for me" : 'Perform this step'}>
              <FastForward /> {presenter ? 'Do it' : 'Show me'}
            </button>
          )}
          {!last ? (
            <button className="btn btn--on-dark btn--sm" onClick={() => goto(index + 1)} disabled={!ready} title={ready ? 'Next chapter' : step.hint}>
              Next <ChevronRight />
              {countdown !== null && ready && <span className="demobar__count">{countdown}s</span>}
            </button>
          ) : (
            <button className="btn btn--mint btn--sm" onClick={finishAndGo}>
              <Sparkles /> See the outcome
              {countdown !== null && <span className="demobar__count">{countdown}s</span>}
            </button>
          )}
          <button className="icon-btn" onClick={() => act().setGuideNotesOpen(!guide.notesOpen)} aria-label={guide.notesOpen ? 'Hide notes' : 'Show notes'} title="What you are seeing / why it matters">
            {guide.notesOpen ? <ChevronDown /> : <ChevronUp />}
          </button>
          <button className="icon-btn" onClick={() => act().endGuide()} aria-label="Close the guide" title="Close (progress is kept)">
            <X />
          </button>
        </div>
      </div>

      <Collapse open={guide.notesOpen}>
        <div className="demobar__notes">
          <div className="demobar__note">
            <span className="demobar__note-h">What you are seeing</span>
            <span>{step.seeing}</span>
          </div>
          <div className="demobar__note">
            <span className="demobar__note-h">Why it matters</span>
            <span>{step.why}</span>
          </div>
          {presenter && (
            <div className="demobar__note demobar__note--presenter">
              <span className="demobar__note-h">Presenter notes</span>
              <ul>
                {step.talkingPoints.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <span className="demobar__evidence">
                Evidence:{' '}
                {step.evidence.map((e, i) => (
                  <span key={e.label}>
                    <Link to={e.to(r)}>{e.label}</Link>
                    {i < step.evidence.length - 1 && ' · '}
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="demobar__tools">
            {presenter && (
              <label className="toggle xs" title="Advance automatically once a chapter's action is done">
                <input type="checkbox" checked={guide.autoplay.on} onChange={(e) => act().setGuideAutoplay(e.target.checked)} />
                <Timer style={{ width: 12 }} /> Autoplay
                {guide.autoplay.on && (
                  <select className="select" value={guide.autoplay.seconds} onChange={(e) => act().setGuideAutoplay(true, Number(e.target.value) as 5 | 8 | 12 | 20)} style={{ width: 'auto', padding: '2px 6px', fontSize: 11, background: 'var(--n-white-10)', color: 'var(--n-white)', borderColor: 'var(--n-white-30)' }}>
                    {[5, 8, 12, 20].map((n) => (
                      <option key={n} value={n} style={{ color: '#000' }}>
                        {n}s
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
            <button className="btn btn--on-dark-ghost btn--sm" onClick={() => act().restartGuide(false)} title="Restart at chapter 1, keeping the current state">
              <RotateCcw /> Restart
            </button>
            {presenter && (
              <button className="btn btn--on-dark-ghost btn--sm" onClick={() => act().restartGuide(true)} title="Reset the demo session to the published version and restart at chapter 1">
                <RotateCcw /> Restart fresh
              </button>
            )}
            <span className="xs row" style={{ color: 'var(--n-white-70)', gap: 4, marginLeft: 'auto' }}>
              <FlaskConical style={{ width: 12 }} /> Sample data · local simulation
            </span>
          </div>
        </div>
      </Collapse>
    </div>
  )
}
