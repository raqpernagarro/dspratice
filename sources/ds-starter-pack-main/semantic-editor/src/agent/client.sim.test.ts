/**
 * Runs the agent tool loop against a simulated Claude stream (no network, no key):
 * progress calls arrive live, tool results go back, the finish tool ends the run.
 */
import { describe, expect, it } from 'vitest'

import { explainError, runToolLoop, streamAnswer } from './client'
import { THEME_TOOLS } from './themeAgent'

function sse(events: object[]): Response {
  const body = events.map((e) => `event: ${(e as { type: string }).type}\ndata: ${JSON.stringify(e)}\n\n`).join('')
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream', 'request-id': 'req_sim' } })
}

function toolTurn(id: string, calls: { name: string; input: object }[]) {
  const events: object[] = [
    { type: 'message_start', message: { id, type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } },
  ]
  calls.forEach((c, i) => {
    events.push({ type: 'content_block_start', index: i, content_block: { type: 'tool_use', id: `tu_${id}_${i}`, name: c.name, input: {} } })
    events.push({ type: 'content_block_delta', index: i, delta: { type: 'input_json_delta', partial_json: JSON.stringify(c.input) } })
    events.push({ type: 'content_block_stop', index: i })
  })
  events.push({ type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 20 } })
  events.push({ type: 'message_stop' })
  return sse(events)
}

describe('agent tool loop (simulated stream)', () => {
  it('streams progress, answers tool calls and stops at the finish tool', async () => {
    const bodies: Record<string, unknown>[] = []
    const headers: Record<string, string>[] = []
    const turns = [
      toolTurn('m1', [
        { name: 'report_progress', input: { stage: 'understand', message: 'Bold and graphic.' } },
        { name: 'report_progress', input: { stage: 'color', message: 'Saturated cyan.' } },
      ]),
      toolTurn('m2', [{ name: 'apply_theme', input: { summary: 'Done', appearance: 'light', radius: 16 } }]),
    ]
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)))
      headers.push(Object.fromEntries(new Headers(init?.headers).entries()))
      return turns.shift()!
    }) as typeof fetch
    const seen: string[] = []
    try {
      const { finish } = await runToolLoop({
        settings: { apiKey: 'sk-ant-test', model: 'claude-opus-5-5' },
        system: ['system text'],
        prompt: 'Make it look like Cartoon Network',
        tools: THEME_TOOLS,
        finishTool: 'apply_theme',
        onToolCall: (c) => seen.push(`${c.name}:${String(c.input.stage ?? c.input.summary)}`),
      })
      expect(finish).toMatchObject({ summary: 'Done', radius: 16 })
    } finally {
      globalThis.fetch = realFetch
    }
    expect(seen).toEqual(['report_progress:understand', 'report_progress:color', 'apply_theme:Done'])
    expect(bodies).toHaveLength(2)
    // First request: the brief, streaming tools, cached system prompt, refusal fallback, explicit effort.
    expect(bodies[0]).toMatchObject({ model: 'claude-opus-5-5', stream: true, fallbacks: 'default', output_config: { effort: 'medium' } })
    expect((bodies[0].tools as { eager_input_streaming?: boolean }[]).every((t) => t.eager_input_streaming)).toBe(true)
    expect((bodies[0].system as { cache_control?: object }[])[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(headers[0]['anthropic-beta']).toContain('server-side-fallback-2026-07-01')
    expect(headers[0]['anthropic-dangerous-direct-browser-access']).toBe('true')
    // Second request: the assistant turn appended unchanged, then one tool_result per call, in one message.
    const msgs = bodies[1].messages as { role: string; content: { type: string; tool_use_id?: string }[] }[]
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    expect(msgs[2].content.map((c) => c.tool_use_id)).toEqual(['tu_m1_0', 'tu_m1_1'])
  })

  it('on the Claude plan, sends the run to the dev-server bridge and reads its events', async () => {
    const lines = [
      { type: 'tool', name: 'report_progress', input: { stage: 'understand', message: 'Bold and graphic.' } },
      { type: 'tool', name: 'apply_theme', input: { summary: 'Done', radius: 16 } },
      { type: 'done', finish: { summary: 'Done', radius: 16 }, text: '' },
    ]
    const requests: { url: string; body: Record<string, unknown> }[] = []
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(url), body: JSON.parse(String(init?.body)) })
      // Split mid-line, as a real stream can.
      const body = lines.map((l) => JSON.stringify(l) + '\n').join('')
      const half = Math.floor(body.length / 2)
      return new Response(new Blob([body.slice(0, half), body.slice(half)]).stream(), { headers: { 'content-type': 'application/x-ndjson' } })
    }) as typeof fetch
    const seen: string[] = []
    try {
      const { finish } = await runToolLoop({
        settings: { connection: 'plan', apiKey: '', model: 'claude-opus-5-5' },
        system: ['system text'],
        prompt: 'Make it look like Cartoon Network',
        tools: THEME_TOOLS,
        finishTool: 'apply_theme',
        onToolCall: (c) => seen.push(`${c.name}:${String(c.input.stage ?? c.input.summary)}`),
      })
      expect(finish).toMatchObject({ summary: 'Done', radius: 16 })
    } finally {
      globalThis.fetch = realFetch
    }
    expect(seen).toEqual(['report_progress:understand', 'apply_theme:Done'])
    expect(requests).toHaveLength(1)
    expect(requests[0].url).toBe('/__ds/agent/run')
    expect(requests[0].body).toMatchObject({ model: 'claude-opus-5-5', system: ['system text'], finishTool: 'apply_theme', effort: 'medium' })
    expect((requests[0].body.tools as { name: string }[]).map((t) => t.name)).toEqual(['report_progress', 'apply_theme'])
  })

  it('on the Claude plan, a docs answer streams text and errors come back in plain words', async () => {
    const realFetch = globalThis.fetch
    let reply: object[] = [{ type: 'text', delta: 'Use ' }, { type: 'text', delta: 'a Button.' }, { type: 'done', finish: null, text: 'Use a Button.' }]
    let prompt = ''
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      prompt = JSON.parse(String(init?.body)).prompt
      return new Response(reply.map((l) => JSON.stringify(l) + '\n').join(''))
    }) as typeof fetch
    const settings = { connection: 'plan' as const, apiKey: '', model: 'claude-haiku-5-5' }
    try {
      let streamed = ''
      const text = await streamAnswer({
        settings,
        system: ['docs'],
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello!' },
          { role: 'user', content: 'Which component for an action?' },
        ],
        onText: (d) => (streamed += d),
      })
      expect(text).toBe('Use a Button.')
      expect(streamed).toBe('Use a Button.')
      expect(prompt).toContain('User: Hi')
      expect(prompt).toContain('You: Hello!')
      expect(prompt).toMatch(/now asks:\nWhich component for an action\?$/)

      reply = [{ type: 'error', code: 'usage_limit', message: 'limit' }]
      const error = await streamAnswer({ settings, system: ['docs'], messages: [{ role: 'user', content: 'Hi' }], onText: () => {} }).catch((e) => e)
      expect(explainError(error)).toMatch(/usage limit/)
    } finally {
      globalThis.fetch = realFetch
    }
  })
})
