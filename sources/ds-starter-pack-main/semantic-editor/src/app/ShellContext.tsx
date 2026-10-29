import { createContext, useContext } from 'react'

/** Project-tab chrome state that steps can reach: the agent drawer and what it is about. */
export interface ShellState {
  agentOpen: boolean
  setAgentOpen: (open: boolean) => void
  /** The component the docs page shows, so the agent answers about it. */
  topicComponent: string | null
  setTopicComponent: (name: string | null) => void
  go: (step: import('./store').StepId) => void
  /** Opens the written-page editor (absent where pages can't be edited). */
  editPage?: (id: string) => void
  /** Opens Prototype, optionally on a saved screen. */
  openPrototype?: (screenId?: string) => void
  /** Opens "Import a file" (a project file or the Figma plugin's variables export). */
  openImport?: () => void
  /** Opens the site's search (⌘K). */
  openSearch?: () => void
}

export const ShellContext = createContext<ShellState | null>(null)

export function useShell() {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used inside the site')
  return ctx
}
