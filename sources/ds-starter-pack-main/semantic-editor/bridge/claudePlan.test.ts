/**
 * The Claude plan bridge turns the Agent SDK's messages into the editor's events, without
 * starting Claude Code: streamed text, report tool calls (prefix removed), the finish tool, and
 * the errors the UI explains in plain words.
 */
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { describe, expect, it } from 'vitest'

import type { PlanEvent } from '../src/agent/planProtocol'
import { toPlanEvents } from './claudePlan'

const base = { uuid: 'u', session_id: 's', parent_tool_use_id: null }
const text = (t: string) => ({ ...base, type: 'stream_event', event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } } })
const assistant = (content: object[], error?: string) => ({ ...base, type: 'assistant', error, message: { content } })
const toolUse = (name: string, input: object) => assistant([{ type: 'tool_use', id: 't', name: `mcp__ds__${name}`, input }])
const result = (extra: object = {}) => ({ ...base, type: 'result', subtype: 'success', is_error: false, stop_reason: 'end_turn', ...extra })

async function events(messages: object[], finishTool?: string) {
  async function* feed() {
    for (const m of messages) yield m as SDKMessage
  }
  const out: PlanEvent[] = []
  try {
    for await (const e of toPlanEvents(feed(), finishTool)) out.push(e)
  } catch (e) {
    return { out, error: e as Error & { code: string } }
  }
  return { out, error: null }
}

describe('Claude plan bridge', () => {
  it('streams tool calls and stops at the finish tool', async () => {
    const { out, error } = await events(
      [
        toolUse('report_progress', { stage: 'understand', message: 'Bold.' }),
        toolUse('apply_theme', { summary: 'Done' }),
        toolUse('report_progress', { stage: 'late', message: 'never seen' }),
      ],
      'apply_theme',
    )
    expect(error).toBeNull()
    expect(out).toEqual([
      { type: 'tool', name: 'report_progress', input: { stage: 'understand', message: 'Bold.' } },
      { type: 'tool', name: 'apply_theme', input: { summary: 'Done' } },
      { type: 'done', finish: { summary: 'Done' }, text: '' },
    ])
  })

  it('streams a plain answer as text', async () => {
    const { out } = await events([text('Use '), text('a Button.'), assistant([{ type: 'text', text: 'Use a Button.' }]), result()])
    expect(out).toEqual([
      { type: 'text', delta: 'Use ' },
      { type: 'text', delta: 'a Button.' },
      { type: 'done', finish: null, text: 'Use a Button.' },
    ])
  })

  it('explains a missing login, a used-up plan and a refusal', async () => {
    const login = await events([assistant([{ type: 'text', text: 'Not logged in · Please run /login' }], 'authentication_failed'), result({ is_error: true })])
    expect(login.out).toEqual([])
    expect(login.error?.code).toBe('not_logged_in')

    const limit = await events([{ ...base, type: 'rate_limit_event', rate_limit_info: { status: 'rejected' } }, assistant([{ type: 'text', text: 'Limit reached' }], 'rate_limit')])
    expect(limit.error?.code).toBe('usage_limit')

    const refusal = await events([result({ stop_reason: 'refusal' })])
    expect(refusal.error?.code).toBe('refusal')
  })
})
