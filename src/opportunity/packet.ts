// The generation packet: everything a colleague needs to draft with their own Claude or ChatGPT
// chat (their subscription, not the hub's API key). Same rules and sources as the API path, same
// token budget, so it stays small.

import type { KnowledgeDocument, KnowledgeSource } from '../knowledge/types.ts'
import { activeRequirements } from './selectors.ts'
import type { Opportunity } from './types.ts'
import { SYSTEM_RULES, budgetSections } from './prompts.ts'

export function generationPacket(opp: Opportunity, clientName: string, requestText: string, sources: KnowledgeSource[], docs: Record<string, KnowledgeDocument>): { filename: string; mime: string; content: string; approxTokens: number } {
  const { blocks, truncated } = budgetSections(opp, sources, docs)
  const reqs = activeRequirements(opp)
  const content = [
    `# Generation packet · ${opp.title} · ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Paste this whole file into a Claude or ChatGPT chat. It holds the rules, the request, the requirements and only the most relevant Nagarro source sections.',
    '',
    '## Rules',
    SYSTEM_RULES,
    '',
    `## Client\n${clientName} · audience: ${opp.context.audience || 'not stated'} · objective: ${opp.context.objective || 'not stated'} · deliverable: ${opp.context.deliverable || 'not stated'}`,
    '',
    '## Request (original)',
    '```',
    requestText.trim(),
    '```',
    '',
    '## Requirements',
    ...reqs.map((r) => `- [${r.id}]${r.number ? ` (${r.number})` : ''} ${r.text}${r.mustAnswer ? ' [must answer]' : ''}${r.unanswerable ? ` [not answerable from sources: ${r.unanswerable.kind}]` : ''}`),
    '',
    `## Sources${truncated ? ' (trimmed to the most relevant sections)' : ''}`,
    ...blocks.map((b) => `### Source ${b.sourceId} · ${b.title} (${b.approval})\n#### Section ${b.sectionId} · ${b.heading}\n${b.text}`),
    '',
    '## What to write back',
    'Headings: Understanding · Approach · Answers (one per requirement id) · Assumptions · Open questions · Next steps. Cite as [S:<source id>/<section id>]. Do not state prices, dates, availability, references, outcomes or capabilities that are not in the sources.',
  ].join('\n')
  return { filename: `${opp.title.toLowerCase().replace(/[^\w]+/g, '-').slice(0, 40)}.packet.md`, mime: 'text/markdown', content, approxTokens: Math.round(content.length / 4) }
}
