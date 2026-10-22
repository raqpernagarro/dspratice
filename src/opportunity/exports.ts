// Downloads for an opportunity. Every function returns { filename, mime, content } so the UI's
// download helper and the tests use the same output.

import type { KnowledgeSource, KnowledgeDocument } from '../knowledge/types.ts'
import { activeRequirements, coverage } from './selectors.ts'
import type { Opportunity, ResponseVersion } from './types.ts'

export interface ExportFile { filename: string; mime: string; content: string }

const KIND_LABEL = { supported: 'Supported by a source', recommendation: 'Recommendation', assumption: 'Assumption', 'open-question': 'Open question' } as const

export function fileSlug(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 50) || 'opportunity'
}

function sourceLine(src: KnowledgeSource | undefined, sectionId: string, docs: Record<string, KnowledgeDocument>) {
  if (!src) return `${sectionId} (source removed)`
  const sec = src.docId ? docs[src.docId]?.sections.find((s) => s.id === sectionId) : undefined
  const where = sec?.ref.url ?? sec?.ref.path ?? (src.location.type === 'url' ? src.location.url : '')
  return `${src.title}${sec ? ` › ${sec.heading}` : ''}${where ? ` (${where})` : ''}`
}

export function exportResponseMd(opp: Opportunity, r: ResponseVersion, clientName: string, registry: KnowledgeSource[], docs: Record<string, KnowledgeDocument>): ExportFile {
  const by = new Map(registry.map((s) => [s.id, s]))
  const notes: string[] = []
  const noteFor = (sourceId: string, sectionId: string) => {
    const line = sourceLine(by.get(sourceId), sectionId, docs)
    let i = notes.indexOf(line)
    if (i < 0) i = notes.push(line) - 1
    return `[^${i + 1}]`
  }
  const lines = [
    `# ${opp.title}`,
    `_${clientName} · response v${r.version} · ${r.generatedBy.label}${r.generatedBy.model ? ` (${r.generatedBy.model})` : ''} · ${new Date(r.generatedBy.at).toISOString().slice(0, 10)}_`,
    '',
    '> Draft for internal review. Every section says whether it is supported by an approved Nagarro source, a recommendation, an assumption or an open question.',
    '',
    ...r.draft.flatMap((d) => [`## ${d.heading}`, `_${KIND_LABEL[d.kind]}_${d.citations.length ? ' ' + d.citations.map((c) => noteFor(c.sourceId, c.sectionId)).join('') : ''}`, '', d.body, '']),
    '## Next steps',
    ...r.nextSteps.map((s) => `- ${s}`),
    '',
    ...(r.conflicts.length ? ['## Where our sources disagree', ...r.conflicts.map((c) => `- **${c.topic}.** ${c.summary}${c.canonical ? ` Current wording: ${c.canonical}.` : ''}`), ''] : []),
    ...(notes.length ? ['---', ...notes.map((n, i) => `[^${i + 1}]: ${n}`)] : []),
  ]
  return { filename: `${fileSlug(opp.title)}.response.md`, mime: 'text/markdown', content: lines.join('\n') + '\n' }
}

const csv = (v: unknown) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportRequirementsCsv(opp: Opportunity, registry: KnowledgeSource[]): ExportFile {
  const by = new Map(registry.map((s) => [s.id, s]))
  const cov = new Map(coverage(opp).map((c) => [c.requirementId, c]))
  const r = opp.responses[0]
  const rows = [['id', 'number', 'requirement', 'category', 'must answer', 'status', 'coverage', 'answer kind', 'sources', 'note']]
  for (const q of activeRequirements(opp)) {
    const a = r?.answers.find((x) => x.requirementId === q.id)
    const srcs = Array.from(new Set((a?.statements ?? []).flatMap((s) => s.citations.map((c) => by.get(c.sourceId)?.title ?? c.sourceId)))).join('; ')
    rows.push([q.id, q.number ?? '', q.text, q.primary, q.mustAnswer ? 'yes' : 'no', q.status, cov.get(q.id)?.state ?? 'none', a?.status ?? '', srcs, q.unanswerable ? q.unanswerable.reason : ''])
  }
  return { filename: `${fileSlug(opp.title)}.requirements.csv`, mime: 'text/csv', content: rows.map((row) => row.map(csv).join(',')).join('\n') + '\n' }
}

export function exportOpportunityJson(opp: Opportunity, requestText: string): ExportFile {
  return { filename: `${fileSlug(opp.title)}.opportunity.json`, mime: 'application/json', content: JSON.stringify({ exportedAt: new Date().toISOString(), opportunity: opp, requestText }, null, 2) }
}

export function exportNotesMd(opp: Opportunity, r: ResponseVersion, registry: KnowledgeSource[]): ExportFile {
  const by = new Map(registry.map((s) => [s.id, s]))
  const lines = [
    `# What this draft is built from · ${opp.title}`,
    '',
    `Generated: ${r.generatedBy.label}${r.generatedBy.model ? ` · ${r.generatedBy.model}` : ''} · ${new Date(r.generatedBy.at).toISOString()}`,
    r.generatedBy.usage ? `Model usage: ${r.generatedBy.usage.inputTokens} input tokens, ${r.generatedBy.usage.outputTokens} output tokens` : 'Model usage: none (template)',
    `Request version: v${r.inputs.requestVersion}`,
    '',
    '## Sources read',
    ...r.inputs.sources.map((s) => `- ${s.title} · ${s.approval}${s.readAt ? ` · read ${new Date(s.readAt).toISOString().slice(0, 10)}` : ''}`),
    '',
    '## Excluded sources',
    ...(opp.sourceSelection.excluded.length ? opp.sourceSelection.excluded.map((e) => `- ${by.get(e.sourceId)?.title ?? e.sourceId}${e.reason ? ` · ${e.reason}` : ''}`) : ['- none']),
    '',
    '## Gaps needing an expert',
    ...(r.gaps.length ? r.gaps.map((g) => `- ${g.what} · ${g.expert ?? 'practice lead'}`) : ['- none']),
    '',
    '## Conflicts between sources',
    ...(r.conflicts.length ? r.conflicts.map((c) => `- ${c.topic}: ${c.summary}`) : ['- none found in the evidence used']),
    '',
    '## Checks',
    ...(r.issues.length ? r.issues.map((i) => `- ${i.code} · ${i.where}: ${i.detail}`) : ['- no issues']),
    ...(r.warnings.length ? ['', '## Warnings', ...r.warnings.map((w) => `- ${w}`)] : []),
  ]
  return { filename: `${fileSlug(opp.title)}.notes.md`, mime: 'text/markdown', content: lines.join('\n') + '\n' }
}
