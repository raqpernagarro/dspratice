import { PLAN_RUN_URL, PLAN_STATUS_URL, type PlanErrorCode, type PlanEvent, type PlanRunRequest, type PlanStatus } from './planProtocol'

/**
 * The agent on the user's own Claude plan: the browser asks the dev server's bridge, which runs
 * Claude Code with its login on this computer. Only the dev server has the bridge, so a published
 * site never offers it.
 */

export const PLAN_SUPPORTED = import.meta.env.DEV

export class PlanError extends Error {
  constructor(
    readonly code: PlanErrorCode | 'unreachable',
    message: string,
  ) {
    super(message)
  }
}

/** Is Claude Code here and logged in? null when this build has no bridge or it does not answer. */
export async function fetchPlanStatus(): Promise<PlanStatus | null> {
  if (!PLAN_SUPPORTED) return null
  try {
    const res = await fetch(PLAN_STATUS_URL, { cache: 'no-store' })
    return res.ok ? ((await res.json()) as PlanStatus) : null
  } catch {
    return null
  }
}

/** One run on the plan. Text and tool calls arrive as they stream; resolves at the end. */
export async function runPlan(
  req: PlanRunRequest,
  on: { onText?: (delta: string) => void; onToolCall?: (call: { name: string; input: Record<string, unknown> }) => void },
  signal?: AbortSignal,
): Promise<{ finish: Record<string, unknown> | null; text: string }> {
  let res: Response
  try {
    res = await fetch(PLAN_RUN_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal })
  } catch (e) {
    if (signal?.aborted) throw e
    throw new PlanError('unreachable', 'Could not reach the editor’s link to your Claude plan.')
  }
  if (!res.ok || !res.body) throw new PlanError('unreachable', 'Could not reach the editor’s link to your Claude plan.')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const handle = (event: PlanEvent) => {
    if (event.type === 'text') on.onText?.(event.delta)
    else if (event.type === 'tool') on.onToolCall?.({ name: event.name, input: event.input })
    else if (event.type === 'error') throw new PlanError(event.code, event.message)
    else return { finish: event.finish, text: event.text }
  }
  for (;;) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split('\n')
    buffer = done ? '' : lines.pop()!
    for (const line of lines) {
      if (!line.trim()) continue
      const result = handle(JSON.parse(line) as PlanEvent)
      if (result) return result
    }
    if (done) break
  }
  throw new PlanError('failed', 'The run ended before it finished.')
}
