import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Download, Play, RefreshCw, CheckCircle2, ExternalLink, Copy, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Chip, Empty, Field, Panel, Segmented, Tabs, cx } from '@/shell/ui'
import { downloadFile } from '@/shell/download'
import { act, usePaths, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useRegistry } from '@/knowledge/hooks'
import { client, nagarro, practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { ENGINE, templateInfo } from '@/deck/catalog'
import { checkDeck } from '@/deck/checks'
import { exportBriefMd, exportDeckHtml, exportDeckJson, exportNotesMd } from '@/deck/exports'
import { STRUCTURES, planFromEngagement, planFromOpportunity } from '@/deck/fromOpportunity'
import { currentResponse, requirementsHash, responseHash, sourcesChanged } from '@/opportunity/selectors'
import type { Deck, DeckBrief, Project } from '@/state/types'
import { SlidesFrame } from './SlidesFrame'

const STAGE_LABEL: Record<Deck['stage'], string> = { brief: 'Brief', plan: 'Plan to approve', built: 'Built', checked: 'Checked', exported: 'Exported' }

export function deckOutdated(deck: Deck, p: Project, registry: ReturnType<typeof useRegistry>): string[] {
  const out: string[] = []
  const o = deck.opportunityId ? p.opportunities[deck.opportunityId] : undefined
  if (deck.opportunityId && !o) return ['The opportunity behind this deck was deleted.']
  if (o) {
    const r = currentResponse(o)
    const cur = o.request?.versions.find((v) => v.version === o.request?.current)
    if (cur && deck.recorded.requestHash && cur.hash !== deck.recorded.requestHash) out.push(`The request changed (now v${cur.version}).`)
    if (r && deck.recorded.responseVersion !== undefined && (r.version !== deck.recorded.responseVersion || responseHash(r) !== deck.recorded.responseHash)) out.push(`The response changed since this deck was built (v${deck.recorded.responseVersion} → v${r.version}${r.version === deck.recorded.responseVersion ? ', edited' : ''}).`)
    if (deck.recorded.requirementsHash && requirementsHash(o) !== deck.recorded.requirementsHash) out.push('The requirements were edited.')
  }
  return [...out, ...sourcesChanged(deck.recorded.sources, registry).map((x) => x.detail)]
}

function DeckTable({ decks }: { decks: { d: Deck; p: Project }[] }) {
  const navigate = useNavigate()
  const registry = useRegistry()
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Deck</th><th>Client</th><th>Built from</th><th>Slides</th><th>Stage</th><th>Status</th><th>Built</th></tr></thead>
        <tbody>
          {decks.map(({ d, p }) => {
            const stale = deckOutdated(d, p, registry)
            return (
              <tr key={d.id} className="is-clickable" onClick={() => navigate(nagarro(p.slug).presentation(d.id))} data-testid={`deck-row-${d.id}`}>
                <td><strong>{d.title}</strong></td>
                <td className="small">{p.client.name}</td>
                <td className="small">{d.opportunityId ? p.opportunities[d.opportunityId]?.title ?? 'deleted opportunity' : 'Engagement data'}</td>
                <td>{d.slides.length}</td>
                <td><Chip tone="outline">{STAGE_LABEL[d.stage]}</Chip></td>
                <td>{stale.length ? <Chip tone="warn" title={stale.join(' ')}>Outdated</Chip> : <Chip tone="ok">Current</Chip>}</td>
                <td className="small muted">{relTime(d.builtAt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function HowItWorks() {
  return (
    <Panel title="How decks are built here" tight>
      <ol className="small">
        <li><strong>Brief.</strong> The 12 points the nagarro-slides plugin asks for, prefilled from the reviewed response.</li>
        <li><strong>Plan.</strong> One line per slide: the claim it makes, light or dark, the master template. Approve it before building.</li>
        <li><strong>Slides.</strong> Rendered here with Carolina Baptista's Nagarro Master Slides engine ({ENGINE.artifactVersion}, {ENGINE.templates} master templates, the same engine as her Presentation Studio).</li>
        <li><strong>Check.</strong> Registered templates only, capacity, dark covers and closing, no number without a source.</li>
        <li><strong>Hand off.</strong> Present from here or a standalone HTML deck, open deck.json in the Presentation Studio when it supports import (for an editable .pptx), or give brief.md to the plugin in Claude Slides.</li>
      </ol>
    </Panel>
  )
}

export function DecksPractice() {
  const projects = useStore((s) => s.projects)
  const decks = Object.values(projects).flatMap((p) => Object.values(p.decks ?? {}).map((d) => ({ d, p }))).sort((a, b) => b.d.builtAt - a.d.builtAt)
  return (
    <div className="page">
      <PageHead screen="decks" title="Presentations" lead="Decks on the Nagarro Master Slides, built from a reviewed opportunity or from an engagement's data, with speaker notes and the moments to switch to the live demo." actions={<Link className="btn btn--primary" to={practice.opportunities}><Plus /> Start from an opportunity</Link>} />
      <div className="grid grid--side">
        <Panel flush>{decks.length ? <DeckTable decks={decks} /> : <Empty>No decks yet. Open a reviewed opportunity and choose "Prepare a presentation".</Empty>}</Panel>
        <HowItWorks />
      </div>
    </div>
  )
}

export function DeckList() {
  const project = useProject()
  const r = usePaths()
  const decks = Object.values(project.decks ?? {}).sort((a, b) => b.builtAt - a.builtAt).map((d) => ({ d, p: project }))
  return (
    <div className="page">
      <PageHead screen="decks" title="Presentations" crumbs={[{ label: 'Clients and engagements', to: practice.clients }, { label: project.client.name, to: r.home }, { label: 'Presentations' }]} lead={`Decks for ${project.client.name}.`} actions={<Link className="btn btn--primary" to={r.presentationNew} data-testid="new-deck"><Plus /> New deck</Link>} />
      <div className="grid grid--side">
        <Panel flush>{decks.length ? <DeckTable decks={decks} /> : <Empty>No decks for {project.client.name} yet. Build one from a reviewed opportunity or from the engagement's data.</Empty>}</Panel>
        <HowItWorks />
      </div>
    </div>
  )
}

export function DeckBuilder() {
  const project = useProject()
  const r = usePaths()
  const navigate = useNavigate()
  const registry = useRegistry()
  const [params] = useSearchParams()
  const ready = Object.values(project.opportunities ?? {}).filter((o) => o.responses.length)
  const [from, setFrom] = useState<string>(params.get('from') ?? ready[0]?.id ?? 'engagement')
  const [structure, setStructure] = useState<Deck['structure']>('proposal')
  const [minutes, setMinutes] = useState(30)
  const build = () => {
    const o = from !== 'engagement' ? project.opportunities[from] : undefined
    const resp = o && currentResponse(o)
    const plan = o && resp ? planFromOpportunity(o, resp, project, registry, { structure, durationMin: minutes }) : planFromEngagement(project, { durationMin: minutes })
    const id = act().saveDeck(project.id, { ...plan, id: '', builtAt: Date.now(), builtBy: '' })
    navigate(r.presentation(id))
  }
  return (
    <div className="page page--narrow">
      <PageHead screen="decks" noTabs title="New deck" crumbs={[{ label: project.client.name, to: r.home }, { label: 'Presentations', to: r.presentations }, { label: 'New' }]} lead="Choose what the deck is built from. The plan comes first; nothing is final until you approve it." />
      <Panel title="Built from">
        <div className="stack">
          {ready.map((o) => (
            <label key={o.id} className={cx('choice', from === o.id && 'is-selected')}>
              <input type="radio" name="from" checked={from === o.id} onChange={() => setFrom(o.id)} />
              <span className="choice__body"><span className="choice__title">{o.title}</span><span className="choice__desc">Reviewed response v{o.responses[0].version} · {o.responses[0].generatedBy.label}</span></span>
            </label>
          ))}
          <label className={cx('choice', from === 'engagement' && 'is-selected')}>
            <input type="radio" name="from" checked={from === 'engagement'} onChange={() => setFrom('engagement')} />
            <span className="choice__body"><span className="choice__title">The engagement's data</span><span className="choice__desc">A short readout: where the system stands, a live demo, next steps.</span></span>
          </label>
          {!ready.length && <Callout tone="info">No opportunity has a reviewed response yet. Draft one in Opportunities to build a proposal deck from it.</Callout>}
        </div>
      </Panel>
      <Panel title="Structure and length">
        <div className="stack">
          <Segmented ariaLabel="Structure" value={structure} onChange={(v) => setStructure(v as Deck['structure'])} options={STRUCTURES.map((s) => ({ id: s.id, label: s.label }))} />
          <p className="small muted">{STRUCTURES.find((s) => s.id === structure)?.blurb}</p>
          <Field label="Duration">
            <Segmented ariaLabel="Duration" value={String(minutes)} onChange={(v) => setMinutes(Number(v))} options={['15', '30', '45', '60'].map((m) => ({ id: m, label: `${m} min` }))} />
          </Field>
        </div>
      </Panel>
      <button className="btn btn--primary" onClick={build} data-testid="build-deck">Plan the deck</button>
    </div>
  )
}

const BRIEF_FIELDS: { key: keyof DeckBrief; label: string; list?: boolean }[] = [
  { key: 'deckName', label: '1 · Deck name' },
  { key: 'keyMessages', label: '2 · Topic and key messages', list: true },
  { key: 'audiencePurpose', label: '3 · Audience and purpose' },
  { key: 'slideCount', label: '4 · Rough slide count' },
  { key: 'client', label: '5 · Client or host name and logo' },
  { key: 'verbatim', label: '6 · Anything verbatim', list: true },
  { key: 'hook', label: '7 · Opening' },
  { key: 'tone', label: '8 · Tone and angle' },
  { key: 'mustHaveSlides', label: '9 · Must-have slides', list: true },
  { key: 'takeaways', label: '10 · Takeaways', list: true },
  { key: 'pictures', label: '11 · Their own pictures', list: true },
  { key: 'sources', label: '12 · Sources', list: true },
]

export function DeckView() {
  const { id } = useParams()
  const project = useProject()
  const r = usePaths()
  const navigate = useNavigate()
  const registry = useRegistry()
  const deck = useStore((s) => (id ? s.projects[project.id]?.decks?.[id] : undefined))
  const [tab, setTab] = useState<'brief' | 'plan' | 'slides' | 'check' | 'handoff'>('plan')
  const [presenting, setPresenting] = useState(false)
  const [idx, setIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const internalOnly = useMemo(() => new Map(registry.filter((x) => x.audience === 'internal').map((x) => [x.id, x.title])), [registry])
  const issues = useMemo(() => (deck ? checkDeck(deck, { internalOnly }) : []), [deck, internalOnly])
  const slideCount = deck?.slides.length ?? 0
  useEffect(() => {
    if (!presenting) return
    // Keys work whether the host or the slides frame has focus (the frame posts its own index).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setIdx((i) => Math.min(slideCount - 1, i + 1))
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx((i) => Math.max(0, i - 1))
      else if (e.key === 'Escape') setPresenting(false)
      else if (e.key.toLowerCase() === 'f') void document.querySelector('.present-overlay')?.requestFullscreen?.().catch(() => undefined)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, slideCount])
  if (!deck) return <Navigate to={r.presentations} replace />
  const stale = deckOutdated(deck, project, registry)
  const errors = issues.filter((i) => i.level === 'error')
  const o = deck.opportunityId ? project.opportunities[deck.opportunityId] : undefined
  const rebuild = () => {
    const resp = o && currentResponse(o)
    const plan = o && resp ? planFromOpportunity(o, resp, project, registry, { structure: deck.structure, durationMin: deck.durationMin }) : planFromEngagement(project, { durationMin: deck.durationMin })
    act().saveDeck(project.id, { ...plan, id: deck.id, brief: { ...plan.brief, verbatim: deck.brief.verbatim }, builtAt: Date.now(), builtBy: deck.builtBy })
  }
  const setBrief = (key: keyof DeckBrief, value: string) => {
    const field = BRIEF_FIELDS.find((f) => f.key === key)!
    const v = key === 'slideCount' ? Number(value) || deck.brief.slideCount : key === 'client' ? { ...deck.brief.client, name: value } : field.list ? value.split('\n').map((x) => x.trim()).filter(Boolean) : value
    act().updateBrief(project.id, deck.id, { [key]: v } as Partial<DeckBrief>)
  }
  const openDemo = (routeKey: string) => {
    const to = act().openClientExperience(project.id) ?? act().openClientExperience('demo-brand')
    if (!to) return
    const pid = project.published ? project : useStore.getState().projects['demo-brand']
    const c = client(pid.slug) as unknown as Record<string, string>
    window.open(`${typeof c[routeKey] === 'string' ? c[routeKey] : c.home}?presenter=1`, '_blank')
  }

  return (
    <div className="page">
      <PageHead
        screen="decks"
        noTabs
        crumbs={[{ label: project.client.name, to: r.home }, { label: 'Presentations', to: r.presentations }, { label: deck.title }]}
        title={deck.title}
        lead={`${deck.slides.length} slides · about ${deck.durationMin} minutes · ${STRUCTURES.find((s) => s.id === deck.structure)?.label}${o ? ` · from "${o.title}", response v${deck.recorded.responseVersion}` : ' · from the engagement data'}`}
        eyebrow={<><Chip tone="outline">{STAGE_LABEL[deck.stage]}</Chip><Chip tone="ink" title={ENGINE.upstream}>Nagarro Master Slides {ENGINE.artifactVersion}</Chip></>}
        actions={<button className="btn btn--mint" onClick={() => { setIdx(0); setPresenting(true) }} data-testid="present-deck"><Play /> Present</button>}
      />
      {stale.length > 0 && (
        <Callout tone="warn">
          <strong>Outdated.</strong> {stale.join(' ')}{' '}
          <button className="btn btn--secondary btn--sm" onClick={rebuild} data-testid="rebuild-deck"><RefreshCw /> Rebuild</button>
        </Callout>
      )}
      <Tabs value={tab} onChange={(t) => setTab(t)} tabs={[{ id: 'brief', label: 'Brief' }, { id: 'plan', label: 'Plan' }, { id: 'slides', label: 'Slides' }, { id: 'check', label: 'Check', badge: errors.length ? String(errors.length) : undefined }, { id: 'handoff', label: 'Hand off' }]} />
      {tab === 'brief' && (
        <Panel title="The 12-point brief" actions={<button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard?.writeText(exportBriefMd(deck).content)}><Copy /> Copy the brief</button>}>
          <p className="small muted">The same 12 points the nagarro-slides plugin asks for, prefilled from the reviewed response. Edit freely.</p>
          <div className="grid grid--2">
            {BRIEF_FIELDS.map((f) => {
              const v = deck.brief[f.key]
              const text = f.key === 'client' ? deck.brief.client.name : Array.isArray(v) ? v.join('\n') : String(v)
              return (
                <Field key={f.key} label={f.label}>
                  {f.list ? <textarea className="textarea" rows={3} defaultValue={text} onBlur={(e) => setBrief(f.key, e.target.value)} /> : <input className="input" defaultValue={text} onBlur={(e) => setBrief(f.key, e.target.value)} data-testid={`brief-${f.key}`} />}
                </Field>
              )
            })}
          </div>
        </Panel>
      )}
      {tab === 'plan' && (
        <Panel title="Slide plan" actions={deck.stage === 'plan' ? <button className="btn btn--primary btn--sm" onClick={() => { act().setDeckStage(project.id, deck.id, 'built'); setTab('slides') }} data-testid="approve-plan"><CheckCircle2 /> Approve the plan and build</button> : <Chip tone="ok">Approved</Chip>}>
          <div className="table-wrap">
            <table className="table slide-plan">
              <thead><tr><th>#</th><th>The slide's claim</th><th>Light / dark</th><th>Master template</th><th>Notes and demo</th><th></th></tr></thead>
              <tbody>
                {deck.slides.map((s, i) => (
                  <tr key={s.id} data-testid={`plan-row-${i + 1}`}>
                    <td>{i + 1}</td>
                    <td style={{ minWidth: 260 }}><input className="input input--inline" aria-label={`Slide ${i + 1} claim`} defaultValue={s.claim} onBlur={(e) => act().updateSlide(project.id, deck.id, s.id, { claim: e.target.value })} /></td>
                    <td><span className={cx('theme-dot', `theme-dot--${s.spec.theme ?? templateInfo(s.spec.template)?.theme ?? 'light'}`)} />{s.spec.theme ?? templateInfo(s.spec.template)?.theme ?? 'light'}</td>
                    <td className="small"><code>{s.spec.template}</code><div className="xs muted">{templateInfo(s.spec.template)?.use.slice(0, 80)}</div></td>
                    <td className="small">{s.demoLink ? <button className="btn btn--mint btn--sm" onClick={() => openDemo(s.demoLink!.routeKey)}><ExternalLink /> {s.demoLink.label}</button> : <span className="muted">{s.notes.slice(0, 70)}{s.notes.length > 70 ? '…' : ''}</span>}</td>
                    <td>
                      <span className="row" style={{ gap: 2 }}>
                        <button className="icon-btn" title="Move up" onClick={() => act().moveSlide(project.id, deck.id, s.id, -1)}><ChevronUp /></button>
                        <button className="icon-btn" title="Move down" onClick={() => act().moveSlide(project.id, deck.id, s.id, 1)}><ChevronDown /></button>
                        <button className="icon-btn" title="Remove" onClick={() => act().removeSlide(project.id, deck.id, s.id)}><Trash2 /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {tab === 'slides' && (
        <div className="stack">
          <div className="grid grid--side">
            <Panel flush><SlidesFrame deck={deck} mode="list" /></Panel>
            <Panel title="Speaker notes" tight>
              <ol className="small notes-list">{deck.slides.map((s, i) => <li key={s.id}><strong>{s.claim}</strong>{s.demoLink && <> · <em>transition: {s.demoLink.label}</em></>}<textarea className="textarea textarea--inline" rows={2} defaultValue={s.notes} onBlur={(e) => act().updateSlide(project.id, deck.id, s.id, { notes: e.target.value })} aria-label={`Notes for slide ${i + 1}`} /></li>)}</ol>
            </Panel>
          </div>
        </div>
      )}
      {tab === 'check' && (
        <Panel title="Checks" actions={!errors.length && deck.stage === 'built' ? <button className="btn btn--primary btn--sm" onClick={() => act().setDeckStage(project.id, deck.id, 'checked')}><CheckCircle2 /> Mark checked</button> : undefined}>
          {issues.length ? <ul className="small" data-testid="deck-issues">{issues.map((i, k) => <li key={k} style={{ color: i.level === 'error' ? 'var(--n-err)' : undefined }}>{i.text}</li>)}</ul> : <Callout tone="ok">Every slide uses a registered master template within its capacity; covers, dividers and the closing are dark; no number appears without a source.</Callout>}
          <p className="xs muted">Balance, rhythm and empty space are judgements the checks cannot make: look at the slides before sharing.</p>
        </Panel>
      )}
      {tab === 'handoff' && (
        <div className="grid grid--2">
          <Panel title="Download">
            <div className="stack">
              <button className="btn btn--secondary" disabled={busy} onClick={async () => { setBusy(true); downloadFile(await exportDeckHtml(deck)); setBusy(false); act().setDeckStage(project.id, deck.id, 'exported') }} data-testid="export-deck-html"><Download /> Standalone deck with present mode (HTML)</button>
              <button className="btn btn--secondary" onClick={() => downloadFile(exportDeckJson(deck))} data-testid="export-deck-json"><Download /> deck.json (the engine's own format)</button>
              <button className="btn btn--secondary" onClick={() => downloadFile(exportBriefMd(deck))} data-testid="export-brief-md"><Download /> brief.md (12 points and slide plan)</button>
              <button className="btn btn--secondary" onClick={() => downloadFile(exportNotesMd(deck))} data-testid="export-notes-deck"><Download /> Speaker notes</button>
            </div>
          </Panel>
          <Panel title="Continue elsewhere">
            <ul className="small">
              <li><strong>Editable PowerPoint or PDF:</strong> Carolina's Presentation Studio (Presentation_v1) uses the same engine and templates. Import of deck.json is to be confirmed with Carolina; until then, rebuild from brief.md.</li>
              <li><strong>Claude Slides:</strong> in Claude, say "make a Nagarro deck" (nagarro-slides plugin) and paste brief.md. It shows a plan to approve, builds, checks and reviews with you.</li>
              <li><strong>Present from here:</strong> the Present button, or the standalone HTML (arrow keys, F for fullscreen).</li>
            </ul>
            <p className="xs muted">Built with the Nagarro Master Slides engine {ENGINE.artifactVersion} by Carolina Baptista, vendored unmodified.</p>
            <Link className="small" to={practice.tools}>About the presentation system</Link>
          </Panel>
        </div>
      )}
      {presenting && createPortal(
        <div className="present-overlay" role="dialog" aria-label="Presenting">
          <SlidesFrame deck={deck} mode="present" index={idx} onIndex={setIdx} onExit={() => setPresenting(false)} />
          <div className="present-bar">
            <button className="btn btn--on-dark-ghost btn--sm" onClick={() => setIdx(Math.max(0, idx - 1))}>←</button>
            <span>{idx + 1} / {deck.slides.length} · {deck.slides[idx]?.claim}</span>
            <button className="btn btn--on-dark-ghost btn--sm" onClick={() => setIdx(Math.min(deck.slides.length - 1, idx + 1))}>→</button>
            {deck.slides[idx]?.demoLink && <button className="btn btn--mint btn--sm" onClick={() => openDemo(deck.slides[idx].demoLink!.routeKey)}><ExternalLink /> {deck.slides[idx].demoLink!.label}</button>}
            <button className="btn btn--on-dark btn--sm" onClick={() => setPresenting(false)}>Exit</button>
          </div>
        </div>,
        document.body,
      )}
      <p className="xs muted"><button className="link-btn" onClick={() => { act().deleteDeck(project.id, deck.id); navigate(r.presentations) }}>Delete this deck</button></p>
    </div>
  )
}
