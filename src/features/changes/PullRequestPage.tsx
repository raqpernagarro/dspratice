import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowRight, Check, ExternalLink, GitMerge, Figma, X } from 'lucide-react'
import { ensureChecksRunning, useStore } from '@/state/store'
import { act, usePaths, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, CheckIcon, Chip, Code, Kv, Panel, SimBadge } from '@/shell/ui'
import { relTime, roleOf } from '@/state/selectors'

export function PullRequestPage() {
  const { n } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const actingAs = useStore((x) => effectiveActingAs(x, scope))
  const pr = sys.pullRequests.find((p) => p.number === Number(n))

  useEffect(() => {
    if (pr) ensureChecksRunning(pr.number)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pr?.number, pr?.status])

  if (!pr) return <div className="empty">Pull request not found.</div>
  const change = sys.changes.find((c) => c.id === pr.changeId)
  const cs = pr.figmaChangeSetId ? sys.figmaChangeSets.find((c) => c.id === pr.figmaChangeSetId) : undefined
  const role = roleOf(sys, actingAs)
  const allPass = pr.checks.every((c) => c.status === 'pass')
  const running = pr.checks.some((c) => c.status === 'running' || c.status === 'queued')
  const canMerge = role === 'owner' && allPass && (pr.status === 'waiting_review' || pr.status === 'approved')

  const body = `## Summary
${change?.title ?? pr.title}

## Token changes
${(change?.tokenChanges ?? []).map((tc) => `- \`${sys.tokens.find((t) => t.id === tc.tokenId)?.cssName}\` (${tc.mode}): ${tc.from} → ${tc.to}`).join('\n') || '- none'}

## Guidance changes
${(change?.guidanceChanges ?? []).map((g) => `- ${sys.components.find((c) => c.id === g.componentId)?.name} · ${g.field}`).join('\n') || '- none'}

## Also used by
${(change?.impact.componentIds ?? []).map((id) => sys.components.find((c) => c.id === id)?.name).join(', ') || '-'}

## Figma
${cs ? `Change set "${cs.title}" (${cs.rows.length} rows) · ${cs.status}` : 'no Figma change'}
`

  return (
    <div className="page">
      <PageHead
        screen="pr"
        crumbs={[{ label: 'Changes', to: r.changes }, { label: `Pull request #${pr.number}` }]}
        title={`#${pr.number} · ${pr.title}`}
        lead={`${pr.branch} → ${pr.base} · opened from the ${pr.openedFrom} ${relTime(pr.createdAt)}`}
        eyebrow={<Chip tone={pr.status === 'merged' ? 'ai' : pr.status === 'waiting_review' || pr.status === 'approved' ? 'ok' : pr.status === 'changes_requested' ? 'warn' : pr.status === 'closed' ? 'outline' : 'info'}>{pr.status.replace('_', ' ')}</Chip>}
        actions={
          <>
            <Btn variant="secondary" onClick={() => act().pushToast({ kind: 'sim', title: 'No GitHub behind this demo', detail: 'The pull request exists in local state only. In DSN, customize → PR opens github.com/… via the gh CLI (local dev only).' })}>
              <ExternalLink /> Open in GitHub
            </Btn>
            {cs && (
              <Btn onClick={() => navigate(r.prFigma(pr.number))} variant={cs.status === 'applied' ? 'secondary' : 'primary'}>
                <Figma /> {cs.status === 'applied' ? 'Figma review (applied)' : 'Open Figma review'}
              </Btn>
            )}
          </>
        }
      />

      <div className="grid grid--side">
        <div className="stack">
          <div data-demo-focus="checks-list">
          <Panel title="Checks" actions={<SimBadge what="Checks run on timers" detail="No CI runs. Results derive from state: parity fails until the Figma change set is applied." />}>
            <div className="list">
              {pr.checks.map((c) => (
                <div key={c.id} className="list__item">
                  <CheckIcon status={c.status} />
                  <div className="list__body">
                    <span className="list__title">
                      {c.name}
                      {c.score !== undefined && `: ${c.score}%`}
                      {c.gate !== undefined && <span className="muted"> (gate {c.gate}%)</span>}
                    </span>
                    <span className="list__meta">{c.status === 'queued' ? 'Queued' : c.status === 'running' ? 'Running…' : c.detail}</span>
                  </div>
                </div>
              ))}
            </div>
            {pr.status === 'changes_requested' && cs && cs.status !== 'applied' && (
              <Callout tone="warn">
                Parity fails because Figma still holds the old value. Apply the change set in the{' '}
                <Link to={r.prFigma(pr.number)}>3-way review</Link>; the check re-runs on its own.
              </Callout>
            )}
          </Panel>
          </div>

          <Panel title="Description" tight>
            <Code light>{body}</Code>
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Reviewers" tight>
            <Kv
              rows={pr.reviewers.map((rv) => {
                const p = sys.people.find((x) => x.id === rv.personId)
                return [
                  <span key="k">
                    {p?.role === 'owner' ? 'design system owner' : 'one product designer'} {rv.required && <Chip tone="outline">required</Chip>}
                  </span>,
                  rv.state === 'approved' ? <Chip tone="ok">approved</Chip> : <Chip tone="warn">pending</Chip>,
                ]
              })}
            />
          </Panel>

          <Panel tight>
            {pr.status === 'merged' ? (
              <Callout tone="ok">
                Merged {pr.mergedAt ? relTime(pr.mergedAt) : ''}. Channels are stale until published.{' '}
                <Link to={r.channels}>Publish channels →</Link>
              </Callout>
            ) : pr.status === 'closed' ? (
              <Callout tone="default">Closed without merging.</Callout>
            ) : (
              <>
                {running && <Callout tone="info">Checks are running…</Callout>}
                {!running && allPass && pr.status === 'waiting_review' && <Callout tone="ok">Waiting for review. All 5 checks pass.</Callout>}
                {role === 'owner' ? (
                  <>
                    {pr.status === 'waiting_review' && (
                      <Btn variant="secondary" onClick={() => act().approvePR(pr.number)}>
                        <Check /> Approve
                      </Btn>
                    )}
                    <Btn disabled={!canMerge} onClick={() => act().mergePR(pr.number)} title={!allPass ? 'All checks must pass' : undefined}>
                      <GitMerge /> Merge into main
                    </Btn>
                  </>
                ) : (
                  <>
                    <Btn variant="secondary" onClick={() => act().requestMerge(pr.number)}>
                      Request merge from the owner
                    </Btn>
                    <span className="xs muted">You can propose. Merging needs the design system owner. Switch “acting as” to see the owner view.</span>
                  </>
                )}
                <Btn variant="ghost" size="sm" onClick={() => act().closePR(pr.number)}>
                  <X /> Close without merging
                </Btn>
              </>
            )}
          </Panel>

          {pr.findingIds.length > 0 && (
            <Panel tight title="Resolves">
              {pr.findingIds.map((fid) => (
                <Link key={fid} to={r.finding(fid)} className="small row">
                  {sys.findings.find((f) => f.id === fid)?.title} <ArrowRight style={{ width: 12 }} />
                </Link>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
