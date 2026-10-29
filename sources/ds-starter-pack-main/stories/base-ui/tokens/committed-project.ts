import { parseProjectFile, type ProjectFile } from './project-file'

/**
 * The project committed to this repo as `ds.project.json` (written by `npm run ds:apply-project`),
 * or null when there is none. Vite resolves the glob at build time, so a missing file is not an error.
 * Browser-only (Storybook and the configurator).
 */
const found = import.meta.glob('../../../ds.project.json', { eager: true, import: 'default' }) as Record<string, unknown>

let cached: ProjectFile | null | undefined

export function committedProject(): ProjectFile | null {
  if (cached !== undefined) return cached
  const raw = Object.values(found)[0]
  try {
    cached = raw ? parseProjectFile(raw) : null
  } catch {
    cached = null
  }
  return cached
}
