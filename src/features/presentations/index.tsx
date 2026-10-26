import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Download, Play, RefreshCw, CheckCircle2, MonitorPlay, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { PageHead } from '@/shell/PageHead'
import { Callout, Chip, Empty, Field, Panel, Segmented, Tabs, cx } from '@/shell/ui'
import { ProcessStrip } from '@/shell/story'
import { usePresentDemo } from '@/shell/present'
import { downloadFile } from '@/shell/download'
import { act, useProject } from '@/state/hooks'
import { useStore } from '@/state/store'
import { useRegistry } from '@/knowledge/hooks'
import { client, practice } from '@/app/routes'
import { relTime } from '@/state/selectors'
import { templateInfo } from '@/deck/catalog'
import { checkDeck } from '@/deck/checks'
import { exportBriefMd, exportDeckHtml, exportDeckJson, exportNotesMd } from '@/deck/exports'
import { STRUCTURES, planFromEngagement, planFromOpportunity } from '@/deck/fromOpportunity'
import { currentResponse, requirementsHash, responseHash, sourcesChanged } from '@/opportunity/selectors'
import type { Deck, DeckBrief, Project } from '@/state/types'
import { SlidesFrame } from './SlidesFrame'
import { StudioHandoff } from './StudioHandoff'

/** Where a deck stands, from the automatic checks and whether it was downloaded. */
export function deckStatus(deck: Deck, errors: number): { label: string; tone: 'ok' | 'warn' | 'outline' } {
  if (errors) return { label: `${errors} to fix`, tone: 'warn' }
  return deck.stage === 'exported' ? { label: 'Downloaded', tone: 'outline' } : { label: 'Ready', tone: 'ok' }
}

export function deckOutdated(deck: Deck, p: Project, registry: ReturnType<typeof useRegistry>): string[] {
  const out: string[] = []
  const o = deck.opportunityId ? p.opportunities[deck.opportunityId] : undefined
  if (deck.opportunityId && !o) return ['The client request behind this deck was deleted.']
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
  const internalOnly = useMemo(() => new Map(registry.filter((x) => x.audience === 'internal').map((x) => [x.id, x.title])), [registry])
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Presentation</th><th>Project</th><th>Built from</th><th>Slides</th><th>Status</th><th>Up to date?</th><th>Built</th></tr></thead>
        <tbody>
          {decks.map(({ d, p }) => {
            const stale = deckOutdated(d, p, registry)
            const status = deckStatus(d, checkDeck(d, { internalOnly }).filter((i) => i.level === 'error').length)
            return (
              <tr key={d.id} className="is-clickable" onClick={() => navigate(practice.deck(d.id))} data-testid={`deck-row-${d.id}`}>
                <td><strong>{d.title}</strong></td>
                <td className="small">{p.client.name}</td>
                <td className="small">{d.opportunityId ? p.opportunities[d.opportunityId]?.title ?? 'a deleted request' : 'The project’s data'}</td>
                <td>{d.slides.length}</td>
                <td><Chip tone={status.tone}>{status.label}</Chip></td>
                <td>{stale.length ? <Chip tone="warn" title={stale.join(' ')}>Out of date</Chip> : <Chip tone="ok">Up to date</Chip>}</td>
                <td className="small muted">{relTime(d.builtAt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const FLOW = [
  { title: 'Build', text: 'From a reviewed client request or a project’s own data. No model, so it takes a second.' },
  { title: 'Slides', text: 'On Carolina Baptista’s Nagarro Master Slides, checked as they are built. Change any line in the outline.' },
  { title: 'Share', text: 'Present here, download, or edit and export .pptx or PDF in Presentation Studio.' },
]

export function DecksPractice() {
  const projects = useStore((s) => s.projects)
  const [params, setParams] = useSearchParams()
  const filter = params.get('project') ?? ''
  const decks = Object.values(projects)
    .filter((p) => !filter || p.slug === filter)
    .flatMap((p) => Object.values(p.decks ?? {}).map((d) => ({ d, p })))
    .sort((a, b) => b.d.builtAt - a.d.builtAt)
  const projectName = filter ? Object.values(projects).find((p) => p.slug === filter)?.client.name : undefined
  return (
    <div className="page">
      <PageHead
        title="Presentations"
        lead="Nagarro decks built from what the hub already knows: a reviewed response to a client request, or a project’s own data for an assessment readout or a project update. Each deck has speaker notes and the moments to switch to the live demo. For a deck from an idea alone, use Presentation Studio."
        actions={
          <Link className="btn btn--primary" to={filter ? `${practice.deckNew}?project=${filter}` : practice.deckNew} data-testid="new-deck">
            <Plus /> New presentation
          </Link>
        }
      />
      <ProcessStrip compact label="How a deck comes together" steps={FLOW} />
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <label className="row small" style={{ gap: 8 }}>
          Project
          <select
            className="select"
            style={{ width: 'auto' }}
            value={filter}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              if (e.target.value) next.set('project', e.target.value)
              else next.delete('project')
              setParams(next, { replace: true })
            }}
            aria-label="Filter by project"
          >
            <option value="">All projects</option>
            {Object.values(projects).map((p) => (
              <option key={p.id} value={p.slug}>
                {p.client.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Panel flush>{decks.length ? <DeckTable decks={decks} /> : <Empty>{projectName ? `No presentations for ${projectName} yet.` : 'No presentations yet.'} Start one from a reviewed client request, or from a project for a readout or an update.</Empty>}</Panel>
    </div>
  )
}

export function DeckBuilder() {
  const projects = useStore((s) => s.projects)
  const navigate = useNavigate()
  const registry = useRegistry()
  const [params] = useSearchParams()
  const fromParam = params.get('from')
  const owner = fromParam ? Object.values(projects).find((p) => p.opportunities?.[fromParam]) : undefined
  const [projectId, setProjectId] = useState<string>(owner?.id ?? Object.values(projects).find((p) => p.slug === params.get('project'))?.id ?? '')
  const project = projects[projectId]
  const ready = project ? Object.values(project.opportunities ?? {}).filter((o) => o.responses.length) : []
  const [from, setFrom] = useState<string>(fromParam ?? (params.get('kind') === 'project' ? 'project' : ''))
  const [projectStructure, setProjectStructure] = useState<'readout' | 'update'>('readout')
  const [structure, setStructure] = useState<Deck['structure']>('proposal')
  const [minutes, setMinutes] = useState(30)
  const source = from || (ready[0] ? ready[0].id : 'project')
  const build = () => {
    if (!project) return
    const o = source !== 'project' ? project.opportunities[source] : undefined
    const resp = o && currentResponse(o)
    const plan = o && resp ? planFromOpportunity(o, resp, project, registry, { structure, durationMin: minutes }) : planFromEngagement(project, { durationMin: minutes, structure: projectStructure })
    const id = act().saveDeck(project.id, { ...plan, id: '', builtAt: Date.now(), builtBy: '' })
    // Opens on the slides: there is no model and nothing to approve before seeing them.
    navigate(practice.deck(id))
  }
  return (
    <div className="page page--narrow">
      <PageHead noTabs title="New presentation" crumbs={[{ label: 'Presentations', to: practice.presentations }, { label: 'New' }]} lead="Choose what the deck is built from and how long it is. It is built straight away, with no model; you can change any slide after." />
      <Panel title="Which project?">
        <select className="select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setFrom('') }} aria-label="Project" data-testid="deck-project">
          <option value="">Choose a project</option>
          {Object.values(projects).map((p) => (
            <option key={p.id} value={p.id}>
              {p.client.name}
              {p.client.fictional ? ' (sample)' : ''}
            </option>
          ))}
        </select>
      </Panel>
      {project && (
        <>
          <Panel title="What is it for?">
            <div className="stack">
              {ready.map((o) => (
                <label key={o.id} className={cx('choice', source === o.id && 'is-selected')}>
                  <input type="radio" name="from" checked={source === o.id} onChange={() => setFrom(o.id)} />
                  <span className="choice__body"><span className="choice__title">Answer “{o.title}”</span><span className="choice__desc">From the reviewed response (v{o.responses[0].version}).</span></span>
                </label>
              ))}
              <label className={cx('choice', source === 'project' && projectStructure === 'readout' && 'is-selected')}>
                <input type="radio" name="from" checked={source === 'project' && projectStructure === 'readout'} onChange={() => { setFrom('project'); setProjectStructure('readout') }} data-testid="from-readout" />
                <span className="choice__body"><span className="choice__title">Assessment readout</span><span className="choice__desc">Where {project.client.name}’s system stands, what we found, what was agreed, and what happens next.</span></span>
              </label>
              <label className={cx('choice', source === 'project' && projectStructure === 'update' && 'is-selected')}>
                <input type="radio" name="from" checked={source === 'project' && projectStructure === 'update'} onChange={() => { setFrom('project'); setProjectStructure('update') }} data-testid="from-update" />
                <span className="choice__body"><span className="choice__title">Project update</span><span className="choice__desc">What changed since the last update, decisions made, open points and next steps, for a steering group.</span></span>
              </label>
              {!ready.length && <p className="xs muted">No client request for {project.client.name} has a draft response yet. To build a proposal deck, draft the response first in Opportunities.</p>}
            </div>
          </Panel>
          <Panel title="Shape and length">
            <div className="stack">
              {source !== 'project' && (
                <>
                  <Segmented ariaLabel="Structure" value={structure} onChange={(v) => setStructure(v as Deck['structure'])} options={STRUCTURES.filter((x) => x.id !== 'update').map((x) => ({ id: x.id, label: x.label }))} />
                  <p className="small muted">{STRUCTURES.find((x) => x.id === structure)?.blurb}</p>
                </>
              )}
              <Field label="About how long?">
                <Segmented ariaLabel="Duration" value={String(minutes)} onChange={(v) => setMinutes(Number(v))} options={['15', '30', '45', '60'].map((m) => ({ id: m, label: `${m} min` }))} />
              </Field>
            </div>
          </Panel>
        </>
      )}
      <button className="btn btn--primary" onClick={build} disabled={!project} data-testid="build-deck">Build the deck</button>
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
  const navigate = useNavigate()
  const present = usePresentDemo()
  const [params, setParams] = useSearchParams()
  const registry = useRegistry()
  const deck = useStore((s) => (id ? s.projects[project.id]?.decks?.[id] : undefined))
  const [tab, setTab] = useState<'slides' | 'outline' | 'share'>('slides')
  // ?present=n reopens present mode at slide n (used when coming back from the live demo).
  const resumeAt = Number(params.get('present') ?? 0)
  const [presenting, setPresenting] = useState(resumeAt > 0)
  const [idx, setIdx] = useState(resumeAt > 0 ? resumeAt - 1 : 0)
  const [showTemplates, setShowTemplates] = useState(false)
  useEffect(() => {
    if (!params.get('present')) return
    const next = new URLSearchParams(params)
    next.delete('present')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
  if (!deck) return <Navigate to={practice.presentations} replace />
  const stale = deckOutdated(deck, project, registry)
  const errors = issues.filter((i) => i.level === 'error')
  const o = deck.opportunityId ? project.opportunities[deck.opportunityId] : undefined
  const rebuild = () => {
    const resp = o && currentResponse(o)
    const plan = o && resp ? planFromOpportunity(o, resp, project, registry, { structure: deck.structure, durationMin: deck.durationMin }) : planFromEngagement(project, { durationMin: deck.durationMin, structure: deck.structure === 'update' ? 'update' : 'readout' })
    act().saveDeck(project.id, { ...plan, id: deck.id, brief: { ...plan.brief, verbatim: deck.brief.verbatim }, builtAt: Date.now(), builtBy: deck.builtBy })
  }
  const setBrief = (key: keyof DeckBrief, value: string) => {
    const field = BRIEF_FIELDS.find((f) => f.key === key)!
    const v = key === 'slideCount' ? Number(value) || deck.brief.slideCount : key === 'client' ? { ...deck.brief.client, name: value } : field.list ? value.split('\n').map((x) => x.trim()).filter(Boolean) : value
    act().updateBrief(project.id, deck.id, { [key]: v } as Partial<DeckBrief>)
  }
  // Hand over to the live demo in this tab; "Back to preparation" returns to this slide.
  const openDemo = (link: NonNullable<Deck['slides'][number]['demoLink']>, at: number) => {
    const returnTo = `${practice.deck(deck.id)}?present=${at + 1}`
    if (link.chapter) return present(project.id, { guide: 'meeting', chapter: link.chapter, returnTo })
    const target = project.published ? project : useStore.getState().projects['demo-brand']
    const c = client(target.slug) as unknown as Record<string, string>
    present(target.id, { path: typeof c[link.routeKey] === 'string' ? c[link.routeKey] : c.home, returnTo })
  }

  return (
    <div className="page">
      <PageHead
       
        noTabs
        crumbs={[{ label: 'Presentations', to: practice.presentations }, { label: project.client.name, to: practice.presentationsFor(project.slug) }, { label: deck.title }]}
        title={deck.title}
        lead={`${deck.slides.length} slides · about ${deck.durationMin} minutes · ${STRUCTURES.find((s) => s.id === deck.structure)?.label}${o ? ` · built from “${o.title}”, response v${deck.recorded.responseVersion}` : ` · built from ${project.client.name}’s project data`}`}
        eyebrow={<Chip tone={deckStatus(deck, errors.length).tone}>{deckStatus(deck, errors.length).label}</Chip>}
        actions={<button className="btn btn--mint" onClick={() => { setIdx(0); setPresenting(true) }} data-testid="present-deck"><Play /> Present</button>}
      />
      {stale.length > 0 && (
        <Callout tone="warn">
          <strong>Out of date.</strong> {stale.join(' ')}{' '}
          <button className="btn btn--secondary btn--sm" onClick={rebuild} data-testid="rebuild-deck"><RefreshCw /> Rebuild the deck</button>
        </Callout>
      )}
      <Tabs value={tab} onChange={(t) => setTab(t)} tabs={[{ id: 'slides', label: 'Slides', badge: errors.length ? String(errors.length) : undefined }, { id: 'outline', label: 'Outline' }, { id: 'share', label: 'Share' }]} />
      {tab === 'slides' && (
        <div className="stack">
          {issues.length ? (
            <Callout tone={errors.length ? 'warn' : 'info'}>
              <strong>{errors.length ? `${errors.length} to fix before you share it.` : 'Worth a look.'}</strong>
              <ul className="small" data-testid="deck-issues" style={{ margin: '4px 0 0' }}>{issues.map((i, k) => <li key={k}>{i.text}</li>)}</ul>
            </Callout>
          ) : (
            <p className="small muted" data-testid="deck-checks-ok" style={{ margin: 0 }}>
              <CheckCircle2 style={{ width: 14, verticalAlign: '-2px' }} /> Checked: every slide uses a Master Slides layout within its capacity, covers and the closing are dark, and no figure appears without a source. Balance and rhythm are yours to judge.
            </p>
          )}
          <div className="grid grid--side">
            <Panel flush><SlidesFrame deck={deck} mode="list" /></Panel>
            <Panel title="Speaker notes" tight>
              <ol className="small notes-list">{deck.slides.map((s, i) => <li key={s.id}><strong>{s.claim}</strong>{s.demoLink && <> · <em>switch to the live demo</em></>}<textarea className="textarea textarea--inline" rows={2} defaultValue={s.notes} onBlur={(e) => act().updateSlide(project.id, deck.id, s.id, { notes: e.target.value })} aria-label={`Notes for slide ${i + 1}`} /></li>)}</ol>
            </Panel>
          </div>
        </div>
      )}
      {tab === 'outline' && (
        <Panel title="Outline">
          <p className="small muted">One line per slide: what it says, light or dark, and the layout. Edit a line in place, or move and remove slides on the right; the slides follow at once.</p>
          <label className="toggle xs" style={{ alignSelf: 'flex-start' }}>
            <input type="checkbox" checked={showTemplates} onChange={(e) => setShowTemplates(e.target.checked)} /> Show template names (for Presentation Studio)
          </label>
          <div className="table-wrap">
            <table className="table slide-plan">
              <thead><tr><th>#</th><th>What the slide says</th><th>Light / dark</th><th>Layout</th><th>Notes and demo</th><th></th></tr></thead>
              <tbody>
                {deck.slides.map((s, i) => (
                  <tr key={s.id} data-testid={`plan-row-${i + 1}`}>
                    <td>{i + 1}</td>
                    <td style={{ minWidth: 260 }}><input className="input input--inline" aria-label={`Slide ${i + 1} claim`} defaultValue={s.claim} onBlur={(e) => act().updateSlide(project.id, deck.id, s.id, { claim: e.target.value })} /></td>
                    <td><span className={cx('theme-dot', `theme-dot--${s.spec.theme ?? templateInfo(s.spec.template)?.theme ?? 'light'}`)} />{s.spec.theme ?? templateInfo(s.spec.template)?.theme ?? 'light'}</td>
                    <td className="small" title={s.spec.template}>{templateInfo(s.spec.template)?.use.split(/[:.—]/)[0].slice(0, 70)}{showTemplates && <div className="xs muted"><code>{s.spec.template}</code></div>}</td>
                    <td className="small">{s.demoLink ? <button className="btn btn--mint btn--sm" onClick={() => openDemo(s.demoLink!, i)}><MonitorPlay /> {s.demoLink.label}</button> : <span className="muted">{s.notes.slice(0, 70)}{s.notes.length > 70 ? '…' : ''}</span>}</td>
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
      {tab === 'share' && (
        <div className="stack">
          <div className="grid grid--2">
            <StudioHandoff deck={deck} />
            <Panel title="Download">
              <div className="stack">
                <button className="btn btn--secondary" disabled={busy} onClick={async () => { setBusy(true); downloadFile(await exportDeckHtml(deck)); setBusy(false); act().setDeckStage(project.id, deck.id, 'exported') }} data-testid="export-deck-html"><Download /> The deck as one HTML file, with present mode</button>
                <button className="btn btn--secondary" onClick={() => downloadFile(exportNotesMd(deck))} data-testid="export-notes-deck"><Download /> Speaker notes (Markdown)</button>
                <button className="btn btn--ghost btn--sm" onClick={() => downloadFile(exportBriefMd(deck))} data-testid="export-brief-md"><Download /> brief.md: the 12 points and the outline</button>
                <button className="btn btn--ghost btn--sm" onClick={() => downloadFile(exportDeckJson(deck))} data-testid="export-deck-json"><Download /> deck.json, the slide engine’s own format</button>
              </div>
              <p className="xs muted">This hub does not produce PowerPoint (.pptx) or PDF files: Presentation Studio does. To present from here, use Present (arrow keys to move, F for full screen); slides that switch to the live demo bring you back to the same slide.</p>
            </Panel>
          </div>
          <details className="panel other-ways">
            <summary><strong>The 12-point brief</strong> <span className="small muted">· what Studio and Claude Slides read, prefilled from what the deck is built from</span></summary>
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
            <p className="xs muted">Claude Slides: in Claude, ask to “make a Nagarro deck” (the nagarro-slides plugin) and paste brief.md. Slides are rendered by the Nagarro Master Slides engine by Carolina Baptista, included unchanged; version details are in <Link to={practice.about}>About this tool</Link>.</p>
          </details>
        </div>
      )}
      {presenting && createPortal(
        <div className="present-overlay" role="dialog" aria-label="Presenting">
          <SlidesFrame deck={deck} mode="present" index={idx} onIndex={setIdx} onExit={() => setPresenting(false)} />
          <div className="present-bar">
            <button className="btn btn--on-dark-ghost btn--sm" onClick={() => setIdx(Math.max(0, idx - 1))}>←</button>
            <span>{idx + 1} / {deck.slides.length} · {deck.slides[idx]?.claim}</span>
            <button className="btn btn--on-dark-ghost btn--sm" onClick={() => setIdx(Math.min(deck.slides.length - 1, idx + 1))}>→</button>
            {deck.slides[idx]?.demoLink && <button className="btn btn--mint btn--sm" onClick={() => openDemo(deck.slides[idx].demoLink!, idx)} data-testid="present-open-demo"><MonitorPlay /> {deck.slides[idx].demoLink!.label}</button>}
            <button className="btn btn--on-dark btn--sm" onClick={() => setPresenting(false)}>Exit</button>
          </div>
        </div>,
        document.body,
      )}
      <p className="xs muted"><button className="link-btn" onClick={() => { act().deleteDeck(project.id, deck.id); navigate(practice.presentations) }}>Delete this deck</button></p>
    </div>
  )
}
