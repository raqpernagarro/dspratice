import { Link, useNavigate, useParams } from 'react-router'
import { ArrowRight, Check, History, Undo2 } from 'lucide-react'
import { act, usePaths, useScope, useSystem } from '@/state/hooks'
import { jobKey } from '@/state/scope'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel, SimBadge, Swatch } from '@/shell/ui'
import { isRunning } from '@/state/sim'

export function FigmaReviewPage() {
  const { n, id } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const pr = n ? sys.pullRequests.find((p) => p.number === Number(n)) : undefined
  const cs = id ? sys.figmaChangeSets.find((c) => c.id === id) : pr?.figmaChangeSetId ? sys.figmaChangeSets.find((c) => c.id === pr.figmaChangeSetId) : undefined
  if (!cs) return <div className="empty">There is no Figma change here.</div>
  const included = cs.rows.filter((row) => row.include).length
  const conflicts = cs.rows.filter((row) => row.status === 'both').length
  const hasMemory = true
  const applying = cs.status === 'version_saved' || isRunning(jobKey(scope, `apply-${cs.id}`))

  return (
    <div className="page">
      <PageHead
       
        crumbs={[{ label: 'Findings and changes', to: r.changes }, ...(pr ? [{ label: `Pull request #${pr.number}`, to: r.pr(pr.number) }] : []), { label: 'Figma review' }]}
        title="Review changes before applying"
        lead={`Figma · variables sync plugin · ${cs.file}. Three columns: what Figma has now, what it had at the last sync, and what the system wants. Only layers that use these variables change.`}
        eyebrow={
          <>
            <Chip tone={cs.status === 'applied' ? 'ok' : cs.status === 'undone' ? 'outline' : 'warn'}>{cs.status.replace('_', ' ')}</Chip>
            {pr && (
              <Link to={r.pr(pr.number)} className="chip chip--outline">
                PR #{pr.number}
              </Link>
            )}
          </>
        }
      />

      <Panel flush>
        <div className="table-wrap">
          <table className="table three-way">
            <thead>
              <tr>
                <th style={{ width: 36 }} />
                <th>Change</th>
                <th>Figma now</th>
                <th>At last sync</th>
                <th>The system</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {cs.rows.map((row) => (
                <tr key={row.tokenId + row.mode} className={row.status === 'both' ? 'conflict' : ''}>
                  <td>
                    <input type="checkbox" checked={row.include} disabled={cs.status !== 'pending'} onChange={() => act().toggleFigmaRow(cs.id, row.tokenId, row.mode)} aria-label="Include this change" />
                  </td>
                  <td>
                    <code className="xs">…/{row.figmaName.split('/').slice(-3).join('/')}</code> · {row.mode}
                  </td>
                  <td>
                    <span className="row">
                      <Swatch color={row.figmaNow} />
                      <code className="xs">{row.figmaNow}</code>
                    </span>
                  </td>
                  <td>
                    <span className="row">
                      <Swatch color={row.atLastSync} />
                      <code className="xs">{row.atLastSync}</code>
                    </span>
                  </td>
                  <td>
                    <span className="row">
                      <Swatch color={row.system} />
                      <code className="xs">{row.system}</code>
                    </span>
                  </td>
                  <td>
                    {row.status === 'applied' ? (
                      <Chip tone="ok">applied</Chip>
                    ) : row.status === 'both' ? (
                      <Chip tone="warn">Changed on both sides</Chip>
                    ) : row.status === 'new' ? (
                      <Chip tone="info">New in Figma</Chip>
                    ) : (
                      <Chip tone="ai">Figma unchanged since the last sync</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid--side">
        <div className="stack">
          {conflicts > 0 && cs.status === 'pending' && (
            <Callout tone="warn">
              {conflicts} value{conflicts > 1 ? 's' : ''} changed in Figma since the last sync and in the system. Pick: keep what Figma has, or use the system’s. The plugin never merges silently.
            </Callout>
          )}
          {!hasMemory && <Callout tone="info">This file has no sync memory, so the middle column is empty and differences show as “Different in Figma”.</Callout>}
          <Panel tight>
            <p className="small">
              <strong>{included} change{included === 1 ? '' : 's'}</strong> selected. {cs.layersRebound || cs.rows.reduce((acc, row) => acc + (sys.tokens.find((t) => t.id === row.tokenId)?.figmaLayerCount ?? 0), 0)} layers rebound: only layers bound to these variables change.
            </p>
            <p className="small muted">
              <History style={{ width: 14, verticalAlign: 'middle' }} /> A version is saved in the file history first (“Before DS Configurator import”), so you can roll back in one step.
            </p>
            <p className="xs muted">Variables are matched by name: the plugin looks for a collection called “semantic”, and finds brands by their short name.</p>
          </Panel>
        </div>
        <Panel tight>
          {cs.status === 'pending' && (
            <>
              <Btn onClick={() => act().applyFigmaChangeSet(cs.id)} disabled={included === 0} loading={applying}>
                <Check /> Apply {included} change{included === 1 ? '' : 's'}
              </Btn>
              <SimBadge detail="The plugin's behaviour is reproduced locally. No Figma file is opened or changed." />
            </>
          )}
          {cs.status === 'version_saved' && <Callout tone="info">Version saved. Applying the change…</Callout>}
          {cs.status === 'applied' && (
            <>
              <Callout tone="ok">
                {cs.rows.filter((row) => row.include).length} change applied · {cs.layersRebound} layers rebound.
              </Callout>
              {pr ? (
                <Btn onClick={() => navigate(r.pr(pr.number))}>
                  Back to the pull request <ArrowRight />
                </Btn>
              ) : (
                <Btn onClick={() => navigate(r.journeyNew())}>
                  Back to the set-up <ArrowRight />
                </Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={() => act().undoFigmaChangeSet(cs.id)}>
                <Undo2 /> Roll back to the saved version
              </Btn>
            </>
          )}
          {cs.status === 'undone' && (
            <Callout tone="default">
              Rolled back. The saved version is restored.{' '}
              <button className="btn btn--sm" onClick={() => act().reopenFigmaChangeSet(cs.id)}>
                Review again
              </button>
            </Callout>
          )}
        </Panel>
      </div>
    </div>
  )
}
