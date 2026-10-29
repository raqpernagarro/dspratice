import type { ProjectFile } from '../../../stories/base-ui/tokens/project-file'
import { clearSystemDraft, writeToRepo } from './mode'

/** Survives the reload after a save: which version was saved, and where the site should open. */
export const SAVED_KEY = 'ds-configurator:saved-version'

export interface SavedNotice {
  version: string
  note: string
  /** Open the docs instead of Home (after shipping a setup). */
  view?: 'docs'
}

/**
 * Ships a new version: writes ds.project.json through the dev server, forgets the draft, and leaves
 * a notice for the reloaded site. The dev server reloads the page onto the new file; the timed
 * reload is the fallback. Throws when the repo can't be written.
 */
export async function shipToRepo(file: ProjectFile, notice: SavedNotice): Promise<void> {
  await writeToRepo(file)
  clearSystemDraft()
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify(notice))
  } catch {
    // The banner is a nicety.
  }
  window.setTimeout(() => window.location.reload(), 1500)
}

export function takeSavedNotice(): SavedNotice | null {
  try {
    const raw = sessionStorage.getItem(SAVED_KEY)
    sessionStorage.removeItem(SAVED_KEY)
    return raw ? (JSON.parse(raw) as SavedNotice) : null
  } catch {
    return null
  }
}
