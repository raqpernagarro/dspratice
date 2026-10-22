// The knowledge library's data model. Pure types, no imports from the app, so Node scripts
// (scripts/*.mjs, run with Node's type stripping) share them with the browser and Vitest.
//
// A KnowledgeSource is the registry entry (where it lives, who owns it, whether it is approved,
// whether we could read it). Its text lives separately as a KnowledgeDocument, keyed by docId:
// bundled JSON for the seed collection, IndexedDB for anything refreshed or uploaded.

export type SourceKind =
  | 'point-of-view' | 'offering' | 'approach' | 'governance-model' | 'method' | 'deck'
  | 'template' | 'proposal-section' | 'case-study' | 'resource' | 'request'

export type Approval = 'draft' | 'approved' | 'outdated'
export type Availability = 'available' | 'inaccessible' | 'unsupported' | 'not-read'
export type Audience = 'internal' | 'client-safe' | 'public'
export type ReadBy = 'figma-plugin' | 'figma-rest' | 'figma-cli' | 'figma-mcp' | 'local-read' | 'upload' | 'paste'

export type SourceScope =
  | { kind: 'practice' }
  | { kind: 'client'; projectId: string; reusable: boolean; reuseApprovedBy?: string; reuseApprovedAt?: number }

export type SourceLocation =
  | { type: 'figma'; fileKey: string; nodeIds: string[]; page?: string; label?: string }
  | { type: 'figjam'; fileKey: string; nodeIds: string[]; label?: string }
  | { type: 'figma-folder'; teamId?: string; projectId?: string; label?: string }
  | { type: 'local'; path: string }
  | { type: 'upload'; filename: string; mime?: string }
  | { type: 'url'; url: string }
  | { type: 'repo'; url: string }

export interface OutlineEntry { id: string; heading: string }

export interface KnowledgeSource {
  id: string
  title: string
  kind: SourceKind
  scope: SourceScope
  location: SourceLocation
  owner?: string
  audience: Audience
  approval: Approval
  approvedBy?: string
  approvedAt?: number
  approvalNote?: string
  availability: Availability
  availabilityMessage?: string
  /** Last change reported by the source itself (file mtime, Figma lastModified). */
  sourceUpdatedAt?: number
  readAt?: number
  readBy?: ReadBy
  sourceHash?: string
  docId?: string
  /** Earlier bodies, newest first (cap 3), so an answer can show what it was built from. */
  bodyHistory: { docId: string; hash: string; readAt: number }[]
  outline: OutlineEntry[]
  excerpt?: string
  charCount?: number
  tags: string[]
  notes?: string
  registeredAt: number
  registeredBy: string
  /** Present on bundled seed entries. */
  seed?: boolean
}

export interface SectionRef {
  page?: string
  frame?: string
  nodeId?: string
  url?: string
  path?: string
  line?: number
  pageNumber?: number
}

export interface KnowledgeSection {
  /** Stable across refreshes: 's-' + hash of the canonical reference (node id, heading path, page). */
  id: string
  heading: string
  text: string
  ref: SectionRef
  order: number
  kind: 'slide' | 'heading' | 'sticky' | 'page' | 'block'
  hash: string
  chars: number
}

export interface KnowledgeDocument {
  schema: 'knowledge-doc@1'
  docId: string
  sourceId: string
  readAt: number
  readBy: ReadBy
  sourceHash: string
  sections: KnowledgeSection[]
  missing: { what: string; why: string }[]
  warnings: string[]
  stats: { sections: number; chars: number; truncated: boolean }
}

export interface ConflictPosition { sourceId: string; sectionId?: string; says: string }

export interface KnowledgeConflict {
  id: string
  topic: string
  summary: string
  positions: ConflictPosition[]
  /** The wording or number the practice has decided on, when there is one. */
  canonical?: string
  /** Words that make this conflict relevant to a request even when only one side is retrieved. */
  triggers: string[]
  /** Regular-expression sources (case-insensitive) that detect each side in a section. */
  patterns: string[]
  status: 'open' | 'resolved'
  resolution?: { note: string; decidedBy: string; decidedAt: number }
}

export interface KnowledgeState {
  overrides: Record<string, Partial<KnowledgeSource>>
  custom: Record<string, KnowledgeSource>
  hidden: string[]
  conflicts: Record<string, KnowledgeConflict>
  activity: { id: string; ts: number; actor: string; text: string; sourceId?: string }[]
}

/** What a response or deck records about each source it used, to detect later changes. */
export interface RecordedSource {
  sourceId: string
  title: string
  readAt?: number
  sourceHash?: string
  approval: Approval
}

export interface EvidenceRef {
  sourceId: string
  sectionId: string
  score: number
  matched: string[]
  why: string
  snippet: string
}

/** Doc-derived fields written by the snapshot scripts into docs/index.generated.json. */
export interface DocIndexEntry {
  docId: string
  sourceHash: string
  readAt: number
  readBy: ReadBy
  outline: OutlineEntry[]
  excerpt: string
  charCount: number
  sections: number
  missing: number
}
