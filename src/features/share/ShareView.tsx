import { Link, useParams } from 'react-router'
import { CalendarCheck, Eye } from 'lucide-react'
import { useStore } from '@/state/store'
import { act } from '@/state/hooks'
import { client } from '@/app/routes'
import { Chip, DemoData, Panel, Stat } from '@/shell/ui'
import { aiReadableCount, checksPassing, componentsInFigma, driftItems, lastEval, valuesWithCodeName } from '@/state/selectors'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsBadge, DsButton, DsCard, DsInput, DsTabs, DsToggle } from '@/demo-system/components'

/** Read-only client view: a stripped layout with no navigation, only demo brands, nothing editable. */
export function ShareView() {
  const { slug = '' } = useParams<{ slug: string }>()
  const project = useStore((s) => Object.values(s.projects).find((p) => p.slug === slug))
  const sys = project?.published?.state

  if (!project || !sys) {
    return (
      <div className="share">
        <header className="share__top">
          <img src="/brand/nagarro-logo.svg" alt="Nagarro" />
        </header>
        <div className="share__body">
          <Panel>
            <div className="stack" style={{ gap: 4 }}>
              <strong>Nothing published yet</strong>
              <span className="muted">{project ? `${project.client.name} has no published version to share. Publish the draft from the Nagarro workspace first.` : 'This link does not match a project.'}</span>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  const before = sys.journey.before
  const vc = valuesWithCodeName(sys)
  const checks = checksPassing(sys)
  const ev = lastEval(sys)

  return (
    <div className="share">
      <header className="share__top">
        <img src="/brand/nagarro-logo.svg" alt="Nagarro" />
        <span style={{ width: 1, height: 20, background: 'var(--n-white-30)' }} />
        <span className="small" style={{ color: 'var(--n-white-70)' }}>
          Prepared for {sys.theme.name} · view only
        </span>
        <span style={{ marginLeft: 'auto' }} className="row">
          <Chip tone="outline" icon={<Eye />} className="small" title="Viewers can’t edit, export or see other brands.">
            <span style={{ color: 'var(--n-white)' }}>View only</span>
          </Chip>
          <Link to={client(project.slug).home} className="btn btn--on-dark-ghost btn--sm">
            Back to the panel
          </Link>
        </span>
      </header>

      <div className="share__body">
        <div className="share__hero fi-dark fi-wash fi-grain">
          <div className="fi-image fi-image--dark-1" style={{ opacity: 0.7 }} />
          <span className="chip chip--outline" style={{ color: 'var(--n-white-70)', borderColor: 'var(--n-white-30)' }}>
            {sys.theme.name} · design system
          </span>
          <h1 style={{ marginTop: 16 }}>Your design system, organized.</h1>
          <p style={{ color: 'var(--n-white-70)', maxWidth: '52ch', marginTop: 12, fontSize: 18 }}>
            Design, code and AI agents use the same rules. Every change is reviewed in both tools. Here is where it stands.
          </p>
        </div>

        <div className="grid grid--3">
          <Panel tight>
            <Stat label="Checks passing" value={`${checks.passing}/${checks.total}`} />
          </Panel>
          <Panel tight>
            <Stat label="On-system eval" value={`${ev?.onSystem ?? '–'}%`} hint={ev ? `${ev.version} · gate ${ev.gate}%` : ''} />
          </Panel>
          <Panel tight>
            <Stat label="Drift items" value={driftItems(sys)} hint={before ? `from ${before.driftItems}` : ''} />
          </Panel>
        </div>

        <Panel title="Before and after" actions={<DemoData>Example values</DemoData>}>
          <div className="ba">
            <span className="ba__head">Measure</span>
            <span className="ba__head">Before</span>
            <span className="ba__head">After</span>
            <span />
            <span>Values with a code name</span>
            <span className="ba__before">{before ? `${before.totalValues - before.valuesWithoutCodeName} / ${before.totalValues}` : `${sys.baseline.totalValues - sys.baseline.valuesWithoutCodeName} / ${sys.baseline.totalValues}`}</span>
            <span className="ba__after">
              {vc.named} / {vc.total}
            </span>
            <span />
            <span>Figma ↔ code drift</span>
            <span className="ba__before">{before?.driftItems ?? 12}</span>
            <span className="ba__after">{driftItems(sys)}</span>
            <span />
            <span>Components AI can read</span>
            <span className="ba__before">{before ? `${before.aiReadable} / ${before.totalComponents}` : `0 / ${sys.baseline.componentsInFigma}`}</span>
            <span className="ba__after">
              {aiReadableCount(sys)} / {componentsInFigma(sys).length}
            </span>
            <span />
          </div>
          <span className="xs muted">Example values. Viewers can’t edit, export or see other brands.</span>
        </Panel>

        <Panel title="The real components" flush>
          <DemoScope system={sys} brand={sys.theme.activeBrand} mode={sys.theme.designedFirst} style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            <DsButton>Primary</DsButton>
            <DsButton variant="secondary">Secondary</DsButton>
            <DsBadge tone="success">Active</DsBadge>
            <DsToggle />
            <DsInput />
            <DsTabs />
            <DsCard />
          </DemoScope>
        </Panel>

        <Panel ink>
          <div className="row row--between">
            <div className="stack" style={{ gap: 4 }}>
              <strong style={{ fontFamily: 'var(--n-font-display)', fontSize: 22, fontWeight: 500 }}>Book a 30-minute readout</strong>
              <span className="muted">We walk through the findings and agree what leads, who owns and what comes first.</span>
            </div>
            <button className="btn btn--on-dark" onClick={() => act().pushToast({ kind: 'sim', title: 'Booking is simulated', detail: 'In an engagement this opens the specialist’s calendar.' })}>
              <CalendarCheck /> Book the readout
            </button>
          </div>
        </Panel>

        <p className="xs muted">This link opens locally. A hosted version would be a static read-only build (the Starter Pack’s docs build with VITE_DS_READONLY). Demo Brand is fictional.</p>
      </div>
    </div>
  )
}
