// Every store action, grouped by slice. Pages import `AppState` from './store'.

import type { GrammarId } from '@/contract/adapters'
import type { StarterImport } from '@/library/theme/fromStarterProject'
import type { Approval, Availability, Category, Deck, DeckSlide, DeckStage, DraftSection, EvidenceRef, KnowledgeDocument, KnowledgeSource, OpportunityContext, OpportunityStep, Opportunity, ReadBy, RequestFormat, RequestKind, Requirement, TaskType, Usage, DeckBrief } from './types'
import type { ResponseDraft } from '@/opportunity/compose'
import type { PublishRefusal } from '@/opportunity/selectors'
import type { ChannelId, ClientExperience, ComponentGuidance, Contract, Engagement, GuideMode, HistoryEvent, Mode, ProjectId, ThemeConfig, Toast, TrustAction, TrustLevel, UiState, Workspace, JourneyProgress } from './types'

export interface UiActions {
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  log: (text: string, entity?: HistoryEvent['entity'], simulated?: boolean, actor?: string) => void
  setActingAs: (personId: string) => void
  setPreview: (p: Partial<Pick<UiState, 'previewBrand' | 'previewMode' | 'previewDensity'>>) => void
  setSideOpen: (open: boolean) => void
  setCmdkOpen: (open: boolean) => void
  setSimSpeed: (s: 1 | 3) => void
  setLastWorkspace: (w: Workspace | null) => void
  setPresenter: (on: boolean) => void
  setMotionPaused: (paused: boolean) => void
  setReturnTo: (path: string | null) => void
}

export interface ProjectActions {
  selectProject: (projectId: ProjectId) => void
  publishProject: (projectId: ProjectId, note?: string) => number
  rollbackTo: (projectId: ProjectId, version: number) => void
  restoreDraftFromPublished: (projectId: ProjectId) => void
  startDemoSession: (projectId: ProjectId, mode?: GuideMode) => boolean
  resetDemoSession: (projectId: ProjectId) => void
  endDemoSession: (projectId: ProjectId) => void
  /** Selects the project, flags the presenter and makes sure a session exists. Returns the client home or null when unpublished. */
  openClientExperience: (projectId: ProjectId) => string | null
  exitPresenter: () => void
  setClientExperience: (projectId: ProjectId, patch: Partial<ClientExperience>) => void
  setClientChapter: (projectId: ProjectId, chapterId: string, enabled: boolean) => void
  updateEngagement: (projectId: ProjectId, patch: Partial<Engagement>) => void
  resetProject: (projectId: ProjectId) => void
  resetAll: () => void
  /** A real client or prospect, created by a colleague (not sample data). Returns the new slug. */
  createProspect: (input: { name: string; sector: string; owner?: string }) => string
}

export type NewSourceInput = Omit<KnowledgeSource, 'id' | 'bodyHistory' | 'outline' | 'registeredAt' | 'registeredBy' | 'approval' | 'availability' | 'tags'> & { approval?: Approval; availability?: Availability; tags?: string[] }

export interface KnowledgeActions {
  registerSource: (input: NewSourceInput) => string
  updateSource: (id: string, patch: Partial<Pick<KnowledgeSource, 'title' | 'kind' | 'owner' | 'audience' | 'tags' | 'notes' | 'location'>>) => void
  setApproval: (id: string, approval: Approval, note?: string) => void
  setAvailability: (id: string, availability: Availability, message?: string) => void
  setReusable: (id: string, reusable: boolean) => void
  /** Stores a freshly read body; an approved source whose text changed becomes outdated. */
  applyBody: (id: string, doc: KnowledgeDocument, meta: { readBy: ReadBy; sourceUpdatedAt?: number }) => Promise<'changed' | 'unchanged'>
  removeSource: (id: string) => Promise<void>
  restoreSource: (id: string) => void
  resolveConflict: (id: string, note: string) => void
  reopenConflict: (id: string) => void
}

export interface OpportunityActions {
  createOpportunity: (projectId: ProjectId, input: { title: string; task: TaskType; requestKind?: RequestKind; context?: Partial<OpportunityContext> }) => string
  updateOpportunity: (projectId: ProjectId, id: string, patch: Partial<Pick<Opportunity, 'title' | 'task' | 'requestKind' | 'status' | 'step' | 'furthest' | 'exportedAt'>>) => void
  /** A person checked (or unchecked) a requirement's answer against the current draft. */
  setRequirementChecked: (projectId: ProjectId, id: string, requirementId: string, checked: boolean) => void
  setRequest: (projectId: ProjectId, id: string, input: { text: string; filename?: string; format: RequestFormat }) => Promise<number>
  setContext: (projectId: ProjectId, id: string, patch: Partial<OpportunityContext>) => void
  confirmContext: (projectId: ProjectId, id: string) => void
  setRequirements: (projectId: ProjectId, id: string, reqs: Requirement[], from: NonNullable<Opportunity['extractedFrom']>) => void
  editRequirement: (projectId: ProjectId, id: string, reqId: string, patch: Partial<Pick<Requirement, 'text' | 'primary' | 'mustAnswer'>> & { categories?: Category[] }) => void
  addRequirement: (projectId: ProjectId, id: string, input: { text: string; category: Category; mustAnswer?: boolean }) => string
  removeRequirement: (projectId: ProjectId, id: string, reqId: string) => void
  restoreRequirement: (projectId: ProjectId, id: string, reqId: string) => void
  setEvidence: (projectId: ProjectId, id: string, evidence: Record<string, EvidenceRef[]>, recommended: string[]) => void
  setSourceSelection: (projectId: ProjectId, id: string, selection: { included: string[]; excluded: { sourceId: string; reason?: string }[] }) => void
  /** keepEdited: 'edited' keeps every section a person edited, 'none' replaces all, or a list of section ids. */
  addResponse: (projectId: ProjectId, id: string, draft: ResponseDraft, keepEdited?: 'edited' | 'none' | string[]) => number
  editSection: (projectId: ProjectId, id: string, sectionId: string, patch: Partial<Pick<DraftSection, 'heading' | 'body' | 'kind'>>) => void
  addSection: (projectId: ProjectId, id: string, afterId?: string) => string
  removeSection: (projectId: ProjectId, id: string, sectionId: string) => void
  moveSection: (projectId: ProjectId, id: string, sectionId: string, dir: -1 | 1) => void
  applyImprovedSection: (projectId: ProjectId, id: string, sectionId: string, out: Pick<DraftSection, 'heading' | 'body' | 'kind' | 'citations'>, usage: Usage, model: string) => void
  setModelConsent: (projectId: ProjectId, id: string) => void
  publishOutput: (projectId: ProjectId, id: string, input: { title: string; sectionIds: string[] }) => { id: string } | { refused: PublishRefusal[] }
  retractOutput: (projectId: ProjectId, outputId: string) => void
  deleteOpportunity: (projectId: ProjectId, id: string) => Promise<boolean>
}

export interface DeckActions {
  saveDeck: (projectId: ProjectId, deck: Deck) => string
  updateDeck: (projectId: ProjectId, id: string, patch: Partial<Pick<Deck, 'title' | 'stage' | 'durationMin' | 'structure'>>) => void
  updateBrief: (projectId: ProjectId, id: string, patch: Partial<DeckBrief>) => void
  updateSlide: (projectId: ProjectId, id: string, slideId: string, patch: Partial<Omit<DeckSlide, 'id'>>) => void
  moveSlide: (projectId: ProjectId, id: string, slideId: string, dir: -1 | 1) => void
  removeSlide: (projectId: ProjectId, id: string, slideId: string) => void
  insertSlide: (projectId: ProjectId, id: string, slide: DeckSlide, afterId?: string) => void
  setDeckStage: (projectId: ProjectId, id: string, stage: DeckStage) => void
  deleteDeck: (projectId: ProjectId, id: string) => void
}

export interface JourneyActions {
  chooseEntryPath: (p: 'new' | 'bring' | 'explore' | null) => void
  setJourneyProgress: (journey: 'new' | 'improve', patch: Partial<Omit<JourneyProgress, 'data'>>) => void
  setJourneyData: (journey: 'new' | 'improve', key: string, value: unknown) => void
  /** Records that a step's work is done (or not), which is what progress and resume read. */
  markJourneyStep: (journey: 'new' | 'improve', step: number, done?: boolean) => void
  updateTheme: (patch: Partial<ThemeConfig>) => void
  applyPreset: (presetId: string) => void
  describeLook: (brief: string) => void
  completeWizard: () => void
  /** Records a set-up made in the DS Starter Pack's own wizard (read by fromStarterProject) and completes the journey. */
  recordStarterProject: (imp: StarterImport, from: string) => void
  exportToFigma: () => string
  connectSystem: (repoUrl: string, figmaUrl: string) => void
  runScan: () => void
  cancelScan: () => void
  setReadout: (id: string, choice: string) => void
  setMappingGrammar: (g: GrammarId) => void
  setMappingDecision: (source: string, d: 'accept' | 'alias' | 'skip') => void
  applyMappingDecisions: () => number
  toggleHandover: (id: string) => void
  fastForwardEngagement: () => void
}

export interface SystemActions {
  proposeFix: (findingId: string) => string | undefined
  dismissFinding: (findingId: string, reason: string) => void
  reopenFinding: (findingId: string) => void
  createPR: (changeId: string) => number | undefined
  discardChange: (changeId: string) => void
  runChecks: (prNumber: number) => void
  approvePR: (prNumber: number) => void
  mergePR: (prNumber: number) => boolean
  requestMerge: (prNumber: number) => void
  closePR: (prNumber: number) => void
  applyFigmaChangeSet: (id: string) => void
  undoFigmaChangeSet: (id: string) => void
  reopenFigmaChangeSet: (id: string) => void
  toggleFigmaRow: (id: string, tokenId: string, mode: Mode) => void
  publishChannels: (ids?: ChannelId[]) => void
  runReleaseEval: () => void
  decideProposal: (id: string, decision: 'approve' | 'reject') => void
  undoProposal: (id: string) => void
  setTrustLevel: (action: TrustAction, level: TrustLevel) => void
  saveGuidance: (componentId: string, guidance: ComponentGuidance) => number | undefined
  generatePrototype: (prompt: string) => void
  setContractLead: (layer: Contract['layers'][number]['layer'], leads: string) => void
  toggleRule: (ruleId: string) => void
  addBrand: (name: string, main: string) => void
}

export interface GuideActions {
  startGuide: (mode: GuideMode, chapterId?: string) => void
  setGuideChapter: (chapterId: string, stepIndex?: number) => void
  setGuideStep: (stepIndex: number) => void
  completeGuideChapter: (chapterId: string) => void
  pauseGuide: (paused: boolean) => void
  endGuide: () => void
  finishGuide: () => void
  restartGuide: (fresh: boolean) => void
  setGuideAutoplay: (on: boolean, seconds?: 5 | 8 | 12 | 20) => void
  setGuideNotesOpen: (open: boolean) => void
  setGuidePresenting: (on: boolean) => void
  setMeetingChapters: (ids: string[]) => void
}

export type AppActions = UiActions & ProjectActions & JourneyActions & SystemActions & GuideActions & KnowledgeActions & OpportunityActions & DeckActions
export type { OpportunityStep }
