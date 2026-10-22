import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Figma, FolderOpen, Upload, Link2, Github, Plus } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Chip, Empty, Panel, Stat, Segmented } from '@/shell/ui'
import { ApprovalChip, AudienceChip, ScopeChip, SourceBadge, LiveBadge } from '@/shell/provenance'
import { useRegistry } from '@/knowledge/hooks'
import { needsAttention } from '@/knowledge/selectors'
import { useIntegrations } from '@/integrations/status'
import { practice } from '@/app/routes'
import { useStore } from '@/state/store'
import { relTime } from '@/state/selectors'
import { AddSourceSheet, KIND_OPTIONS } from './AddSourceSheet'
import type { Approval, KnowledgeSource } from '@/state/types'

const LOC_ICON = { figma: Figma, figjam: Figma, 'figma-folder': Figma, local: FolderOpen, upload: Upload, url: Link2, repo: Github } as const

export function locationLabel(s: KnowledgeSource) {
  const l = s.location
  switch (l.type) {
    case 'figma':
    case 'figjam':
      return l.label ?? `Figma ${l.fileKey}`
    case 'figma-folder':
      return l.label ?? `Figma team ${l.teamId}`
    case 'local':
      return l.path
    case 'upload':
      return l.filename
    case 'url':
    case 'repo':
      return l.url.replace(/^https?:\/\//, '')
  }
}

export function KnowledgeLibrary() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const tab = params.get('tab')
  const registry = useRegistry()
  const projects = useStore((s) => s.projects)
  const integrations = useIntegrations()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [approval, setApproval] = useState<'all' | Approval>('all')
  const adding = pathname === practice.knowledgeAdd

  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return registry.filter((s) => {
      if (tab === 'practice' && s.scope.kind !== 'practice') return false
      if (tab === 'client' && s.scope.kind !== 'client') return false
      if (tab === 'attention' && !needsAttention(s)) return false
      if (kind !== 'all' && s.kind !== kind) return false
      if (approval !== 'all' && s.approval !== approval) return false
      const hay = `${s.title} ${s.owner ?? ''} ${s.tags.join(' ')} ${locationLabel(s)}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [registry, q, kind, approval, tab])

  const approved = registry.filter((s) => s.approval === 'approved').length
  const attention = registry.filter(needsAttention).length
  const lastRead = Math.max(0, ...registry.map((s) => s.readAt ?? 0))

  return (
    <div className="page">
      <PageHead
        screen="knowledge"
        title="Knowledge library"
        lead="The practice's reusable material: point of view, offerings, approaches, governance models, methods, decks, proposal sections and approved case studies. Every draft cites what is here, and only what is here."
        eyebrow={<Chip tone="ink">Internal only</Chip>}
        actions={
          <button className="btn btn--primary" onClick={() => navigate(practice.knowledgeAdd)} data-testid="add-source">
            <Plus /> Add a source
          </button>
        }
      />
      <div className="grid grid--4">
        <Stat label="Sources" value={String(registry.length)} hint={`${registry.filter((s) => s.availability === 'available').length} readable`} />
        <Stat label="Approved" value={String(approved)} hint="can back a 'supported' answer" />
        <Stat label="Need attention" value={String(attention)} hint="outdated, not read or no access" tone={attention ? 'warn' : undefined} />
        <Stat label="Last read" value={lastRead ? relTime(lastRead) : '—'} hint="most recent real read" />
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {integrations.figma.configured ? <LiveBadge what="Figma REST connected" /> : <Chip tone="dashed" title="Read Figma with the knowledge plugin or figma-cli and upload the JSON, or add FIGMA_TOKEN">Figma REST not configured · plugin and figma-cli work</Chip>}
        {integrations.offline ? <Chip tone="dashed">Static build · local files cannot be read</Chip> : <LiveBadge what="Local practice files readable" />}
        <Chip tone="outline" title="Captured through Claude Code's Figma MCP on 22 Oct 2026, text only">Figma snapshots captured 22 Oct via MCP</Chip>
      </div>
      {tab === 'attention' && attention > 0 && <Callout tone="warn">These sources cannot back an answer until someone reads, re-approves or fixes access to them. Approve a source only after reading what the library captured.</Callout>}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search title, owner, topic" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sources" data-testid="source-search" />
        <select className="select" style={{ maxWidth: 220 }} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind">
          <option value="all">All kinds</option>
          {KIND_OPTIONS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
          <option value="request">Request</option>
        </select>
        <Segmented ariaLabel="Approval" value={approval} onChange={(v) => setApproval(v)} options={[{ id: 'all', label: 'All' }, { id: 'approved', label: 'Approved' }, { id: 'draft', label: 'Draft' }, { id: 'outdated', label: 'Outdated' }]} />
      </div>
      <Panel flush>
        {rows.length === 0 ? (
          <Empty>No sources match. Start with Nuno's and Rui's material: a Figma link, a practice file or an upload is enough.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Where</th>
                  <th>Owner</th>
                  <th>Read</th>
                  <th>Approval</th>
                  <th>Audience</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const Icon = LOC_ICON[s.location.type]
                  return (
                    <tr key={s.id} className="is-clickable" onClick={() => navigate(practice.knowledgeSource(s.id))} data-testid={`source-row-${s.id}`}>
                      <td>
                        <strong>{s.title}</strong>
                        <div className="xs muted">{KIND_OPTIONS.find((k) => k.id === s.kind)?.label ?? s.kind}</div>
                      </td>
                      <td className="small">
                        <span className="row" style={{ gap: 6 }}>
                          <Icon style={{ width: 14, flex: 'none' }} />
                          <span className="truncate" style={{ maxWidth: 220 }}>{locationLabel(s)}</span>
                        </span>
                      </td>
                      <td className="small">{s.owner ?? '—'}</td>
                      <td><SourceBadge source={s} /></td>
                      <td><ApprovalChip approval={s.approval} title={s.approvalNote} /></td>
                      <td><AudienceChip audience={s.audience} /></td>
                      <td><ScopeChip source={s} clientName={s.scope.kind === 'client' ? projects[s.scope.projectId]?.client.name : undefined} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {adding && <AddSourceSheet onClose={() => navigate(practice.knowledge)} returnTo={params.get('return') ?? undefined} />}
    </div>
  )
}
