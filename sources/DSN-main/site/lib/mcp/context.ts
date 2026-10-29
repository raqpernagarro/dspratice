import 'server-only';
import { getKitStore } from '@/lib/prototype';
import { ServiceError, themeFor } from '@/lib/prototype/service';
import type { ToolContext } from './tools';

/**
 * The customisation every tool call inherits, read from URL params:
 * `theme` (settings query), `kit` (+ `key` to edit it), `brand`.
 * Shared by the MCP route and the in-site chat. Errors come back as a Response.
 */
export async function toolContextFor(origin: string, params: URLSearchParams): Promise<ToolContext | Response> {
  const kitId = params.get('kit');
  const kit = kitId ? await getKitStore().get(kitId) : null;
  if (kitId && !kit) return Response.json({ error: `Team kit ${kitId} not found` }, { status: 404 });
  try {
    const theme = themeFor(params.get('theme'), params.get('brand'), kit);
    return { origin, theme, kit, kitKey: params.get('key') };
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
