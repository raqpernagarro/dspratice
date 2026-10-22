// At most N live frames per page. Frames beyond the budget stay as skeletons until a slot frees up.

type Listener = () => void
const live = new Set<string>()
const waiting: string[] = []
const listeners = new Map<string, Listener>()
let budget = 6

export function setFrameBudget(n: number) {
  budget = n
  drain()
}

function drain() {
  while (live.size < budget && waiting.length) {
    const id = waiting.shift()!
    live.add(id)
    listeners.get(id)?.()
  }
}

/** Ask for a slot; the listener fires when granted. Returns true if granted at once. */
export function requestSlot(id: string, onGranted: Listener): boolean {
  listeners.set(id, onGranted)
  if (live.has(id)) return true
  if (live.size < budget) {
    live.add(id)
    return true
  }
  if (!waiting.includes(id)) waiting.push(id)
  return false
}

export function releaseSlot(id: string) {
  live.delete(id)
  listeners.delete(id)
  const i = waiting.indexOf(id)
  if (i >= 0) waiting.splice(i, 1)
  drain()
}
