/**
 * `npm run ds:reset` leaves a reset stamp for the dev server to hand out. When it differs from the
 * one this browser last saw, the editor forgets everything it saved here before it starts: the
 * unsaved draft, the theme copy Storybook reads and any imported Figma variables. The agent
 * settings (API key, model) stay. The read-only docs build has no dev server, so nothing happens.
 */
const STAMP_KEY = 'ds-configurator:reset-stamp'
const KEEP = new Set(['ds-configurator:agent', STAMP_KEY])

export async function resetIfAsked(): Promise<void> {
  let stamp: string | null = null
  try {
    const res = await fetch('/__ds/reset', { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return
    stamp = ((await res.json()) as { stamp?: string | null }).stamp ?? null
  } catch {
    return
  }
  if (!stamp) return
  try {
    if (localStorage.getItem(STAMP_KEY) === stamp) return
    for (const key of Object.keys(localStorage)) if (key.startsWith('ds-configurator:') && !KEEP.has(key)) localStorage.removeItem(key)
    for (const key of Object.keys(sessionStorage)) if (key.startsWith('ds-configurator:')) sessionStorage.removeItem(key)
    localStorage.setItem(STAMP_KEY, stamp)
  } catch {
    // Storage unavailable: nothing was saved here anyway.
  }
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase('ds-configurator')
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })
}
