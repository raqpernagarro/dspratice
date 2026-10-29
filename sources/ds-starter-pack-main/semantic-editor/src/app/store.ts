import { DEFAULT_THEME_CONFIG, withDefaults, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import {
  DEFAULT_PROJECT_INFO,
  normalizeProjectInfo,
  type ProjectFile,
  type ProjectInfo,
  type SavedPrototype,
  type SystemVersion,
} from '../../../stories/base-ui/tokens/project-file'

/**
 * The system being edited, as saved in this browser (localStorage):
 *   ds-configurator:project:system   the unsaved draft (a ProjectDoc)
 *   ds-configurator:agent            the agent settings
 * The theme is also mirrored to the single-theme key, which Storybook reads.
 */

/** Where `go` can take you: Edit theme, the docs, or Prototype. */
export type StepId = 'configure' | 'docs' | 'prototype'

export interface ProjectDoc {
  id: string
  info: ProjectInfo
  theme: ThemeConfig
  /** Index of the "Set up system" screen the user is on. */
  setupStep: number
  /** True once "Set up system" has been finished (or skipped). */
  setupDone: boolean
  /** Prompt from "Set up system" (describe the look), run once when Edit theme opens the agent. */
  pendingPrompt: string | null
  prototypes: SavedPrototype[]
  /** Written docs pages: page id → Markdown (missing = the sample text). */
  pages: Record<string, string>
  /** Saved versions, newest first. */
  versions: SystemVersion[]
  createdAt: string
  updatedAt: string
  /** The system's site: the saved version (its exportedAt) this draft started from. */
  base?: string
}

const projectKey = (id: string) => `ds-configurator:project:${id}`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or privacy mode: the app keeps working for this session.
  }
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const now = () => new Date().toISOString()

export function newProject(partial: Omit<Partial<ProjectDoc>, 'info'> & { info?: Partial<ProjectInfo> } = {}): ProjectDoc {
  const info = normalizeProjectInfo({ ...DEFAULT_PROJECT_INFO, ...partial.info })
  return {
    id: newId(),
    setupStep: 0,
    setupDone: false,
    pendingPrompt: null,
    prototypes: [],
    pages: {},
    versions: [],
    createdAt: now(),
    updatedAt: now(),
    ...partial,
    info,
    theme: withDefaults({ ...(partial.theme ?? DEFAULT_THEME_CONFIG), name: (partial.theme?.name && partial.theme.name !== DEFAULT_THEME_CONFIG.name) ? partial.theme.name : info.name }),
  }
}

export function projectFromFile(file: ProjectFile): ProjectDoc {
  return newProject({
    info: file.project,
    theme: file.theme,
    prototypes: file.prototypes,
    pages: file.pages,
    versions: file.versions,
  })
}

/** Normalises a stored doc (older shapes, missing fields). */
export function normalizeDoc(raw: Partial<ProjectDoc> & { id: string }): ProjectDoc {
  return {
    id: raw.id,
    info: normalizeProjectInfo(raw.info),
    theme: withDefaults(raw.theme),
    setupStep: typeof raw.setupStep === 'number' ? raw.setupStep : 0,
    setupDone: Boolean(raw.setupDone),
    pendingPrompt: typeof raw.pendingPrompt === 'string' ? raw.pendingPrompt : null,
    prototypes: Array.isArray(raw.prototypes) ? raw.prototypes : [],
    pages: raw.pages && typeof raw.pages === 'object' ? raw.pages : {},
    versions: Array.isArray(raw.versions) ? raw.versions : [],
    createdAt: raw.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? now(),
  }
}

export function saveProject(doc: ProjectDoc) {
  write(projectKey(doc.id), doc)
}

/* ----------------------------------------------------------------- settings */

/** How the agent reaches Claude: the user's Claude plan (this computer only) or an API key. */
export type AgentConnection = 'plan' | 'apiKey'

export interface AgentSettings {
  /** null until the user picks: the plan when it is available, else the API key. */
  connection: AgentConnection | null
  apiKey: string
  model: string
}

export const AGENT_MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', hint: 'Best results. The default.' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', hint: 'Faster and cheaper.' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', hint: 'Fastest, for quick questions.' },
]

const SETTINGS_KEY = 'ds-configurator:agent'

export function loadSettings(): AgentSettings {
  const s = read<Partial<AgentSettings>>(SETTINGS_KEY)
  return {
    connection: s?.connection === 'plan' || s?.connection === 'apiKey' ? s.connection : null,
    apiKey: typeof s?.apiKey === 'string' ? s.apiKey : '',
    model: AGENT_MODELS.some((m) => m.id === s?.model) ? (s!.model as string) : AGENT_MODELS[0].id,
  }
}

export function saveSettings(s: AgentSettings) {
  write(SETTINGS_KEY, s)
}
