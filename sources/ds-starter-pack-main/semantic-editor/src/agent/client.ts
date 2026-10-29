import Anthropic from '@anthropic-ai/sdk'
import type {
  BetaContentBlockParam,
  BetaMessageParam,
  BetaTextBlockParam,
  BetaTool,
} from '@anthropic-ai/sdk/resources/beta/messages/messages'

import type { AgentConnection } from '../app/store'
import { PlanError, runPlan } from './planClient'

/**
 * The agent connects to Claude one of two ways:
 *   apiKey  in the browser with the user's own key (stored in this browser only), anywhere
 *   plan    through the dev server, on the user's Claude plan (Claude Code login on this computer)
 * Every call streams. Tools are "report" tools: the app acts on each call as it arrives
 * (progress lines, a theme, a screen) and acknowledges it so the model can carry on.
 */

export class AgentError extends Error {}

/** What a run needs. No connection means the API key. */
export interface RunSettings {
  connection?: AgentConnection
  apiKey: string
  model: string
}

export function makeClient(settings: RunSettings) {
  if (!settings.apiKey) throw new AgentError('Connect the agent first: add a Claude API key in the agent settings.')
  return new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true })
}

/** Server-side refusal fallback: on for Opus and Sonnet, which support the "default" routing. */
function fallbackParams(model: string) {
  return model === 'claude-opus-5-5' || model === 'claude-sonnet-5-5'
    ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
    : {}
}

/** Turns SDK errors into one plain sentence for the UI. */
export function explainError(e: unknown): string {
  if (e instanceof AgentError) return e.message
  if (e instanceof DOMException && e.name === 'AbortError') return 'Stopped.'
  if (e instanceof PlanError) return explainPlanError(e)
  if (e instanceof Anthropic.APIUserAbortError) return 'Stopped.'
  if (e instanceof Anthropic.AuthenticationError) return 'The API key was rejected. Check it in the agent settings.'
  if (e instanceof Anthropic.PermissionDeniedError) return 'This API key is not allowed to use that model. Pick another model in the agent settings.'
  if (e instanceof Anthropic.RateLimitError) return 'Too many requests right now. Wait a moment and try again.'
  if (e instanceof Anthropic.BadRequestError) return `The request was not accepted: ${e.message}`
  if (e instanceof Anthropic.APIConnectionError) return 'Could not reach Claude. Check your connection, or whether a network policy blocks api.anthropic.com.'
  if (e instanceof Anthropic.APIError) return `Claude returned an error (${e.status ?? 'unknown'}). Try again in a moment.`
  return e instanceof Error ? e.message : 'Something went wrong.'
}

function explainPlanError(e: PlanError): string {
  switch (e.code) {
    case 'not_installed':
      return 'Claude Code isn’t installed on this computer. Install it and log in, or switch to an API key in the agent settings.'
    case 'not_logged_in':
      return 'Claude Code isn’t logged in. Open a terminal, run claude and log in with your Claude account, then try again.'
    case 'usage_limit':
      return 'You’ve reached your Claude plan’s usage limit for now. Wait for it to reset, or switch to an API key in the agent settings.'
    case 'refusal':
      return 'The agent declined this request. Try describing it differently.'
    case 'cut_off':
      return 'The answer was cut off before it finished. Try a smaller request.'
    case 'unreachable':
      return 'Could not reach your Claude plan. Is the editor still running (npm run editor:dev)?'
    default:
      return `Claude Code returned an error: ${e.message}`
  }
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
}

export interface ToolLoopOptions {
  settings: RunSettings
  /** Stable system text first (cached), so repeated runs are cheap. */
  system: string[]
  prompt: string
  tools: BetaTool[]
  /** The run ends when the model calls this tool. */
  finishTool: string
  /** Every completed tool call, in order, as soon as it arrives. */
  onToolCall?: (call: ToolCall) => void
  onText?: (delta: string) => void
  signal?: AbortSignal
  effort?: 'low' | 'medium' | 'high'
  maxTurns?: number
}

export async function runToolLoop(opts: ToolLoopOptions): Promise<{ finish: Record<string, unknown> | null; text: string }> {
  if (opts.settings.connection === 'plan') {
    return runPlan(
      {
        model: opts.settings.model,
        system: opts.system,
        prompt: opts.prompt,
        tools: opts.tools.map((t) => ({ name: t.name, description: t.description ?? '', input_schema: t.input_schema })),
        finishTool: opts.finishTool,
        effort: opts.effort ?? 'medium',
        maxTurns: opts.maxTurns ?? 10,
      },
      opts,
      opts.signal,
    )
  }
  const client = makeClient(opts.settings)
  const system: BetaTextBlockParam[] = opts.system.map((text, i) =>
    i === opts.system.length - 1 ? { type: 'text', text, cache_control: { type: 'ephemeral' } } : { type: 'text', text },
  )
  const tools = opts.tools.map((t) => ({ ...t, eager_input_streaming: true }))
  const messages: BetaMessageParam[] = [{ role: 'user', content: opts.prompt }]
  let text = ''

  for (let turn = 0; turn < (opts.maxTurns ?? 10); turn++) {
    const stream = client.beta.messages.stream(
      {
        model: opts.settings.model,
        max_tokens: 32000,
        system,
        messages,
        tools,
        output_config: { effort: opts.effort ?? 'medium' },
        ...fallbackParams(opts.settings.model),
      },
      { signal: opts.signal },
    )
    stream.on('text', (delta) => {
      text += delta
      opts.onText?.(delta)
    })
    stream.on('contentBlock', (block) => {
      if (block.type === 'tool_use' && block.input && typeof block.input === 'object') {
        opts.onToolCall?.({ name: block.name, input: block.input as Record<string, unknown> })
      }
    })
    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal') throw new AgentError('The agent declined this request. Try describing it differently.')
    const uses = message.content.filter((b) => b.type === 'tool_use')
    if (message.stop_reason === 'max_tokens' && uses.length) throw new AgentError('The answer was cut off before it finished. Try a smaller request.')

    const finish = uses.find((u) => u.name === opts.finishTool)
    if (finish) return { finish: finish.input as Record<string, unknown>, text }
    if (message.stop_reason !== 'tool_use' || !uses.length) return { finish: null, text }

    messages.push({ role: 'assistant', content: message.content as unknown as BetaContentBlockParam[] })
    messages.push({
      role: 'user',
      content: uses.map((u) => ({ type: 'tool_result' as const, tool_use_id: u.id, content: 'Shown to the user. Continue.' })),
    })
  }
  return { finish: null, text }
}

/** A plain streamed answer (docs questions). */
export async function streamAnswer(opts: {
  settings: RunSettings
  system: string[]
  messages: BetaMessageParam[]
  onText: (delta: string) => void
  signal?: AbortSignal
}): Promise<string> {
  if (opts.settings.connection === 'plan') {
    const { text } = await runPlan({ model: opts.settings.model, system: opts.system, prompt: transcript(opts.messages), effort: 'low', maxTurns: 1 }, opts, opts.signal)
    return text
  }
  const client = makeClient(opts.settings)
  const system: BetaTextBlockParam[] = opts.system.map((text, i) =>
    i === opts.system.length - 1 ? { type: 'text', text, cache_control: { type: 'ephemeral' } } : { type: 'text', text },
  )
  const stream = client.beta.messages.stream(
    {
      model: opts.settings.model,
      max_tokens: 8000,
      system,
      messages: opts.messages,
      output_config: { effort: 'low' },
      ...fallbackParams(opts.settings.model),
    },
    { signal: opts.signal },
  )
  stream.on('text', opts.onText)
  const message = await stream.finalMessage()
  if (message.stop_reason === 'refusal') throw new AgentError('The agent declined to answer that. Try asking differently.')
  return message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
}

/** The conversation so far as one prompt (a plan run starts fresh each time). */
export function transcript(messages: BetaMessageParam[]): string {
  const say = (m: BetaMessageParam) => (typeof m.content === 'string' ? m.content : m.content.map((b) => (b.type === 'text' ? b.text : '')).join(''))
  const last = messages[messages.length - 1]
  if (messages.length === 1) return say(last)
  const earlier = messages.slice(0, -1).map((m) => `${m.role === 'user' ? 'User' : 'You'}: ${say(m)}`)
  return `The conversation so far:\n\n${earlier.join('\n\n')}\n\nThe user now asks:\n${say(last)}`
}
