// The scope every system action writes to: which project, and whether the internal draft or the
// client demo session. Layouts set it from the route; actions capture it once when they start so
// timer callbacks keep writing to the same place.

import type { AppData, GuideMode, GuideState, Layer, Project, ProjectId, Scope, SystemState } from './types'

let active: Scope = { projectId: 'demo-brand', layer: 'draft' }

export function activeScope(): Scope {
  return active
}

export function setActiveScope(scope: Scope) {
  active = scope
}

/** Draft = what the Nagarro team edits; published = the approved snapshot; session = the live demo (over published, never over draft). */
export function resolveView(s: Pick<AppData, 'projects'>, projectId: ProjectId, layer: Layer): SystemState | null {
  const p = s.projects[projectId]
  if (!p) return null
  if (layer === 'draft') return p.draft
  if (layer === 'published') return p.published?.state ?? null
  return p.session?.state ?? p.published?.state ?? null
}

export function projectBySlug(s: Pick<AppData, 'projects'>, slug: string): Project | undefined {
  return Object.values(s.projects).find((p: Project) => p.slug === slug)
}

export function jobKey(scope: Scope, name: string) {
  return `${scope.projectId}:${scope.layer}:${name}`
}

export function jobPrefix(scope: Scope) {
  return `${scope.projectId}:${scope.layer}:`
}

/** In a client session the visitor acts as the client's design-system owner; presenters keep the role switcher. */
export function effectiveActingAs(s: Pick<AppData, 'ui'>, scope: Scope) {
  return scope.layer === 'session' && !s.ui.presenter ? 'p-owner' : s.ui.actingAs
}

/** Deep clone of JSON-safe state. Works on frozen store objects and on immer drafts alike. */
export function cloneSys<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function newGuideState(mode: GuideMode = 'meeting'): GuideState {
  return {
    mode,
    status: 'idle',
    chapterId: null,
    stepIndex: 0,
    completedChapters: [],
    completedSteps: {},
    meetingChapters: [],
    autoplay: { on: false, seconds: 8 },
    notesOpen: true,
    presenting: false,
    elapsedMs: {},
  }
}

export function hasUnpublishedChanges(p: Pick<Project, 'published' | 'draftRev'>) {
  return !p.published || p.published.draftRev !== p.draftRev
}

export function sessionIsStale(p: Pick<Project, 'published' | 'session'>) {
  return Boolean(p.session && p.published && p.session.baseVersion !== p.published.version)
}
