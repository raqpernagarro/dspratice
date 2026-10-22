// The opportunity-response data model. Pure types; relative imports only.

import type { Approval, EvidenceRef, KnowledgeConflict, RecordedSource } from '../knowledge/types.ts'

export type PackageName = '2-week AI audit' | 'DS Build' | 'DS Accelerate' | 'DS Scale' | 'Support'

export type TaskType = 'rfp' | 'proposal' | 'approach' | 'discovery' | 'governance' | 'summary' | 'meeting'
export type RequestKind = 'rfp' | 'questionnaire' | 'brief' | 'notes' | 'other'
export type RequestFormat = 'text' | 'markdown' | 'docx' | 'pdf'
export type OpportunityStep = 'request' | 'context' | 'requirements' | 'sources' | 'response' | 'export'
export type OpportunityStatus = 'draft' | 'in-review' | 'responded' | 'archived'

export interface RequestVersion {
  version: number
  docId: string
  hash: string
  charCount: number
  excerpt: string
  filename?: string
  format: RequestFormat
  importedAt: number
  importedBy: string
}

export type Category =
  | 'assessment' | 'governance' | 'enablement' | 'tooling-ai' | 'accessibility' | 'delivery-approach'
  | 'team' | 'commercial' | 'legal' | 'timeline' | 'technical' | 'general'

export type UnanswerableKind = 'pricing' | 'timeline' | 'availability' | 'credentials' | 'outcomes' | 'contract' | 'undocumented-capability'

export interface Requirement {
  id: string
  number?: string
  text: string
  originalText?: string
  span?: { requestVersion: number; start: number; end: number }
  categories: Category[]
  primary: Category
  status: 'extracted' | 'edited' | 'added' | 'removed'
  mustAnswer: boolean
  unanswerable?: { kind: UnanswerableKind; reason: string }
  evidence: EvidenceRef[]
  order: number
}

export type StatementKind = 'supported' | 'recommendation' | 'assumption' | 'open-question'

export interface Citation { sourceId: string; sectionId: string; quote?: string }

export interface Statement {
  kind: StatementKind
  text: string
  citations: Citation[]
  caveat?: string
}

export interface Answer {
  requirementId: string
  status: StatementKind | 'gap'
  statements: Statement[]
  edited?: boolean
}

export interface DraftSection {
  id: string
  heading: string
  /** Markdown. */
  body: string
  kind: StatementKind
  citations: Citation[]
  requirementIds: string[]
  edited?: boolean
  keptFrom?: number
  /** Set when "Improve with AI" rewrote this section. */
  aiRevised?: { model: string; at: number }
}

export interface ValidationIssue {
  code: 'bad-citation' | 'uncited-supported' | 'uncited-figure' | 'unanswerable-overclaim' | 'unknown-requirement' | 'bad-package' | 'other-client' | 'schema'
  where: string
  detail: string
}

export interface Usage { inputTokens: number; outputTokens: number; cacheReadTokens?: number }

export interface ResponseVersion {
  version: number
  generatedBy: { mode: 'template' | 'model'; model?: string; label: string; at: number; usage?: Usage }
  triggeredBy: string
  inputs: { requestVersion: number; requestHash: string; requirementsHash: string; sources: RecordedSource[] }
  understanding: string
  answers: Answer[]
  approach: { package: PackageName; alternatives: PackageName[]; reasoning: string; phases: { name: string; what: string; citations: Citation[] }[]; citations: Citation[] }
  assumptions: Statement[]
  openQuestions: Statement[]
  gaps: { what: string; why: string; expert?: string }[]
  conflicts: KnowledgeConflict[]
  draft: DraftSection[]
  nextSteps: string[]
  presentationStructure: { title: string; purpose: string }[]
  warnings: string[]
  issues: ValidationIssue[]
}

export interface OpportunityContext {
  client: string
  audience: string
  objective: string
  deliverable: string
  dueDate?: string
  confirmedAt?: number
  confirmedBy?: string
}

export interface Opportunity {
  id: string
  projectId: string
  title: string
  task: TaskType
  requestKind: RequestKind
  status: OpportunityStatus
  step: OpportunityStep
  createdAt: number
  updatedAt: number
  createdBy: string
  request: { original: RequestVersion; versions: RequestVersion[]; current: number } | null
  context: OpportunityContext
  requirements: Requirement[]
  extractedFrom?: { requestVersion: number; at: number; by: 'rules' | 'model' }
  sourceSelection: { included: string[]; excluded: { sourceId: string; reason?: string }[]; recommended: string[]; updatedAt?: number }
  responses: ResponseVersion[]
  aiUsage: { inputTokens: number; outputTokens: number; calls: number }
  modelConsentAt?: number
  publishedOutputIds: string[]
  deckIds: string[]
}

export interface PublishedOutput {
  id: string
  opportunityId: string
  title: string
  responseVersion: number
  sections: { heading: string; body: string; kind: StatementKind; sources: string[] }[]
  generatedByMode: 'template' | 'model'
  publishedAt: number
  publishedBy: string
  /** Provenance as hashes only: this object is client-facing, so it never names internal sources. */
  recorded: { requestVersion: number; requestHash: string; responseHash: string; sourcesHash: string; sourceCount: number }
  retractedAt?: number
}

export type { Approval }
