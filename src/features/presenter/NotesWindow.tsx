// The presenter's private window. Open it from the client demo ("Presenter notes"), keep it on your
// own screen, and share only the demo tab. It follows the demo chapter by chapter and can drive it.
// Internal only: this route exists in the hub build, never in the client-safe demo build.

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ChevronLeft, ChevronRight, FastForward, Pause, Play } from 'lucide-react'
import { TOUR, TOUR_BY_ID, pathFor, PATH_MINUTES, demoText } from '@/features/demo/steps'
import { openDemoChannel, type DemoStateMessage } from '@/features/demo/channel'
import { PRESENTER_NOTES } from '@/internal/presenterNotes'
import { cx } from '@/shell/ui'

export function NotesWindow() {
  const { slug } = useParams()
  const [state, setState] = useState<DemoStateMessage | null>(null)
  const channel = useRef<ReturnType<typeof openDemoChannel>>(null)

  useEffect(() => {
    document.title = 'Presenter notes · Client demo'
    const ch = openDemoChannel((m) => {
      if (m.type === 'state' && (!slug || m.slug === slug)) setState(m)
    })
    channel.current = ch
    ch?.post({ type: 'cmd', action: 'hello' })
    const t = setInterval(() => ch?.post({ type: 'cmd', action: 'hello' }), 4000)
    return () => {
      clearInterval(t)
      ch?.close()
    }
  }, [slug])

  const send = (action: 'next' | 'back' | 'goto' | 'show' | 'pause' | 'resume' | 'start', chapterId?: string, mode?: 'meeting' | 'full') => channel.current?.post({ type: 'cmd', action, chapterId, mode })
  const step = state?.chapterId ? TOUR_BY_ID[state.chapterId] : undefined
  const note = step ? PRESENTER_NOTES[step.id] : undefined
  const path = pathFor(state?.mode ?? 'meeting', state?.chapters)

  if (!channel.current && typeof BroadcastChannel === 'undefined') {
    return (
      <main className="notes-window">
        <p>This browser cannot link two windows. Use the meeting-prep page in the hub for your notes.</p>
      </main>
    )
  }

  return (
    <main className="notes-window" aria-live="polite">
      <header className="notes-window__head">
        <p className="kicker">Presenter notes{state ? ` · ${state.client}` : ''}</p>
        <p className="xs notes-window__private">Private. Keep this window off the shared screen.</p>
      </header>

      {!state || state.status === 'idle' || state.status === 'finished' || !step ? (
        <section className="notes-window__waiting">
          <h1>{!state ? 'Waiting for the client demo…' : state.status === 'finished' ? 'The guided story is finished.' : 'The guided story has not started.'}</h1>
          <p className="small">{!state ? 'Open the client demo as presenter in this browser. This window links to it automatically.' : 'Start it here or from the demo itself.'}</p>
          {state && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--mint" onClick={() => send('start', undefined, 'meeting')}>
                Start the short path (about {PATH_MINUTES.meeting} min)
              </button>
              <button className="btn btn--secondary" onClick={() => send('start', undefined, 'full')}>
                Full path (about {PATH_MINUTES.full} min)
              </button>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="notes-window__now">
            <p className="kicker">
              <span className="kicker__n">{String(step.n).padStart(2, '0')}</span>
              <span>{step.title}</span>
              {note && <span className="demobar__pos">about {note.minutes} min</span>}
            </p>
            <h1 className="notes-window__say">{note?.say ?? demoText(step.clientSay, state.client, true)}</h1>
            {note?.action && (
              <p className="notes-window__action">
                <strong>On screen:</strong> {note.action} {state.ready ? <span className="chip chip--ok">Done</span> : null}
              </p>
            )}
            {note && (
              <ul className="notes-window__points">
                {note.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <p className="small muted">
              <strong>The client sees:</strong> {demoText(step.clientSay, state.client, true)}
            </p>
          </section>

          <div className="notes-window__controls">
            <button className="btn btn--secondary" onClick={() => send('back')}>
              <ChevronLeft /> Back
            </button>
            <button className="btn btn--secondary" onClick={() => send(state.status === 'paused' ? 'resume' : 'pause')}>
              {state.status === 'paused' ? <Play /> : <Pause />} {state.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            {!state.ready && step.skip && (
              <button className="btn btn--secondary" onClick={() => send('show')}>
                <FastForward /> Show me
              </button>
            )}
            <button className="btn btn--primary" onClick={() => send('next')}>
              Next <ChevronRight />
            </button>
          </div>

          <ol className="notes-window__path">
            {(state?.mode === 'custom' ? [...path, ...TOUR.filter((c) => !path.includes(c))] : TOUR).map((c) => (
              <li key={c.id}>
                <button className={cx('notes-window__chapter', c.id === step.id && 'is-current', !path.includes(c) && 'is-optional')} onClick={() => send('goto', c.id)}>
                  <span className="kicker__n">{String(c.n).padStart(2, '0')}</span> {c.title}
                  {!path.includes(c) && <span className="xs muted"> · {state?.mode === 'custom' ? 'not in this demo' : 'full path'}</span>}
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  )
}
