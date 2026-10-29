import type { BetaTool } from '@anthropic-ai/sdk/resources/beta/messages/messages'

import { catalogSummary } from '../agent/docsContext'
import { vocabulary, type UiNode } from './schema'
import { EXAMPLE_SCREENS } from './screens'

export const PROTO_TOOLS: BetaTool[] = [
  {
    name: 'report_progress',
    description: 'Tell the user, in one short plain sentence, what you are building next (for example "Laying out the sidebar and header"). Call it 3 to 6 times while you work, before render_screen.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
      additionalProperties: false,
    },
  },
  {
    name: 'render_screen',
    description: 'Render the finished screen. Call it exactly once, at the end.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short screen name, e.g. "Billing settings".' },
        summary: { type: 'string', description: 'One sentence on what you built, for the user.' },
        tree: {
          type: 'object',
          description: 'The root node: { type, props, children }. Children are nodes or plain strings.',
        },
      },
      required: ['title', 'summary', 'tree'],
    },
  },
]

export function protoSystemPrompt(): string[] {
  const example = JSON.stringify(EXAMPLE_SCREENS['internal-tool'].tree)
  return [
    `You build screens for a design system inside the DS Configurator's Prototype page.
You never write code. You describe the screen as a tree of nodes from the vocabulary below; the app renders it with the system's real React components and tokens, in the user's theme.

Work like a product designer:
1. Call report_progress with what you are about to build, step by step (3 to 6 short messages, plain words).
2. Call render_screen once with the full tree.

Rules:
- Use only node types from the vocabulary. Anything else shows as an error box.
- Pick components by their job. One primary button per view. Destructive actions use destructive: true.
- Write realistic, specific content (names, numbers, labels) that fits the product. No lorem ipsum.
- Every form control has a label, except a search box (input with search: true and a placeholder).
- Icon-only actions use iconButton with a label.
- For apps with navigation use appShell (desktop) or mobileShell (phones). For websites use topNav at the top of a stack.
- Keep it to one screen. Prefer grids and stacks over deep nesting. Aim for 30 to 120 nodes.
- When the user asks for a change to the current screen, return the whole updated tree and keep everything else as it was.

# Vocabulary
${vocabulary()}

# The system's components (for judgement; render only the vocabulary)
${catalogSummary()}

# Example tree (an expense request form)
${example}`,
  ]
}

export function protoUserPrompt(request: string, productLine: string, current: UiNode | null): string {
  return current
    ? `${productLine}\n\nThe current screen:\n${JSON.stringify(current)}\n\nChange it like this:\n${request}`
    : `${productLine}\n\nBuild this screen:\n${request}`
}
