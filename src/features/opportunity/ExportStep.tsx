import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Download, Copy, Presentation, Share2, ExternalLink } from 'lucide-react'
import { Callout, Chip, Panel, Sheet, Field } from '@/shell/ui'
import { KindChip } from '@/shell/provenance'
import { downloadFile } from '@/shell/download'
import { act, usePaths, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useRegistry } from '@/knowledge/hooks'
import { resolveDocs } from '@/knowledge/resolve'
import { client } from '@/app/routes'
import { exportNotesMd, exportOpportunityJson, exportRequirementsCsv, exportResponseMd } from '@/opportunity/exports'
import { generationPacket } from '@/opportunity/packet'
import { opportunitySources, publishRefusals } from '@/opportunity/selectors'
import type { Opportunity } from '@/state/types'
import { useRequestText } from './hooks'

function PublishSheet({ o, onClose }: { o: Opportunity; onClose: () => void }) {
  const project = useProject()
  const registry = useRegistry()
  const r = o.responses[0]!
  const [title, setTitle] = useState(`${project.client.name} · proposal summary`)
  // Start from what can be published as it stands: no open questions, nothing a refusal would block.
  const [ticked, setTicked] = useState<string[]>(() => r.draft.filter((d) => d.kind !== 'open-question' && !publishRefusals(o, [d.id], registry, project.client.name).length).map((d) => d.id))
  const [refused, setRefused] = useState<string[]>([])
  const by = new Map(registry.map((s) => [s.id, s]))
  const preview = publishRefusals(o, ticked, registry, project.client.name)
  return (
    <Sheet wide title={`Share a summary with ${project.client.name}`} onClose={onClose} actions={
      <button className="btn btn--primary" disabled={!ticked.length || preview.length > 0} onClick={() => {
        const out = act().publishOutput(project.id, o.id, { title, sectionIds: ticked })
        if ('refused' in out) setRefused(out.refused.map((x) => x.reason))
        else onClose()
      }} data-testid="publish-confirm">Publish to the client workspace</button>
    }>
      <Callout tone="info">Only what you tick appears in the client workspace, under Evidence and next steps › Proposal summary. Drafts, internal notes and the knowledge library stay internal. Citations to internal-only sources are removed from the client copy, and a section that still quotes internal-only material word for word cannot be published until you rewrite it.</Callout>
      {!project.published && <Callout tone="warn">{project.client.name} has no published version yet, so the client workspace cannot open. The summary is saved and appears once v1 is published from the engagement page.</Callout>}
      <Field label="Title">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <ul className="checklist">
        {r.draft.map((d) => {
          const internal = d.citations.some((c) => by.get(c.sourceId)?.audience === 'internal')
          const blockers = publishRefusals(o, [d.id], registry, project.client.name)
          return (
            <li key={d.id} className="checklist__item">
              <label className="toggle" style={{ alignItems: 'flex-start' }}>
                <input type="checkbox" checked={ticked.includes(d.id)} onChange={(e) => setTicked(e.target.checked ? [...ticked, d.id] : ticked.filter((x) => x !== d.id))} data-testid={`publish-${d.id}`} />
                <span>
                  <strong>{d.heading}</strong> <KindChip kind={d.kind} />
                  {internal && !blockers.length && <Chip tone="warn">cites internal material · citation removed</Chip>}
                  {blockers.map((b) => <div key={b.reason} className="xs" style={{ color: 'var(--n-err)' }}>{b.reason}</div>)}
                  <div className="xs muted">{d.body.replace(/\s+/g, ' ').slice(0, 140)}…</div>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {(refused.length > 0 || preview.length > 0) && <Callout tone="err">{[...new Set([...refused, ...preview.map((p) => p.reason)])].join(' ')}</Callout>}
    </Sheet>
  )
}

export function ExportStep({ o }: { o: Opportunity }) {
  const project = useProject()
  const r = usePaths()
  const navigate = useNavigate()
  const registry = useRegistry()
  const { text } = useRequestText(o)
  const [publishing, setPublishing] = useState(false)
  const [busy, setBusy] = useState(false)
  const resp = o.responses[0]
  const outputs = project.clientExperience.publishedOutputs.filter((x) => x.opportunityId === o.id)
  const live = outputs.find((x) => !x.retractedAt)
  const deckMap = useStore((s) => s.projects[project.id]?.decks)
  const decks = useMemo(() => Object.values(deckMap ?? {}).filter((d) => d.opportunityId === o.id), [deckMap, o.id])
  const selected = useMemo(() => opportunitySources(registry, project.id, o), [registry, project.id, o])
  if (!resp) return <Callout tone="warn">Draft the response first (step 6).</Callout>

  const withDocs = async <T,>(fn: (docs: Awaited<ReturnType<typeof resolveDocs>>) => T) => {
    setBusy(true)
    const docs = await resolveDocs(selected.filter((s) => s.docId).map((s) => s.docId!))
    setBusy(false)
    return fn(docs)
  }

  return (
    <div className="stack">
      <div className="grid grid--2">
        <Panel title="Download">
          <div className="stack">
            <button className="btn btn--secondary" disabled={busy} onClick={() => withDocs((docs) => downloadFile(exportResponseMd(o, resp, project.client.name, registry, docs)))} data-testid="export-response-md"><Download /> Response (markdown, with footnoted sources)</button>
            <button className="btn btn--secondary" onClick={() => downloadFile(exportRequirementsCsv(o, registry))} data-testid="export-requirements-csv"><Download /> Requirements matrix (CSV)</button>
            <button className="btn btn--secondary" onClick={() => downloadFile(exportNotesMd(o, resp, registry))} data-testid="export-notes-md"><Download /> What it is built from (notes)</button>
            <button className="btn btn--secondary" onClick={() => downloadFile(exportOpportunityJson(o, text))} data-testid="export-opportunity-json"><Download /> Everything (JSON)</button>
            <button className="btn btn--ghost" disabled={busy} onClick={() => withDocs((docs) => {
              const p = generationPacket(o, project.client.name, text, selected.filter((s) => s.docId && docs[s.docId]), docs)
              downloadFile(p)
            })} data-testid="export-packet"><Copy /> Generation packet for your own Claude or ChatGPT chat</button>
            <p className="xs muted">Files download from this browser. Nothing is uploaded anywhere. The packet holds the rules, the request, the requirements and only the most relevant source sections, so it stays small.</p>
          </div>
        </Panel>
        <Panel title={`Share a summary with ${project.client.name}`}>
          <p className="small">Only what you tick appears in the client workspace. Drafts, notes and the library stay internal.</p>
          {live ? (
            <p><Chip tone="mint">Shared · summary of response v{live.responseVersion}</Chip>{live.responseVersion < resp.version && <Chip tone="warn">behind (latest is v{resp.version})</Chip>}</p>
          ) : (
            <p className="muted small">Not shared yet.</p>
          )}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={() => setPublishing(true)} data-testid="publish-open"><Share2 /> Review and publish</button>
            {live && <button className="btn btn--ghost btn--sm" onClick={() => act().retractOutput(project.id, live.id)}>Withdraw</button>}
            {live && project.published && (
              <button className="btn btn--mint btn--sm" onClick={() => {
                const to = act().openClientExperience(project.id)
                if (to) navigate(client(project.slug).proposalSummary)
              }} data-testid="see-as-client"><ExternalLink /> See it as the client</button>
            )}
          </div>
        </Panel>
      </div>
      <div className="panel panel--ink">
        <h3 style={{ marginTop: 0 }}>Prepare a presentation</h3>
        <p>Turn this reviewed response into a deck on the Nagarro Master Slides (Carolina Baptista's engine): the 12-point brief, a slide plan to approve, the rendered slides with speaker notes and the moments to switch to the live demo.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--on-dark" to={`${r.presentationNew}?from=${o.id}`} data-testid="prepare-presentation"><Presentation /> Prepare a presentation</Link>
          {decks.map((d) => <Link key={d.id} className="btn btn--on-dark-ghost btn--sm" to={r.presentation(d.id)}>{d.title}</Link>)}
        </div>
      </div>
      {publishing && <PublishSheet o={o} onClose={() => setPublishing(false)} />}
    </div>
  )
}
