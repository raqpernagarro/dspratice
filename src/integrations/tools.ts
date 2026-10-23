// Whether each practice tool is running, and where. The address is this machine's setting (kept in
// this browser, never in project data); the running check is a HEAD request with no CORS, which
// only tells "something answers" and reads nothing. Where the tool's files are (clone, copy or
// read-only original) comes from the local server, which can look at the disk.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TOOL_SERVERS, defaultAddress, type ServerId } from '@/fixtures/experiences'

export type RunState = 'unknown' | 'checking' | 'up' | 'down'

/** Where a tool would run from, as the local server sees the disk. */
export interface ToolFiles {
  /** `sources`: your own clone. `copy`: tool-copies/. `original`: only the read-only ../demo tools copy. */
  runFrom: 'sources' | 'copy' | 'original' | 'missing'
  installed: boolean
}

export const PROBE_TIMEOUT_MS = 6000

/** True when anything answers at `base + path`. An opaque response still means the server is up. */
export async function probe(base: string, path: string, fetchFn: typeof fetch = fetch, timeoutMs = PROBE_TIMEOUT_MS): Promise<boolean> {
  try {
    await fetchFn(new URL(path, base).toString(), { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
    return true
  } catch {
    return false
  }
}

/** A usable http(s) address, without a trailing slash, or null. */
export function cleanAddress(raw: string): string | null {
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.origin
  } catch {
    return null
  }
}

interface ToolsState {
  /** Only the addresses changed from the default. */
  addresses: Partial<Record<ServerId, string>>
  run: Record<ServerId, { state: RunState; checkedAt: number | null }>
  files: Partial<Record<ServerId, ToolFiles>> | null
  setAddress: (id: ServerId, value: string | null) => void
  check: (id: ServerId) => Promise<boolean>
  checkAll: () => Promise<void>
  loadFiles: () => Promise<void>
}

const idle = Object.fromEntries(TOOL_SERVERS.map((s) => [s.id, { state: 'unknown', checkedAt: null }])) as ToolsState['run']

export const useTools = create<ToolsState>()(
  persist(
    (set, get) => ({
      addresses: {},
      run: idle,
      files: null,
      setAddress: (id, value) =>
        set((s) => {
          const next = { ...s.addresses }
          const clean = value ? cleanAddress(value) : null
          if (!clean || clean === defaultAddress(TOOL_SERVERS.find((x) => x.id === id)!)) delete next[id]
          else next[id] = clean
          return { addresses: next, run: { ...s.run, [id]: { state: 'unknown', checkedAt: null } } }
        }),
      check: async (id) => {
        const server = TOOL_SERVERS.find((s) => s.id === id)!
        set((s) => ({ run: { ...s.run, [id]: { ...s.run[id], state: 'checking' } } }))
        const up = await probe(addressOf(id, get().addresses), server.probe)
        set((s) => ({ run: { ...s.run, [id]: { state: up ? 'up' : 'down', checkedAt: Date.now() } } }))
        return up
      },
      checkAll: async () => {
        await Promise.all(TOOL_SERVERS.map((s) => get().check(s.id)))
      },
      loadFiles: async () => {
        try {
          const res = await fetch('/api/tools')
          const body = (await res.json()) as { ok?: boolean; tools?: Partial<Record<ServerId, ToolFiles>> }
          set({ files: body.ok && body.tools ? body.tools : null })
        } catch {
          set({ files: null })
        }
      },
    }),
    {
      name: 'unified-ds-tool:tool-addresses',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ addresses: s.addresses }),
    },
  ),
)

export function addressOf(id: ServerId, addresses: Partial<Record<ServerId, string>>): string {
  return addresses[id] ?? defaultAddress(TOOL_SERVERS.find((s) => s.id === id)!)
}

export function useAddress(id: ServerId): string {
  return useTools((s) => addressOf(id, s.addresses))
}
