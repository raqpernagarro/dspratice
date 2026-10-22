import { Link, useNavigate } from 'react-router'
import { CalendarCheck, Share2 } from 'lucide-react'
import { act, useIsClient, usePaths, useProject, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, DemoData, FindingStatusChip, Panel, Stat } from '@/shell/ui'
import { aiReadableCount, componentsDiffer, componentsInFigma, contrastFails, driftItems, parityPct, readiness, valuesWithCodeName } from '@/state/selectors'
import { RULE_BY_ID } from '@/fixtures/demo-brand/rules'
import { AnimatedNumber } from '@/motion'

export function ReportPage() {
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const project = useProject()
  const client = useIsClient()
  const before = sys.journey.before
  const scanned = sys.journey.scan.status === 'done'
  const rd = readiness(sys)
  const vc = valuesWithCodeName(sys)
  const cd = componentsDiffer(sys)

  return (
    <div className="page">
      <PageHead
       
        title={`${sys.theme.name}: assessment report`}
        lead={scanned ? `Assessment of ${sys.journey.connect.repoUrl} and ${sys.journey.connect.figmaUrl}. Figures change as findings are fixed; the baseline stays as it was.` : 'Run the assessment to fill this report with a baseline.'}
        eyebrow={<DemoData>Sample figures</DemoData>}
        actions={
          <>
            <Link to={`/share/${project.slug}`} className="btn btn--secondary">
              <Share2 /> Share read-only report
            </Link>
            <Btn onClick={() => act().pushToast({ kind: 'sim', title: 'Readout booking is simulated', detail: 'In an engagement this opens the specialist’s calendar.' })}>
              <CalendarCheck /> Book the readout
            </Btn>
          </>
        }
      />

      {!scanned && (
        <Callout tone="warn">
          No baseline yet. <Link to={r.assessment}>Run the scan</Link> first.
        </Callout>
      )}

      <div className="grid grid--4">
        <Panel tight className="fi-dark fi-wash" style={{ color: 'var(--n-white)' }}>
          <Stat label="AI readiness" value={<><AnimatedNumber value={rd} />/5</>} hint={before ? `baseline ${before.readiness}/5` : ''} />
        </Panel>
        <Panel tight>
          <Stat label="Figma ↔ code" value={`${parityPct(sys)}%`} hint={before ? `baseline ${before.parityPct}%` : 'in sync'} tone={parityPct(sys) >= 90 ? 'ok' : 'warn'} />
        </Panel>
        <Panel tight>
          <Stat label="Contrast fails" value={contrastFails(sys)} hint={before ? `baseline ${before.contrastFails}` : ''} tone={contrastFails(sys) === 0 ? 'ok' : 'warn'} />
        </Panel>
        <Panel tight>
          <Stat label="Figma–code differences" value={<AnimatedNumber value={driftItems(sys)} />} hint={before ? `baseline ${before.driftItems}` : ''} tone={driftItems(sys) === 0 ? 'ok' : 'warn'} />
        </Panel>
      </div>

      <Callout tone="info">
        {vc.total - vc.named} values have no code name. {cd.differ} of {cd.total} components differ between Figma and code. {aiReadableCount(sys)} of {componentsInFigma(sys).length} components are readable by agents (guidance complete and Code Connect mapped).
      </Callout>

      <Panel title="Findings" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Finding</th>
                <th>Fix side</th>
                <th>Rule</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sys.findings
                .filter((f) => f.ruleId !== 'guidance-complete')
                .map((f) => (
                  <tr key={f.id} className="is-clickable" onClick={() => navigate(r.finding(f.id))}>
                    <td>{f.componentIds.map((id) => sys.components.find((c) => c.id === id)?.name).join(', ') || <span className="muted">Tokens</span>}</td>
                    <td>
                      {f.title}
                      {f.count && f.count > 1 ? ` (${f.count})` : ''}
                      {sys.contract.rulesEnabled[f.ruleId] === false && <Chip tone="outline">rule off · accepted</Chip>}
                    </td>
                    <td>
                      <Chip tone={f.fixSide === 'figma' ? 'ai' : f.fixSide === 'code' ? 'info' : 'outline'}>{f.fixSide === 'both' ? 'Both' : f.fixSide === 'figma' ? 'Figma' : 'Code'}</Chip>
                    </td>
                    <td className="small muted">{RULE_BY_ID[f.ruleId]?.category}</td>
                    <td>
                      <FindingStatusChip status={f.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div data-demo-focus="before-after">
      <Panel title="Before and after" tight>
        <div className="ba">
          <span className="ba__head">Measure</span>
          <span className="ba__head">Baseline</span>
          <span className="ba__head">Now</span>
          <span className="ba__head">Target</span>
          <span>Values with a code name</span>
          <span className="ba__before">{before ? `${before.totalValues - before.valuesWithoutCodeName} / ${before.totalValues}` : '—'}</span>
          <span className="ba__after">
            {vc.named} / {vc.total}
          </span>
          <span className="muted">{sys.baseline.totalValues} / {sys.baseline.totalValues}</span>
          <span>Figma ↔ code drift</span>
          <span className="ba__before">{before?.driftItems ?? '—'}</span>
          <span className="ba__after">{driftItems(sys)}</span>
          <span className="muted">0</span>
          <span>Components AI can read</span>
          <span className="ba__before">{before ? `${before.aiReadable} / ${before.totalComponents}` : '—'}</span>
          <span className="ba__after">
            {aiReadableCount(sys)} / {componentsInFigma(sys).length}
          </span>
          <span className="muted">{sys.baseline.componentsInFigma} / {sys.baseline.componentsInFigma}</span>
        </div>
        {!client && (
          <p className="xs muted">
            A real client before/after (four button sets became one Button plus an Icon button; every value given a code name) is shown internally only, after written clearance. The figures come from a showcase deck and are not verified in this copy. The demo brand carries the numbers here.
          </p>
        )}
      </Panel>
      </div>
    </div>
  )
}
