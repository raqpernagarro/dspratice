// Demos › Prepare a client meeting: pick the client and the meeting, then make what you need, one
// thing at a time: a presentation, a demo, your notes, and the follow-up afterwards. Outcomes, not a
// script. Everything the client sees happens in the client demo; this page is internal.

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Check, MonitorPlay, NotebookPen } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Panel, Segmented } from '@/shell/ui'
import { usePresentDemo, demoScenario, storyFits } from '@/shell/present'
import { TOUR_BY_ID, pathFor } from '@/features/demo/steps'
import { MINI_DEMOS, type MiniDemo } from '@/fixtures/demos'
import { DemoBuilder } from '@/features/demos/DemoBuilder'

type Meeting = 'first' | 'follow-up' | 'workshop'
const MEETINGS: { id: Meeting; label: string; demo: string; hint: string }[] = [
  { id: 'first', label: 'First meeting', demo: 'meeting-story', hint: 'The short story: the problem, one fix, AI on the system, what you keep.' },
  { id: 'follow-up', label: 'Follow-up', demo: 'fix-travels', hint: 'Go deeper on one thing: a fix from Figma to code.' },
  { id: 'workshop', label: 'Workshop', demo: 'full-story', hint: 'Every chapter, for designers and engineers together.' },
]

function chaptersOf(d: MiniDemo): string[] {
  return d.chapters ?? (d.story ? pathFor(d.story).map((s) => s.id) : [])
}

function Outcome({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <li className={`outcome${done ? ' is-done' : ''}`} data-testid={`outcome-${n}`}>
      <span className="outcome__n" aria-hidden="true">
        {done ? <Check /> : n}
      </span>
      <div className="outcome__body">
        <strong>{title}</strong>
        {children}
      </div>
    </li>
  )
}

export function PresenterGuide() {
  const [params, setParams] = useSearchParams()
  const projects = useStore((s) => s.projects)
  const present = usePresentDemo()
  const scenario = demoScenario(projects, Object.values(projects).find((p) => p.slug === params.get('project'))?.id)
  const published = Object.values(projects).filter((p) => p.published)
  const [meeting, setMeeting] = useState<Meeting>('first')
  const [building, setBuilding] = useState(false)
  const m = MEETINGS.find((x) => x.id === meeting)!
  const recommended = MINI_DEMOS.find((d) => d.id === m.demo)!
  const decks = scenario ? Object.values(scenario.decks ?? {}).sort((a, b) => b.builtAt - a.builtAt) : []
  const playlists = scenario?.clientExperience.playlists ?? []
  const demo = playlists[0]
  const fits = storyFits(scenario)

  const pickDemo = (d: MiniDemo) => {
    if (!scenario) return
    const chapters = chaptersOf(d)
    if (!chapters.length) return
    act().setClientExperience(scenario.id, { playlists: [{ id: `pl-${Date.now().toString(36)}`, name: d.title, chapters, savedAt: Date.now() }, ...playlists] })
    setBuilding(false)
  }
  const start = () => (demo && fits ? present(scenario?.id, { guide: 'custom', chapters: demo.chapters }) : present(scenario?.id, { guide: 'meeting' }))

  return (
    <div className="page">
      <PageHead
        title="Prepare a client meeting"
        lead="Pick the client and the meeting, then make what you need, one thing at a time."
        actions={
          <button className="btn btn--mint" onClick={start} disabled={!scenario} data-testid="prep-present">
            <MonitorPlay /> Present
          </button>
        }
      />

      <Panel title="The meeting">
        <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="row small" style={{ gap: 8 }}>
            <span className="muted">Client</span>
            <select className="select" style={{ width: 'auto' }} value={scenario?.slug ?? ''} onChange={(e) => setParams({ project: e.target.value })} aria-label="Client" data-testid="prep-project">
              {published.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.client.name}
                  {p.client.fictional ? ' (fictional)' : ''}
                </option>
              ))}
            </select>
          </label>
          <Segmented ariaLabel="Meeting" value={meeting} onChange={setMeeting} options={MEETINGS.map((x) => ({ id: x.id, label: x.label }))} />
        </div>
        {scenario && !fits && <p className="small" style={{ color: 'var(--n-warn)', margin: '10px 0 0' }}>{scenario.client.name}’s demo version can be explored, not narrated: the story chapters run on Demo Brand.</p>}
      </Panel>

      {scenario && (
        <ol className="outcomes">
          <Outcome n={1} title="A presentation" done={decks.length > 0}>
            {decks.length ? (
              <p className="small muted">
                Ready: <Link to={practice.deck(decks[0].id)}>{decks[0].title}</Link>, {decks[0].slides.length} slides.
              </p>
            ) : (
              <p className="small muted">A Nagarro deck from {scenario.client.name}’s project, built in one click on the master slides.</p>
            )}
            <Link className="btn btn--secondary btn--sm" to={`${practice.deckNew}?project=${scenario.slug}&kind=project&structure=${meeting === 'follow-up' ? 'update' : 'readout'}`} data-testid="prep-build-deck">
              {decks.length ? 'Build another' : 'Build it'}
            </Link>
          </Outcome>

          <Outcome n={2} title="A demo" done={Boolean(demo)}>
            {demo ? (
              <p className="small muted">
                Ready: <strong>{demo.name}</strong>, {demo.chapters.map((c) => TOUR_BY_ID[c]?.title).filter(Boolean).join(' → ')}.
              </p>
            ) : (
              <p className="small muted">
                For a {m.label.toLowerCase()}: <strong>{recommended.title}</strong>. {m.hint}
              </p>
            )}
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {!demo && (
                <button className="btn btn--secondary btn--sm" onClick={() => pickDemo(recommended)} data-testid="prep-use-demo">
                  Use this demo
                </button>
              )}
              <button className="btn btn--ghost btn--sm" onClick={() => setBuilding(!building)} data-testid="prep-build-demo">
                {building ? 'Close' : demo ? 'Build a different one' : 'Build my own'}
              </button>
            </div>
            {building && <DemoBuilder project={scenario} onSaved={() => setBuilding(false)} onPick={pickDemo} />}
          </Outcome>

          <Outcome n={3} title="Your notes" done={false}>
            <p className="small muted">What to say in each chapter, in a window only you see. It follows the demo as you present.</p>
            <button className="btn btn--secondary btn--sm" onClick={() => window.open(practice.presenterNotes(scenario.slug), 'ds-presenter-notes', 'width=520,height=760')} data-testid="prep-open-notes">
              <NotebookPen /> Open my notes
            </button>
          </Outcome>

          <Outcome n={4} title="After the meeting" done={false}>
            <p className="small muted">A short readout for {scenario.client.name}: what we saw, what we recommend, the next step.</p>
            <Link className="btn btn--ghost btn--sm" to={`${practice.deckNew}?project=${scenario.slug}&kind=project&structure=readout`}>
              Build the follow-up
            </Link>
          </Outcome>
        </ol>
      )}
    </div>
  )
}
