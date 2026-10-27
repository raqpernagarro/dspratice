// The link between the shared client-demo tab and the presenter's notes window (same browser).
// The demo tab sends where it is; the notes window sends commands. Nothing leaves the browser.

import type { GuideMode } from '@/state/types'

export const DEMO_CHANNEL = 'ds-client-demo'

export interface DemoStateMessage {
  type: 'state'
  slug: string
  chapterId: string | null
  mode: GuideMode
  /** The playlist, when mode is 'custom'. */
  chapters?: string[]
  status: 'idle' | 'running' | 'paused' | 'finished'
  ready: boolean
  client: string
}

export interface DemoCommandMessage {
  type: 'cmd'
  action: 'next' | 'back' | 'goto' | 'show' | 'pause' | 'resume' | 'start' | 'hello'
  chapterId?: string
  mode?: GuideMode
}

export type DemoMessage = DemoStateMessage | DemoCommandMessage

export function openDemoChannel(onMessage: (m: DemoMessage) => void): { post: (m: DemoMessage) => void; close: () => void } | null {
  if (typeof BroadcastChannel === 'undefined') return null
  const ch = new BroadcastChannel(DEMO_CHANNEL)
  ch.onmessage = (e: MessageEvent<DemoMessage>) => onMessage(e.data)
  return { post: (m) => ch.postMessage(m), close: () => ch.close() }
}
