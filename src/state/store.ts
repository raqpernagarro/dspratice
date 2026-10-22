// One Zustand store, persisted, split into slices. The data shape is in types.ts (AppData), the
// actions in actions.ts. Every system action writes through ctx.setSys() to the active scope.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AppActions } from './actions'
import type { AppData, SystemState } from './types'
import { makeCtx } from './ctx'
import { SCHEMA_VERSION, seedState } from './seed'
import { migrateV2toV3, migrateV3toV4, type V2State, type V3State } from './migrate'
import { bindJobSetter } from './jobs'
import { uiSlice } from './slices/ui'
import { projectsSlice } from './slices/projects'
import { journeySlice } from './slices/journey'
import { systemSlice } from './slices/system'
import { guideSlice } from './slices/guide'
import { knowledgeSlice } from './slices/knowledge'
import { opportunitySlice } from './slices/opportunity'
import { deckSlice } from './slices/deck'

export { SCHEMA_VERSION }
/** The demo build keeps its own storage so a public visitor never shares state with the internal hub. */
export const STORAGE_KEY = import.meta.env.VITE_TARGET === 'demo' ? 'unified-ds-tool:demo' : 'unified-ds-tool:v1'

export type AppState = AppData & AppActions
export type { Workspace } from './types'

export const useStore = create<AppState>()(
  persist(
    immer((set, get) => {
      bindJobSetter((fn) => set((s) => fn(s.sim.jobs)))
      const ctx = makeCtx(set, get)
      return {
        ...seedState(),
        ...uiSlice(ctx),
        ...projectsSlice(ctx),
        ...journeySlice(ctx),
        ...systemSlice(ctx),
        ...guideSlice(ctx),
        ...knowledgeSlice(ctx),
        ...opportunitySlice(ctx),
        ...deckSlice(ctx),
      }
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { sim, ...rest } = s
        void sim
        return { ...rest, ui: { ...rest.ui, cmdkOpen: false, sideOpen: false, motionPaused: false } } as unknown as AppState
      },
      migrate: (persisted, version) => {
        try {
          let data = persisted as unknown
          let v = version
          if (v === 2) {
            data = migrateV2toV3(data as V2State)
            v = 3
          }
          if (v === 3) {
            data = migrateV3toV4(data as V3State)
            v = 4
          }
          if (v === SCHEMA_VERSION) return data as AppState
        } catch {
          /* fall through to a fresh seed */
        }
        return seedState() as unknown as AppState
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Simulations never persist: downgrade anything left "running" in any project and layer.
        let interrupted = false
        useStore.setState((s) => {
          const systems: SystemState[] = []
          for (const p of Object.values(s.projects)) {
            systems.push(p.draft)
            if (p.session) systems.push(p.session.state)
          }
          for (const sys of systems) {
            if (sys.journey.scan.status === 'running') {
              sys.journey.scan.status = 'idle'
              sys.journey.scan.stageDetails = []
              interrupted = true
            }
            for (const p of sys.pullRequests) {
              if (p.status === 'checks_running') {
                p.checks.forEach((c) => {
                  if (c.status === 'running') c.status = 'queued'
                })
                interrupted = true
              }
            }
            for (const c of sys.channels) if (c.status === 'publishing') c.status = 'stale'
            for (const cs of sys.figmaChangeSets) if (cs.status === 'version_saved') cs.status = 'pending'
          }
          s.sim = { jobs: {}, toasts: [] }
        })
        if (interrupted) state.pushToast({ kind: 'info', title: 'Interrupted simulation reset', detail: 'A reload stopped a running simulation. Start it again when you are ready.' })
        if (state.meta.migratedFrom === 2) {
          state.pushToast({ kind: 'info', title: 'Your demo data moved into projects', detail: 'Demo Brand kept every change and was published as v1. The guided demo now lives in the client experience.' })
        } else if (state.meta.migratedFrom === 3) {
          state.pushToast({ kind: 'info', title: 'Knowledge library and opportunities added', detail: 'Your drafts and published versions are unchanged. Northwind has a sample request to try the response workflow.' })
        }
        if (state.meta.migratedFrom) {
          useStore.setState((s) => {
            delete s.meta.migratedFrom
          })
        }
      },
    },
  ),
)

// "Unpublished changes" without per-action bookkeeping: whenever a project's draft identity changes
// (immer), bump its revision. Published versions remember the revision they were taken from.
useStore.subscribe((next, prev) => {
  if (next.projects === prev.projects) return
  for (const id of Object.keys(next.projects)) {
    const a = next.projects[id]
    const b = prev.projects[id]
    if (b && a.draft !== b.draft && a.draftRev === b.draftRev) {
      useStore.setState((s) => {
        const p = s.projects[id]
        if (p) p.draftRev += 1
      })
    }
  }
})

// Re-run interrupted checks on demand (used by the PR page).
export function ensureChecksRunning(prNumber: number) {
  const s = useStore.getState()
  const scope = activeScopeFor()
  const sys = scope.layer === 'session' ? s.projects[scope.projectId]?.session?.state : s.projects[scope.projectId]?.draft
  const pr = sys?.pullRequests.find((p) => p.number === prNumber)
  if (pr && pr.status === 'checks_running' && pr.checks.some((c) => c.status === 'queued') && !pr.checks.some((c) => c.status === 'running')) {
    s.runChecks(prNumber)
  }
}

import { activeScope as activeScopeFor } from './scope'
