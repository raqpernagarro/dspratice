// Zero-token deck planning: a reviewed opportunity response → slide specs on Carolina's master
// templates (the engine's own spec format), with speaker notes, citations and the moments to
// switch to the live client demo. Picture slots stay empty: the engine never invents an image.

import type { Deck, DeckBrief, DeckSlide, SlideSpec } from './types'
import type { Opportunity, Project, ResponseVersion, Citation } from '@/state/types'
import { activeRequirements, requirementsHash, responseHash } from '@/opportunity/selectors'
import { recordSources } from '@/knowledge/selectors'
import type { KnowledgeSource } from '@/knowledge/types'
import { ENGINE } from './catalog'

export const STRUCTURES = [
  { id: 'proposal', label: 'Proposal', blurb: 'Understanding, what you asked for, approach, live demo, assumptions, next steps.' },
  { id: 'readout', label: 'Assessment readout', blurb: 'Where the system stands, what we found, what to do first, live demo.' },
  { id: 'kickoff', label: 'Discovery kickoff', blurb: 'Why we are here, what we heard, questions for today, how we work together.' },
] as const

const CAT: Record<string, string> = { assessment: 'Assessment', governance: 'Governance', enablement: 'Enablement', 'tooling-ai': 'AI tooling', accessibility: 'Accessibility', 'delivery-approach': 'Approach', technical: 'Technology', general: 'Other' }

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, ' ').replace(/\[[^\]]+\]/g, '').trim()
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t
}
const firstSentence = (s: string) => clip((s.replace(/\s+/g, ' ').match(/^[^.!?]+[.!?]/)?.[0] ?? s), 160)
let n = 0
const sid = () => `sl-${++n}-${Math.random().toString(36).slice(2, 6)}`

function slide(spec: SlideSpec, claim: string, notes: string, citations: Citation[] = [], extra: Partial<DeckSlide> = {}): DeckSlide {
  return { id: sid(), spec, claim, notes, citations, picture: 'none', ...extra }
}

export function briefFrom(o: Opportunity, r: ResponseVersion, p: Project, slides: number, sources: KnowledgeSource[]): DeckBrief {
  const supported = r.answers.flatMap((a) => a.statements).filter((s) => s.kind === 'supported').slice(0, 3)
  return {
    deckName: o.title,
    keyMessages: [firstSentence(r.approach.reasoning), ...supported.map((s) => firstSentence(s.text))].filter(Boolean),
    audiencePurpose: [o.context.audience, o.context.objective].filter(Boolean).join(' · ') || `${p.client.name}: respond to the request`,
    slideCount: slides,
    client: { name: p.client.name, logo: 'Look it up in the DS client-logo set; never redraw it' },
    verbatim: [],
    hook: 'AI will build your interfaces anyway. Make sure it builds yours.',
    tone: 'Plain, specific and confident: a senior consultant talking to a client. No invented figures, no marketing adjectives.',
    mustHaveSlides: ['Recommended approach', 'See it live', 'Assumptions and open points', 'Next steps'],
    takeaways: r.nextSteps.slice(0, 3),
    pictures: ['Picture placeholders only; no client or colleague photos standing for specific people'],
    sources: recordSources(sources, r.inputs.sources.map((x) => x.sourceId)).map((s) => s.title),
  }
}

export function planFromOpportunity(o: Opportunity, r: ResponseVersion, p: Project, sources: KnowledgeSource[], opts: { structure: Deck['structure']; durationMin: number }): Omit<Deck, 'id' | 'builtAt' | 'builtBy'> {
  n = 0
  const reqs = activeRequirements(o)
  const asked = Array.from(reqs.filter((q) => !q.unanswerable).reduce((m, q) => m.set(q.primary, [...(m.get(q.primary) ?? []), q]), new Map<string, typeof reqs>()).entries()).sort((a, b) => b[1].length - a[1].length)
  const byKind = (k: string) => r.draft.find((d) => d.heading.toLowerCase().includes(k))
  const gov = r.draft.find((d) => /governance/i.test(d.heading) && d.kind !== 'open-question')
  const enable = r.draft.find((d) => /enablement/i.test(d.heading))
  const open = [...r.assumptions.slice(0, 2).map((a) => ({ title: 'To confirm', primary: clip(a.text, 90), secondary: 'Assumption' })), ...r.openQuestions.slice(0, 2).map((q) => ({ title: 'Open point', primary: clip(q.text.split(':')[0], 90), secondary: clip(q.caveat ?? 'Account team', 40) }))].slice(0, 3)
  const chapters = ['Our understanding', 'What you asked for', 'Recommended approach', ...(gov ? ['Governance'] : []), 'See it live', 'Assumptions and open points', 'Next steps']
  const slides: DeckSlide[] = []
  slides.push(slide({ template: 'main/cover-01', theme: 'dark', title: clip(o.title, 60), subtitle: clip(`For ${p.client.name}${o.context.audience ? ` · ${o.context.audience.replace(/\s*\([^)]*\)/g, '').trim()}` : ''}`, 70) }, 'Cover', `Open with the hook: "AI will build your interfaces anyway. Make sure it builds yours."`))
  slides.push(slide({ template: 'main/index-01', title: 'Today', items: chapters.map((c, i) => ({ number: String(i + 1).padStart(2, '0'), label: c })) }, 'What we will cover', 'Walk through the agenda in one breath; promise the live demo.'))
  slides.push(slide({ template: 'core/divider-single', theme: 'dark', number: '01', title: 'Our understanding' }, 'Chapter: our understanding', ''))
  const paras = r.understanding.split(/(?<=\.)\s+/).reduce<string[]>((acc, s) => {
    if (!acc.length || acc[acc.length - 1].length > 220) acc.push(s)
    else acc[acc.length - 1] += ` ${s}`
    return acc
  }, []).slice(0, 3)
  slides.push(slide({ template: 'main/summary-01', title: 'What we heard', body: paras }, clip(paras[0] ?? r.understanding, 120), `Read it back in their words. Ask: "Did we get this right?"\n\n${r.understanding}`))
  const cards = asked.slice(0, 6).map(([c, qs]) => ({ title: CAT[c] ?? c, body: clip(qs.map((q) => q.text).join(' · '), 150) }))
  const cardsTemplate = cards.length >= 5 ? (cards.length === 6 ? 'core/cards-grid-6' : 'core/cards-row-5') : 'core/cards-row-4'
  const cardsFor = cardsTemplate === 'core/cards-row-4' ? cards.slice(0, 4) : cardsTemplate === 'core/cards-row-5' ? cards.slice(0, 5) : cards.slice(0, 6)
  while (cardsFor.length < 3) cardsFor.push({ title: 'Other', body: 'Further requirements are in the written response.' })
  slides.push(slide({ template: cardsTemplate, caption: 'What you asked for', title: `${reqs.length} requirements, ${asked.length} themes`, subtitle: 'Every one is answered, assumed or listed as an open point', cards: cardsFor }, 'What they asked for, grouped', reqs.map((q) => `- ${q.number ? `${q.number}. ` : ''}${q.text}`).join('\n')))
  slides.push(slide({ template: 'core/divider-single', theme: 'dark', number: '02', title: 'Recommended approach' }, 'Chapter: approach', ''))
  slides.push(slide({ template: 'marketing/text-02', caption: 'Our recommendation', title: r.approach.package, body: clip(r.approach.reasoning, 420) }, `Start with ${r.approach.package}`, `${r.approach.reasoning}${r.approach.alternatives.length ? `\n\nAlternatives if asked: ${r.approach.alternatives.join(', ')}.` : ''}`, r.approach.citations))
  if (r.approach.phases.length >= 3) slides.push(slide({ template: 'planning/data-01', caption: 'How we would run it', title: 'Phase by phase', phases: r.approach.phases.slice(0, 6).map((ph, i) => ({ label: ph.name, bold: `Phase ${i + 1}`, month: '', sub: '', body: clip(ph.what, 110) })) }, 'The phases', r.approach.phases.map((ph) => `${ph.name}: ${ph.what}`).join('\n'), r.approach.phases.flatMap((ph) => ph.citations)))
  if (gov) {
    const govCards = gov.body.split(/\n\n+/).map((b) => b.replace(/\s*\[[^\]]+\]/g, '').replace(/^_|_$/g, '').trim()).filter((b) => b && !b.startsWith('_')).slice(0, 4).map((b, i) => ({ title: ['Who decides', 'How changes are reviewed', 'What runs on every change', 'What stays local'][i] ?? `Point ${i + 1}`, body: clip(b, 150) }))
    while (govCards.length < 3) govCards.push({ title: 'To agree together', body: 'Ownership, review and release cadence are agreed in the readout.' })
    slides.push(slide({ template: 'core/cards-row-4', caption: 'Governance', title: 'People decide; checks run on every change', subtitle: 'Including changes proposed by AI tools', cards: govCards }, 'How governance works', gov.body, gov.citations))
  }
  if (enable) slides.push(slide({ template: 'main/overview-01', title: 'Your team runs it after us', subtitle: 'Enablement', body: enable.body.split(/\n\n+/).map((b) => clip(b.replace(/\s*\[[^\]]+\]/g, ''), 260)).filter((b) => b && !b.startsWith('_')).slice(0, 2) }, 'Enablement', enable.body, enable.citations))
  slides.push(slide({ template: 'marketing/text-02', caption: 'Live demo', title: 'See it working', body: `We switch to the client experience: an AI-ready system on our demo brand, where AI builds with the real components and a rule becomes a fix.` }, 'Switch to the live demo', 'Open the client experience as presenter. Come back to this deck for the open points.', [], { demoLink: { label: 'Open the client experience', routeKey: 'home' } }))
  if (open.length >= 2) slides.push(slide({ template: 'core/table-rows-3', caption: 'Before we start', title: 'Assumptions and open points', subtitle: 'What we need to confirm together', rows: open }, 'Assumptions and open points', [...r.assumptions.map((a) => `- Assumption: ${a.text}`), ...r.openQuestions.map((q) => `- Open: ${q.text}`)].join('\n')))
  const steps = r.nextSteps.slice(0, 4).map((s, i) => ({ date: `Step ${i + 1}`, title: clip(s.split(/[.:]/)[0], 40), body: clip(s, 110) }))
  if (steps.length >= 3) slides.push(slide({ template: 'pitch/grid-15', caption: 'Next steps', title: 'How we get started', steps }, 'Next steps', r.nextSteps.join('\n')))
  slides.push(slide({ template: 'main/closing-01', theme: 'dark', title: "Let's build it together." }, 'Closing', 'Thank them; confirm the readout date.'))
  void byKind
  const brief = briefFrom(o, r, p, slides.length, sources)
  const cur = o.request!.versions.find((v) => v.version === o.request!.current)!
  return {
    projectId: p.id,
    opportunityId: o.id,
    title: o.title,
    structure: opts.structure,
    durationMin: opts.durationMin,
    brief,
    slides,
    stage: 'plan',
    engine: { artifactVersion: ENGINE.artifactVersion, templates: ENGINE.templates },
    recorded: { requestHash: cur.hash, responseVersion: r.version, responseHash: responseHash(r), requirementsHash: requirementsHash(o), sources: r.inputs.sources },
    generatedBy: 'template',
  }
}

/** A short readout deck from the engagement itself (no opportunity). */
export function planFromEngagement(p: Project, opts: { durationMin: number }): Omit<Deck, 'id' | 'builtAt' | 'builtBy'> {
  n = 0
  const sys = p.draft
  const open = sys.findings.filter((f) => f.status === 'open').length
  const slides: DeckSlide[] = [
    slide({ template: 'main/cover-01', theme: 'dark', title: `${p.client.name}: where the system stands`, subtitle: `${p.engagement.package} · ${p.engagement.stage}` }, 'Cover', ''),
    slide({ template: 'main/summary-01', title: 'Where you are today', body: [`${sys.components.length} components in the contract, ${open} open findings.`, `Next review: ${p.engagement.nextReview}.`] }, 'Where they are', 'Numbers come from the hub (demo data for sample clients).'),
    slide({ template: 'marketing/text-02', caption: 'Live demo', title: 'See it working', body: 'We switch to your control panel: findings, changes and what AI builds with your system.' }, 'Switch to the live demo', 'Open the client experience as presenter.', [], { demoLink: { label: 'Open the client experience', routeKey: 'report' } }),
    slide({ template: 'main/closing-01', theme: 'dark', title: "Let's keep building it together." }, 'Closing', ''),
  ]
  return {
    projectId: p.id,
    title: `${p.client.name} readout`,
    structure: 'readout',
    durationMin: opts.durationMin,
    brief: { deckName: `${p.client.name} readout`, keyMessages: [], audiencePurpose: `${p.client.name} · readout`, slideCount: slides.length, client: { name: p.client.name, logo: 'Look it up in the DS client-logo set' }, verbatim: [], hook: 'AI will build your interfaces anyway. Make sure it builds yours.', tone: 'Plain, specific, confident.', mustHaveSlides: ['See it live'], takeaways: [], pictures: [], sources: [] },
    slides,
    stage: 'plan',
    engine: { artifactVersion: ENGINE.artifactVersion, templates: ENGINE.templates },
    recorded: { sources: [] },
    generatedBy: 'template',
  }
}
