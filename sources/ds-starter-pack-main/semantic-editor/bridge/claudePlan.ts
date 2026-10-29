import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { PlanErrorCode, PlanEvent, PlanRunRequest, PlanStatus, PlanTool } from '../src/agent/planProtocol'

/**
 * Runs the editor's agent on the user's own Claude plan, through the Claude Agent SDK and the
 * Claude Code login on this computer. Dev server only (see vite.config.ts): a published site
 * has no such bridge and uses an API key instead.
 *
 * The agent here can only talk and call the editor's report tools: every built-in Claude Code
 * tool (files, shell, web) is off, and no user or project settings, hooks or MCP servers load.
 */

const SERVER = 'ds'
const PREFIX = `mcp__${SERVER}__`

type Sdk = typeof import('@anthropic-ai/claude-agent-sdk')
type SdkMessage = import('@anthropic-ai/claude-agent-sdk').SDKMessage

let sdk: Promise<Sdk> | null = null
const loadSdk = () => (sdk ??= import('@anthropic-ai/claude-agent-sdk'))

/** An empty folder to run in, so Claude Code never sees the repo. */
let workDir: string | null = null
const emptyDir = () => (workDir ??= mkdtempSync(path.join(tmpdir(), 'ds-agent-')))

/** The environment Claude Code runs with: an API key would bill Console credits, not the plan. */
function planEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env, ENABLE_CLAUDEAI_MCP_SERVERS: 'false', CLAUDE_AGENT_SDK_CLIENT_APP: 'ds-configurator' }
  delete env.ANTHROPIC_API_KEY
  delete env.ANTHROPIC_AUTH_TOKEN
  return env
}

/** The Claude Code binary the SDK ships for this platform (glibc, musl, Windows), else one on PATH. */
function claudeBinary(): { file: string; shell: boolean } {
  const require = createRequire(import.meta.url)
  const exe = process.platform === 'win32' ? 'claude.exe' : 'claude'
  for (const pkg of [`${process.platform}-${process.arch}`, `${process.platform}-${process.arch}-musl`]) {
    try {
      return { file: require.resolve(`@anthropic-ai/claude-agent-sdk-${pkg}/${exe}`), shell: false }
    } catch {
      // Not this package.
    }
  }
  // An npm-installed `claude` on Windows is a .cmd script, which only starts through a shell.
  return { file: 'claude', shell: process.platform === 'win32' }
}

/** Longest a run may take before it's stopped (a stalled login refresh or network). */
const RUN_TIMEOUT_MS = 10 * 60 * 1000
const MAX_TURNS = 30

/** Is Claude Code here and logged in with a Claude account? Asks `claude auth status`. */
export async function planStatus(): Promise<PlanStatus> {
  try {
    await loadSdk()
  } catch {
    return { installed: false, loggedIn: false }
  }
  return new Promise((resolve) => {
    const bin = claudeBinary()
    execFile(bin.file, ['auth', 'status', '--json'], { env: planEnv(), timeout: 15000, shell: bin.shell }, (err, stdout) => {
      if (err && !stdout) return resolve({ installed: (err as NodeJS.ErrnoException).code !== 'ENOENT', loggedIn: false })
      try {
        const s = JSON.parse(stdout) as { loggedIn?: boolean; authMethod?: string; subscriptionType?: string }
        // Logged in to a Console account bills credits, the same as an API key: not "your plan".
        const loggedIn = Boolean(s.loggedIn) && s.authMethod === 'claude.ai'
        resolve({ installed: true, loggedIn, plan: loggedIn ? s.subscriptionType : undefined })
      } catch {
        resolve({ installed: true, loggedIn: false })
      }
    })
  })
}

/** The tool's JSON Schema as the zod shape the SDK's in-process MCP server takes. */
async function zodShape(t: PlanTool) {
  const { z } = await import('zod')
  const required = new Set(t.input_schema.required ?? [])
  return Object.fromEntries(
    Object.entries((t.input_schema.properties ?? {}) as Record<string, unknown>).map(([key, schema]) => {
      const field = z.fromJSONSchema(schema as Parameters<typeof z.fromJSONSchema>[0])
      return [key, required.has(key) ? field : field.optional()]
    }),
  )
}

class PlanFailure extends Error {
  constructor(
    readonly code: PlanErrorCode,
    message: string,
  ) {
    super(message)
  }
}

const ACK = { content: [{ type: 'text' as const, text: 'Shown to the user. Continue.' }] }

/**
 * Turns the SDK's messages into the editor's events: streamed text, each report tool call as it
 * completes, then done. Stops at the finish tool. Throws PlanFailure for errors the UI explains.
 */
export async function* toPlanEvents(messages: AsyncIterable<SdkMessage>, finishTool?: string): AsyncGenerator<PlanEvent> {
  let text = ''
  let limited = false
  for await (const m of messages) {
    if (m.type === 'rate_limit_event') {
      if (m.rate_limit_info.status === 'rejected') limited = true
    } else if (m.type === 'stream_event') {
      const e = m.event
      if (m.parent_tool_use_id === null && e.type === 'content_block_delta' && e.delta.type === 'text_delta') {
        text += e.delta.text
        yield { type: 'text', delta: e.delta.text }
      }
    } else if (m.type === 'assistant') {
      if (m.error) {
        if (m.error === 'authentication_failed' || m.error === 'oauth_org_not_allowed') throw new PlanFailure('not_logged_in', 'Claude Code is not logged in.')
        if (m.error === 'rate_limit' || m.error === 'billing_error' || limited) throw new PlanFailure('usage_limit', 'Your Claude plan’s usage limit is reached.')
        if (m.error === 'max_output_tokens') throw new PlanFailure('cut_off', 'The answer was cut off.')
        const said = m.message.content.map((b) => (b.type === 'text' ? b.text : '')).join(' ').trim()
        throw new PlanFailure('failed', said || `Claude returned an error (${m.error}).`)
      }
      for (const block of m.message.content) {
        if (block.type !== 'tool_use' || !block.name.startsWith(PREFIX)) continue
        const name = block.name.slice(PREFIX.length)
        const input = (block.input && typeof block.input === 'object' ? block.input : {}) as Record<string, unknown>
        yield { type: 'tool', name, input }
        if (name === finishTool) {
          yield { type: 'done', finish: input, text }
          return
        }
      }
    } else if (m.type === 'result') {
      if (m.stop_reason === 'refusal') throw new PlanFailure('refusal', 'The agent declined this request.')
      if (m.subtype === 'error_max_turns') throw new PlanFailure('cut_off', 'The agent ran out of turns before it finished.')
      if (m.subtype !== 'success' || m.is_error) {
        if (limited) throw new PlanFailure('usage_limit', 'Your Claude plan’s usage limit is reached.')
        const errors = 'errors' in m && Array.isArray(m.errors) ? m.errors.join(' ') : ''
        throw new PlanFailure('failed', errors || 'The run did not finish.')
      }
      break
    }
  }
  if (limited && !text) throw new PlanFailure('usage_limit', 'Your Claude plan’s usage limit is reached.')
  yield { type: 'done', finish: null, text }
}

/** One agent run on the plan, as events. Aborting the signal stops Claude Code. */
export async function* runOnPlan(req: PlanRunRequest, signal: AbortSignal): AsyncGenerator<PlanEvent> {
  let api: Sdk
  try {
    api = await loadSdk()
  } catch {
    yield { type: 'error', code: 'not_installed', message: 'The Claude Agent SDK is not installed. Run npm install.' }
    return
  }
  const abortController = new AbortController()
  const stop = () => abortController.abort()
  signal.addEventListener('abort', stop, { once: true })
  let timedOut = false
  const deadline = setTimeout(() => {
    timedOut = true
    abortController.abort()
  }, RUN_TIMEOUT_MS)
  let q: ReturnType<Sdk['query']> | null = null
  try {
    // Inside the try: a tool schema the SDK can't take is an error event, not a crashed dev server.
    const tools = await Promise.all(
      (Array.isArray(req.tools) ? req.tools : []).map(async (t) => api.tool(t.name, t.description, await zodShape(t), async () => ACK)),
    )
    q = api.query({
      prompt: req.prompt,
      options: {
        model: req.model,
        systemPrompt: req.system,
        effort: req.effort ?? 'medium',
        maxTurns: Math.min(Math.max(1, Number(req.maxTurns) || 10), MAX_TURNS),
        // Only the editor's tools: no files, shell or web, no user settings, hooks or MCP servers.
        tools: [],
        mcpServers: tools.length ? { [SERVER]: api.createSdkMcpServer({ name: SERVER, version: '1.0.0', alwaysLoad: true, tools }) } : {},
        allowedTools: tools.map((t) => `${PREFIX}${t.name}`),
        strictMcpConfig: true,
        settingSources: [],
        permissionMode: 'dontAsk',
        persistSession: false,
        includePartialMessages: true,
        cwd: emptyDir(),
        env: planEnv(),
        abortController,
      },
    })
    yield* toPlanEvents(q, req.finishTool)
  } catch (e) {
    if (timedOut) {
      yield { type: 'error', code: 'failed', message: 'The run took longer than 10 minutes and was stopped. Try again.' }
      return
    }
    if (signal.aborted) return
    if (e instanceof PlanFailure) yield { type: 'error', code: e.code, message: e.message }
    else if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') yield { type: 'error', code: 'not_installed', message: 'Claude Code could not be started.' }
    else yield { type: 'error', code: 'failed', message: e instanceof Error ? e.message : String(e) }
  } finally {
    clearTimeout(deadline)
    signal.removeEventListener('abort', stop)
    q?.close()
  }
}
