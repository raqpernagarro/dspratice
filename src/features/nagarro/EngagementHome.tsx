// The engagement page: record, status of draft vs published, demo session, journeys, actions.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ExternalLink, RotateCcw, Presentation, History } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Kv, Panel, SimBadge, Stat } from '@/shell/ui'
import { act, usePaths, useProject, useSystem } from '@/state/hooks'
import { driftItems, health, openPRs, readiness, relTime } from '@/state/selectors'
import { hasUnpublishedChanges, sessionIsStale } from '@/state/scope'
import { ALL_CHAPTERS } from '@/fixtures/projects'
import { TOUR_BY_ID } from '@/features/demo/steps'
import { practice } from '@/app/routes'

const CHAPTER_TITLES: Record<string, string> = Object.fromEntries(ALL_CHAPTERS.map((id) => [id, TOUR_BY_ID[id]?.title ?? id]))

export function EngagementHome() {
  const project = useProject()
  const sys = useSystem()
  const r = usePaths()
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const dirty = hasUnpublishedChanges(project)
  const stale = sessionIsStale(project)
  const openClient = () => {
    const to = act().openClientExperience(project.id)
    if (to) navigate(to)
  }
  const jnew = sys.journey.new
  const jimp = sys.journey.improve

  return (
    <div className="page">
      <PageHead
        title={project.client.name}
        lead={`${project.engagement.package} · ${project.engagement.stage} · next review ${project.engagement.nextReview} · ${project.client.sector}`}
        eyebrow={<SimBadge detail="Sample data · fictional client" />}
        crumbs={[{ label: 'Clients and engagements', to: practice.clients }, { label: project.client.name }]}
        actions={
          <>
            <button className="btn btn--mint" onClick={openClient} disabled={!project.published} title={project.published ? 'Open the published client experience as a presenter' : 'Publish first'}>
              <ExternalLink /> Open client experience
            </button>
          </>
        }
      />

      <div className="grid grid--4">
        <Stat label="Health" value={`${health(sys)}%`} hint={`${driftItems(sys)} drift items`} />
        <Stat label="Open pull requests" value={String(openPRs(sys).length)} hint={`${sys.changes.filter((c) => c.status === 'draft').length} draft changes`} />
        <Stat label="AI readiness" value={`${readiness(sys)} / 5`} hint="simulated score" />
        <Stat label="Published" value={project.published ? `v${project.published.version}` : '—'} hint={project.published ? relTime(project.published.publishedAt) : 'nothing published yet'} />
      </div>

      <div className="grid grid--2">
        <Panel title="Draft and published">
          <p className="muted small">Internal edits land in the draft and show in your private preview at once. The client experience shows the published version only.</p>
          <Kv rows={[
            ['Draft', dirty ? `ahead of ${project.published ? `v${project.published.version}` : 'nothing published'}` : 'matches the published version'],
            ['Published', project.published ? `v${project.published.version} · ${project.published.note} · by ${project.published.publishedBy}` : '—'],
            ['Demo session', project.session ? `running on v${project.session.baseVersion}${stale ? ' · a newer version is published' : ''}` : 'none'],
          ]} />
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <input className="input" placeholder="What changed in this version?" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <button
              className="btn btn--primary btn--sm"
              disabled={!dirty && Boolean(project.published)}
              onClick={() => {
                act().publishProject(project.id, note)
                setNote('')
              }}
            >
              Publish {project.published ? `v${project.published.version + 1}` : 'v1'}
            </button>
            {project.published && dirty && (
              <button className="btn btn--secondary btn--sm" onClick={() => act().restoreDraftFromPublished(project.id)} title="Discard draft changes and return to the published version">
                Discard draft changes
              </button>
            )}
            {project.session && (
              <button className="btn btn--secondary btn--sm" onClick={() => act().resetDemoSession(project.id)}>
                <RotateCcw /> Reset demo session
              </button>
            )}
          </div>
          {project.versions.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary className="small">
                <History style={{ width: 12 }} /> Previous versions
              </summary>
              <ul className="list">
                {project.versions.map((v) => (
                  <li key={v.version} className="row" style={{ justifyContent: 'space-between' }}>
                    <span>
                      v{v.version} · {v.note} · {relTime(v.publishedAt)}
                    </span>
                    <button className="btn btn--secondary btn--sm" onClick={() => act().rollbackTo(project.id, v.version)}>
                      Roll back
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Panel>

        <Panel title="Client experience">
          <label className="toggle">
            <input type="checkbox" checked={project.clientExperience.enabled} onChange={(e) => act().setClientExperience(project.id, { enabled: e.target.checked })} /> Enabled for the client
          </label>
          <p className="muted small">Chapters shown in the guided walkthrough:</p>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {ALL_CHAPTERS.map((id) => (
              <label key={id} className="toggle xs">
                <input type="checkbox" checked={project.clientExperience.chapters[id] !== false} onChange={(e) => act().setClientChapter(project.id, id, e.target.checked)} /> {CHAPTER_TITLES[id]}
              </label>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn--secondary btn--sm" to={r.meeting}>
              <Presentation /> Prepare the meeting
            </Link>
            <Link className="btn btn--secondary btn--sm" to={`/share/${project.slug}`}>
              Read-only share link
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid grid--2">
        <Panel title="Start a new system">
          <p className="muted small">Goals, foundations, branding, typography, modes, density, real components, outputs, review, publish.</p>
          <Kv rows={[['Progress', jnew.completedAt ? 'completed' : jnew.visited.length ? `step ${jnew.currentStep} of 10` : 'not started']]} />
          <Link className="btn btn--primary btn--sm" to={r.journeyNew(jnew.visited.length ? jnew.currentStep : 1)}>
            {jnew.visited.length && !jnew.completedAt ? `Resume at step ${jnew.currentStep}` : jnew.completedAt ? 'Review the journey' : 'Start'}
          </Link>
        </Panel>
        <Panel title="Improve an existing system">
          <p className="muted small">Context, connect, inventory, assessment, inconsistencies, priorities, mappings and fixes, review, publish.</p>
          <Kv rows={[['Progress', jimp.completedAt ? 'completed' : jimp.visited.length ? `step ${jimp.currentStep} of 9` : sys.journey.scan.status === 'done' ? 'assessment done' : 'not started']]} />
          <Link className="btn btn--primary btn--sm" to={r.journeyImprove(jimp.visited.length ? jimp.currentStep : 2)}>
            {jimp.visited.length && !jimp.completedAt ? `Resume at step ${jimp.currentStep}` : 'Start'}
          </Link>
        </Panel>
      </div>

      <Panel title="Engagement notes">
        <textarea className="input" rows={3} value={project.engagement.notes} onChange={(e) => act().updateEngagement(project.id, { notes: e.target.value })} />
        {project.engagement.needsSpecialist && <p className="small" style={{ color: 'var(--n-amber, #b7791f)' }}>Specialist: {project.engagement.needsSpecialist}</p>}
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
      </Panel>
    </div>
  )
}
