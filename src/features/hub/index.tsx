import { Link, useNavigate } from 'react-router'
import { ExternalLink, Play, RefreshCw } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Chip, Kv, Panel, Stat } from '@/shell/ui'
import { LiveBadge } from '@/shell/provenance'
import { usePresentDemo } from '@/shell/present'
import { useStore } from '@/state/store'
import { useIntegrationStatus } from '@/integrations/status'
import { client, practice } from '@/app/routes'
import { DEMOS, PRACTICE_TOOLS, SOLUTIONS, type DemoEntry, type ToolEntry } from '@/fixtures/hub'
import slidesVersion from '@/deck/engine.generated.json'
import { ToolCatalog } from '@/features/tools'
import { ToolAddresses } from '@/features/tools/ToolAddresses'

const STATUS: Record<ToolEntry['status'], { label: string; tone: 'ok' | 'warn' | 'ink' | 'outline' }> = { works: { label: 'Ready to use', tone: 'ok' }, partly: { label: 'Partly ready', tone: 'warn' }, 'internal-only': { label: 'Internal only', tone: 'ink' }, proposed: { label: 'Planned', tone: 'outline' } }
const IN_HUB: Record<NonNullable<ToolEntry['inHub']>['to'], string> = { library: practice.projects, presentations: practice.presentations, knowledge: practice.knowledge, opportunities: practice.opportunityStart, demos: practice.demos, integrations: practice.integrations }

function ToolCard({ t }: { t: ToolEntry }) {
  return (
    <article className="panel tool-card" data-testid={`tool-${t.id}`}>
      <div className="row row--between" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>{t.name}</h3>
        <Chip tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Chip>
      </div>
      <p className="small muted" style={{ margin: '4px 0 8px' }}>Owner: {t.owner}</p>
      <p className="small">{t.what}</p>
      <ul className="tool-parts">
        {t.parts.map((p) => (
          <li key={p.name} className="small">
            <strong>{p.name}</strong>
            {p.how && <span className="muted"> · {p.how}</span>}
            {p.link && <> · <a href={p.link} target="_blank" rel="noreferrer">open <ExternalLink style={{ width: 12 }} /></a></>}
          </li>
        ))}
      </ul>
      <Kv rows={[['Get it', t.get], ['Access', t.access]]} />
      {t.inHub && <Link className="btn btn--secondary btn--sm" to={IN_HUB[t.inHub.to]}>{t.inHub.label}</Link>}
    </article>
  )
}

export function ToolsPage() {
  return (
    <div className="page">
      <PageHead title="Tools" lead="What the practice has built. Open a tool here to use the real thing on this machine; the cards below say who owns each one and how to get it." />
      <ToolCatalog />
      <h2 className="section-title">Our three solutions</h2>
      <div className="grid grid--3">{SOLUTIONS.map((t) => <ToolCard key={t.id} t={t} />)}</div>
      <h2 className="section-title">Practice tools</h2>
      <div className="grid grid--3">{PRACTICE_TOOLS.map((t) => <ToolCard key={t.id} t={t} />)}</div>
    </div>
  )
}

export function DemosPage() {
  const navigate = useNavigate()
  const present = usePresentDemo()
  const demoUrl = import.meta.env.VITE_DEMO_URL as string | undefined
  const open = (d: DemoEntry) => {
    if (d.open === 'opportunity') return navigate(practice.opportunitiesFor('northwind'))
    const c = client('demo-brand')
    if (d.open === 'guide') return present('demo-brand', { guide: 'meeting' })
    if (d.open === 'scorecard') return present('demo-brand', { path: c.scorecard })
    if (d.open === 'prototype') return present('demo-brand', { guide: 'meeting', chapter: 'ai' })
    return present('demo-brand', { path: d.open === 'components' ? c.components : c.home })
  }
  return (
    <div className="page">
      <PageHead
        title="Client demo"
        lead="What we show prospects and clients in meetings, on Demo Brand, a fictional company. Pick a demo, prepare it, then present. Everything the client sees happens in the client demo; your notes stay with you."
      />
      <div className="grid grid--2">
        {DEMOS.map((d) => (
          <article key={d.id} className="panel demo-card" data-testid={`demo-${d.id}`}>
            <div className="row row--between" style={{ gap: 8 }}>
              <h3 style={{ margin: 0 }}>{d.title}</h3>
              <Chip tone={d.audience === 'internal' ? 'ink' : 'mint'}>{d.audience === 'internal' ? 'For colleagues' : 'For clients'}</Chip>
            </div>
            <p className="small muted">About {d.minutes} minutes</p>
            <p className="small">{d.proves}</p>
            <details className="small">
              <summary>Tips</summary>
              <ul>{d.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </details>
            <div className="row" style={{ gap: 8, marginTop: 'auto' }}>
              <button className="btn btn--mint btn--sm" onClick={() => open(d)} data-testid={`run-demo-${d.id}`}>
                <Play /> {d.audience === 'internal' ? 'Open the sample' : 'Start presenting'}
              </button>
              {d.open === 'guide' && (
                <Link className="btn btn--secondary btn--sm" to={practice.meetingPrep('demo-brand')}>
                  Prepare the meeting
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      <Panel title="Showing the demo outside a meeting" tight>
        <p className="small muted">A client-safe copy of the demo can be built as a separate site (see docs/demo-build.md). It is not published: that needs the practice lead’s go-ahead and marketing’s approval of the scorecard.</p>
        {demoUrl && (
          <a className="btn btn--secondary btn--sm" href={demoUrl} target="_blank" rel="noreferrer">
            <ExternalLink /> Open the demo site
          </a>
        )}
      </Panel>
    </div>
  )
}

export function IntegrationsPage() {
  const { status, refresh, loading, checkedAt } = useIntegrationStatus()
  const projects = useStore((s) => s.projects)
  const usage = Object.values(projects).flatMap((p) => Object.values(p.opportunities ?? {})).reduce((a, o) => ({ calls: a.calls + o.aiUsage.calls, tokens: a.tokens + o.aiUsage.inputTokens + o.aiUsage.outputTokens }), { calls: 0, tokens: 0 })
  return (
    <div className="page">
      <PageHead title="Integrations and AI usage" lead="What this machine can reach, and how many model tokens the hub has spent. Keys stay in .env.local on the local server; the browser only learns whether each one is set." actions={<button className="btn btn--secondary" onClick={() => refresh()} disabled={loading}><RefreshCw /> Check again</button>} />
      <div className="grid grid--3">
        <Stat label="Model" value={status.model.configured ? 'On' : 'Templates only'} hint={status.model.configured ? status.model.model : 'add ANTHROPIC_API_KEY to use a model'} />
        <Stat label="Figma REST" value={status.figma.configured ? 'On' : 'Off'} hint={status.figma.configured ? 'refresh and folder listing' : 'plugin, figma-cli and snapshots still work'} />
        <Stat label="Model usage" value={`${usage.tokens.toLocaleString()} tokens`} hint={`${usage.calls} calls across all opportunities`} />
      </div>
      {status.offline && <Callout tone="warn">The local server is not reachable (a static build, or npm run dev is not running). Templates, uploads and the bundled knowledge still work.</Callout>}
      <ToolAddresses />
      <Panel title="Reading Figma, cheapest first">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Route</th><th>Model tokens</th><th>Needs</th><th>Lists folders</th><th>Here</th></tr></thead>
            <tbody>
              <tr><td>Nagarro knowledge export plugin</td><td>0</td><td>Figma desktop, any plan</td><td>No</td><td><Chip tone="ok">Ready</Chip></td></tr>
              <tr><td>Figma REST</td><td>0</td><td>FIGMA_TOKEN (file_content:read, projects:read)</td><td>Yes</td><td>{status.figma.configured ? <LiveBadge what="On" /> : <Chip tone="outline">Off</Chip>}</td></tr>
              <tr><td>figma-cli (Safe or Browser mode)</td><td>0</td><td>Figma desktop; unofficial</td><td>Open files only</td><td><Chip tone="warn">Not exercised</Chip></td></tr>
              <tr><td>Figma MCP, text only (use_figma)</td><td>about the text size</td><td>Claude Code</td><td>No</td><td><Chip tone="outline">Seed capture, 22 Oct</Chip></td></tr>
              <tr><td>Figma MCP, design context</td><td>8–10K per slide</td><td>Claude Code</td><td>No</td><td><Chip tone="dashed">Avoid for reading text</Chip></td></tr>
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Setup" tight>
        <Kv rows={[
          ['Model', 'ANTHROPIC_API_KEY, optional ANTHROPIC_MODEL (default claude-opus-5-5) in .env.local'],
          ['Figma', 'FIGMA_TOKEN in .env.local'],
          ['Local files', `Read only from: ${status.localRead.roots.join(', ') || 'the practice folders (needs npm run dev)'}`],
          ['Slide engine', `Nagarro Master Slides ${slidesVersion.artifactVersion} · ${slidesVersion.templates} templates · ${slidesVersion.upstream}`],
          ['Last check', checkedAt ? new Date(checkedAt).toLocaleTimeString('en-GB') : 'not yet'],
        ]} />
      </Panel>
    </div>
  )
}
