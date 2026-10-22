import { Link, useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Chip, FindingStatusChip, Panel, SeverityChip } from '@/shell/ui'
import { driftItems } from '@/state/selectors'
import { RULE_BY_ID } from '@/fixtures/demo-brand/rules'

export function DriftList() {
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const findings = sys.findings.filter((f) => f.ruleId !== 'guidance-complete')

  return (
    <div className="page">
      <PageHead
        screen="connect"
        title="Drift list"
        lead={`${driftItems(sys)} drift items across ${findings.filter((f) => f.status === 'open').length} open findings. The tool lists them and names the side to fix; people decide per item. Nothing auto-resolves.`}
      />
      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Finding</th>
                <th>Fix side</th>
                <th>Rule</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <tr key={f.id} className="is-clickable" onClick={() => navigate(r.finding(f.id))}>
                  <td>{f.componentIds.length ? f.componentIds.map((id) => sys.components.find((c) => c.id === id)?.name).join(', ') : <span className="muted">Tokens</span>}</td>
                  <td>
                    {f.title} {f.count && f.count > 1 && <span className="muted">({f.count})</span>}
                  </td>
                  <td>
                    <Chip tone={f.fixSide === 'figma' ? 'ai' : f.fixSide === 'code' ? 'info' : 'outline'}>{f.fixSide === 'both' ? 'Both' : f.fixSide === 'figma' ? 'Figma' : 'Code'}</Chip>
                  </td>
                  <td className="small muted">{RULE_BY_ID[f.ruleId]?.category}</td>
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
      <div className="row row--between">
        <Link to={r.changes} className="small">
          Work on findings in Changes →
        </Link>
        <Btn onClick={() => navigate(r.handover)}>
          Handover and baseline <ArrowRight />
        </Btn>
      </div>
    </div>
  )
}
