import { useEffect } from 'react'
import { Link } from 'react-router'
import { Check, FastForward, Share2 } from 'lucide-react'
import { act, useIsClient, useProject, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, DemoData, Panel, SimBadge, Stat } from '@/shell/ui'
import { HANDOVER_ITEMS } from '@/fixtures/demo-brand/system'
import { aiReadableCount, componentsInFigma, driftItems, readiness, valuesWithCodeName, checksPassing, lastEval } from '@/state/selectors'
import { AnimatedNumber, Reveal } from '@/motion'

export function Handover() {
  const sys = useSystem()
  const project = useProject()
  const client = useIsClient()
  const done = HANDOVER_ITEMS.filter((i) => sys.journey.handover[i.id]).length
  const allDone = done === HANDOVER_ITEMS.length
  const before = sys.journey.before
  const vc = valuesWithCodeName(sys)
  const ev = lastEval(sys)
  const checks = checksPassing(sys)
  useEffect(() => {
    if (allDone && !client) act().markJourneyStep('improve', 8, true)
  }, [allDone, client])

  return (
    <div className="page">
      <PageHead
       
        noTabs={!client}
        title={client ? 'What an engagement leaves behind' : 'Handover (example)'}
        lead={`An example of what a client keeps at the end of an engagement. Everything lives in ${client ? 'their' : 'the client’s'} own repository and Figma file, with a named owner and a baseline to measure against. The exact list depends on the engagement.`}
        actions={
          <>
            {!sys.journey.engagementFastForwarded && (
              <Btn variant="secondary" onClick={() => act().fastForwardEngagement()} title="Demo shortcut: resolve every remaining finding so the end state shows">
                <FastForward /> Skip to the end of the example
              </Btn>
            )}
            <Link to={`/share/${project.slug}`} className="btn btn--secondary">
              <Share2 /> Read-only report
            </Link>
          </>
        }
      />

      <div className="grid grid--side">
        <div className="stack" data-demo-focus="handover-list">
        {allDone && (
          <Reveal>
            <div className="panel fi-dark fi-wash fi-grain" style={{ color: 'var(--n-white)', borderColor: 'transparent' }}>
              <span className="xs" style={{ color: 'var(--n-mint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Example handover complete</span>
              <strong style={{ fontFamily: 'var(--n-font-display)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>{sys.theme.name}’s team owns it and can run it.</strong>
              <span style={{ color: 'var(--n-white-70)' }}>Repository, Figma library, checks, files for AI tools, a named owner and a baseline, all in the client’s hands.</span>
            </div>
          </Reveal>
        )}
        <Panel title="What the client keeps" actions={<span className="small muted">{done} / {HANDOVER_ITEMS.length}</span>}>
          <div className="checklist">
            {HANDOVER_ITEMS.map((it) => (
              <button key={it.id} className={`checklist__item ${sys.journey.handover[it.id] ? 'is-done' : ''}`} onClick={() => act().toggleHandover(it.id)}>
                <span className="checklist__box">{sys.journey.handover[it.id] && <Check style={{ width: 12 }} />}</span>
                <span className="stack" style={{ gap: 2 }}>
                  <span className="checklist__title">{it.label}</span>
                  <span className="checklist__detail">{it.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </Panel>
        </div>

        <div className="stack">
          <Panel tight title="Before → now (sample)" actions={<DemoData />}>
            <div className="ba">
              <span className="ba__head">Measure</span>
              <span className="ba__head">Before</span>
              <span className="ba__head">Now</span>
              <span />
              <span>Values with a code name</span>
              <span className="ba__before">{before ? `${before.totalValues - before.valuesWithoutCodeName} / ${before.totalValues}` : '—'}</span>
              <span className="ba__after">
                {vc.named} / {vc.total}
              </span>
              <span />
              <span>Places where Figma and code differ</span>
              <span className="ba__before">{before ? before.driftItems : '—'}</span>
              <span className="ba__after"><AnimatedNumber value={driftItems(sys)} /></span>
              <span />
              <span>Components AI can read</span>
              <span className="ba__before">{before ? `${before.aiReadable} / ${before.totalComponents}` : '—'}</span>
              <span className="ba__after">
                {aiReadableCount(sys)} / {componentsInFigma(sys).length}
              </span>
              <span />
              <span>AI readiness</span>
              <span className="ba__before">{before ? `${before.readiness} / 5` : '—'}</span>
              <span className="ba__after">{readiness(sys)} / 5</span>
              <span />
            </div>
            {!before && <span className="xs muted">Run the assessment to capture the baseline.</span>}
          </Panel>
          <Panel tight>
            <div className="grid grid--2">
              <Stat label="Checks passing" value={`${checks.passing}/${checks.total}`} small />
              <Stat label="AI output on the system" value={`${ev?.onSystem ?? '–'}%`} small />
            </div>
          </Panel>
          <Callout tone="info">
            <SimBadge what="Demo shortcut" detail="Marks every remaining finding fixed and refreshes the AI tool files so the example end state shows. In a real engagement each item is its own reviewed change." /> “Skip to the end of the example” stands in for the weeks of work between the plan and the handover. The figures are sample data.
          </Callout>
        </div>
      </div>
    </div>
  )
}
