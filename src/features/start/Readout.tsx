import { useNavigate } from 'react-router'
import { ArrowRight, Users } from 'lucide-react'
import { useStore } from '@/state/store'
import { usePaths, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel } from '@/shell/ui'
import { READOUT_DECISIONS } from '@/fixtures/demo-brand/system'

export function Readout() {
  const navigate = useNavigate()
  const r = usePaths()
  const readout = useSys((s) => s.journey.readout)
  const setReadout = useStore((s) => s.setReadout)
  const scanDone = useSys((s) => s.journey.scan.status === 'done')
  const decided = READOUT_DECISIONS.filter((d) => readout[d.id]).length

  return (
    <div className="page">
      <PageHead
        screen="connect"
        title="Readout: agree the plan"
        lead="The scan lists findings; people decide. Four decisions are written into the contract before anything is adapted. A Nagarro specialist runs this session with you."
        eyebrow={<Chip tone="info" icon={<Users style={{ width: 12 }} />}>Service step · with a specialist</Chip>}
      />

      {!scanDone && <Callout tone="warn">Run the scan first so the readout has findings to discuss.</Callout>}

      <div className="stack">
        {READOUT_DECISIONS.map((d) => (
          <Panel key={d.id} title={d.question}>
            <p className="small muted">{d.why}</p>
            <div className="grid grid--2">
              {d.options.map((o) => (
                <button key={o.id} className={`choice ${readout[d.id] === o.id ? 'is-selected' : ''}`} onClick={() => setReadout(d.id, o.id)}>
                  <div className="choice__body">
                    <span className="choice__title">
                      {o.label} {d.recommended === o.id && <Chip tone="mint">Recommended</Chip>}
                    </span>
                    <span className="choice__desc">{o.hint}</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <div className="row row--between">
        <span className="small muted">
          {decided} of {READOUT_DECISIONS.length} decided · written to the contract as you choose
        </span>
        <Btn onClick={() => navigate(r.journeyImprove(7))} disabled={decided < READOUT_DECISIONS.length}>
          Adapt to the contract <ArrowRight />
        </Btn>
      </div>
    </div>
  )
}
