// "Ask AI" on Home: an explicit, small model call (kind 'route') when the keyword router finds
// nothing or the person wants a second opinion. Its only context is the journey list itself, so
// it can only point at journeys that exist. Nothing runs unless the person presses the button.

import { generate } from '@/integrations/api'
import { JOURNEYS, journey, type JourneyDef } from '@/fixtures/journeys'

const SYSTEM = `You route a Nagarro colleague to the right journey in an internal design-systems workspace.
You are given the journeys as JSON. Pick at most three journey ids that fit what the colleague wrote, best first.
Use only ids from the list. If nothing fits, return an empty list and say in "reason" which journey is closest and what is missing.
"reason" is one or two plain sentences in British English, addressed to the colleague.`

function journeyContext() {
  return JSON.stringify(JOURNEYS.map((j) => ({ id: j.id, group: j.group, title: j.title, outcome: j.outcome, forWho: j.forWho, kind: j.status, keywords: j.keywords, antiUse: j.antiUse ?? '' })))
}

/** Rough input size, shown on the button before anything is sent (about four characters a token). */
export function estimateAskTokens(text: string) {
  return Math.ceil((SYSTEM.length + journeyContext().length + text.length + 40) / 4)
}

export interface AskResult {
  journeys: JourneyDef[]
  reason: string
  model: string
  usage: { inputTokens: number; outputTokens: number }
}

export async function askAi(text: string, signal?: AbortSignal): Promise<AskResult> {
  const res = await generate<{ journeyIds: string[]; reason: string }>({ kind: 'route', system: SYSTEM, user: `Journeys:\n${journeyContext()}\n\nWhat the colleague wrote:\n${text}` }, signal)
  const journeys = res.data.journeyIds.map((id) => journey(id)).filter((j): j is JourneyDef => Boolean(j)).slice(0, 3)
  return { journeys, reason: res.data.reason, model: res.model, usage: res.usage }
}
