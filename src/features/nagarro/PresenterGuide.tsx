// Client demo › Prepare a meeting. Choose which system to show and how long to take, rehearse the
// script, open the private notes window, then present. Everything the client sees happens in the
// client demo; this page is internal.

import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CheckSquare, MonitorPlay, NotebookPen, Square } from 'lucide-react'
import { useStore } from '@/state/store'
import { practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Panel, Segmented } from '@/shell/ui'
import { ProcessStrip } from '@/shell/story'
import { usePresentDemo, demoScenario } from '@/shell/present'
import { TOUR, pathFor, PATH_MINUTES } from '@/features/demo/steps'
import { PRESENTER_NOTES } from '@/internal/presenterNotes'

const PACKAGES = [
  { name: '2-week AI audit', dur: '2 weeks', when: 'A system exists but nobody knows how consistent it is, or AI output looks generic.', leaves: 'An assessment, a baseline and one component made readable by AI tools.' },
  { name: 'DS Build', dur: '12–20 weeks', when: 'No system yet, or one too broken to build on.', leaves: 'Repository, Figma library, checks, files for AI tools, a handover.' },
  { name: 'DS Accelerate', dur: '8–14 weeks', when: 'A system worth keeping that has drifted and that AI tools cannot read well.', leaves: 'The system contract, fixed differences, files for AI tools, a named owner.' },
  { name: 'DS Scale', dur: '16–24 weeks', when: 'Many brands or products, a migration ahead.', leaves: 'Token structure for several brands and a migration plan.' },
  { name: 'Support', dur: 'ongoing', when: 'After handover, to keep the system from drifting.', leaves: 'Regular reviews and upgrades.' },
]

const BEFORE_THE_MEETING = [
  'Know the client’s stack. The demo assumes React, JSON tokens and Figma variables; say what else would need a specialist.',
  'Decide which chapter matters most for this client and rehearse it once.',
  'Have a view on who could own their system; the outcome chapter asks for it.',
  'Pick the next step to propose: usually the 2-week AI audit.',
  'Open your notes window on your own screen and share only the demo tab.',
]

export function PresenterGuide() {
  const [params, setParams] = useSearchParams()
  const projects = useStore((s) => s.projects)
  const present = usePresentDemo()
  const scenario = demoScenario(projects, Object.values(projects).find((p) => p.slug === params.get('project'))?.id)
  const [mode, setMode] = useState<'meeting' | 'full'>(scenario?.clientExperience.guidanceDefault === 'full' ? 'full' : 'meeting')
  const [done, setDone] = useState<Record<number, boolean>>({})
  const path = pathFor(mode)
  const minutes = path.reduce((n, c) => n + (PRESENTER_NOTES[c.id]?.minutes ?? 2), 0)

  return (
    <div className="page">
      <PageHead
        title="Prepare a meeting"
        lead="Choose which system to show and how long to take, rehearse the story, then present. The client only ever sees the client demo; your notes stay in a separate window."
        actions={
          <>
            {scenario && (
              <button className="btn btn--secondary" onClick={() => window.open(practice.presenterNotes(scenario.slug), 'ds-presenter-notes', 'width=520,height=760')} data-testid="prep-open-notes">
                <NotebookPen /> Open presenter notes
              </button>
            )}
            <button className="btn btn--mint" onClick={() => present(scenario?.id, { guide: mode })} disabled={!scenario} data-testid="prep-present">
              <MonitorPlay /> Start presenting
            </button>
          </>
        }
      />

      <div className="grid grid--2">
        <Panel title="Which system to show">
          <select
            className="select"
            value={scenario?.slug ?? ''}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.set('project', e.target.value)
              setParams(next, { replace: true })
            }}
            aria-label="System to show"
          >
            {Object.values(projects).map((p) => (
              <option key={p.id} value={p.slug} disabled={!p.published}>
                {p.client.name}
                {p.client.fictional ? ' (sample)' : ''}
                {p.published ? '' : ' · no client demo version yet'}
              </option>
            ))}
          </select>
          <p className="small muted">Demo Brand is built for first meetings. Another project shows its own last published version.</p>
        </Panel>
        <Panel title="How long">
          <Segmented
            ariaLabel="Demo path"
            value={mode}
            options={[
              { id: 'meeting', label: `Short · about ${PATH_MINUTES.meeting} min` },
              { id: 'full', label: `Full · about ${PATH_MINUTES.full} min` },
            ]}
            onChange={setMode}
          />
          <p className="small muted">The short path skips the assessment and the review in Figma; the demo sets them up for you if you open those chapters anyway. This path adds up to about {minutes} minutes of talking.</p>
        </Panel>
      </div>

      <ProcessStrip label="The story" steps={path.map((c) => ({ title: c.title, text: PRESENTER_NOTES[c.id] ? `about ${PRESENTER_NOTES[c.id].minutes} min` : undefined }))} />

      <Panel title="The script" flush>
        <div className="table-wrap">
          <table className="table table--script">
            <thead>
              <tr>
                <th>Chapter</th>
                <th>The client sees</th>
                <th>You say</th>
                <th>Points to make</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {TOUR.map((c) => {
                const note = PRESENTER_NOTES[c.id]
                const inPath = path.includes(c)
                return (
                  <tr key={c.id} className={inPath ? undefined : 'is-muted'}>
                    <td>
                      <span className="kicker__n">{String(c.n).padStart(2, '0')}</span> <strong>{c.title}</strong>
                      <div className="xs muted">{inPath ? `about ${note?.minutes ?? 2} min` : 'Full path only'}</div>
                    </td>
                    <td className="small">
                      {c.headline.before}
                      <span className="em-hl">{c.headline.hl}</span>
                      {c.headline.after}
                    </td>
                    <td className="small">
                      {note?.say}
                      {note?.action && <div className="xs muted">On screen: {note.action}</div>}
                    </td>
                    <td className="small muted">
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {note?.points.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="num">
                      <button className="btn btn--ghost btn--sm" onClick={() => present(scenario?.id, { guide: mode, chapter: c.id })} disabled={!scenario} title="Opens the demo at this chapter, with everything before it set up">
                        Rehearse
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid--side">
        <Panel title="Which engagement to propose next" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>When it fits</th>
                  <th>What the client keeps</th>
                </tr>
              </thead>
              <tbody>
                {PACKAGES.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="xs muted">{p.dur}</div>
                    </td>
                    <td className="small">{p.when}</td>
                    <td className="small muted">{p.leaves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Before the meeting" tight>
          <div className="stack" style={{ gap: 4 }}>
            {BEFORE_THE_MEETING.map((t, i) => (
              <button key={t} className="row small" style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '6px 0', color: 'inherit', alignItems: 'flex-start' }} onClick={() => setDone({ ...done, [i]: !done[i] })} aria-pressed={Boolean(done[i])}>
                {done[i] ? <CheckSquare style={{ width: 16, color: 'var(--n-ok)', flexShrink: 0 }} /> : <Square style={{ width: 16, color: 'var(--n-fg-subtle)', flexShrink: 0 }} />}
                <span style={{ textDecoration: done[i] ? 'line-through' : undefined, color: done[i] ? 'var(--n-fg-muted)' : undefined }}>{t}</span>
              </button>
            ))}
          </div>
          <span className="xs muted">This checklist is not saved.</span>
        </Panel>
      </div>
    </div>
  )
}
