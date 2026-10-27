// A project's Overview: the system at a glance, then what to do next in one list (the set-up step,
// open findings, agent suggestions to decide, files AI tools read, the release check), then one row
// to show it to the client. The AI tab's useful parts live here now; the full metrics are on Report.

import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Check, X } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Chip, DemoData, Panel, Stat } from '@/shell/ui'
import { usePresentDemo } from '@/shell/present'
import { useStore } from '@/state/store'
import { act, usePaths, useProject, useScope, useSystem } from '@/state/hooks'
import { driftItems, health, lastEval, openFindings, readiness, roleOf, staleChannels } from '@/state/selectors'
import { effectiveActingAs, hasUnpublishedChanges } from '@/state/scope'
import { improveSlug, journeySummary } from '@/state/journeyProgress'

const SEV: Record<string, number> = { error: 0, warn: 1, info: 2 }

function NextRow({ kind, title, detail, children }: { kind: string; title: React.ReactNode; detail?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <li className="next-row">
      <Chip tone="outline">{kind}</Chip>
      <span className="next-row__main">
        <strong>{title}</strong>
        {detail && <span className="small muted">{detail}</span>}
      </span>
      <span className="next-row__actions">{children}</span>
    </li>
  )
}

export function EngagementHome() {
  const project = useProject()
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const ui = useStore((x) => x.ui)
  const present = usePresentDemo()
  const [published, setPublished] = useState<number | null>(null)
  const dirty = hasUnpublishedChanges(project)
  const jNew = journeySummary(sys, 'new')
  const jImp = journeySummary(sys, 'improve')
  const byHand = jNew.complete && !sys.journey.new?.data?.recorded
  const findings = openFindings(sys).sort((a, b) => (SEV[a.severity] ?? 3) - (SEV[b.severity] ?? 3)).slice(0, 3)
  const suggestions = sys.agentProposals.filter((p) => p.status === 'pending')
  const canDecide = ['owner', 'contributor'].includes(roleOf(sys, effectiveActingAs({ ui }, scope)) ?? '')
  const stale = staleChannels(sys)
  const ev = lastEval(sys)
  const evalBelow = ev && ev.onSystem < ev.gate

  // A row per set-up journey that has started; both offers when neither has.
  const setups = [
    jNew.started && {
      key: 'new',
      title: jNew.complete ? (byHand ? 'Basics entered by hand' : 'Set up in the Starter Pack') : 'New design system: in progress',
      detail: jNew.complete ? 'Recorded in this project.' : jNew.done > 0 ? `Basics by hand: ${jNew.done} of ${jNew.total}` : 'Step 1 of 2 · Set it up in the Starter Pack, then bring it in here.',
      to: jNew.complete || jNew.done === 0 ? r.journeyNew() : r.journeyNew(jNew.resume),
      cta: jNew.complete ? 'Review' : jNew.done > 0 ? `Resume: ${jNew.resumeLabel.toLowerCase()}` : 'Resume',
      testid: 'resume-new',
    },
    jImp.started && {
      key: 'improve',
      title: jImp.complete ? 'Improve journey done' : 'Improve the system',
      detail: jImp.complete ? 'Review it any time.' : `${jImp.done} of ${jImp.total} steps done`,
      to: r.journeyImprove(jImp.complete ? 'goals' : improveSlug(jImp.resume)),
      cta: jImp.complete ? 'Review' : `Resume: ${jImp.resumeLabel.toLowerCase()}`,
      testid: 'resume-improve',
    },
  ].filter((x): x is Exclude<typeof x, false> => Boolean(x))

  return (
    <div className="page">
      <PageHead noTabs title="Overview" lead={`${project.client.name}${project.client.sector ? ` · ${project.client.sector}` : ''}. How the system is doing and what to do next.`} />

      <Panel title="The system at a glance" actions={<><DemoData>Sample figures</DemoData><Link to={r.report} className="small">Full report →</Link></>}>
        <div className="grid grid--3">
          <Stat label="Checks passing" value={`${health(sys)}%`} hint="Automated checks on tokens, components and AI files" />
          <Stat label="Figma and code differ" value={driftItems(sys)} hint={<Link to={r.changes}>See what differs</Link>} tone={driftItems(sys) > 0 ? 'warn' : undefined} />
          <Stat label="Readable by AI tools" value={`${readiness(sys)} / 5`} hint="How much AI tools can read without guessing" />
        </div>
      </Panel>

      <Panel title="What to do next">
        <ul className="next-list" data-testid="next-list">
          {setups.length ? (
            setups.map((st) => (
              <NextRow key={st.key} kind="Set-up" title={st.title} detail={st.detail}>
                <Link className="btn btn--primary btn--sm" to={st.to} data-testid={st.testid}>
                  {st.cta} <ArrowRight />
                </Link>
              </NextRow>
            ))
          ) : (
            <NextRow kind="Set-up" title="Not started" detail="New client without a system, or a system that exists already?">
              <Link className="btn btn--primary btn--sm" to={r.journeyNew()} data-testid="resume-new">
                Start a design system
              </Link>
              <Link className="btn btn--secondary btn--sm" to={r.journeyImprove('goals')} data-testid="resume-improve">
                Improve one
              </Link>
            </NextRow>
          )}
          {findings.map((f) => (
            <NextRow key={f.id} kind={f.severity === 'error' ? 'Fix' : 'Check'} title={f.title} detail={f.summary}>
              <Link className="btn btn--secondary btn--sm" to={r.finding(f.id)}>
                Review
              </Link>
            </NextRow>
          ))}
          {suggestions.map((p) => (
            <NextRow key={p.id} kind="AI suggestion" title={p.title} detail={`${p.description} · from the ${p.agent} agent`}>
              <button className="btn btn--primary btn--sm" onClick={() => act().decideProposal(p.id, 'approve')} disabled={!canDecide} data-testid={`approve-${p.id}`}>
                <Check /> Approve
              </button>
              <button className="btn btn--secondary btn--sm" onClick={() => act().decideProposal(p.id, 'reject')} disabled={!canDecide}>
                <X /> Reject
              </button>
            </NextRow>
          ))}
          {stale.length > 0 && (
            <NextRow kind="AI files" title={`${stale.length} file${stale.length > 1 ? 's' : ''} AI tools read ${stale.length > 1 ? 'are' : 'is'} out of date`} detail="They are generated from the system contract. Simulated: nothing is uploaded.">
              <button className="btn btn--secondary btn--sm" onClick={() => act().publishChannels()}>
                Update
              </button>
            </NextRow>
          )}
          {evalBelow && (
            <NextRow kind="AI check" title={`AI output stays on the system ${ev.onSystem}% of the time (target ${ev.gate}%)`} detail="Run the release check again after a fix.">
              <button className="btn btn--secondary btn--sm" onClick={() => act().runReleaseEval()}>
                Run the check
              </button>
            </NextRow>
          )}
          {!findings.length && !suggestions.length && !stale.length && !evalBelow && setups.length > 0 && (
            <li className="small muted">Nothing else waiting. Figma and code agree.</li>
          )}
        </ul>
      </Panel>

      <Panel title="Show it to the client">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="small muted" style={{ flex: 1, minWidth: 220 }}>
            {project.published ? (dirty ? `The client demo shows version ${project.published.version}; this project has changed since.` : `The client demo shows the latest version (${project.published.version}).`) : 'No client demo version yet: update it to show this project.'}
            {published ? ` Version ${published} is ready.` : ''}
          </span>
          {(dirty || !project.published) && (
            <button className="btn btn--secondary btn--sm" onClick={() => setPublished(act().publishProject(project.id))} data-testid="update-demo">
              Update the client demo
            </button>
          )}
          {project.published && (
            <button className="btn btn--mint btn--sm" onClick={() => present(project.id)} data-testid="overview-present">
              Present
            </button>
          )}
        </div>
      </Panel>
    </div>
  )
}
