// Shared entity types for the hub and the client demo.

export type Id = string
export type Mode = 'light' | 'dark'
export type BrandId = 'demo' | 'gold' | 'violet'
export type Severity = 'error' | 'warn' | 'info'
export type FixSide = 'figma' | 'code' | 'both'
export type TrustLevel = 'suggest' | 'autofix' | 'never'
export type TrustAction =
  | 'bindLooseFills'
  | 'writeGuidance'
  | 'renameToContractRoles'
  | 'changeTokenValues'
  | 'addRemoveComponents'
export type ContractLayer = 'primitives' | 'semantic' | 'componentApi' | 'guidance'
export type Role = 'owner' | 'contributor' | 'viewer' | 'agent'
export type ScreenStatus = 'works' | 'partly' | 'proposed'
export type Tier = 'primitive' | 'semantic' | 'component'

export interface Token {
  id: Id // css name without the leading dashes, e.g. color-background-interactive-primary-default
  path: string // contract path, e.g. color.background.interactive.primary.default
  tier: Tier
  type: 'color' | 'dimension' | 'font' | 'number' | 'shadow'
  figmaName: string // semantic/color/background/interactive/primary/default
  cssName: string // --color-background-interactive-primary-default
  values: Record<Mode, string> // demo brand
  brandOverrides?: Partial<Record<Exclude<BrandId, 'demo'>, Partial<Record<Mode, string>>>>
  usedBy: Id[] // component ids
  figmaLayerCount: number
  hasCodeName: boolean
  /** When Figma holds a different value than the system (drift). Cleared when a change set is applied. */
  figmaDrift?: Partial<Record<Mode, string>>
  description?: string
}

export interface ComponentGuidance {
  whenToUse?: string
  whenNotToUse?: string
  antiPatterns: string[]
  a11y?: string
}

export type ComponentSource = 'dsn' | 'starter'

export interface Component {
  id: Id
  name: string
  /** Which real library implements it (registry key = `${source}:${sourceId}`). */
  source: ComponentSource
  sourceId: string
  category: 'atoms' | 'molecules' | 'organisms' | 'patterns'
  usedIn: number
  guidance: ComponentGuidance
  tokenRefs: Id[]
  figmaNodeId: string
  storyCount: number
  rendered: boolean
  variants?: string[]
  props?: { name: string; type: string; values?: string[] }[]
  status: 'stable' | 'beta' | 'needs-review'
  codeConnect: boolean
  description: string
}

export interface Rule {
  id: Id
  title: string
  source: 'DSN audit' | 'Starter Pack parity' | 'Prototyping kit lint' | 'WCAG 2.2' | 'Contract grammar'
  sourceDetail: string // e.g. scripts/audit-token-collisions.mjs
  description: string
  fixSide: FixSide
  severity: Severity
  category: 'collision' | 'naming' | 'parity' | 'contrast' | 'guidance' | 'code-syntax' | 'grammar'
}

export interface EvidenceItem {
  label: string
  value: string
  swatch?: string
  note?: string
}

export type FindingStatus = 'open' | 'proposed' | 'in_pr' | 'merged' | 'dismissed'

export interface Finding {
  id: Id
  ruleId: Id
  title: string
  summary: string
  componentIds: Id[]
  tokenIds: Id[]
  severity: Severity
  evidence: EvidenceItem[]
  status: FindingStatus
  fixSide: FixSide
  source: 'scan' | 'patrol' | 'seed'
  dismissReason?: string
  changeId?: Id
  prNumber?: number
  suggestedFix?: {
    description: string
    tokenChanges?: TokenChange[]
    guidanceChanges?: GuidanceChange[]
  }
  count?: number // e.g. "Hover equals default in dark (3)"
}

export interface TokenChange {
  tokenId: Id
  mode: Mode
  from: string
  to: string
}

export interface GuidanceChange {
  componentId: Id
  field: keyof ComponentGuidance
  from: string
  to: string
}

export interface Impact {
  componentIds: Id[]
  figmaLayers: number
  figmaFiles: number
  docsPages: string[]
  channels: number
}

export type ChangeStatus = 'draft' | 'in_pr' | 'applied' | 'discarded'

export interface Change {
  id: Id
  kind: 'token' | 'guidance' | 'contract' | 'figma'
  title: string
  findingId?: Id
  tokenChanges: TokenChange[]
  guidanceChanges: GuidanceChange[]
  impact: Impact
  status: ChangeStatus
  createdAt: number
  prNumber?: number
  author: string
}

export type CheckStatus = 'queued' | 'running' | 'pass' | 'fail'

export interface Check {
  id: 'parity' | 'a11y' | 'grammar' | 'eval' | 'index'
  name: string
  status: CheckStatus
  detail?: string
  score?: number
  gate?: number
  durationMs: number
}

export type PrStatus = 'checks_running' | 'waiting_review' | 'changes_requested' | 'approved' | 'merged' | 'closed'

export interface PullRequest {
  number: number
  title: string
  branch: string
  base: 'main'
  changeId: Id
  findingIds: Id[]
  checks: Check[]
  reviewers: { personId: Id; required: boolean; state: 'pending' | 'approved' }[]
  status: PrStatus
  figmaChangeSetId?: Id
  createdAt: number
  mergedAt?: number
  openedFrom: 'panel' | 'editor' | 'agent'
}

export interface FigmaChangeRow {
  tokenId: Id
  figmaName: string
  mode: Mode
  change: string // the new value
  figmaNow: string
  atLastSync: string
  system: string
  status: 'figma' | 'both' | 'new' | 'different' | 'applied'
  include: boolean
}

export interface FigmaChangeSet {
  id: Id
  prNumber?: number
  title: string
  rows: FigmaChangeRow[]
  layersRebound: number
  status: 'pending' | 'version_saved' | 'applied' | 'undone'
  versionLabel?: string
  appliedAt?: number
  file: string
}

export type ChannelId = 'figma-specs' | 'storybook-mcp' | 'claude-design' | 'v0-registry' | 'design-md' | 'agents-md'

export interface Channel {
  id: ChannelId
  name: string
  format: string
  consumer: string
  status: 'fresh' | 'stale' | 'publishing'
  lastPublished: number
  staleReason?: string
  sample: string
}

export interface EvalRun {
  id: Id
  version: string
  onSystem: number
  gate: number
  perTool: { tool: string; model: string; score: number }[]
  failures: { prompt: string; tool: string; reason: string; rule: string }[]
  date: number
  prompts: number
}

export type AgentProposalStatus = 'pending' | 'approved' | 'rejected' | 'auto_applied' | 'undone' | 'blocked'

export interface AgentProposal {
  id: Id
  agent: 'patrol' | 'publisher'
  title: string
  description: string
  kind: 'needs_review' | 'mechanical'
  trustAction: TrustAction
  status: AgentProposalStatus
  tokenChanges?: TokenChange[]
  guidanceChanges?: GuidanceChange[]
  figmaRebinds?: number
  createdAt: number
  decidedAt?: number
}

export interface Person {
  id: Id
  name: string
  role: Role
  count?: number
  can: string
  isAgent?: boolean
}

export type Package = '2-week AI audit' | 'DS Build' | 'DS Accelerate' | 'DS Scale' | 'Support'
export type Stage = 'scoping' | 'assessing' | 'building' | 'adapting' | 'scaling' | 'supporting'

export interface Engagement {
  package: Package
  stage: Stage
  startedAt: number
  nextReview: string
  /** Nagarro lead for the engagement. */
  owner: string
  adapterVersion: string
  needsSpecialist?: string
  notes: string
}

export interface HistoryEvent {
  id: Id
  ts: number
  actor: string
  text: string
  entity?: { type: 'finding' | 'change' | 'pr' | 'figma' | 'channel' | 'proposal' | 'trust' | 'contract' | 'guidance' | 'scan' | 'wizard' | 'prototype' | 'people' | 'project' | 'session' | 'knowledge' | 'opportunity' | 'deck' | 'publishedOutput'; id: string }
  simulated?: boolean
}

export interface ContractLayerDef {
  layer: ContractLayer
  label: string
  leads: string
  readThrough: string
  options: string[]
}

export interface Contract {
  version: number
  name: string
  repo: string
  figmaFile: string
  ci: string
  layers: ContractLayerDef[]
  rulesEnabled: Record<Id, boolean>
  supportedProfile: string
}

export interface BrandDef {
  id: BrandId
  name: string
  main: string
  accent: string
  isDefault?: boolean
}

export interface ThemeConfig {
  name: string
  tagline: string
  appearance: 'both' | 'light' | 'dark'
  designedFirst: Mode
  secondMode: 'follows' | 'separate'
  productType: string
  brands: BrandDef[]
  activeBrand: BrandId
  color: { main: string; accent: string; neutralTint: number }
  type: { heading: string; body: string; baseSize: number; headingWeight: number }
  radius: number
  density: number
  depth: number
  buttonShape: 'default' | 'pill'
  presetId?: string
  startingPoint: 'defaults' | 'describe' | 'preset' | 'mirror'
  brief?: string
  repoUrl: string
  figmaUrl: string
}

export interface PrototypeBlock {
  componentId: Id
  label: string
  props?: Record<string, string>
}

export interface PrototypeCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail?: string
}

export interface Prototype {
  id: Id
  prompt: string
  blocks: PrototypeBlock[]
  checks: PrototypeCheck[]
  refused: { token: string; reason: string; nearest?: string; rule: string }[]
  createdAt: number
}

export interface ScanStage {
  id: string
  label: string
  detail: string
  ms: number
}

export interface ScanResult {
  readiness: number // 1–5
  parityPct: number
  contrastFails: number
  valuesWithoutCodeName: number
  totalValues: number
  componentsDiffer: number
  totalComponents: number
  aiReadable: number
}

export interface BeforeSnapshot extends ScanResult {
  takenAt: number
  driftItems: number
}

export interface Toast {
  id: Id
  kind: 'sim' | 'ok' | 'warn' | 'err' | 'info'
  title: string
  detail?: string
  diff?: string[]
  ttl?: number
}

export interface Job {
  id: Id
  label: string
  stageIndex: number
  stages: { label: string; detail?: string }[]
  status: 'running' | 'done' | 'cancelled' | 'failed'
  /** Set when a real (non-simulated) task failed. */
  error?: string
  /** 'sim' = timer-based local simulation; 'task' = real async work (file reads, model calls). */
  kind?: 'sim' | 'task'
}

// ---------------------------------------------------------------------------
// Project-scoped model (schema v3). One SystemState shape serves the internal
// draft, every published snapshot and the client demo session.
// ---------------------------------------------------------------------------

export type ProjectId = string
export type Workspace = 'nagarro' | 'client'
export type Layer = 'draft' | 'published' | 'session'
export type WriteLayer = 'draft' | 'session'

export interface Scope {
  projectId: ProjectId
  layer: WriteLayer
}

/** The numbers the assessment reports, per project (replaces constants that used to live in selectors). */
export interface Baseline {
  totalValues: number
  valuesWithoutCodeName: number
  componentsInFigma: number
  componentsDiffer: number
  contrastFails: number
  parityPct: number
  checksTotal: number
}

export type EntryPath = 'new' | 'bring' | 'explore' | null
export type ConnectStatus = 'idle' | 'detected' | 'unsupported' | 'denied'
export type GrammarChoice = 'dsn' | 'starter' | 'kit'

export interface JourneyProgress {
  /** 1-based step the person is on; the URL shows it, the store saves it. */
  currentStep: number
  visited: number[]
  /** Steps whose work is done (1-based, in the journey's order). Opening a step never adds it here. */
  done?: number[]
  startedAt?: number
  completedAt?: number
  /** Step data that is not part of the theme or the contract (goals, checklists, choices). */
  data: Record<string, unknown>
}

export interface Journey {
  entryPath: EntryPath
  wizardDone: boolean
  exportedChangeSetId?: string
  connect: { repoUrl: string; figmaUrl: string; status: ConnectStatus; message?: string }
  scan: { status: 'idle' | 'running' | 'done' | 'cancelled'; completedAt?: number; stageDetails: string[] }
  before?: BeforeSnapshot
  readout: Record<string, string>
  mapping: { grammar: GrammarChoice; decisions: Record<string, 'accept' | 'alias' | 'skip'> }
  handover: Record<string, boolean>
  engagementFastForwarded: boolean
  /** Save-and-resume state for the two guided journeys. */
  new: JourneyProgress
  improve: JourneyProgress
}

/** Everything a page reads about one system. */
export interface SystemState {
  components: Component[]
  tokens: Token[]
  findings: Finding[]
  changes: Change[]
  pullRequests: PullRequest[]
  figmaChangeSets: FigmaChangeSet[]
  channels: Channel[]
  evals: EvalRun[]
  agentProposals: AgentProposal[]
  people: Person[]
  contract: Contract
  trust: Record<TrustAction, TrustLevel>
  history: HistoryEvent[]
  prototypes: Prototype[]
  theme: ThemeConfig
  journey: Journey
  baseline: Baseline
}

export interface PublishedVersion {
  version: number
  publishedAt: number
  publishedBy: string
  note: string
  /** The draft revision that was published; equal to project.draftRev when nothing changed since. */
  draftRev: number
  state: SystemState
}

/** meeting = short path, full = every chapter, custom = a playlist built for one meeting (in meetingChapters). */
export type GuideMode = 'meeting' | 'full' | 'free' | 'custom'
export type GuideStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface GuideState {
  mode: GuideMode
  status: GuideStatus
  chapterId: string | null
  stepIndex: number
  completedChapters: string[]
  completedSteps: Record<string, number[]>
  /** The playlist for mode 'custom', in order. */
  meetingChapters: string[]
  autoplay: { on: boolean; seconds: 5 | 8 | 12 | 20 }
  notesOpen: boolean
  presenting: boolean
  startedAt?: number
  finishedAt?: number
  elapsedMs: Record<string, number>
}

export interface DemoSession {
  baseVersion: number
  startedAt: number
  /** A full clone of the published snapshot; every client-side action writes here. */
  state: SystemState
  guide: GuideState
}

export interface ClientExperience {
  enabled: boolean
  /** chapter id → enabled in this project's client demo (kept for older data; the path choice replaces it) */
  chapters: Record<string, boolean>
  guidanceDefault: 'none' | 'meeting' | 'full'
  /** Summaries a colleague explicitly added to the client demo (frozen copies). */
  publishedOutputs: PublishedOutput[]
  /** Demos built for a meeting on the Demos page: chapters in order. Optional: older data has none. */
  playlists?: { id: string; name: string; chapters: string[]; savedAt: number }[]
}

/** Where an item stands on the Projects board: a pitch we are working on, live work, done, or on hold. */
export type ProjectStatus = 'opportunity' | 'in-progress' | 'delivered' | 'paused'
export type ProjectTag = 'product-design' | 'design-system' | 'prototype' | 'ai-ready'

/** What the Projects board shows about an item (schema v5). Tasks live in Jira; this is the portfolio view. */
export interface ProjectCard {
  status: ProjectStatus
  tags: ProjectTag[]
  /** ISO 3166 alpha-2 country of the client, for the flag. */
  country?: string
  /** An image URL; without one the board draws a tile from the system's colours. */
  thumbnail?: string
  brief: string
  links: { figma?: string; code?: string; jira?: string; storybook?: string }
  /** Nagarro people on it (ids from src/fixtures/team-board.json). */
  peopleIds: string[]
}

export interface Project {
  id: ProjectId
  slug: string
  /** fictional = sample data shipped with the hub; real prospects are created by users. */
  client: { name: string; sector: string; fictional: boolean }
  engagement: Engagement
  draft: SystemState
  draftRev: number
  published: PublishedVersion | null
  /** Previous published versions, newest first. */
  versions: PublishedVersion[]
  clientExperience: ClientExperience
  session: DemoSession | null
  /** Project-level events: published, rolled back, session started… */
  activity: HistoryEvent[]
  /** Opportunity responses (internal only; never versioned or cloned into client sessions). */
  opportunities: Record<string, Opportunity>
  /** Decks built on the Nagarro Master Slides engine (internal only). */
  decks: Record<string, Deck>
  card: ProjectCard
}

export interface UiState {
  /** Only used by the welcome redirect; the workspace itself is derived from the route. */
  lastWorkspace: Workspace | null
  /** True while a colleague presents the client demo. Never implied by the route. */
  presenter: boolean
  actingAs: string
  motionPaused: boolean
  previewBrand: BrandId
  previewMode: Mode
  previewDensity: 'compact' | 'standard' | 'comfortable'
  sideOpen: boolean
  cmdkOpen: boolean
  simSpeed: 1 | 3
  /** Where "Back to preparation" leads from the client demo (the hub page or slide it was opened from). */
  returnTo?: string | null
  /** Who "My work" is for (a person id from the team board). */
  me?: string
}

/** Fixture input for one project. */
export interface ProjectSeed {
  id: ProjectId
  slug: string
  client: Project['client']
  engagement: Engagement
  theme: Partial<ThemeConfig> & Pick<ThemeConfig, 'name'>
  componentIds: 'all' | string[]
  findingIds: 'all' | string[]
  findingOverrides?: Record<string, Partial<Finding>>
  journey?: Partial<Omit<Journey, 'new' | 'improve'>>
  fastForwarded?: boolean
  publish: boolean
  clientExperience: Omit<ClientExperience, 'publishedOutputs'>
}

/** The persisted, action-free part of the store. */
/** A post about the practice's work (Engagement). Drafts made here; Nuno's posts come from a FigJam snapshot. */
export type PostFormat = 'video' | 'carousel' | 'image' | 'article' | 'idea'
export type PostKind = 'show-the-work' | 'point-of-view' | 'field-notes' | 'lesson-learned' | 'insight'
export type PostStatus = 'idea' | 'draft' | 'in-review' | 'approved' | 'posted'
export interface PostDraft {
  id: string
  title: string
  format: PostFormat
  kind: PostKind
  /** company = the Nagarro Design page; personal = a designer's own account. */
  surface: 'company' | 'personal'
  byline: string
  status: PostStatus
  /** The post exactly as it would be pasted. */
  text: string
  /** Where its facts come from; what is simulated or sped up. */
  notes: string
  /** The social cut it came from, if any (src/fixtures/social-cuts.ts). */
  cutId?: string
  createdAt: number
  updatedAt: number
}

export interface AppData {
  meta: { schemaVersion: number; seededAt: number; migratedFrom?: number }
  /** posts is optional: stores from before Engagement have none. */
  practice: { rules: Rule[]; knowledge: KnowledgeState; posts?: PostDraft[] }
  projects: Record<ProjectId, Project>
  selectedProjectId: ProjectId
  ui: UiState
  sim: { jobs: Record<string, Job>; toasts: Toast[] }
}

// ---- knowledge library, opportunity responses, decks (schema v4) ----
import type { KnowledgeState } from '@/knowledge/types'
import type { Opportunity, PublishedOutput } from '@/opportunity/types'
import type { Deck } from '@/deck/types'
export type * from '@/knowledge/types'
export type * from '@/opportunity/types'
export type * from '@/deck/types'
