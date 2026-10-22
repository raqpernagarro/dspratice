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

  return (
    <div className="page">
      <PageHead
        screen="connect"
        title={client ? 'What you keep' : 'Handover: what the client keeps'}
        lead="Everything on this list lives in your repository or your Figma file. A named owner, trust levels for agents and a baseline for the steering group. You own it and can run it."
        actions={
          <>
            {!sys.journey.engagementFastForwarded && (
              <Btn variant="secondary" onClick={() => act().fastForwardEngagement()} title="Demo shortcut: resolve every remaining finding so the end state shows">
                <FastForward /> {client ? 'Show the end state' : 'Fast-forward the engagement'}
              </Btn>
            )}
            <Link to={`/share/${project.slug}`} className="btn">
              <Share2 /> Open the share link
            </Link>
          </>
        }
      />

      <div className="grid grid--side">
        <div className="stack" data-demo-focus="handover-list">
        {allDone && (
          <Reveal>
            <div className="panel fi-dark fi-wash fi-grain" style={{ color: 'var(--n-white)', borderColor: 'transparent' }}>
              <span className="xs" style={{ color: 'var(--n-mint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Handover complete</span>
              <strong style={{ fontFamily: 'var(--n-font-display)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>You own it and can run it.</strong>
              <span style={{ color: 'var(--n-white-70)' }}>Repository, Figma library, panel, checks, AI channels, evals, a named owner and a baseline: all in your hands.</span>
            </div>
          </Reveal>
        )}
        <Panel title={client ? 'Your handover checklist' : 'Handover checklist'} actions={<span className="small muted">{done} / {HANDOVER_ITEMS.length}</span>}>
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
          <Panel tight title="Baseline → now" actions={<DemoData />}>
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
              <span>Figma ↔ code drift items</span>
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
            {!before && <span className="xs muted">Run the scan to capture the baseline.</span>}
          </Panel>
          <Panel tight>
            <div className="grid grid--2">
              <Stat label="Checks passing" value={`${checks.passing}/${checks.total}`} small />
              <Stat label="On-system eval" value={`${ev?.onSystem ?? '–'}%`} small />
            </div>
          </Panel>
          <Callout tone="info">
            <SimBadge what="Demo shortcut" detail="Fast-forward marks every remaining finding resolved and republishes channels so the handover shows the end state. In a real engagement each item is a pull request." /> {client ? 'The “show the end state” button stands in for the weeks of engagement between readout and handover.' : 'The fast-forward button stands in for the weeks of engagement between readout and handover.'}
          </Callout>
        </div>
      </div>
    </div>
  )
}
