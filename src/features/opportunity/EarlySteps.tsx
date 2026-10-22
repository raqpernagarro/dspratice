import { useMemo, useState } from 'react'
import { RotateCcw, Trash2, Plus, Sparkles } from 'lucide-react'
import { Callout, Chip, Field, Panel, Sheet, cx } from '@/shell/ui'
import { DropZone } from '@/shell/DropZone'
import { ProgressPanel } from '@/shell/ProgressPanel'
import { TemplateNote } from '@/shell/provenance'
import { act, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { readUpload, UnsupportedFormatError } from '@/knowledge/extract/upload'
import { resolveText } from '@/knowledge/resolve'
import { analyzeRequest, oppTask } from '@/state/flows/opportunity'
import { activeRequirements } from '@/opportunity/selectors'
import { detectContextHints } from '@/opportunity/extract'
import type { Category, Opportunity, RequestFormat } from '@/state/types'
import { useRequestText } from './hooks'

export const CATEGORY_LABEL: Record<Category, string> = {
  assessment: 'Assessment', governance: 'Governance', enablement: 'Enablement', 'tooling-ai': 'AI tooling', accessibility: 'Accessibility', 'delivery-approach': 'Approach and delivery', team: 'Team', commercial: 'Commercial', legal: 'Contract', timeline: 'Timing', technical: 'Technology', general: 'Other',
}
const UNANSWERABLE_LABEL: Record<string, string> = { pricing: 'Pricing', credentials: 'References or CVs', availability: 'Availability', timeline: 'Dates', contract: 'Contract terms', outcomes: 'Outcomes', 'undocumented-capability': 'Undocumented capability' }

/** The original request, read-only, with each requirement's span highlighted. */
export function RequestView({ text, o, active }: { text: string; o?: Opportunity; active?: string }) {
  const spans = (o?.requirements ?? []).filter((r) => r.status !== 'removed' && r.span && r.span.requestVersion === o?.request?.current).map((r) => ({ id: r.id, ...r.span! })).sort((a, b) => a.start - b.start)
  const parts: React.ReactNode[] = []
  let at = 0
  for (const s of spans) {
    if (s.start < at) continue
    parts.push(text.slice(at, s.start))
    parts.push(<mark key={s.id} className={cx('hl', active === s.id && 'is-active')} id={`span-${s.id}`}>{text.slice(s.start, s.end)}</mark>)
    at = s.end
  }
  parts.push(text.slice(at))
  return <div className="req-source" data-testid="request-view">{parts}</div>
}

export function RequestStep({ o }: { o: Opportunity }) {
  const project = useProject()
  const { text, loading } = useRequestText(o)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const importText = async (t: string, filename?: string, format: RequestFormat = 'text') => {
    setError(null)
    await act().setRequest(project.id, o.id, { text: t, filename, format })
    setReplacing(false)
  }
  const onFile = async (f: File) => {
    setBusy(true)
    setError(null)
    try {
      const out = await readUpload(f, { sourceId: `req-${o.id}`, docId: 'tmp', readBy: 'upload', readAt: Date.now() })
      await importText(out.text, f.name, out.format === 'markdown' ? 'markdown' : out.format === 'docx' ? 'docx' : out.format === 'pdf' ? 'pdf' : 'text')
      if (out.doc.missing.length) setError(`Read with gaps: ${out.doc.missing.map((m) => m.why).join('; ')}`)
    } catch (e) {
      setError(e instanceof UnsupportedFormatError ? e.message : e instanceof Error ? e.message : String(e))
    }
    setBusy(false)
  }
  const useSample = async () => {
    const t = await resolveText('seed.northwind-rfp')
    if (t) await importText(t, 'northwind-rfp.md', 'markdown')
  }
  if (!o.request || replacing)
    return (
      <Panel title={replacing ? 'Replace the request' : 'Add the request'}>
        {replacing && <Callout tone="warn">The current version stays in the history. The requirements and the draft will show as outdated until you run the analysis again.</Callout>}
        {error && <Callout tone="err">{error}</Callout>}
        <DropZone accept=".md,.markdown,.txt,.docx,.pdf" onFile={onFile} onText={(t) => importText(t)} busy={busy} pasteLabel="Paste the request instead" hint="RFP, questionnaire, email or meeting notes: .docx, .pdf (with a text layer), .md or .txt. Read in this browser; nothing leaves this machine." />
        <div className="row" style={{ gap: 8 }}>
          {!o.request && project.id === 'northwind' && (
            <button className="btn btn--ghost btn--sm" onClick={useSample} data-testid="use-sample-request">
              Use the Northwind sample request
            </button>
          )}
          {replacing && <button className="btn btn--ghost btn--sm" onClick={() => setReplacing(false)}>Cancel</button>}
        </div>
      </Panel>
    )
  const cur = o.request.versions.find((v) => v.version === o.request!.current)!
  return (
    <Panel
      title="The request, as received"
      actions={
        <span className="row" style={{ gap: 6 }}>
          <Chip tone="outline">v{cur.version} · {cur.format}{cur.filename ? ` · ${cur.filename}` : ''}</Chip>
          <button className="btn btn--secondary btn--sm" onClick={() => setReplacing(true)} data-testid="replace-request">Replace request</button>
        </span>
      }
    >
      <p className="small muted">The original is never changed. Requirements, drafts and decks record which version they were built from.</p>
      {error && <Callout tone="warn">{error}</Callout>}
      {loading ? <p className="muted">Loading…</p> : <RequestView text={text} />}
      {o.request.versions.length > 1 && <p className="xs muted">Versions: {o.request.versions.map((v) => `v${v.version} (${new Date(v.importedAt).toLocaleDateString('en-GB')})`).join(' · ')}</p>}
    </Panel>
  )
}

const AUDIENCES = ['Design leadership', 'Product and engineering leadership', 'Procurement', 'Executive sponsor', 'Design-system team', 'Mixed audience']
const DELIVERABLES = ['Written answers to each question', 'Proposal document', 'Engagement approach', 'Discovery questions', 'Governance explanation', 'Executive summary', 'Meeting narrative and deck']

export function ContextStep({ o }: { o: Opportunity }) {
  const project = useProject()
  const { text } = useRequestText(o)
  const hints = useMemo(() => detectContextHints(text), [text])
  const c = o.context
  const set = (patch: Partial<Opportunity['context']>) => act().setContext(project.id, o.id, patch)
  return (
    <div className="grid grid--side">
      <Panel title="Who is this for, and what do they expect back?">
        <div className="stack">
          <Field label="Client">
            <input className="input" value={c.client} onChange={(e) => set({ client: e.target.value })} />
          </Field>
          <Field label="Audience" hint="Who will read or hear the response">
            <input className="input" list="audiences" value={c.audience} onChange={(e) => set({ audience: e.target.value })} data-testid="ctx-audience" />
            <datalist id="audiences">{AUDIENCES.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          <Field label="What do they want to achieve?">
            <textarea className="textarea" rows={3} value={c.objective} onChange={(e) => set({ objective: e.target.value })} data-testid="ctx-objective" />
          </Field>
          <Field label="What do they expect back?">
            <input className="input" list="deliverables" value={c.deliverable} onChange={(e) => set({ deliverable: e.target.value })} />
            <datalist id="deliverables">{DELIVERABLES.map((d) => <option key={d} value={d} />)}</datalist>
          </Field>
          <Field label="Due" hint="Optional">
            <input className="input" value={c.dueDate ?? ''} onChange={(e) => set({ dueDate: e.target.value })} placeholder="e.g. 14 November 2026" />
          </Field>
          <div>
            <button className="btn btn--primary" onClick={() => act().confirmContext(project.id, o.id)} disabled={!c.client.trim()} data-testid="confirm-context">
              {c.confirmedAt ? 'Confirmed · confirm again' : 'Confirm the context'}
            </button>
            {c.confirmedAt && <span className="small muted"> Confirmed by {c.confirmedBy} · {new Date(c.confirmedAt).toLocaleString('en-GB')}</span>}
          </div>
        </div>
      </Panel>
      <div className="stack">
        <Callout tone="info">
          <strong>From the engagement:</strong> {project.engagement.package} · {project.engagement.stage} · lead {project.engagement.owner}. These prefill the approach recommendation; change the context if this opportunity differs.
        </Callout>
        {hints.length > 0 && (
          <Panel title="Found in the request" tight>
            <ul className="list">
              {hints.map((h) => (
                <li key={h.label} className="list__item">
                  <div className="list__body">
                    <span className="list__meta">{h.label}</span>
                    <span className="small">{h.value}</span>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => set({ [h.field]: h.value } as Partial<Opportunity['context']>)}>Use</button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  )
}

export function RequirementsStep({ o }: { o: Opportunity }) {
  const project = useProject()
  const { text } = useRequestText(o)
  const job = useStore((s) => s.sim.jobs[oppTask(project.id, o.id, 'analyze')])
  const [active, setActive] = useState<string | undefined>()
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newCat, setNewCat] = useState<Category>('general')
  const reqs = o.requirements.slice().sort((a, b) => a.order - b.order)
  const stale = o.extractedFrom && o.request && o.extractedFrom.requestVersion !== o.request.current
  if (!reqs.length || job?.status === 'running')
    return (
      <ProgressPanel
        title="Analyze this request"
        explain="Lists every question and requirement, with the exact passage it comes from, and flags what we never answer from documents (pricing, references, dates, contract terms). Rules only, no model."
        stages={['Reading the request', 'Listing what it asks for']}
        job={job}
        mode={<TemplateNote />}
        action={<button className="btn btn--primary" onClick={() => analyzeRequest(project.id, o.id)} disabled={job?.status === 'running'} data-testid="analyze-request"><Sparkles /> Analyze this request</button>}
      />
    )
  const activeCount = activeRequirements(o).length
  return (
    <div className="stack">
      {stale && (
        <Callout tone="warn">
          The request changed (now v{o.request!.current}). Run the analysis again; edits to requirements whose text still matches are kept.{' '}
          <button className="btn btn--secondary btn--sm" onClick={() => analyzeRequest(project.id, o.id)}>Analyze again</button>
        </Callout>
      )}
      <Callout tone="info">Check these before drafting. Fix the wording, untick what is not a real ask, add what was missed. Nothing here is sent anywhere, and the original on the left never changes.</Callout>
      <div className="grid grid--2 req-grid">
        <Panel title="Original request" flush>
          <RequestView text={text} o={o} active={active} />
        </Panel>
        <Panel title={`${activeCount} requirements`} actions={<button className="btn btn--secondary btn--sm" onClick={() => setAdding(true)} data-testid="add-requirement"><Plus /> Add</button>}>
          <ul className="list req-list">
            {reqs.map((r) => (
              <li key={r.id} className={cx('req-card', r.status === 'removed' && 'is-removed', active === r.id && 'is-active')} onMouseEnter={() => setActive(r.id)} data-testid={`req-${r.id}`}>
                <div className="row row--between" style={{ gap: 6 }}>
                  <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {r.number && <Chip tone="outline">{r.number}</Chip>}
                    <select className="select select--sm" value={r.primary} onChange={(e) => act().editRequirement(project.id, o.id, r.id, { primary: e.target.value as Category })} aria-label="Category" disabled={r.status === 'removed'}>
                      {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {r.unanswerable && <Chip tone="warn" title={r.unanswerable.reason}>Not from documents · {UNANSWERABLE_LABEL[r.unanswerable.kind]}</Chip>}
                    {r.status === 'edited' && <Chip tone="outline">Edited</Chip>}
                    {r.status === 'added' && <Chip tone="info">Added</Chip>}
                  </span>
                  <span className="row" style={{ gap: 4 }}>
                    <label className="toggle xs" title="Must be answered">
                      <input type="checkbox" checked={r.mustAnswer} onChange={(e) => act().editRequirement(project.id, o.id, r.id, { mustAnswer: e.target.checked })} disabled={r.status === 'removed'} /> Must answer
                    </label>
                    {r.status === 'removed' || r.status === 'edited' ? (
                      <button className="icon-btn" title="Restore the original" onClick={() => act().restoreRequirement(project.id, o.id, r.id)} data-testid={`restore-${r.id}`}><RotateCcw /></button>
                    ) : null}
                    {r.status !== 'removed' && (
                      <button className="icon-btn" title="Not a real ask: remove" onClick={() => act().removeRequirement(project.id, o.id, r.id)} data-testid={`remove-${r.id}`}><Trash2 /></button>
                    )}
                  </span>
                </div>
                <textarea
                  className="textarea textarea--inline"
                  rows={2}
                  defaultValue={r.text}
                  key={`${r.id}-${r.status}-${r.text.length}`}
                  disabled={r.status === 'removed'}
                  onBlur={(e) => e.target.value.trim() !== r.text && act().editRequirement(project.id, o.id, r.id, { text: e.target.value.trim() })}
                  aria-label={`Requirement ${r.number ?? r.id}`}
                  data-testid={`req-text-${r.id}`}
                />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      {adding && (
        <Sheet title="Add a requirement" onClose={() => setAdding(false)} actions={<button className="btn btn--primary" disabled={!newText.trim()} onClick={() => {
          act().addRequirement(project.id, o.id, { text: newText.trim(), category: newCat })
          setNewText('')
          setAdding(false)
        }}>Add</button>}>
          <Field label="What do they ask for?">
            <textarea className="textarea" rows={3} value={newText} onChange={(e) => setNewText(e.target.value)} />
          </Field>
          <Field label="Category">
            <select className="select" value={newCat} onChange={(e) => setNewCat(e.target.value as Category)}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </Sheet>
      )}
    </div>
  )
}
