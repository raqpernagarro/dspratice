import { Link, useNavigate, useParams } from 'react-router'
import { RefreshCw, Upload } from 'lucide-react'
import { act, usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Code, Kv, Panel, SimBadge } from '@/shell/ui'
import { relTime, staleAge } from '@/state/selectors'
import { HERO_TOKEN_ID } from '@/fixtures/demo-brand/tokens'

export function ChannelsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const selected = sys.channels.find((c) => c.id === id)
  const stale = sys.channels.filter((c) => c.status === 'stale')
  const publishing = sys.channels.some((c) => c.status === 'publishing')
  const hero = sys.tokens.find((t) => t.id === HERO_TOKEN_ID)!
  const heroMerged = sys.findings.find((f) => f.id === 'f-hover-dark')?.status === 'merged'

  if (selected) {
    const beforeValue = heroMerged ? '#1f6feb' : hero.values.dark
    const diffBefore = selected.sample.replace('#1F7A6B', hero.values.light.toUpperCase())
    const diffAfter = selected.id === 'design-md' ? `${diffBefore}\n  interactive.primary.hover.dark: "${hero.values.dark.toUpperCase()}" # must differ from default` : selected.id === 'v0-registry' ? `{ "name": "demo-brand", "items": [{ "name": "button", "type": "registry:ui", "files": ["button.tsx"], "cssVars": { "light": { "interactive-primary": "${hero.values.light}" }, "dark": { "interactive-primary-hover": "${hero.values.dark}" } } }] }` : selected.sample
    return (
      <div className="page">
        <PageHead
         
          title={selected.name}
          lead={`${selected.format} · read by ${selected.consumer}. Generated from contract v${sys.contract.version}; never edited by hand.`}
          eyebrow={<Chip tone={selected.status === 'fresh' ? 'ok' : selected.status === 'publishing' ? 'info' : 'warn'}>{selected.status === 'fresh' ? `synced ${relTime(selected.lastPublished)}` : selected.status === 'publishing' ? 'publishing…' : `stale · ${staleAge(selected.lastPublished)}`}</Chip>}
          actions={
            <>
              <Btn variant="ghost" onClick={() => navigate(r.channels)}>
                All channels
              </Btn>
              <Btn onClick={() => act().publishChannels([selected.id])} disabled={selected.status === 'publishing'} loading={selected.status === 'publishing'}>
                <Upload /> Publish this channel
              </Btn>
            </>
          }
        />
        {selected.status === 'stale' && (
          <Callout tone="warn">
            Out of date: {selected.staleReason}. The file below is what consumers still read; the diff shows what changes on publish.
          </Callout>
        )}
        <div className="grid grid--2">
          <Panel title={selected.status === 'stale' ? 'Out of date' : 'Published'} tight>
            <Code>{selected.status === 'stale' ? diffBefore.replace(hero.values.dark.toUpperCase(), beforeValue.toUpperCase()) : diffAfter}</Code>
            <Kv rows={[['Last published', relTime(selected.lastPublished)], ['Format', selected.format], ['Consumers', selected.consumer]]} />
          </Panel>
          <Panel title="Generated from the contract now" tight actions={<SimBadge what="Generated in memory" />}>
            <Code>{diffAfter}</Code>
            <span className="xs muted">{selected.status === 'stale' ? 'Lines that differ from the last generated file would be highlighted.' : 'Identical to the last generated file.'}</span>
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead
       
        title="Keep AI tools on the system"
        lead="Each AI tool your teams use reads its own file format: Figma, Storybook, Claude, v0 and others. All of these files are generated from the system contract, so one change reaches every tool. After a merge they show as out of date until they are regenerated. Nobody edits them by hand."
        actions={
          <Btn onClick={() => act().publishChannels()} disabled={publishing} loading={publishing}>
            <RefreshCw /> Publish all
          </Btn>
        }
      />
      {stale.length > 0 && !publishing && (
        <Callout tone="warn">
          {stale.length} channel{stale.length > 1 ? 's are' : ' is'} stale: {stale.map((c) => c.name).join(', ')}. Agents reading them get old values until you publish.
        </Callout>
      )}
      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>AI tool file</th>
                <th>Format</th>
                <th>Read by</th>
                <th>Status</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {sys.channels.map((c) => (
                <tr key={c.id} className="is-clickable" onClick={() => navigate(r.channel(c.id))}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td className="small">{c.format}</td>
                  <td className="small muted">{c.consumer}</td>
                  <td>
                    <Chip tone={c.status === 'fresh' ? 'ok' : c.status === 'publishing' ? 'info' : 'warn'}>{c.status === 'fresh' ? '✓ synced' : c.status === 'publishing' ? 'publishing…' : '⚠ stale'}</Chip>
                  </td>
                  <td className="small muted">{c.status === 'publishing' ? '…' : relTime(c.lastPublished)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="row">
        <SimBadge detail="Publishing generates each format in memory from the contract. Nothing is uploaded." />
        <Link to={r.guide('channels')} className="small">
          Why one source, every channel →
        </Link>
      </div>
    </div>
  )
}
