import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, GitPullRequest } from 'lucide-react'
import { useStore } from '@/state/store'
import { usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Chip, FindingStatusChip, Panel, Segmented, SeverityChip } from '@/shell/ui'
import { driftItems, openFindings, openPRs, relTime } from '@/state/selectors'

type Tab = 'findings' | 'prs' | 'figma'

export function ChangesList() {
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const rules = useStore((x) => x.practice.rules)
  const [params, setParams] = useSearchParams()
  const tab = ((params.get('tab') as Tab) || 'findings') as Tab
  const setTab = (t: Tab) => setParams(t === 'findings' ? {} : { tab: t })
  const open = openFindings(sys)
  const prs = openPRs(sys)

  return (
    <div className="page">
      <PageHead
        screen="finding"
        title="Changes"
        lead={`${driftItems(sys)} drift items across ${open.length} open findings, ${prs.length} open pull request${prs.length === 1 ? '' : 's'}, ${sys.figmaChangeSets.filter((c) => c.status === 'pending').length} Figma change set${sys.figmaChangeSets.filter((c) => c.status === 'pending').length === 1 ? '' : 's'} waiting. Suggest, preview, review in both tools.`}
        actions={
          <Segmented
            value={tab}
            options={[
              { id: 'findings', label: `Findings ${sys.findings.length}` },
              { id: 'prs', label: `Pull requests ${sys.pullRequests.length}` },
              { id: 'figma', label: `Figma change sets ${sys.figmaChangeSets.length}` },
            ]}
            onChange={setTab}
          />
        }
      />

      {tab === 'findings' && (
        <Panel flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Rule</th>
                  <th>Affects</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...sys.findings]
                  .sort((a, b) => rank(a.status) - rank(b.status) || sev(a.severity) - sev(b.severity))
                  .map((f) => (
                    <tr key={f.id} className="is-clickable" onClick={() => navigate(r.finding(f.id))}>
                      <td>
                        <div className="stack" style={{ gap: 2 }}>
                          <strong>{f.title}</strong>
                          <span className="xs muted">{f.summary.slice(0, 110)}…</span>
                        </div>
                      </td>
                      <td className="small">{rules.find((rule) => rule.id === f.ruleId)?.title}</td>
                      <td className="small">{f.componentIds.map((id) => sys.components.find((c) => c.id === id)?.name).join(', ') || 'Tokens'}</td>
                      <td>
                        <SeverityChip severity={f.severity} />
                      </td>
                      <td>
                        <FindingStatusChip status={f.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'prs' && (
        <Panel flush>
          {sys.pullRequests.length === 0 ? (
            <div className="empty">No pull requests yet. Propose a fix on a finding, or save guidance as a pull request.</div>
          ) : (
            <div className="list" style={{ padding: '0 20px' }}>
              {sys.pullRequests.map((p) => (
                <Link key={p.number} to={r.pr(p.number)} className="list__item list__item--link">
                  <GitPullRequest style={{ width: 16, color: p.status === 'merged' ? 'var(--n-ai)' : 'var(--n-ok)' }} />
                  <div className="list__body">
                    <span className="list__title">
                      #{p.number} · {p.title}
                    </span>
                    <span className="list__meta">
                      {p.branch} → {p.base} · opened from the {p.openedFrom} · {relTime(p.createdAt)}
                    </span>
                  </div>
                  <Chip tone={p.status === 'merged' ? 'ai' : p.status === 'waiting_review' || p.status === 'approved' ? 'ok' : p.status === 'changes_requested' ? 'warn' : 'info'}>{p.status.replace('_', ' ')}</Chip>
                  <ArrowRight style={{ width: 14, color: 'var(--n-fg-subtle)' }} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'figma' && (
        <Panel flush>
          {sys.figmaChangeSets.length === 0 ? (
            <div className="empty">No Figma change sets yet. They come from pull requests that change tokens, or from the wizard’s export.</div>
          ) : (
            <div className="list" style={{ padding: '0 20px' }}>
              {sys.figmaChangeSets.map((c) => (
                <Link key={c.id} to={c.prNumber ? r.prFigma(c.prNumber) : r.figma(c.id)} className="list__item list__item--link">
                  <div className="list__body">
                    <span className="list__title">{c.title}</span>
                    <span className="list__meta">
                      {c.rows.length} change{c.rows.length > 1 ? 's' : ''} · {c.file} {c.prNumber ? `· PR #${c.prNumber}` : ''}
                    </span>
                  </div>
                  <Chip tone={c.status === 'applied' ? 'ok' : c.status === 'pending' ? 'warn' : 'outline'}>{c.status.replace('_', ' ')}</Chip>
                  <ArrowRight style={{ width: 14, color: 'var(--n-fg-subtle)' }} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}

function rank(status: string) {
  return { open: 0, proposed: 1, in_pr: 2, dismissed: 3, merged: 4 }[status] ?? 5
}
function sev(sv: string) {
  return { error: 0, warn: 1, info: 2 }[sv] ?? 3
}
