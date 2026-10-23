// A practice tool in the hub: framed when it answers, a "Start it" card with the exact commands
// when it does not, a button to its own window for full apps; addresses are cleaned and saved.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { experience } from '@/fixtures/experiences'
import { cleanAddress, probe, useTools } from '@/integrations/tools'
import { ExperienceFrame } from './ExperienceFrame'

const reset = () => useTools.setState({ addresses: {}, files: null, run: { starter: { state: 'unknown', checkedAt: null }, dsn: { state: 'unknown', checkedAt: null }, studio: { state: 'unknown', checkedAt: null } } })

/** `up`: whether the tool answers; `files`: what /api/tools says. */
function stubFetch(up: boolean, files?: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/tools') return new Response(JSON.stringify(files ? { ok: true, tools: files } : { ok: false }))
      if (!up) throw new TypeError('Failed to fetch')
      return new Response(null, { status: 200 })
    }),
  )
}

// Plain React DOM (no testing-library/dom in this repo): mount, then poll the DOM.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | null = null
let host: HTMLElement
async function show(id: string) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  // Render and let the first checks settle inside act, so their state updates are tracked.
  await act(async () => {
    root!.render(<MemoryRouter><ExperienceFrame e={experience(id)!} /></MemoryRouter>)
    await new Promise((r) => setTimeout(r, 30))
  })
}
async function until<T>(fn: () => T | null | undefined | false, ms = 2000): Promise<T> {
  const end = Date.now() + ms
  for (;;) {
    const v = fn()
    if (v) return v
    if (Date.now() > end) throw new Error('Timed out waiting for the DOM')
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })
  }
}
const byTestId = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const hasText = (t: string | RegExp) => (typeof t === 'string' ? host.textContent?.includes(t) : t.test(host.textContent ?? ''))

afterEach(() => {
  if (root) act(() => root!.unmount())
  root = null
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  reset()
})

describe('ExperienceFrame', () => {
  it('frames the tool when it answers', async () => {
    reset()
    stubFetch(true)
    await show('dsn-brands')
    const frame = await until(() => byTestId('xframe-iframe'))
    expect(frame.getAttribute('src')).toBe('http://localhost:3100/brands')
    expect(hasText('Running')).toBe(true)
  })

  it('says what to run when it does not answer, starting with a copy of the read-only original', async () => {
    reset()
    stubFetch(false, { dsn: { runFrom: 'original', installed: false } })
    await show('dsn-brands')
    await until(() => hasText('DSN site is not running'))
    await until(() => hasText('npm run tools -- copy dsn'))
    expect(hasText('npm run tools -- start dsn')).toBe(true)
    expect(byTestId('xframe-iframe')).toBeNull()
  })

  it('skips the copy step when a copy exists, and names the owner when the tool is missing', async () => {
    reset()
    stubFetch(false, { starter: { runFrom: 'copy', installed: true }, studio: { runFrom: 'missing', installed: false } })
    await show('starter-setup')
    await until(() => hasText('npm run tools -- start starter') && useTools.getState().files)
    expect(hasText('npm run tools -- copy starter')).toBe(false)
    act(() => root!.unmount())
    await show('studio')
    await until(() => hasText(/Ask Carolina Baptista for access/))
  })

  it('opens full apps in their own tab instead of a frame', async () => {
    reset()
    stubFetch(true)
    await show('studio')
    expect((await until(() => byTestId('xframe-open'))).getAttribute('href')).toBe('http://localhost:4600/')
    expect(byTestId('xframe-iframe')).toBeNull()
  })

  it('uses a changed address, and a default address is not stored', async () => {
    reset()
    stubFetch(true)
    useTools.getState().setAddress('dsn', 'http://127.0.0.1:3999/whatever')
    expect(useTools.getState().addresses.dsn).toBe('http://127.0.0.1:3999')
    await show('dsn-components')
    expect((await until(() => byTestId('xframe-iframe'))).getAttribute('src')).toBe('http://127.0.0.1:3999/components')
    await act(async () => {
      useTools.getState().setAddress('dsn', 'http://localhost:3100')
      await new Promise((r) => setTimeout(r, 30))
    })
    expect(useTools.getState().addresses.dsn).toBeUndefined()
  })
})

describe('probe and addresses', () => {
  it('treats any answer as up, and errors or timeouts as down', async () => {
    expect(await probe('http://localhost:1', '/', vi.fn(async () => new Response(null)) as unknown as typeof fetch)).toBe(true)
    expect(await probe('http://localhost:1', '/', vi.fn(async () => Promise.reject(new TypeError('x'))) as unknown as typeof fetch)).toBe(false)
    const hang = vi.fn((_: unknown, init?: RequestInit) => new Promise<Response>((_r, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('timeout')))))
    expect(await probe('http://localhost:1', '/', hang as unknown as typeof fetch, 20)).toBe(false)
  })

  it('accepts only http(s) addresses and keeps the origin', () => {
    expect(cleanAddress(' http://localhost:4175/x ')).toBe('http://localhost:4175')
    expect(cleanAddress('localhost:4175')).toBeNull()
    expect(cleanAddress('file:///etc')).toBeNull()
  })
})
