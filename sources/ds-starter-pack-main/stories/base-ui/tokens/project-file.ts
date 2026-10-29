import { withDefaults, type ThemeConfig } from './theme-config'

/**
 * The DS Configurator project file (`<name>.dsproject.json`): everything one project needs to
 * recreate its design system somewhere else. Dropped on the configurator's Home it opens as a
 * new project; `npm run ds:apply-project -- <file>` commits it to a repo copy as `ds.project.json`,
 * which Storybook and the configurator then load as the default theme.
 *
 * Pure data, no browser or Node APIs, so the app and the scripts share it.
 */

export const PROJECT_FILE_FORMAT = 'ds-configurator/project'
export const PROJECT_FILE_VERSION = 1

export type AppTypeId = 'dashboard' | 'admin' | 'marketing' | 'ecommerce' | 'internal-tool' | 'content' | 'mobile'

export const APP_TYPE_IDS: AppTypeId[] = ['dashboard', 'admin', 'marketing', 'ecommerce', 'internal-tool', 'content', 'mobile']

export interface ProjectInfo {
  name: string
  description: string
  appType: AppTypeId
  /** The project's own copy of the starter repo. */
  githubUrl: string
  /** The project's own copy of the Figma file. */
  figmaUrl: string
  /** Tab color, one of the configurator's tab swatches. */
  color: string
}

/** A screen built in Prototype: a tree of design-system components (see the configurator's proto/schema.ts). */
export interface SavedPrototype {
  id: string
  title: string
  prompt: string
  tree: unknown
  createdAt: string
}

/** One saved version of the system, newest first in `versions`. */
export interface SystemVersion {
  /** "1.4" */
  version: string
  /** One line: what changed. */
  note: string
  date: string
}

export interface ProjectFile {
  format: typeof PROJECT_FILE_FORMAT
  version: number
  exportedAt: string
  project: ProjectInfo
  theme: ThemeConfig
  prototypes: SavedPrototype[]
  /** Written docs pages (tone of voice, best practices…): page id → Markdown. Missing = the sample text. */
  pages: Record<string, string>
  /** Saved versions of the system, newest first. */
  versions: SystemVersion[]
}

export const DEFAULT_PROJECT_INFO: ProjectInfo = {
  name: 'Untitled project',
  description: '',
  appType: 'dashboard',
  githubUrl: '',
  figmaUrl: '',
  color: '#8b7cff',
}

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback)

export function normalizeProjectInfo(raw: unknown): ProjectInfo {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const appType = APP_TYPE_IDS.includes(p.appType as AppTypeId) ? (p.appType as AppTypeId) : DEFAULT_PROJECT_INFO.appType
  return {
    name: str(p.name, DEFAULT_PROJECT_INFO.name).trim() || DEFAULT_PROJECT_INFO.name,
    description: str(p.description, ''),
    appType,
    githubUrl: str(p.githubUrl, ''),
    figmaUrl: str(p.figmaUrl, ''),
    color: /^#[0-9a-f]{6}$/i.test(str(p.color, '')) ? str(p.color, '') : DEFAULT_PROJECT_INFO.color,
  }
}

export function makeProjectFile(
  project: ProjectInfo,
  theme: ThemeConfig,
  prototypes: SavedPrototype[] = [],
  pages: Record<string, string> = {},
  versions: SystemVersion[] = [],
): ProjectFile {
  return {
    format: PROJECT_FILE_FORMAT,
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    project,
    // Saved in its base mode and main brand: what is being previewed is not part of the system.
    theme: { ...theme, appearance: theme.modes?.[0] ?? theme.appearance, brand: null },
    prototypes,
    pages,
    versions,
  }
}

/** The system's current version ("1.0" before the first save). */
export const currentVersion = (versions: SystemVersion[]) => versions[0]?.version ?? '1.0'

/** The version the next save gets: "1.0" for the first one, then "1.1", "1.2"… */
export const versionAfter = (versions: SystemVersion[]) => (versions.length ? nextVersion(versions[0].version) : '1.0')

/** "1.3" → "1.4". */
export function nextVersion(version: string): string {
  const [major, minor] = version.split('.').map((n) => parseInt(n, 10))
  return `${Number.isFinite(major) ? major : 1}.${(Number.isFinite(minor) ? minor : 0) + 1}`
}

function normalizePages(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  return Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string'))
}

function normalizeVersions(raw: unknown): SystemVersion[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object' && typeof (v as SystemVersion).version === 'string')
    .map((v) => ({ version: String(v.version), note: str(v.note, ''), date: str(v.date, '') }))
}

/** Parses a project file. Throws an Error with a plain-language message when it isn't one. */
export function parseProjectFile(input: unknown): ProjectFile {
  const data = (typeof input === 'string' ? JSON.parse(input) : input) as Partial<ProjectFile> | null
  if (!data || typeof data !== 'object' || data.format !== PROJECT_FILE_FORMAT) {
    throw new Error('This is not a DS Configurator project file. Look for a file ending in .dsproject.json.')
  }
  if (typeof data.version !== 'number' || data.version > PROJECT_FILE_VERSION) {
    throw new Error('This project file was made by a newer version of the configurator. Update your copy first.')
  }
  return {
    format: PROJECT_FILE_FORMAT,
    version: data.version,
    exportedAt: str(data.exportedAt, new Date().toISOString()),
    project: normalizeProjectInfo(data.project),
    theme: withDefaults(data.theme as Partial<ThemeConfig>),
    prototypes: Array.isArray(data.prototypes)
      ? data.prototypes.filter((p): p is SavedPrototype => !!p && typeof p === 'object' && typeof (p as SavedPrototype).id === 'string')
      : [],
    pages: normalizePages(data.pages),
    versions: normalizeVersions(data.versions),
  }
}

/** File name for a project: "Acme Insights" → "acme-insights.dsproject.json". */
export function projectFileName(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'project'
  return `${slug}.dsproject.json`
}
