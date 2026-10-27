import { RefreshCw } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Chip, Kv, Panel, Stat } from '@/shell/ui'
import { LiveBadge } from '@/shell/provenance'
import { useStore } from '@/state/store'
import { useIntegrationStatus } from '@/integrations/status'
import slidesVersion from '@/deck/engine.generated.json'
import { ToolAddresses } from '@/features/tools/ToolAddresses'

export function IntegrationsPage() {
  const { status, refresh, loading, checkedAt } = useIntegrationStatus()
  const projects = useStore((s) => s.projects)
  const usage = Object.values(projects).flatMap((p) => Object.values(p.opportunities ?? {})).reduce((a, o) => ({ calls: a.calls + o.aiUsage.calls, tokens: a.tokens + o.aiUsage.inputTokens + o.aiUsage.outputTokens }), { calls: 0, tokens: 0 })
  return (
    <div className="page">
      <PageHead title="Integrations and AI usage" lead="What this machine can reach, and how many model tokens the workspace has spent. Keys stay in .env.local on the local server; the browser only learns whether each one is set." actions={<button className="btn btn--secondary" onClick={() => refresh()} disabled={loading}><RefreshCw /> Check again</button>} />
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
