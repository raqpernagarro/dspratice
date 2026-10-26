import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Download, Copy, Presentation, Share2, ExternalLink, MonitorPlay } from 'lucide-react'
import { Callout, Chip, Panel, Sheet, Field } from '@/shell/ui'
import { KindChip } from '@/shell/provenance'
import { downloadFile } from '@/shell/download'
import { act, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useRegistry } from '@/knowledge/hooks'
import { resolveDocs } from '@/knowledge/resolve'
import { client, practice } from '@/app/routes'
import { usePresentDemo } from '@/shell/present'
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
  const unchecked = new Set(r.draft.filter((d) => ticked.includes(d.id)).flatMap((d) => d.requirementIds).filter((id) => o.checked?.[id]?.version !== r.version))
  return (
    <Sheet wide title="Show a summary in the client demo" onClose={onClose} actions={
      <button className="btn btn--primary" disabled={!ticked.length || preview.length > 0} onClick={() => {
        const out = act().publishOutput(project.id, o.id, { title, sectionIds: ticked })
        if ('refused' in out) setRefused(out.refused.map((x) => x.reason))
        else onClose()
      }} data-testid="publish-confirm">Add to the client demo</button>
    }>
      <Callout tone="info">The ticked sections appear in the client demo’s last chapter, as a proposal summary you can walk through in the meeting. Drafts, internal notes and the knowledge library stay here. References to internal-only sources are removed from the copy, and a section that quotes internal-only material word for word has to be rewritten first.</Callout>
      {unchecked.size > 0 && <Callout tone="warn">{unchecked.size} answer{unchecked.size > 1 ? 's' : ''} in the ticked sections {unchecked.size > 1 ? 'have' : 'has'} not been checked yet. Check them in “Draft response”, or untick those sections.</Callout>}
      {!project.published && <Callout tone="warn">{project.client.name} has no client demo version yet. The summary is saved and appears once you update the client demo from the project’s Overview.</Callout>}
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
  const present = usePresentDemo()
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
  if (!resp) return <Callout tone="warn">Draft the answers first, in “Draft response”.</Callout>
  const download = (file: Parameters<typeof downloadFile>[0]) => {
    downloadFile(file)
    act().updateOpportunity(project.id, o.id, { exportedAt: Date.now() })
  }

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
            <button className="btn btn--secondary" disabled={busy} onClick={() => withDocs((docs) => download(exportResponseMd(o, resp, project.client.name, registry, docs)))} data-testid="export-response-md"><Download /> The response (Markdown, sources as footnotes)</button>
            <button className="btn btn--secondary" onClick={() => download(exportRequirementsCsv(o, registry))} data-testid="export-requirements-csv"><Download /> Requirements and answers (CSV)</button>
            <button className="btn btn--secondary" onClick={() => download(exportNotesMd(o, resp, registry))} data-testid="export-notes-md"><Download /> Notes: sources, assumptions and checks (Markdown)</button>
            <button className="btn btn--secondary" onClick={() => download(exportOpportunityJson(o, text))} data-testid="export-opportunity-json"><Download /> Everything, for another tool (JSON)</button>
            <button className="btn btn--ghost" disabled={busy} onClick={() => withDocs((docs) => {
              const p = generationPacket(o, project.client.name, text, selected.filter((s) => s.docId && docs[s.docId]), docs)
              download(p)
            })} data-testid="export-packet"><Copy /> Packet for your own Claude or ChatGPT chat</button>
            <p className="xs muted">Files are saved by this browser; nothing is uploaded. The packet holds the rules, the request, the requirements and only the most relevant source passages, so it stays small. To edit in Word or Google Docs, open the Markdown file there.</p>
          </div>
        </Panel>
        <Panel title="Show a summary in the client demo">
          <p className="small">The client demo can end with a short summary of this response, in its last chapter. Only the sections you choose appear. Drafts, notes and the library stay here.</p>
          {live ? (
            <p><Chip tone="mint">In the client demo · summary of v{live.responseVersion}</Chip>{live.responseVersion < resp.version && <Chip tone="warn">older than the latest draft (v{resp.version})</Chip>}</p>
          ) : (
            <p className="muted small">Not in the client demo.</p>
          )}
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--primary" onClick={() => setPublishing(true)} data-testid="publish-open"><Share2 /> {live ? 'Update the summary' : 'Choose the sections'}</button>
            {live && <button className="btn btn--ghost btn--sm" onClick={() => act().retractOutput(project.id, live.id)}>Remove from the client demo</button>}
            {live && project.published && (
              <button className="btn btn--mint btn--sm" onClick={() => present(project.id, { path: client(project.slug).proposalSummary })} data-testid="see-as-client"><ExternalLink /> Preview in the client demo</button>
            )}
          </div>
        </Panel>
      </div>
      <div className="panel panel--ink">
        <h3 style={{ marginTop: 0 }}>Present it</h3>
        <p>Turn this response into a Nagarro deck: slides on Carolina Baptista’s Nagarro Master Slides with speaker notes and the moments to switch to the live demo, checked as they are built. For .pptx or PDF, continue in Presentation Studio. Then rehearse the client demo for the same meeting.</p>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn--on-dark" to={`${practice.deckNew}?from=${o.id}`} data-testid="prepare-presentation"><Presentation /> Prepare a presentation</Link>
          <Link className="btn btn--on-dark-ghost" to={practice.meetingPrep(project.slug)}><MonitorPlay /> Prepare the client demo</Link>
          {decks.map((d) => <Link key={d.id} className="btn btn--on-dark-ghost btn--sm" to={practice.deck(d.id)}>Open “{d.title}”</Link>)}
        </div>
      </div>
      {publishing && <PublishSheet o={o} onClose={() => setPublishing(false)} />}
    </div>
  )
}
