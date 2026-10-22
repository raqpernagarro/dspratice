import { ArrowRight } from 'lucide-react'
import { useStore } from '@/state/store'
import { useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel } from '@/shell/ui'
import { READOUT_DECISIONS } from '@/fixtures/demo-brand/system'
import { useImproveNav } from './JourneyFrame'

export function Readout() {
  const nav = useImproveNav('plan')
  const readout = useSys((s) => s.journey.readout)
  const setReadout = useStore((s) => s.setReadout)
  const scanDone = useSys((s) => s.journey.scan.status === 'done')
  const decided = READOUT_DECISIONS.filter((d) => readout[d.id]).length

  return (
    <div className="page">
      <PageHead
       
        noTabs
        title="Agree the plan"
        lead="The assessment lists the findings; people decide what happens. These four decisions go into the system contract before anything changes. Each choice is saved as you make it."
      />

      {!scanDone && <Callout tone="warn">Run the assessment first, so the plan has findings to discuss.</Callout>}

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
          {decided} of {READOUT_DECISIONS.length} decided
        </span>
        <Btn onClick={nav.complete} disabled={decided < READOUT_DECISIONS.length} title={decided < READOUT_DECISIONS.length ? 'Decide all four first' : undefined}>
          Plan agreed: map the names <ArrowRight />
        </Btn>
      </div>
    </div>
  )
}
