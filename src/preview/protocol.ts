// Messages between the app and a preview frame. Both documents import this file, nothing else is
// shared: the frame never touches the app store.

import type { ThemeIntents } from '@/library/theme/intents'

export type LibraryId = 'dsn' | 'starter'
export type FrameView = 'component' | 'gallery' | 'template' | 'tokens'

export interface FrameParams {
  lib: LibraryId
  view: FrameView
  ids: string[]
  theme?: ThemeIntents
  frame: string
  paused?: boolean
  reducedMotion?: boolean
}

export type HighlightTarget = { kind: 'token'; name: string } | { kind: 'part'; selector: string } | { kind: 'entry'; id: string } | null

export type HostMessage =
  | { v: 1; frame: string; type: 'init'; theme: ThemeIntents; props?: Record<string, Record<string, unknown>>; highlight?: HighlightTarget; paused?: boolean; reducedMotion?: boolean }
  | { v: 1; frame: string; type: 'theme'; theme: ThemeIntents }
  | { v: 1; frame: string; type: 'props'; id: string; props: Record<string, unknown> }
  | { v: 1; frame: string; type: 'highlight'; target: HighlightTarget }
  | { v: 1; frame: string; type: 'pause'; paused: boolean }
  | { v: 1; frame: string; type: 'motion'; reduced: boolean }
  | { v: 1; frame: string; type: 'measure' }
  | { v: 1; frame: string; type: 'tokens'; names: string[] }

export type FrameMessage =
  | { v: 1; frame: string; type: 'ready'; lib: LibraryId; ids: string[] }
  | { v: 1; frame: string; type: 'height'; height: number }
  | { v: 1; frame: string; type: 'rendered'; id: string; ms: number; lazy: boolean }
  | { v: 1; frame: string; type: 'error'; id?: string; message: string; stack?: string }
  | { v: 1; frame: string; type: 'event'; id: string; name: string; detail?: unknown }
  | { v: 1; frame: string; type: 'tokens'; values: Record<string, string> }

export function isFrameMessage(data: unknown): data is FrameMessage {
  return Boolean(data && typeof data === 'object' && (data as { v?: unknown }).v === 1 && typeof (data as { frame?: unknown }).frame === 'string' && typeof (data as { type?: unknown }).type === 'string' && ['ready', 'height', 'rendered', 'error', 'event', 'tokens'].includes((data as { type: string }).type))
}

export function isHostMessage(data: unknown): data is HostMessage {
  return Boolean(data && typeof data === 'object' && (data as { v?: unknown }).v === 1 && typeof (data as { frame?: unknown }).frame === 'string' && typeof (data as { type?: unknown }).type === 'string' && ['init', 'theme', 'props', 'highlight', 'pause', 'motion', 'measure', 'tokens'].includes((data as { type: string }).type))
}

export function encodeIntents(t: ThemeIntents): string {
  const json = JSON.stringify(t)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeIntents(s: string): ThemeIntents | undefined {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as ThemeIntents
  } catch {
    return undefined
  }
}

export function frameUrl(p: FrameParams): string {
  const q = new URLSearchParams()
  q.set('lib', p.lib)
  q.set('view', p.view)
  q.set('ids', p.ids.join(','))
  q.set('frame', p.frame)
  if (p.theme) q.set('theme', encodeIntents(p.theme))
  if (p.paused) q.set('pause', '1')
  if (p.reducedMotion) q.set('rm', '1')
  return `/preview.html?${q.toString()}`
}

export function parseFrameParams(search: string): FrameParams | null {
  const q = new URLSearchParams(search)
  const lib = q.get('lib')
  const view = (q.get('view') ?? 'component') as FrameView
  if (lib !== 'dsn' && lib !== 'starter') return null
  const theme = q.get('theme')
  return {
    lib,
    view,
    ids: (q.get('ids') ?? '').split(',').filter(Boolean),
    frame: q.get('frame') ?? 'frame',
    theme: theme ? decodeIntents(theme) : undefined,
    paused: q.get('pause') === '1',
    reducedMotion: q.get('rm') === '1',
  }
}
