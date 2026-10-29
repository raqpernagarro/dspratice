import { committedProject } from '../../../stories/base-ui/tokens/committed-project'
import { DEFAULT_PROJECT_INFO, makeProjectFile, parseProjectFile, type ProjectFile } from '../../../stories/base-ui/tokens/project-file'
import { DEFAULT_THEME_CONFIG } from '../../../stories/base-ui/tokens/theme-config'
import { newProject, projectFromFile, saveProject, type ProjectDoc } from '../app/store'

/**
 * The configurator is this repo's design system as its own site: Home and Docs, with
 * "Edit system" for the theme, prototypes, written pages and imports. The system lives in
 * ds.project.json at the repo root. Until that file exists, the site shows the starter system
 * with a "Set up system" welcome. A read-only build (VITE_DS_READONLY=1) has no editing at all.
 */

export const READONLY = import.meta.env.VITE_DS_READONLY === '1'

export const SYSTEM_ID = 'system'
/** Where drafts kept their baseline before it moved into the draft; cleared on load. */
const BASE_KEY = 'ds-configurator:system-base'

/** Marks the starter system, so a draft made on it survives reloads until the first save. */
const STARTER_STAMP = 'starter'

export const STARTER_INFO = {
  ...DEFAULT_PROJECT_INFO,
  name: 'Starter system',
  description: 'A neutral, accessible starting point: components, tokens and guidance, ready to make your own.',
}

/** True until the repo has a system of its own (no ds.project.json yet). */
export const isStarter = () => !committedProject()

/** What the site shows when nothing is edited: the committed system, else the starter system. */
export function systemBaseline(): ProjectFile {
  const committed = committedProject()
  if (committed) return committed
  return parseProjectFile({ ...makeProjectFile(STARTER_INFO, { ...DEFAULT_THEME_CONFIG, name: STARTER_INFO.name }), exportedAt: STARTER_STAMP })
}

/**
 * The system as a project doc: the unsaved draft if it started from this baseline, else the baseline
 * itself. The draft carries its baseline: a tab left open across a save keeps writing the old
 * system, and that must not pass for a draft of the new one.
 */
export function loadSystemDoc(baseline: ProjectFile): ProjectDoc {
  let draft: Partial<ProjectDoc> | null = null
  try {
    const raw = localStorage.getItem(`ds-configurator:project:${SYSTEM_ID}`)
    const parsed = raw ? (JSON.parse(raw) as Partial<ProjectDoc>) : null
    // Drafts saved before the baseline moved into them: the old key still says which one.
    const legacy = parsed && parsed.base === undefined && localStorage.getItem(BASE_KEY) === baseline.exportedAt
    if (parsed?.base === baseline.exportedAt || legacy) draft = parsed
    localStorage.removeItem(BASE_KEY)
  } catch {
    // Storage unavailable: start from the baseline.
  }
  const fresh = { ...projectFromFile(baseline), id: SYSTEM_ID, setupDone: baseline.exportedAt !== STARTER_STAMP, base: baseline.exportedAt }
  if (!draft) {
    saveProject(fresh)
    return fresh
  }
  return newProject({ ...fresh, ...draft, id: SYSTEM_ID, base: baseline.exportedAt, info: { ...fresh.info, ...draft.info } })
}

/** Forgets the draft (after a save or a discard). */
export function clearSystemDraft() {
  try {
    localStorage.removeItem(`ds-configurator:project:${SYSTEM_ID}`)
    localStorage.removeItem(BASE_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** True when the dev server can write ds.project.json. */
export async function canWriteRepo(): Promise<boolean> {
  if (READONLY) return false
  try {
    const res = await fetch('/__ds/status')
    return res.ok && Boolean(((await res.json()) as { writable?: boolean }).writable)
  } catch {
    return false
  }
}

export async function writeToRepo(file: ProjectFile): Promise<void> {
  const res = await fetch('/__ds/project', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(file) })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `The dev server refused the save (${res.status}).`)
  }
}
