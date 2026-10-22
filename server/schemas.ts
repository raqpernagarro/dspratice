// Structured-output schemas for the model calls (zod v4, as the Anthropic SDK's helper expects).
// Optional-looking fields are required strings ("" = none) so every response validates strictly.

import * as z from 'zod/v4'

const KIND = z.enum(['supported', 'recommendation', 'assumption', 'open-question'])
const PACKAGE = z.enum(['2-week AI audit', 'DS Build', 'DS Accelerate', 'DS Scale', 'Support'])
const Citation = z.object({ sourceId: z.string(), sectionId: z.string(), quote: z.string() })
const Statement = z.object({ kind: KIND, text: z.string(), citations: z.array(Citation), caveat: z.string() })

export const ComposeSchema = z.object({
  understanding: z.string(),
  answers: z.array(z.object({ requirementId: z.string(), statements: z.array(Statement) })),
  approach: z.object({
    package: PACKAGE,
    alternatives: z.array(PACKAGE),
    reasoning: z.string(),
    phases: z.array(z.object({ name: z.string(), what: z.string(), citations: z.array(Citation) })),
    citations: z.array(Citation),
  }),
  assumptions: z.array(Statement),
  openQuestions: z.array(Statement),
  gaps: z.array(z.object({ what: z.string(), why: z.string(), expert: z.string() })),
  draft: z.array(z.object({ heading: z.string(), body: z.string(), kind: KIND, citations: z.array(Citation), requirementIds: z.array(z.string()) })),
  nextSteps: z.array(z.string()),
})

export const ImproveSchema = z.object({ heading: z.string(), body: z.string(), kind: KIND, citations: z.array(Citation) })

export type ComposeOutput = z.infer<typeof ComposeSchema>
export type ImproveOutput = z.infer<typeof ImproveSchema>
