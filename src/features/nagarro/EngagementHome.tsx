// A project's Overview: the two set-up journeys with real progress, the version the client demo
// shows, this project's requests and presentations, and its notes.

import { useState } from 'react'
import { Link } from 'react-router'
import { RotateCcw, History, Plus } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, DemoData, Kv, Panel, Segmented, Stat } from '@/shell/ui'
import { ProcessStrip } from '@/shell/story'
import { usePresentDemo } from '@/shell/present'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { driftItems, health, openPRs, readiness, relTime } from '@/state/selectors'
import { hasUnpublishedChanges, sessionIsStale } from '@/state/scope'
import { IMPROVE_META, IMPROVE_PHASES, improveSlug, improveStepStates, journeySummary, newStepStates } from '@/state/journeyProgress'
import { opportunityProgress } from '@/opportunity/progress'
import { stepMeta } from '@/features/opportunity/steps'
import { practice } from '@/app/routes'

export function EngagementHome() {
  const project = useProject()
  const sys = useSystem()
  const r = usePaths()
  const present = usePresentDemo()
  const [note, setNote] = useState('')
  const dirty = hasUnpublishedChanges(project)
  const stale = sessionIsStale(project)
  const jNew = journeySummary(sys, 'new')
  const jImp = journeySummary(sys, 'improve')
  const newStates = newStepStates(sys)
  const impStates = improveStepStates(sys)
  const requests = Object.values(project.opportunities ?? {}).sort((a, b) => b.updatedAt - a.updatedAt)
  const decks = Object.values(project.decks ?? {}).sort((a, b) => b.builtAt - a.builtAt)
  const nextVersion = (project.published?.version ?? 0) + 1

  // The set-up happens in the DS Starter Pack; the hub records it (or the basics, by hand).
  const basicsByHand = newStates.some((st) => st === 'done') && !jNew.complete
  const newPhases = [
    { title: 'Set up in the Starter Pack', state: jNew.complete ? ('done' as const) : jNew.started ? ('current' as const) : ('todo' as const), to: r.journeyNew() },
    { title: 'Record it in the project', state: jNew.complete ? ('done' as const) : ('todo' as const), to: r.journeyNew() },
  ]
  const impPhases = IMPROVE_PHASES.map((ph) => ({
    title: ph.label,
    text: ph.steps.some((s) => IMPROVE_META[s].specialist) ? 'With a specialist' : undefined,
    state: ph.steps.every((s) => impStates[s] === 'done') ? ('done' as const) : ph.steps.includes(improveSlug(jImp.resume)) && jImp.started ? ('current' as const) : ('todo' as const),
    to: r.journeyImprove(ph.steps.find((s) => impStates[s] !== 'done') ?? ph.steps[0]),
  }))

  return (
    <div className="page">
      <PageHead
        noTabs
        title="Overview"
        lead={`${project.client.name}${project.client.sector ? ` · ${project.client.sector}` : ''}. What is in progress, and what the client demo shows. Next review: ${project.engagement.nextReview}.`}
      />

      <section className="grid grid--2" aria-label="Set-up journeys">
        <Panel title="Start a new design system" actions={<Chip tone={jNew.complete ? 'ok' : jNew.started ? 'info' : 'outline'}>{jNew.complete ? 'Recorded' : jNew.started ? 'In progress' : 'Not started'}</Chip>}>
          <p className="small muted">For a client without a system: set it up in the DS Starter Pack’s own wizard, then record it here.{basicsByHand ? ` Basics recorded by hand: ${jNew.done} of ${jNew.total}.` : ''}</p>
          <ProcessStrip compact numbered={false} steps={newPhases} label="New system phases" />
          <Link className="btn btn--primary btn--sm" to={basicsByHand ? r.journeyNew(jNew.resume) : r.journeyNew()} data-testid="resume-new">
            {jNew.complete ? 'Review the set-up' : jNew.started ? `Resume: ${jNew.resumeLabel.toLowerCase()}` : 'Start'}
          </Link>
        </Panel>
        <Panel title="Improve an existing system" actions={<Chip tone={jImp.complete ? 'ok' : jImp.started ? 'info' : 'outline'}>{jImp.complete ? 'Done' : `${jImp.done} of ${jImp.total} steps done`}</Chip>}>
          <p className="small muted">For a client with a system: goals, a read-only connection, an assessment, and a plan agreed with a specialist.</p>
          <ProcessStrip compact numbered={false} steps={impPhases} label="Improve phases" />
          <Link className="btn btn--primary btn--sm" to={r.journeyImprove(jImp.complete ? 'goals' : improveSlug(jImp.resume))} data-testid="resume-improve">
            {jImp.complete ? 'Review the journey' : jImp.started ? `Resume: ${jImp.resumeLabel.toLowerCase()}` : 'Start'}
          </Link>
        </Panel>
      </section>

      <Panel title="Client demo version">
        <p className="small muted">The client demo always shows the version you last published, so preparing here never changes what a client sees. Update it when your preparation is ready to show.</p>
        <Kv
          rows={[
            ['The demo shows', project.published ? `v${project.published.version} · ${project.published.note} · ${relTime(project.published.publishedAt)}` : 'Nothing yet'],
            ['Your preparation', dirty ? `Has changes since v${project.published?.version ?? 0}` : 'Matches what the demo shows'],
            ['Demo in progress', project.session ? `Started ${relTime(project.session.startedAt)} on v${project.session.baseVersion}${stale ? ' · reset it to show the newer version' : ''}` : 'None'],
          ]}
        />
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {(dirty || !project.published) && (
            <>
              <input className="input" placeholder="What changed? (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1, minWidth: 200 }} aria-label="What changed in this version" />
              <button
                className="btn btn--primary btn--sm"
                onClick={() => {
                  act().publishProject(project.id, note)
                  setNote('')
                }}
                data-testid="update-demo"
              >
                Update the client demo (v{nextVersion})
              </button>
            </>
          )}
          <button className="btn btn--mint btn--sm" onClick={() => present(project.id)} disabled={!project.published} title={project.published ? 'Opens the demo as presenter' : 'Update the client demo first'}>
            Present client demo
          </button>
          {project.published && dirty && (
            <button className="btn btn--ghost btn--sm" onClick={() => act().restoreDraftFromPublished(project.id)} title="Throws away preparation changes and goes back to what the demo shows">
              Discard changes since v{project.published.version}
            </button>
          )}
          {project.session && (
            <button className="btn btn--ghost btn--sm" onClick={() => act().resetDemoSession(project.id)}>
              <RotateCcw /> Reset the demo
            </button>
          )}
        </div>
        <div className="row" style={{ gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <span className="small">Default path when you present:</span>
          <Segmented
            ariaLabel="Default demo path"
            value={project.clientExperience.guidanceDefault === 'full' ? 'full' : 'meeting'}
            options={[
              { id: 'meeting', label: 'Short, about 12 min' },
              { id: 'full', label: 'Full, about 25 min' },
            ]}
            onChange={(v) => act().setClientExperience(project.id, { guidanceDefault: v })}
          />
          <Link className="small" to={r.meeting}>
            Prepare the meeting
          </Link>
        </div>
        {project.versions.length > 0 && (
          <details style={{ marginTop: 12 }}>
            <summary className="small">
              <History style={{ width: 12 }} /> Earlier versions
            </summary>
            <ul className="list">
              {project.versions.map((v) => (
                <li key={v.version} className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">
                    v{v.version} · {v.note} · {relTime(v.publishedAt)}
                  </span>
                  <button className="btn btn--secondary btn--sm" onClick={() => act().rollbackTo(project.id, v.version)}>
                    Show this version again
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Panel>

      <section className="grid grid--2" aria-label="Requests and presentations">
        <Panel
          title="Client requests"
          actions={
            <Link className="btn btn--secondary btn--sm" to={r.opportunityNew}>
              <Plus /> New request
            </Link>
          }
        >
          {requests.length ? (
            <ul className="list">
              {requests.map((o) => {
                const p = opportunityProgress(o)
                return (
                  <li key={o.id}>
                    <Link to={r.opportunity(o.id, p.next ?? 'export')}>{o.title}</Link>
                    <div className="xs muted">
                      {p.done} of {p.total} steps done{p.next ? ` · Next: ${stepMeta(p.next).next.toLowerCase()}` : ''}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="small muted">No requests for this project yet. Start one when the client sends an RFP, a questionnaire or a brief.</p>
          )}
        </Panel>
        <Panel
          title="Presentations"
          actions={
            <Link className="btn btn--secondary btn--sm" to={r.presentationNew}>
              <Plus /> New presentation
            </Link>
          }
        >
          {decks.length ? (
            <ul className="list">
              {decks.map((d) => (
                <li key={d.id}>
                  <Link to={r.presentation(d.id)}>{d.title}</Link>
                  <div className="xs muted">
                    {d.slides.length} slides · built {relTime(d.builtAt)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">No presentations yet. An assessment readout or a project update can start from this project’s data, no request needed.</p>
          )}
        </Panel>
      </section>

      <Panel title="The system at a glance" actions={project.client.fictional ? <DemoData>Sample data · illustrative, not measured</DemoData> : undefined}>
        <div className="grid grid--3">
          <Stat label="Checks passing (health)" value={`${health(sys)}%`} hint={`${driftItems(sys)} places where Figma and code disagree`} />
          <Stat label="Open pull requests" value={String(openPRs(sys).length)} hint={`${sys.changes.filter((c) => c.status === 'draft').length} proposed changes`} />
          <Stat label="AI readiness" value={`${readiness(sys)} / 5`} hint="How well AI tools can read the system" />
        </div>
        <div className="row" style={{ gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <Link className="small" to={r.components}>
            Components and tokens
          </Link>
          <Link className="small" to={r.changes}>
            Findings and changes
          </Link>
          <Link className="small" to={r.report}>
            Assessment report
          </Link>
        </div>
      </Panel>

      <div className="grid grid--2">
        <Panel title="Notes">
          <textarea className="input" rows={4} value={project.engagement.notes} onChange={(e) => act().updateEngagement(project.id, { notes: e.target.value })} aria-label="Project notes" placeholder="Anything colleagues should know: contacts, constraints, decisions." />
          {project.engagement.needsSpecialist && <p className="small" style={{ color: '#9a6412' }}>Needs a specialist: {project.engagement.needsSpecialist}</p>}
          <p className="xs muted">Notes stay internal. They never appear in the client demo.</p>
        </Panel>
        <Panel title="Activity">
          <ul className="list">
            {project.activity.slice(0, 8).map((e) => (
              <li key={e.id} className="small">
                {e.text} · <span className="muted">{e.actor} · {relTime(e.ts)}</span>
              </li>
            ))}
            {!project.activity.length && <li className="muted small">Nothing yet.</li>}
          </ul>
          <Link className="small" to={practice.opportunitiesFor(project.slug)}>
            All requests for {project.client.name}
          </Link>
        </Panel>
      </div>
    </div>
  )
}
