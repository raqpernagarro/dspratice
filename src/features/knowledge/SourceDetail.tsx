import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { RefreshCw, Upload, CheckCircle2, AlertTriangle, Trash2, ExternalLink, Copy } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Chip, Empty, Kv, Panel } from '@/shell/ui'
import { ApprovalChip, AudienceChip, ScopeChip, SourceBadge } from '@/shell/provenance'
import { useSource } from '@/knowledge/hooks'
import { useDoc } from '@/knowledge/useDoc'
import { act } from '@/state/hooks'
import { useStore } from '@/state/store'
import { practice, nagarro } from '@/app/routes'
import { canReadAgain, readSource, readTaskId } from '@/state/flows/knowledge'
import { useIntegrations } from '@/integrations/status'
import { figmaProjects } from '@/integrations/api'
import { SectionList } from './SectionList'
import { AddSourceSheet, KIND_OPTIONS } from './AddSourceSheet'
import { locationLabel } from './KnowledgeLibrary'
import type { KnowledgeDocument } from '@/state/types'

export function SourceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const source = useSource(id)
  const { doc, loading } = useDoc(source?.docId)
  const job = useStore((s) => (id ? s.sim.jobs[readTaskId(id)] : undefined))
  const projects = useStore((s) => s.projects)
  const activity = useStore((s) => s.practice.knowledge.activity)
  const log = useMemo(() => activity.filter((a) => a.sourceId === id).slice(0, 6), [activity, id])
  useIntegrations()
  const [replacing, setReplacing] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [folder, setFolder] = useState<{ id: string; name: string }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!source) return <Navigate to={practice.knowledge} replace />
  const can = canReadAgain(source)
  const kdoc = doc && 'sections' in doc ? (doc as KnowledgeDocument) : null
  const usedIn = Object.values(projects).flatMap((p) =>
    Object.values(p.opportunities ?? {})
      .filter((o) => o.sourceSelection.included.includes(source.id) || o.responses[0]?.inputs.sources.some((r) => r.sourceId === source.id))
      .map((o) => ({ p, o })),
  )
  const figmaUrl = source.location.type === 'figma' || source.location.type === 'figjam' ? `https://www.figma.com/${source.location.type === 'figjam' ? 'board' : 'design'}/${source.location.fileKey}/${source.location.nodeIds[0] ? `?node-id=${source.location.nodeIds[0].replace(':', '-')}` : ''}` : undefined

  return (
    <div className="page">
      <PageHead
       
        noTabs
        crumbs={[{ label: 'Sources', to: practice.knowledge }, { label: source.title }]}
        title={source.title}
        lead={source.approvalNote ?? 'Where it lives, who owns it, what the hub read from it, and where it has been used.'}
        eyebrow={
          <>
            <Chip tone="outline">{KIND_OPTIONS.find((k) => k.id === source.kind)?.label ?? source.kind}</Chip>
            <ScopeChip source={source} clientName={source.scope.kind === 'client' ? projects[source.scope.projectId]?.client.name : undefined} />
            <AudienceChip audience={source.audience} />
            <SourceBadge source={source} />
          </>
        }
        actions={
          <>
            <button className="btn btn--secondary" disabled={!can.ok || job?.status === 'running'} title={can.why} onClick={async () => {
              setError(null)
              const out = await readSource(source.id)
              if (out.status === 'failed') setError(out.error)
            }} data-testid="read-again">
              <RefreshCw /> {job?.status === 'running' ? 'Reading…' : 'Read again'}
            </button>
            <button className="btn btn--secondary" onClick={() => setReplacing(true)} data-testid="replace-source">
              <Upload /> Replace
            </button>
            {source.approval !== 'approved' ? (
              <button className="btn btn--mint" disabled={!kdoc} title={kdoc ? 'Approve after reading what was captured' : 'Read it first'} onClick={() => act().setApproval(source.id, 'approved')} data-testid="approve-source">
                <CheckCircle2 /> Approve
              </button>
            ) : (
              <button className="btn btn--secondary" onClick={() => act().setApproval(source.id, 'outdated', 'Marked outdated by a reviewer.')} data-testid="mark-outdated">
                <AlertTriangle /> Mark out of date
              </button>
            )}
          </>
        }
      />
      {error && <Callout tone="err">{error}</Callout>}
      {!can.ok && <Callout tone="info">{can.why}</Callout>}
      <div className="grid grid--side">
        <div className="stack">
          <Panel title="What the hub read" actions={kdoc ? <span className="xs muted">{kdoc.stats.sections} sections · {kdoc.stats.chars.toLocaleString()} characters</span> : undefined}>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : kdoc ? (
              <SectionList doc={kdoc} highlightId={location.hash.slice(1) || undefined} />
            ) : source.availability === 'inaccessible' ? (
              <Callout tone="err">{source.availabilityMessage ?? 'The hub has no access to this source.'}</Callout>
            ) : source.availability === 'unsupported' ? (
              <Callout tone="warn">{source.availabilityMessage ?? 'This format is not read. Export it to PDF or markdown, or paste the text with Replace.'}</Callout>
            ) : (
              <Empty>{source.availabilityMessage ?? 'Nothing has been read from this source yet.'}</Empty>
            )}
          </Panel>
          {kdoc && (kdoc.missing.length > 0 || kdoc.warnings.length > 0) && (
            <Panel title="Not read, and why">
              <ul className="small">
                {kdoc.missing.map((m, i) => (
                  <li key={i}>
                    <strong>{m.what}</strong>: {m.why}
                  </li>
                ))}
                {kdoc.warnings.map((w, i) => (
                  <li key={`w${i}`}>{w}</li>
                ))}
              </ul>
            </Panel>
          )}
          {source.location.type === 'figma-folder' && (
            <Panel title="Files in this Figma folder">
              <p className="small muted">Folder discovery needs Figma REST (FIGMA_TOKEN with projects:read). The Figma MCP cannot list folders.</p>
              <button className="btn btn--secondary btn--sm" onClick={async () => {
                setError(null)
                try {
                  const r = await figmaProjects(source.location.type === 'figma-folder' ? source.location.teamId ?? '' : '')
                  setFolder(r.projects)
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e))
                }
              }}>List folders</button>
              {folder && (
                <ul className="list">
                  {folder.map((f) => (
                    <li key={f.id} className="list__item">{f.name} <span className="xs muted">folder {f.id}</span></li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
        <div className="stack">
          <Panel title="Details" tight>
            <Kv
              rows={[
                ['Location', <span className="row" style={{ gap: 6 }}><span className="truncate" style={{ maxWidth: 180 }}>{locationLabel(source)}</span>{figmaUrl ? <a href={figmaUrl} target="_blank" rel="noreferrer" title="Open in Figma"><ExternalLink style={{ width: 14 }} /></a> : <button className="icon-btn" title="Copy" onClick={() => navigator.clipboard?.writeText(locationLabel(source))}><Copy style={{ width: 14 }} /></button>}</span>],
                ['Owner', source.owner ?? '—'],
                ['Approval', <span className="row" style={{ gap: 6 }}><ApprovalChip approval={source.approval} />{source.approvedBy && source.approval === 'approved' ? <span className="xs muted">by {source.approvedBy}{source.approvedAt ? ` · ${new Date(source.approvedAt).toLocaleDateString('en-GB')}` : ''}</span> : null}</span>],
                ['Last read', source.readAt ? `${new Date(source.readAt).toLocaleString('en-GB')} · ${source.readBy}` : 'Never'],
                ['Source changed', source.sourceUpdatedAt ? new Date(source.sourceUpdatedAt).toLocaleString('en-GB') : 'Unknown'],
                ['Topics', source.tags.length ? source.tags.join(', ') : '—'],
                ...(source.scope.kind === 'client' ? [['Reuse', source.scope.reusable ? `Approved for other clients${source.scope.reuseApprovedBy ? ` by ${source.scope.reuseApprovedBy}` : ''}` : `Only ${projects[source.scope.projectId]?.client.name ?? 'this client'}`] as [string, string]] : []),
              ]}
            />
            {source.scope.kind === 'client' && (
              <button className="btn btn--ghost btn--sm" onClick={() => act().setReusable(source.id, !(source.scope.kind === 'client' && source.scope.reusable))}>
                {source.scope.reusable ? 'Withdraw reuse' : 'Approve for reuse with other clients'}
              </button>
            )}
          </Panel>
          <Panel title="Used in" tight>
            {usedIn.length ? (
              <ul className="list">
                {usedIn.map(({ p, o }) => (
                  <li key={o.id} className="list__item">
                    <Link to={nagarro(p.slug).opportunity(o.id, 'response')}>{o.title}</Link>
                    <span className="xs muted"> · {p.client.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Not used by any opportunity yet.</p>
            )}
          </Panel>
          <Panel title="Read log" tight>
            {log.length ? (
              <ul className="list">
                {log.map((a) => (
                  <li key={a.id} className="list__item small">{a.text} <span className="xs muted">· {a.actor} · {new Date(a.ts).toLocaleString('en-GB')}</span></li>
                ))}
              </ul>
            ) : (
              <p className="small muted">{source.seed ? `Bundled snapshot${source.readAt ? `, read ${new Date(source.readAt).toLocaleDateString('en-GB')}` : ''}.` : 'No reads yet.'}</p>
            )}
          </Panel>
          <button className="btn btn--danger btn--sm" onClick={() => setConfirmRemove(true)}>
            <Trash2 /> Remove from the library
          </button>
          {confirmRemove && (
            <Callout tone="warn">
              Remove "{source.title}"? Opportunities that cite it keep their citations but show "source removed".{' '}
              <button className="btn btn--danger btn--sm" onClick={async () => {
                await act().removeSource(source.id)
                navigate(practice.knowledge)
              }}>Remove</button>{' '}
              <button className="btn btn--ghost btn--sm" onClick={() => setConfirmRemove(false)}>Cancel</button>
            </Callout>
          )}
        </div>
      </div>
      {replacing && <AddSourceSheet replace={source} onClose={() => setReplacing(false)} returnTo={practice.knowledgeSource(source.id)} />}
    </div>
  )
}
