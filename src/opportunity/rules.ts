// Which Nagarro package fits, by rule (zero tokens). The canonical names are the 19 Oct decision:
// 2-week AI audit → DS Build / DS Accelerate / DS Scale, with Support as the add-on. Durations are
// never stated here; a duration only appears in a draft when it is quoted from a cited source.

import type { Category, PackageName } from './types.ts'

export interface PackageRule {
  id: string
  when: (ctx: { text: string; categories: Set<Category>; engagementPackage?: PackageName }) => boolean
  package: PackageName
  alternatives: PackageName[]
  reasoning: string
  /** Retrieval query that should find the practice's own words for this recommendation. */
  query: string
}

export const PACKAGES: { name: PackageName; what: string }[] = [
  { name: '2-week AI audit', what: 'A short, fixed assessment: where the system stands, what blocks AI from staying on-system, and a readout with the recommended next package.' },
  { name: 'DS Build', what: 'A new design system for a product that has none it can trust.' },
  { name: 'DS Accelerate', what: 'An existing system made AI-ready: a system contract, guidance AI tools can read, checks on every change and a named owner.' },
  { name: 'DS Scale', what: 'Several systems or brands brought onto one shared foundation.' },
  { name: 'Support', what: 'Ongoing governance, evals and enablement after handover.' },
]

export const PACKAGE_RULES: PackageRule[] = [
  {
    id: 'no-system',
    when: ({ text }) => /\b(no (design )?system|from scratch|greenfield|start(ing)? (a )?new (design )?system|don'?t have a design system)\b/i.test(text),
    package: 'DS Build',
    alternatives: ['2-week AI audit'],
    reasoning: 'The request describes no design system the teams can rely on yet, so the work starts by building one, with the AI-ready structure in from day one.',
    query: 'DS Build new design system no usable system',
  },
  {
    id: 'multi-brand',
    when: ({ text }) => /\b((several|multiple|three|four|two|\d) (design )?systems|multi-?brand|several brands|multiple brands|brand portfolio|merg(e|ing) (brands|systems))\b/i.test(text),
    package: 'DS Scale',
    alternatives: ['2-week AI audit', 'DS Accelerate'],
    reasoning: 'Several systems or brands have to share one foundation, which is what DS Scale is for. We would still open with a short assessment to see how far apart they are.',
    query: 'DS Scale several systems multi-brand shared foundation',
  },
  {
    id: 'ongoing',
    when: ({ text, categories }) => /\b(ongoing|retainer|after (the )?handover|run and evolve|continuous support)\b/i.test(text) && !categories.has('assessment'),
    package: 'Support',
    alternatives: ['2-week AI audit'],
    reasoning: 'The ask is about keeping a system healthy over time (governance, evals, enablement), which is the Support add-on.',
    query: 'Support ongoing governance evals enablement',
  },
  {
    id: 'default-audit-first',
    when: () => true,
    package: '2-week AI audit',
    alternatives: ['DS Accelerate', 'DS Scale'],
    reasoning: 'The request asks for an assessment, a governance model for AI-proposed changes and enablement on an existing system. We recommend starting with the 2-week AI audit to establish where the system stands, then moving into DS Accelerate, rather than pitching a full plan before the assessment.',
    query: '2-week AI audit assessment readout first step accelerate',
  },
]

export function recommendPackage(ctx: { text: string; categories: Set<Category>; engagementPackage?: PackageName }): PackageRule {
  return PACKAGE_RULES.find((r) => r.when(ctx))!
}

/** Names of other clients and companies a client-facing draft must never mention. The list itself
 *  is internal (real client names), so it is registered from src/internal/register.ts and never
 *  ships in the public demo build. */
let denylist: string[] = []
export function setOtherClientDenylist(names: string[]) {
  denylist = [...names]
}
export function otherClientDenylist(): readonly string[] {
  return denylist
}
