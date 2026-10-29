/**
 * What the browser and the dev-server bridge to the user's Claude plan say to each other
 * (semantic-editor/bridge/claudePlan.ts). Shared by both sides, so it imports nothing.
 *
 *   GET  /__ds/agent/status  → PlanStatus
 *   POST /__ds/agent/run     PlanRunRequest → one PlanEvent per line (NDJSON), streamed
 */

export const PLAN_STATUS_URL = '/__ds/agent/status'
export const PLAN_RUN_URL = '/__ds/agent/run'

export interface PlanStatus {
  /** Claude Code can be started on this computer. */
  installed: boolean
  /** It is logged in with a Claude account (Pro, Max, Team or Enterprise). */
  loggedIn: boolean
  /** The plan's name as Claude Code reports it ("pro", "max", "team"…), when known. */
  plan?: string
}

/** A report tool, as the agent defines it (name, description and JSON Schema input). */
export interface PlanTool {
  name: string
  description: string
  input_schema: { type: 'object'; properties?: unknown; required?: readonly string[] | null }
}

export interface PlanRunRequest {
  model: string
  system: string[]
  prompt: string
  tools?: PlanTool[]
  /** The run ends when the model calls this tool. */
  finishTool?: string
  effort?: 'low' | 'medium' | 'high'
  maxTurns?: number
}

export type PlanErrorCode = 'not_installed' | 'not_logged_in' | 'usage_limit' | 'refusal' | 'cut_off' | 'failed'

export type PlanEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; input: Record<string, unknown> }
  | { type: 'done'; finish: Record<string, unknown> | null; text: string }
  | { type: 'error'; code: PlanErrorCode; message: string }
