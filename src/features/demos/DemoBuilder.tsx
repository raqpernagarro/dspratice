// Build a demo for one meeting, with no model: plain words suggest ready-made demos and a playlist of
// the story's chapters; the presenter adds, removes and reorders them, and saves the playlist on the
// project. Used in Prepare a client meeting (step 2).

import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Save, Trash2 } from 'lucide-react'
import { act } from '@/state/hooks'
import { TOUR, TOUR_BY_ID, pathMinutes } from '@/features/demo/steps'
import type { MiniDemo } from '@/fixtures/demos'
import type { Project } from '@/state/types'
import { suggestDemo } from './build'

const TRY = ['How AI stays on their design system', 'Figma and code drift apart', 'The whole story, short']

export function DemoBuilder({ project, onSaved, onPick }: { project: Project; onSaved?: () => void; onPick?: (d: MiniDemo) => void }) {
  const [text, setText] = useState('')
  const [asked, setAsked] = useState('')
  const suggestion = useMemo(() => suggestDemo(asked), [asked])
  const [playlist, setPlaylist] = useState<string[]>([])
  const [name, setName] = useState('')
  const saved = project.clientExperience.playlists ?? []

  const ask = (q: string) => {
    setText(q)
    setAsked(q.trim())
    setPlaylist(suggestDemo(q).chapters)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }
  const toggle = (id: string) => setPlaylist((pl) => (pl.includes(id) ? pl.filter((x) => x !== id) : [...pl, id].sort((a, b) => TOUR.findIndex((s) => s.id === a) - TOUR.findIndex((s) => s.id === b))))
  const move = (k: number, by: -1 | 1) =>
    setPlaylist((pl) => {
      const next = [...pl]
      const j = k + by
      if (j < 0 || j >= next.length) return pl
      ;[next[k], next[j]] = [next[j], next[k]]
      return next
    })
  const save = () => {
    if (!playlist.length) return
    act().setClientExperience(project.id, { playlists: [{ id: `pl-${Date.now().toString(36)}`, name: name.trim() || asked || 'Meeting demo', chapters: playlist, savedAt: Date.now() }, ...saved] })
    setName('')
    onSaved?.()
  }

  return (
    <div className="stack">
      <form className="ask ask--panel" onSubmit={submit} aria-label="What should this meeting show?">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What should this meeting show? For example: Figma and code drift apart" aria-label="What should this meeting show?" data-testid="demo-ask" />
        <button className="ask__send" type="submit" aria-label="Suggest a demo">
          <ArrowRight />
        </button>
      </form>
      <div className="ask__try">
        <span>Try</span>
        {TRY.map((t) => (
          <button key={t} type="button" onClick={() => ask(t)}>
            {t}
          </button>
        ))}
      </div>
      {asked && (
        <div className="build" data-testid="demo-build">
          {suggestion.demos.length > 0 && onPick && (
            <div className="stack">
              <p className="ask__who">Ready-made demos that fit</p>
              <div className="build__ready">
                {suggestion.demos.map((d) => (
                  <button key={d.id} type="button" className="jrow" onClick={() => onPick(d)}>
                    <span className="jrow__main">
                      <strong className="jrow__title">{d.title}</strong>
                      <span className="jrow__outcome">{d.shows}</span>
                    </span>
                    <ArrowRight className="jrow__arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="stack">
            <p className="ask__who">{suggestion.chapters.length ? `This playlist${suggestion.matched.length ? `, because you wrote: ${suggestion.matched.slice(0, 4).join(', ')}` : ''}` : 'Nothing matched those words: pick the chapters yourself'}</p>
            <div className="playlist">
              <ol className="playlist__chosen" data-testid="playlist">
                {playlist.map((id, k) => (
                  <li key={id} className="playlist__item">
                    <span className="jrow__n">{String(k + 1).padStart(2, '0')}</span>
                    <span className="playlist__title">{TOUR_BY_ID[id]?.title}</span>
                    <button type="button" className="icon-btn" onClick={() => move(k, -1)} aria-label={`Move ${TOUR_BY_ID[id]?.title} earlier`} disabled={k === 0}>
                      <ArrowUp />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => move(k, 1)} aria-label={`Move ${TOUR_BY_ID[id]?.title} later`} disabled={k === playlist.length - 1}>
                      <ArrowDown />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => toggle(id)} aria-label={`Remove ${TOUR_BY_ID[id]?.title}`}>
                      <Trash2 />
                    </button>
                  </li>
                ))}
                {!playlist.length && <li className="small muted">No chapters yet. Add them from the list.</li>}
              </ol>
              <div className="playlist__all">
                <span className="xs muted">The story’s chapters</span>
                {TOUR.map((s) => (
                  <label key={s.id} className="row small" style={{ gap: 8 }}>
                    <input type="checkbox" checked={playlist.includes(s.id)} onChange={() => toggle(s.id)} data-testid={`playlist-toggle-${s.id}`} /> {s.n}. {s.title}
                  </label>
                ))}
              </div>
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <input className="input" style={{ width: 240 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name it, e.g. Contoso kickoff" aria-label="Playlist name" />
              <button type="button" className="btn btn--primary" disabled={!playlist.length} onClick={save} data-testid="save-playlist">
                <Save /> Save this demo · about {pathMinutes('custom', playlist)} min
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
