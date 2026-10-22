// Where our own material disagrees, from the practice's audits (19–21 Oct 2026). A conflict shows
// up in a draft when a retrieved section matches one of its patterns.

import type { KnowledgeConflict } from '../../knowledge/types.ts'

export const SEED_CONFLICTS: KnowledgeConflict[] = [
  { id: 'c-package-names', topic: 'Package names', summary: 'Older material uses Diagnostic, Cornerstone, Grow and Revamp & Unify. Since 19 Oct the canonical names are 2-week AI audit, DS Build, DS Accelerate, DS Scale and Support (same scopes).', canonical: '2-week AI audit · DS Build · DS Accelerate · DS Scale · Support', triggers: [], patterns: ['\\bCornerstone\\b', '\\bRevamp (&|and) Unify\\b', '\\bDiagnostic\\b(?!s)'], positions: [], status: 'open' },
  { id: 'c-pillars', topic: 'How many pillars', summary: 'The campaign uses five pillars; one deck slide says six. Keep five until the campaign ends on 16 Nov, then harmonise.', canonical: 'Five pillars (until 16 Nov)', triggers: [], patterns: ['\\b(5|five) pillars\\b', '\\b(6|six) pillars\\b'], positions: [], status: 'open' },
  { id: 'c-starter-count', topic: 'DS Starter Pack component count', summary: 'The Starter Pack docs say 49 components; the repository has 56 specs (57 registry entries, counted 21 Oct).', canonical: '56 specs', triggers: [], patterns: ['\\b49 components\\b', '\\b56 (components|specs)\\b'], positions: [], status: 'open' },
  { id: 'c-dsn-docs', topic: 'DSN documentation vs code', summary: 'The DSN README describes the styling library and the npm package differently from the code (a publish workflow exists). Quote the code-verified evidence index, not the README.', triggers: [], patterns: ['styled[- ]components', 'no (published )?npm package', 'publish workflow'], positions: [], status: 'open' },
  { id: 'c-ai-delivery-names', topic: 'Names for "AI in delivery"', summary: 'Decks use several names for AI in delivery and for the studio. Use the campaign wording ("AI-ready design systems"; "One foundation. Shared by people and AI.") until the naming decision.', triggers: [], patterns: ['\\bAI[- ]accelerated delivery\\b', '\\bAI-powered delivery\\b', '\\bintelligent delivery\\b'], positions: [], status: 'open' },
]
