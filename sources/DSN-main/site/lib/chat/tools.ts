import 'server-only';
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { ServiceError } from '@/lib/prototype/service';
import { TOOLS, type ToolContext } from '@/lib/mcp/tools';

/** Kit-editing tools; offered only when the chat is connected to a kit with its edit key. */
const KIT_EDIT = new Set(['save_kit_component', 'save_kit_override', 'save_kit_pattern', 'save_kit_rule', 'remove_kit_item', 'set_kit_theme']);
const KIT_READ = new Set(['get_kit']);
/** Tools each chat mode leaves out: drafting never writes (the user saves with a button); screen chat has no option UI. */
const DRAFTING = ['create_prototype', 'update_prototype', 'get_prototype', 'create_kit', ...KIT_EDIT];
const HIDDEN: Record<ChatMode, Set<string>> = {
  prototype: new Set(['propose_component_options', 'propose_component_customization']),
  component: new Set([...DRAFTING, 'propose_component_customization']),
  customize: new Set([...DRAFTING, 'propose_component_options', 'find_similar_components']),
};

export type ChatMode = 'prototype' | 'component' | 'customize';

/**
 * The MCP tool definitions as AI SDK tools. Errors become tool results, the
 * same shape the MCP route returns, so the model can read them and fix its call.
 */
export function toAiTools(ctx: ToolContext, mode: ChatMode = 'prototype'): ToolSet {
  const tools: ToolSet = {};
  for (const def of TOOLS) {
    if (KIT_EDIT.has(def.name) && !(ctx.kit && ctx.kitKey)) continue;
    if (KIT_READ.has(def.name) && !ctx.kit) continue;
    if (HIDDEN[mode].has(def.name)) continue;
    const forModel = def.forModel;
    tools[def.name] = tool({
      description: def.description,
      inputSchema: z.object(def.input),
      execute: async (args) => {
        try {
          return await def.run(args as never, ctx);
        } catch (err) {
          if (err instanceof ServiceError) return { error: err.message, ...(err.issues && { issues: err.issues }) };
          throw err;
        }
      },
      ...(forModel && {
        toModelOutput: ({ output }: { output: unknown }) => ({
          type: 'json' as const,
          value: (output && typeof output === 'object' && 'error' in output ? output : forModel(output as never)) as never,
        }),
      }),
    });
  }
  return tools;
}
