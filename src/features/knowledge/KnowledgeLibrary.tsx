import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Figma, FolderOpen, Upload, Link2, Github, Plus } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Empty, Panel, Stat, Segmented, Sheet } from '@/shell/ui'
import { ApprovalChip, AudienceChip, ScopeChip, SourceBadge } from '@/shell/provenance'
import { useDoc } from '@/knowledge/useDoc'
import { SectionList } from './SectionList'
import type { KnowledgeDocument } from '@/state/types'
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

/** What each kind of source is usually good for, so colleagues can pick material for their task. */
export const GOOD_FOR: Record<string, string> = {
  'point-of-view': 'Opening a conversation, talks and articles.',
  offering: 'Proposals and first meetings: what we sell, and when it fits.',
  approach: 'Planning an engagement and explaining how we would run it.',
  'governance-model': 'Questions about ownership, reviews and approving changes.',
  method: 'Delivery: running an assessment, a readout or a handover.',
  deck: 'Reusing slides and wording. Check who may see it first.',
  template: 'Starting a document or deck in the house format.',
  'proposal-section': 'Answering a request with wording that has worked before.',
  'case-study': 'Proof in proposals. Internal until each client clears it.',
  resource: 'Background reading and references.',
  request: 'A client’s own request: only for that client’s work.',
}

function SourcePreview({ source, clientName, onClose }: { source: KnowledgeSource; clientName?: string; onClose: () => void }) {
  const { doc, loading } = useDoc(source.docId)
  const kdoc = doc && 'sections' in doc ? (doc as KnowledgeDocument) : null
  const day = (t?: number) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
  return (
    <Sheet
      wide
      title={source.title}
      onClose={onClose}
      actions={
        <Link className="btn btn--primary" to={practice.knowledgeSource(source.id)} data-testid="open-source">
          Open the full source
        </Link>
      }
    >
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <ApprovalChip approval={source.approval} title={source.approvalNote} />
        <AudienceChip audience={source.audience} />
        <ScopeChip source={source} clientName={clientName} />
        <SourceBadge source={source} />
      </div>
      <dl className="brief" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div>
          <dt>Good for</dt>
          <dd>{GOOD_FOR[source.kind] ?? 'Background reading.'}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>
            {source.owner ?? 'Not named'}
            {source.approval === 'approved' && source.approvedBy ? ` · approved by ${source.approvedBy}${source.approvedAt ? ` on ${day(source.approvedAt)}` : ''}` : ''}
          </dd>
        </div>
        <div>
          <dt>Freshness</dt>
          <dd>{source.readAt ? `Text read ${day(source.readAt)}` : source.availabilityMessage ?? 'Not read yet'}</dd>
        </div>
      </dl>
      {source.audience === 'internal' && <Callout tone="warn">Internal only: you can learn from it, but don’t quote it to a client.</Callout>}
      {source.approval !== 'approved' && <Callout tone="info">Not approved yet. Drafts can use it as a recommendation, never as a statement backed by a source. Ask {source.owner ?? 'its owner'} to review it.</Callout>}
      {kdoc ? (
        <>
          <p className="small muted">The first passages the hub read ({kdoc.sections.length} in total):</p>
          <SectionList doc={kdoc} limit={3} compact />
        </>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <p className="small muted">{source.location.type === 'url' ? 'A link only: the hub does not read its text.' : 'No text has been read from this source yet.'}</p>
      )}
    </Sheet>
  )
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
  const [audience, setAudience] = useState<'all' | 'client' | 'internal'>('all')
  const [preview, setPreview] = useState<KnowledgeSource | null>(null)
  const adding = pathname === practice.knowledgeAdd

  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return registry.filter((s) => {
      if (tab === 'practice' && s.scope.kind !== 'practice') return false
      if (tab === 'client' && s.scope.kind !== 'client') return false
      if (tab === 'attention' && !needsAttention(s)) return false
      if (kind !== 'all' && s.kind !== kind) return false
      if (approval !== 'all' && s.approval !== approval) return false
      if (audience === 'client' && s.audience === 'internal') return false
      if (audience === 'internal' && s.audience !== 'internal') return false
      const hay = `${s.title} ${s.owner ?? ''} ${s.tags.join(' ')} ${locationLabel(s)}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [registry, q, kind, approval, audience, tab])

  const approved = registry.filter((s) => s.approval === 'approved').length
  const attention = registry.filter(needsAttention).length
  const lastRead = Math.max(0, ...registry.map((s) => s.readAt ?? 0))
  const clientName = (s: KnowledgeSource) => (s.scope.kind === 'client' ? projects[s.scope.projectId]?.client.name : undefined)

  return (
    <div className="page">
      <PageHead
        title="Knowledge library"
        lead="Material the practice can reuse: offers, points of view, methods, decks, proposal sections and case studies. It covers the whole practice; the few items that belong to one client are marked. Check approval and audience before you show anything to a client. Drafts for client requests only quote what is here."
        actions={
          <button className="btn btn--primary" onClick={() => navigate(practice.knowledgeAdd)} data-testid="add-source">
            <Plus /> Add a source
          </button>
        }
      />
      <div className="grid grid--4">
        <Stat label="Sources" value={String(registry.length)} hint={`${registry.filter((s) => s.availability === 'available').length} with readable text`} />
        <Stat label="Approved" value={String(approved)} hint="can back an answer in a draft" />
        <Stat label="Need attention" value={String(attention)} hint="out of date, not read yet, or no access" tone={attention ? 'warn' : undefined} />
        <Stat label="Last read" value={lastRead ? relTime(lastRead) : '—'} hint="most recent time text was read" />
      </div>
      <p className="xs muted">
        How text gets here: Figma decks were captured on 22 Oct 2026 (text only) · practice files {integrations.offline ? 'cannot be read in a static build' : 'are read from this machine'} · Figma refresh {integrations.figma.configured ? 'is on' : 'is off (no token; use the knowledge export plugin instead)'}. <Link to={practice.integrations}>Details</Link>
      </p>
      {tab === 'attention' && attention > 0 && <Callout tone="warn">These sources can’t back an answer until someone reads, re-approves or fixes access to them. Approve a source only after reading what the library captured.</Callout>}
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search by title, owner or topic" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sources" data-testid="source-search" />
        <select className="select" style={{ maxWidth: 220 }} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind">
          <option value="all">All kinds</option>
          {KIND_OPTIONS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
          <option value="request">Client request</option>
        </select>
        <select className="select" style={{ maxWidth: 220 }} value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} aria-label="Who may see it" data-testid="audience-filter">
          <option value="all">Any audience</option>
          <option value="client">Safe to show clients</option>
          <option value="internal">Internal only</option>
        </select>
        <Segmented ariaLabel="Approval" value={approval} onChange={(v) => setApproval(v)} options={[{ id: 'all', label: 'All' }, { id: 'approved', label: 'Approved' }, { id: 'draft', label: 'Draft' }, { id: 'outdated', label: 'Out of date' }]} />
      </div>
      <Panel flush>
        {rows.length === 0 ? (
          <Empty>No sources match. Clear a filter, or add one: a Figma link, a practice file or an upload is enough.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table table--library">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Who may see it</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const Icon = LOC_ICON[s.location.type]
                  return (
                    <tr key={s.id} className="is-clickable" onClick={() => setPreview(s)} data-testid={`source-row-${s.id}`}>
                      <td>
                        <button className="link-btn" onClick={(e) => { e.stopPropagation(); setPreview(s) }} aria-label={`Preview ${s.title}`}>
                          <strong>{s.title}</strong>
                        </button>
                        <div className="xs muted row" style={{ gap: 6 }}>
                          {KIND_OPTIONS.find((k) => k.id === s.kind)?.label ?? 'Client request'} · <Icon style={{ width: 12, flex: 'none' }} />
                          <span className="truncate" style={{ maxWidth: 260 }}>{locationLabel(s)}</span>
                        </div>
                      </td>
                      <td className="small">{s.owner ?? '—'}</td>
                      <td>
                        <span className="stack" style={{ gap: 4, alignItems: 'flex-start' }}>
                          <ApprovalChip approval={s.approval} title={s.approvalNote} />
                          <SourceBadge source={s} />
                        </span>
                      </td>
                      <td><AudienceChip audience={s.audience} /></td>
                      <td><ScopeChip source={s} clientName={clientName(s)} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {preview && <SourcePreview source={preview} clientName={clientName(preview)} onClose={() => setPreview(null)} />}
      {adding && <AddSourceSheet onClose={() => navigate(practice.knowledge)} returnTo={params.get('return') ?? undefined} />}
    </div>
  )
}
