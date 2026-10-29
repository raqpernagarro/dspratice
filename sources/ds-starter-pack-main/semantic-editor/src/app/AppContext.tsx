import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type { RunSettings } from '../agent/client'
import { fetchPlanStatus, PLAN_SUPPORTED } from '../agent/planClient'
import type { PlanStatus } from '../agent/planProtocol'
import { loadSettings, saveProject, saveSettings, type AgentConnection, type AgentSettings, type ProjectDoc } from './store'

type Patch = Partial<ProjectDoc> | ((doc: ProjectDoc) => Partial<ProjectDoc>)

interface AppContextValue {
  project: (id: string) => ProjectDoc | undefined
  /** `silent` saves without re-rendering (theme edits while dragging). */
  updateProject: (id: string, patch: Patch, opts?: { silent?: boolean }) => void
  settings: AgentSettings
  setSettings: (s: AgentSettings) => void
  /** How the agent connects right now, and whether it can run. */
  agent: AgentState
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  notice: string | null
  notify: (text: string) => void
}

export interface AgentState {
  connection: AgentConnection
  /** Connected: the plan is logged in, or there is an API key. */
  ready: boolean
  /** No pick yet and the plan's status is still loading: which connection applies isn't known. */
  pending: boolean
  /** What runToolLoop and streamAnswer take. */
  run: RunSettings
  plan: {
    /** False on a published site: the plan only works while the editor runs on this computer. */
    supported: boolean
    checking: boolean
    status: PlanStatus | null
    recheck: () => void
  }
}

/** The user's pick, else the plan when it is logged in, else the API key. */
export function resolveConnection(settings: AgentSettings, supported: boolean, status: PlanStatus | null): AgentConnection {
  if (!supported) return 'apiKey'
  return settings.connection ?? (status?.loggedIn ? 'plan' : 'apiKey')
}

const AppContext = createContext<AppContextValue | null>(null)

/**
 * Holds the system being viewed or edited (the unsaved draft is kept in local storage), the agent
 * settings and the passing notices. `readOnly` never writes anything.
 */
export function AppProvider({ children, system, readOnly = false }: { children: ReactNode; system: ProjectDoc; readOnly?: boolean }) {
  const docs = useRef(new Map([[system.id, system]]))
  const [, setRev] = useState(0)
  const [settings, setSettingsState] = useState<AgentSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null)
  const [planChecking, setPlanChecking] = useState(PLAN_SUPPORTED)
  const [notice, setNotice] = useState<string | null>(null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const scheduleSave = useCallback(
    (id: string) => {
      if (readOnly) return
      clearTimeout(timers.current.get(id))
      timers.current.set(
        id,
        setTimeout(() => {
          const doc = docs.current.get(id)
          if (doc) saveProject(doc)
        }, 250),
      )
    },
    [readOnly],
  )

  // Flush pending saves when the page goes away.
  useEffect(() => {
    const flush = () => docs.current.forEach((doc, id) => timers.current.has(id) && saveProject(doc))
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  const notify = useCallback((text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice((n) => (n === text ? null : n)), 4500)
  }, [])

  const updateProject = useCallback(
    (id: string, patch: Patch, opts?: { silent?: boolean }) => {
      const doc = docs.current.get(id)
      if (!doc) return
      const changes = typeof patch === 'function' ? patch(doc) : patch
      docs.current.set(id, { ...doc, ...changes, updatedAt: new Date().toISOString() })
      scheduleSave(id)
      if (!opts?.silent) setRev((r) => r + 1)
    },
    [scheduleSave],
  )

  const setSettings = useCallback((s: AgentSettings) => {
    setSettingsState(s)
    saveSettings(s)
  }, [])

  const project = useCallback((id: string) => docs.current.get(id), [])

  const recheckPlan = useCallback(() => {
    if (!PLAN_SUPPORTED) return
    setPlanChecking(true)
    fetchPlanStatus().then((s) => {
      setPlanStatus(s)
      setPlanChecking(false)
    })
  }, [])
  useEffect(recheckPlan, [recheckPlan])

  const agent = useMemo<AgentState>(() => {
    const connection = resolveConnection(settings, PLAN_SUPPORTED, planStatus)
    // Until the plan's status is known, an unset connection mustn't fall back to (and bill) the API key.
    const pending = PLAN_SUPPORTED && !settings.connection && planStatus === null
    return {
      connection,
      pending,
      ready: !pending && (connection === 'plan' ? Boolean(planStatus?.loggedIn) : Boolean(settings.apiKey)),
      run: { connection, apiKey: settings.apiKey, model: settings.model },
      plan: { supported: PLAN_SUPPORTED, checking: planChecking, status: planStatus, recheck: recheckPlan },
    }
  }, [settings, planStatus, planChecking, recheckPlan])

  const value = useMemo(
    () => ({ project, updateProject, settings, setSettings, agent, settingsOpen, setSettingsOpen, notice, notify }),
    [project, updateProject, settings, setSettings, agent, settingsOpen, notice, notify],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

/** The project this component edits (the system). */
const ProjectIdContext = createContext<string | null>(null)
export const ProjectIdProvider = ProjectIdContext.Provider

export function useProject() {
  const id = useContext(ProjectIdContext)
  const app = useApp()
  if (!id) throw new Error('useProject must be used inside <ProjectIdProvider>')
  const doc = app.project(id)!
  const update = useCallback((patch: Patch, opts?: { silent?: boolean }) => app.updateProject(id, patch, opts), [app, id])
  return { id, doc, update }
}
