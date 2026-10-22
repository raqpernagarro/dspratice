import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FileText, RefreshCw, Sparkles, Copy, ChevronUp, ChevronDown, Trash2, Plus, Eye, Pencil, ArrowDown } from 'lucide-react'
import { Callout, Chip, Panel, Segmented, Sheet, cx } from '@/shell/ui'
import { ProgressPanel } from '@/shell/ProgressPanel'
import { MarkdownLite } from '@/shell/markdown'
import { GenerationBadge, KIND_HELP, KIND_LABEL, KindChip, TemplateNote, ApprovalChip, SourceBadge } from '@/shell/provenance'
import { AiCostNote } from '@/shell/AiCostNote'
import { act, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useRegistry, useSource } from '@/knowledge/hooks'
import { useDoc } from '@/knowledge/useDoc'
import { useIntegrations } from '@/integrations/status'
import { draftResponse, improveSection, oppTask } from '@/state/flows/opportunity'
import { activeRequirements, coverage, coverageSummary, responseOutdated } from '@/opportunity/selectors'
import { uncheckedRequirements } from '@/opportunity/progress'
import { practice } from '@/app/routes'
import { SectionList } from '@/features/knowledge/SectionList'
import type { Citation, DraftSection, KnowledgeDocument, Opportunity, StatementKind } from '@/state/types'

const STAGES = ['Reading the request', 'Finding matching passages in your sources', 'Marking what the sources can’t answer', 'Preparing the draft']

const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })

/** Off on this machine: said once, at the action, with where to turn it on. */
function AiOffNote() {
  return (
    <span className="xs muted" title="Add ANTHROPIC_API_KEY to .env.local on this machine to use AI drafting">
      AI drafting is off on this machine. The rule-based draft works without it. <Link to={practice.about}>What needs a key</Link>
    </span>
  )
}

export function CitationSheet({ c, onClose }: { c: Citation; onClose: () => void }) {
  const source = useSource(c.sourceId)
  const { doc } = useDoc(source?.docId)
  const kdoc = doc && 'sections' in doc ? (doc as KnowledgeDocument) : null
  return (
    <Sheet title={source?.title ?? 'Source removed from the library'} onClose={onClose} wide>
      {source ? (
        <div className="stack">
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <ApprovalChip approval={source.approval} title={source.approvalNote} />
            <SourceBadge source={source} />
            <Link className="small" to={`${practice.knowledgeSource(source.id)}#${c.sectionId}`}>Open in the library</Link>
          </div>
          {c.quote && <blockquote className="cite-quote">{c.quote}</blockquote>}
          {kdoc ? kdoc.sections.some((s) => s.id === c.sectionId) ? <SectionList doc={kdoc} highlightId={c.sectionId} limit={1} /> : <Callout tone="warn">That section no longer exists in the current text of this source (it changed since the draft).</Callout> : <p className="muted">Loading…</p>}
        </div>
      ) : (
        <Callout tone="warn">This source was removed from the library. The citation is kept so you can see what the draft relied on.</Callout>
      )}
    </Sheet>
  )
}

export function CiteChips({ citations, onOpen }: { citations: Citation[]; onOpen: (c: Citation) => void }) {
  const reg = useRegistry()
  const seen = new Set<string>()
  const list = citations.filter((c) => (seen.has(`${c.sourceId}|${c.sectionId}`) ? false : seen.add(`${c.sourceId}|${c.sectionId}`)))
  return (
    <span className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
      {list.slice(0, 4).map((c) => (
        <button key={`${c.sourceId}|${c.sectionId}`} className="cite" onClick={() => onOpen(c)} title="Inspect the source text" data-testid="evidence-ref">
          <FileText /> {reg.find((s) => s.id === c.sourceId)?.title ?? 'removed source'}
        </button>
      ))}
      {list.length > 4 && <span className="xs muted">+{list.length - 4}</span>}
    </span>
  )
}

function ConsentSheet({ o, onOk, onClose }: { o: Opportunity; onOk: () => void; onClose: () => void }) {
  const project = useProject()
  return (
    <Sheet title="Send this to the model?" onClose={onClose} actions={<button className="btn btn--primary" onClick={() => {
      act().setModelConsent(project.id, o.id)
      onOk()
    }} data-testid="consent-ok">Yes, use the model</button>}>
      <p>The hub sends the request text, the listed requirements and only the most relevant sections of the selected sources (at most about 20K tokens) from this machine's local server to the Anthropic API, using the key in .env.local.</p>
      <p><strong>Check the client's confidentiality terms first.</strong> Nothing else leaves this machine, and the result is checked by the same rules as the template draft before you see it.</p>
      <p className="small muted">Prefer to use your own Claude or ChatGPT chat? Download the generation packet in “Share and present” instead.</p>
    </Sheet>
  )
}

function SectionEditor({ s, o, onCite }: { s: DraftSection; o: Opportunity; onCite: (c: Citation) => void }) {
  const project = useProject()
  const integrations = useIntegrations()
  const [editing, setEditing] = useState(false)
  const [consent, setConsent] = useState(false)
  const job = useStore((st) => st.sim.jobs[oppTask(project.id, o.id, `improve-${s.id}`)])
  const reqs = new Map(o.requirements.map((r) => [r.id, r]))
  const run = () => (o.modelConsentAt ? improveSection(project.id, o.id, s.id) : setConsent(true))
  return (
    <article className={cx('kind', `kind--${s.kind}`, 'draft-section')} data-testid={`draft-${s.id}`}>
      <div className="row row--between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input className="input input--heading" value={s.heading} onChange={(e) => act().editSection(project.id, o.id, s.id, { heading: e.target.value })} aria-label="Section heading" />
        <span className="row" style={{ gap: 4 }}>
          <button className="icon-btn" title="Move up" onClick={() => act().moveSection(project.id, o.id, s.id, -1)}><ChevronUp /></button>
          <button className="icon-btn" title="Move down" onClick={() => act().moveSection(project.id, o.id, s.id, 1)}><ChevronDown /></button>
          <button className="icon-btn" title={editing ? 'Preview' : 'Edit'} onClick={() => setEditing(!editing)} data-testid={`edit-${s.id}`}>{editing ? <Eye /> : <Pencil />}</button>
          <button className="icon-btn" title="Remove section" onClick={() => act().removeSection(project.id, o.id, s.id)}><Trash2 /></button>
        </span>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '6px 0' }}>
        <Segmented ariaLabel="What kind of statement" value={s.kind} onChange={(k) => act().editSection(project.id, o.id, s.id, { kind: k as StatementKind })} options={(['supported', 'recommendation', 'assumption', 'open-question'] as StatementKind[]).map((k) => ({ id: k, label: KIND_LABEL[k] }))} />
        {s.edited && <Chip tone="outline" title="Your wording; regenerating keeps it unless you choose otherwise">Edited{s.keptFrom ? ` · kept from v${s.keptFrom}` : ''}</Chip>}
        {s.aiRevised && <Chip tone="ai" title={`Rewritten by ${s.aiRevised.model}`}>Improved with AI</Chip>}
      </div>
      {editing ? (
        <textarea className="textarea" rows={Math.min(18, Math.max(4, s.body.split('\n').length + 1))} value={s.body} onChange={(e) => act().editSection(project.id, o.id, s.id, { body: e.target.value })} data-testid={`body-${s.id}`} />
      ) : (
        <MarkdownLite text={s.body || '_Empty: click edit to write this section._'} className="prose--sm" />
      )}
      <div className="row row--between" style={{ gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
        <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {s.citations.length ? <CiteChips citations={s.citations} onOpen={onCite} /> : <span className="xs muted">No source cited</span>}
          {s.requirementIds.slice(0, 6).map((id) => reqs.get(id)).filter(Boolean).map((r) => <Chip key={r!.id} tone="outline" title={r!.text}>{r!.number ? `#${r!.number}` : r!.id}</Chip>)}
        </span>
        <span className="row" style={{ gap: 6 }}>
          {integrations.model.configured ? (
            <>
              <AiCostNote inputTokens={2_000 + Math.round(s.body.length / 4) + s.citations.length * 400} outputTokens={1_500} />
              <button className="btn btn--ghost btn--sm" onClick={run} disabled={job?.status === 'running'} data-testid={`improve-${s.id}`}>
                <Sparkles /> {job?.status === 'running' ? 'Rewriting…' : 'Rewrite with AI'}
              </button>
            </>
          ) : (
            <span className="xs muted" title="Add ANTHROPIC_API_KEY to .env.local, or download the generation packet in “Share and present”">Edit by hand, or use the packet in your own AI chat</span>
          )}
        </span>
      </div>
      {job?.status === 'failed' && <Callout tone="err">{job.error}</Callout>}
      {consent && <ConsentSheet o={o} onClose={() => setConsent(false)} onOk={() => {
        setConsent(false)
        void improveSection(project.id, o.id, s.id)
      }} />}
    </article>
  )
}

function RegenerateSheet({ o, onClose, mode }: { o: Opportunity; onClose: () => void; mode: 'template' | 'model' }) {
  const project = useProject()
  const edited = o.responses[0]?.draft.filter((d) => d.edited) ?? []
  const [keep, setKeep] = useState<'edited' | 'none'>('edited')
  return (
    <Sheet title="Draft again?" onClose={onClose} actions={<button className="btn btn--primary" onClick={() => {
      onClose()
      void draftResponse(project.id, o.id, { mode, keep })
    }} data-testid="regenerate-confirm">Draft again</button>}>
      <p>You edited {edited.length} section{edited.length === 1 ? '' : 's'}. Keep your wording for those and redraft the rest, or start over.</p>
      <Segmented ariaLabel="Keep edits" value={keep} onChange={(v) => setKeep(v)} options={[{ id: 'edited', label: 'Keep my edited sections' }, { id: 'none', label: 'Redraft everything' }]} />
    </Sheet>
  )
}

export function ResponseStep({ o }: { o: Opportunity }) {
  const project = useProject()
  const registry = useRegistry()
  const integrations = useIntegrations()
  const job = useStore((s) => s.sim.jobs[oppTask(project.id, o.id, 'draft')])
  const [cite, setCite] = useState<Citation | null>(null)
  const [regen, setRegen] = useState<'template' | 'model' | null>(null)
  const [consent, setConsent] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const r = o.responses[0]
  const reqs = activeRequirements(o)
  const cov = useMemo(() => coverage(o), [o])
  const sum = coverageSummary(cov)
  const outdated = useMemo(() => responseOutdated(o, registry), [o, registry])
  const estimate = { input: Math.min(25_000, 1_500 + o.sourceSelection.included.length * 1_600 + reqs.length * 60), output: 6_000 }
  const runModel = () => (o.modelConsentAt ? draftResponse(project.id, o.id, { mode: 'model' }) : setConsent(true))

  const startButtons = (
    <>
      <button className="btn btn--primary" onClick={() => (r ? setRegen('template') : draftResponse(project.id, o.id, { mode: 'template' }))} disabled={job?.status === 'running'} data-testid="draft-template">
        <RefreshCw /> {r ? 'Draft again' : 'Draft the answers'}
      </button>
      {integrations.model.configured ? (
        <>
          <button className="btn btn--secondary" onClick={() => (!o.modelConsentAt ? setConsent(true) : r ? setRegen('model') : runModel())} disabled={job?.status === 'running'} data-testid="draft-model">
            <Sparkles /> Draft with AI
          </button>
          <AiCostNote inputTokens={estimate.input} outputTokens={estimate.output} used={o.aiUsage} />
        </>
      ) : (
        <AiOffNote />
      )}
    </>
  )

  if (!r || job?.status === 'running')
    return (
      <>
        <ProgressPanel
          title="Draft the answers"
          explain={integrations.model.configured ? 'You get a first answer to every requirement, each quoting the passage it is built on, plus the open questions the sources can’t answer. “Draft the answers” uses rules and spends no tokens; “Draft with AI” sends a small packet to the model and checks its output with the same rules. Then you check each answer.' : 'You get a first answer to every requirement, each quoting the passage it is built on, plus the open questions the sources can’t answer. It is built by rules from the sources you chose, so the wording is plain. Then you check each answer and edit what needs it.'}
          stages={STAGES}
          job={job}
          mode={<TemplateNote />}
          action={startButtons}
        />
        {consent && <ConsentSheet o={o} onClose={() => setConsent(false)} onOk={() => {
          setConsent(false)
          void draftResponse(project.id, o.id, { mode: 'model' })
        }} />}
      </>
    )

  const byReq = new Map(r.answers.map((a) => [a.requirementId, a]))
  const unchecked = uncheckedRequirements(o)
  const openCount = r.gaps.length + r.openQuestions.length
  const isChecked = (id: string) => o.checked?.[id]?.version === r.version
  return (
    <div className="stack">
      <section className="to-review" aria-label="To review" data-testid="to-review">
        <strong>To review</strong>
        <button className={cx('to-review__item', unchecked.length > 0 && 'is-open')} onClick={() => jump('req-matrix')}>
          {unchecked.length ? `${unchecked.length} answer${unchecked.length > 1 ? 's' : ''} to check` : 'Every answer checked'} <ArrowDown />
        </button>
        <button className={cx('to-review__item', openCount > 0 && 'is-open')} onClick={() => jump('open-questions')}>
          {openCount ? `${openCount} open question${openCount > 1 ? 's' : ''} for an expert` : 'No open questions'} <ArrowDown />
        </button>
        <button className={cx('to-review__item', r.conflicts.length > 0 && 'is-open')} onClick={() => jump(r.conflicts.length ? 'conflicts' : 'req-matrix')}>
          {r.conflicts.length ? `${r.conflicts.length} place${r.conflicts.length > 1 ? 's' : ''} where sources disagree` : 'No source conflicts'} <ArrowDown />
        </button>
        <span className="xs muted">A matching passage is evidence to check, not a finished answer.</span>
      </section>
      <div className="row row--between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <GenerationBadge mode={r.generatedBy.mode} model={r.generatedBy.model} at={r.generatedBy.at} />
          <span className="small muted">v{r.version} · from request v{r.inputs.requestVersion} · {r.inputs.sources.length} sources{r.generatedBy.usage ? ` · ${(r.generatedBy.usage.inputTokens + r.generatedBy.usage.outputTokens).toLocaleString()} tokens` : ' · 0 tokens'}</span>
        </span>
        <span className="row" style={{ gap: 8 }}>{startButtons}</span>
      </div>
      {outdated.length > 0 && (
        <Callout tone="warn">
          <strong>Behind its inputs.</strong> {outdated.map((x) => x.detail).join(' ')} Draft again to pick that up; your edited sections can be kept.
        </Callout>
      )}
      {r.warnings.map((w) => <Callout key={w} tone="info">{w}</Callout>)}

      <Panel title="Our understanding">
        <MarkdownLite text={r.understanding} />
      </Panel>

      <div id="req-matrix" />
      <Panel title="What they ask, and the evidence" flush actions={<span className="xs muted" data-testid="coverage-summary">{sum.full} with a matching passage · {sum.partial} our recommendation · {sum.none} open</span>}>
        <div className="table-wrap">
          <table className="table req-matrix">
            <thead>
              <tr>
                <th>#</th>
                <th>Requirement</th>
                <th>Answer</th>
                <th>Evidence</th>
                <th>Checked</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((q) => {
                const a = byReq.get(q.id)
                const c = cov.find((x) => x.requirementId === q.id)
                const cites = a?.statements.flatMap((s) => s.citations) ?? []
                return (
                  <tr key={q.id} data-testid={`matrix-${q.id}`} className={cx(open === q.id && 'is-open')}>
                    <td className="small">{q.number ?? '—'}</td>
                    <td className="small">
                      <button className="link-btn" onClick={() => setOpen(open === q.id ? null : q.id)}>{q.text}</button>
                      {q.mustAnswer && <Chip tone="outline">Must answer</Chip>}
                      {open === q.id && a && <div className="matrix-answer">{a.statements.map((s, i) => <p key={i} className="small"><KindChip kind={s.kind} /> {s.text}{s.caveat ? <em className="muted"> ({s.caveat})</em> : null}</p>)}</div>}
                    </td>
                    <td>
                      <span className={cx('coverage-dot', `coverage-dot--${c?.state ?? 'none'}`)} />
                      <span className="small">{a ? (a.status === 'gap' ? 'Open: no source' : a.status === 'supported' ? (isChecked(q.id) ? 'Backed by a source' : 'Passage found · check it') : KIND_LABEL[a.status as StatementKind]) : 'Not answered'}</span>
                    </td>
                    <td>{cites.length ? <CiteChips citations={cites} onOpen={setCite} /> : <span className="xs muted">{q.unanswerable ? q.unanswerable.reason : 'No source'}</span>}</td>
                    <td>
                      <label className="toggle xs" title="Mark that a person has read the answer and its passage">
                        <input type="checkbox" checked={isChecked(q.id)} onChange={(e) => act().setRequirementChecked(project.id, o.id, q.id, e.target.checked)} data-testid={`check-${q.id}`} aria-label={`Checked: ${q.text}`} />
                        {isChecked(q.id) ? 'Checked' : o.checked?.[q.id] ? 'Re-check' : 'Check'}
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="xs muted" style={{ padding: '8px 16px' }}>Open a requirement to read its answer, and a source chip to read the passage behind it. Tick “Check” once you are sure the passage answers the question. “Re-check” means the draft changed since you checked it.</p>
      </Panel>

      <div className="panel panel--ink" data-testid="approach-card">
        <div className="small" style={{ opacity: 0.8 }}>Recommended approach and offering</div>
        <h2 style={{ margin: '4px 0 8px' }}>{r.approach.package}</h2>
        <p>{r.approach.reasoning}</p>
        <ol className="small">{r.approach.phases.map((p) => <li key={p.name}><strong>{p.name}.</strong> {p.what}</li>)}</ol>
        {r.approach.alternatives.length > 0 && <p className="xs" style={{ opacity: 0.8 }}>Alternatives: {r.approach.alternatives.join(', ')}</p>}
        {r.approach.citations.length > 0 && <CiteChips citations={r.approach.citations} onOpen={setCite} />}
      </div>

      {r.conflicts.length > 0 && (
        <Panel title="Where our sources disagree" tight>
          <span id="conflicts" />
          <ul className="list" data-testid="conflicts">
            {r.conflicts.map((c) => (
              <li key={c.id} className="list__item">
                <div className="list__body">
                  <span className="list__title">{c.topic}</span>
                  <span className="small">{c.summary}{c.canonical ? ` Use: ${c.canonical}.` : ''}</span>
                  {c.positions.length > 0 && <CiteChips citations={c.positions.filter((p) => p.sectionId).map((p) => ({ sourceId: p.sourceId, sectionId: p.sectionId! }))} onOpen={setCite} />}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="The draft" actions={<button className="btn btn--ghost btn--sm" onClick={() => act().addSection(project.id, o.id)}><Plus /> Add a section</button>}>
        <div className="kind-legend">
          {(['supported', 'recommendation', 'assumption', 'open-question'] as StatementKind[]).map((k) => (
            <span key={k} className="small"><KindChip kind={k} /> {KIND_HELP[k]}</span>
          ))}
        </div>
        <div className="stack">{r.draft.map((s) => <SectionEditor key={s.id} s={s} o={o} onCite={setCite} />)}</div>
      </Panel>

      <div className="grid grid--2">
        <Panel title="Open questions for an expert or the account team" tight>
          <span id="open-questions" />
          {r.gaps.length + r.openQuestions.length === 0 ? (
            <p className="small muted">Nothing open.</p>
          ) : (
            <ul className="list" data-testid="gaps">
              {[...r.openQuestions.map((q) => ({ what: q.text, who: q.caveat ?? 'Account team' })), ...r.gaps.map((g) => ({ what: g.what, who: g.expert ?? 'Practice lead' }))].map((g, i) => (
                <li key={i} className="list__item">
                  <div className="list__body">
                    <span className="small">{g.what}</span>
                    <span className="xs muted">{g.who}</span>
                  </div>
                  <button className="icon-btn" title="Copy as a question" onClick={() => navigator.clipboard?.writeText(`For ${project.client.name} (${o.title}): ${g.what}`)}><Copy /></button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Next steps" tight>
          <ol className="small">{r.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol>
        </Panel>
      </div>
      {r.issues.length > 0 && (
        <Panel title="Checks applied to this draft" tight>
          <ul className="small">{r.issues.map((i, n) => <li key={n}><code>{i.code}</code> · {i.where}: {i.detail}</li>)}</ul>
        </Panel>
      )}
      {cite && <CitationSheet c={cite} onClose={() => setCite(null)} />}
      {regen && <RegenerateSheet o={o} mode={regen} onClose={() => setRegen(null)} />}
      {consent && <ConsentSheet o={o} onClose={() => setConsent(false)} onOk={() => {
        setConsent(false)
        void draftResponse(project.id, o.id, { mode: 'model' })
      }} />}
    </div>
  )
}
