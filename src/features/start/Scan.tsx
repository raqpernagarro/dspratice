import { useNavigate } from 'react-router'
import { ArrowRight, Check, Loader2, Play, Square } from 'lucide-react'
import { act, useJob, usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Panel, Stat } from '@/shell/ui'
import { SCAN_STAGES } from '@/fixtures/demo-brand/system'
import { readiness, parityPct, contrastFails, valuesWithCodeName, componentsDiffer } from '@/state/selectors'

export function Scan() {
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const job = useJob('scan')
  const scan = sys.journey.scan
  const running = scan.status === 'running'
  const done = scan.status === 'done'
  const stageIndex = job?.stageIndex ?? -1

  return (
    <div className="page">
      <PageHead
        screen="connect"
        title="Assessment scan"
        lead={`Scanning ${sys.journey.connect.repoUrl} and ${sys.journey.connect.figmaUrl}, read-only. Six stages, about ten seconds. Nothing is written.`}
        actions={
          !running ? (
            <Btn onClick={() => act().runScan()}>
              <Play /> {done ? 'Run the scan again' : 'Run the scan'}
            </Btn>
          ) : (
            <Btn variant="secondary" onClick={() => act().cancelScan()}>
              <Square /> Cancel
            </Btn>
          )
        }
      />

      <div className="grid grid--side">
        <div data-demo-focus="scan-stages">
        <Panel>
          <div className="steps">
            {SCAN_STAGES.map((st, i) => {
              const state = done ? 'done' : running ? (i < stageIndex ? 'done' : i === stageIndex ? 'active' : 'pending') : scan.status === 'cancelled' && i < scan.stageDetails.length ? 'done' : 'pending'
              return (
                <div key={st.id} className={`step ${state === 'done' ? 'is-done' : state === 'active' ? 'is-active' : ''}`}>
                  <span className="step__dot">{state === 'done' ? <Check style={{ width: 12 }} /> : state === 'active' ? <Loader2 className="spin" style={{ width: 12 }} /> : i + 1}</span>
                  <span className="step__body">
                    <span className="step__title">{st.label}</span>
                    <span className="step__detail">{state === 'done' ? st.detail : state === 'active' ? 'Working…' : ' '}</span>
                  </span>
                </div>
              )
            })}
          </div>
          {scan.status === 'cancelled' && <Callout tone="warn">Scan cancelled. Nothing was written; run it again when ready.</Callout>}
          {done && (
            <div className="row row--between" style={{ borderTop: 'var(--n-hairline) solid var(--n-line)', paddingTop: 12 }}>
              <span className="small muted">Baseline captured {sys.journey.before ? new Date(sys.journey.before.takenAt).toLocaleTimeString() : ''}</span>
              <span className="row">
                <Btn variant="secondary" onClick={() => navigate(r.report)}>
                  Open the assessment report
                </Btn>
                <Btn onClick={() => navigate(r.journeyImprove(6))}>
                  Continue to the readout <ArrowRight />
                </Btn>
              </span>
            </div>
          )}
        </Panel>
        </div>

        <div className="stack">
          <div className="scan-art fi-dark fi-wash">
            <div className="fi-image fi-image--dark-2" style={{ opacity: 0.7 }} />
            <span className="xs" style={{ color: 'var(--n-white-70)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your system today
            </span>
            <span className="big-number">{done ? `${readiness(sys)} / 5` : '–'}</span>
            <span className="small" style={{ color: 'var(--n-white-70)' }}>
              AI readiness · demo data
            </span>
          </div>
          <Panel tight>
            <div className="grid grid--2">
              <Stat label="Figma ↔ code" value={done ? `${parityPct(sys)}%` : '–'} small />
              <Stat label="Contrast fails" value={done ? contrastFails(sys) : '–'} small />
              <Stat label="No code name" value={done ? valuesWithCodeName(sys).total - valuesWithCodeName(sys).named : '–'} small hint={done ? `of ${valuesWithCodeName(sys).total} values` : ''} />
              <Stat label="Components differ" value={done ? componentsDiffer(sys).differ : '–'} small hint={done ? `of ${componentsDiffer(sys).total}` : ''} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
