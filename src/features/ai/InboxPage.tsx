import { Link } from 'react-router'
import { Check, ShieldOff, Undo2, X } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel, SimBadge } from '@/shell/ui'
import { relTime, roleOf } from '@/state/selectors'
import { TRUST_ACTION_LABELS } from '@/fixtures/demo-brand/system'

export function InboxPage() {
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const ui = useStore((x) => x.ui)
  const pending = sys.agentProposals.filter((p) => p.status === 'pending' || p.status === 'blocked')
  const role = roleOf(sys, effectiveActingAs({ ui }, scope))
  const canDecide = role === 'owner' || role === 'contributor'

  return (
    <div className="page">
      <PageHead
       
        title={`${pending.length} suggestion${pending.length === 1 ? '' : 's'} from agents`}
        lead="Agents suggest changes; people decide anything beyond a mechanical fix. What counts as mechanical is set in Settings › What agents may do."
        actions={
          <Link to={r.trust} className="btn btn--secondary">
            Trust levels
          </Link>
        }
      />
      <div className="stack">
        {sys.agentProposals.map((p) => {
          const trust = sys.trust[p.trustAction]
          return (
            <Panel key={p.id} tight>
              <div className="row row--between">
                <div className="stack" style={{ gap: 2 }}>
                  <strong>{p.title}</strong>
                  <span className="small muted">
                    {p.description} · proposed by the {p.agent} agent {relTime(p.createdAt)}
                  </span>
                  <span className="row xs muted">
                    Action: {TRUST_ACTION_LABELS[p.trustAction]} · trust: <Chip tone={trust === 'never' ? 'err' : trust === 'autofix' ? 'ok' : 'info'}>{trust === 'autofix' ? 'auto-fix' : trust}</Chip>
                  </span>
                </div>
                <div className="row">
                  {p.status === 'pending' && (
                    <>
                      <Chip tone="warn">Needs review</Chip>
                      <Btn size="sm" onClick={() => act().decideProposal(p.id, 'approve')} disabled={!canDecide}>
                        <Check /> Approve
                      </Btn>
                      <Btn size="sm" variant="secondary" onClick={() => act().decideProposal(p.id, 'reject')} disabled={!canDecide}>
                        <X /> Reject
                      </Btn>
                    </>
                  )}
                  {p.status === 'blocked' && (
                    <Chip tone="err" icon={<ShieldOff />}>
                      Blocked by trust settings
                    </Chip>
                  )}
                  {p.status === 'auto_applied' && (
                    <>
                      <Chip tone="ok">Applied</Chip>
                      <Btn size="sm" variant="secondary" onClick={() => act().undoProposal(p.id)}>
                        <Undo2 /> Undo
                      </Btn>
                    </>
                  )}
                  {p.status === 'approved' && <Chip tone="ok">Approved</Chip>}
                  {p.status === 'rejected' && <Chip tone="outline">Rejected</Chip>}
                  {p.status === 'undone' && <Chip tone="outline">Undone</Chip>}
                </div>
              </div>
              {p.guidanceChanges?.map((g, i) => (
                <Callout key={i} tone="ai">
                  <strong>{sys.components.find((c) => c.id === g.componentId)?.name}</strong> · {g.field}: “{g.to}”
                </Callout>
              ))}
              {p.figmaRebinds && <span className="xs muted">{p.figmaRebinds} fills rebound in Figma. A version was saved first.</span>}
            </Panel>
          )
        })}
      </div>
      <div className="row">
        <SimBadge what="Fixtures from a patrol agent" detail="In DSN the ds-patrol skill runs in a terminal; here its output is modelled as an inbox." />
        {!canDecide && <span className="xs muted">Viewers cannot decide. Switch “acting as” to a contributor or the owner.</span>}
      </div>
    </div>
  )
}
