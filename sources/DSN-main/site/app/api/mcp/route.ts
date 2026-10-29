import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { getLibraryVersion } from '@/lib/ds-knowledge';
import { ServiceError } from '@/lib/prototype/service';
import { toolContextFor } from '@/lib/mcp/context';
import { SERVER_INSTRUCTIONS } from '@/lib/mcp/guide';
import { TOOLS, type ToolContext } from '@/lib/mcp/tools';

/**
 * DS-Ngr MCP server (streamable HTTP, stateless). The connection URL carries
 * the customisation every call inherits:
 *   /api/mcp?theme=<settings query>        a configurator theme
 *   /api/mcp?kit=<id>                      a team kit (its theme + components), read-only
 *   /api/mcp?kit=<id>&key=<editToken>      the same, allowed to edit the kit
 *   &brand=<slug>                          pick a brand from a multi-brand theme
 */

export const dynamic = 'force-dynamic';

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 1) }] });

function buildServer(ctx: ToolContext) {
  const server = new McpServer({ name: 'ds-ngr', title: 'DS-Ngr', version: getLibraryVersion() }, { instructions: SERVER_INSTRUCTIONS });
  for (const t of TOOLS) {
    server.registerTool(
      t.name,
      {
        title: t.title,
        description: t.description,
        inputSchema: t.input,
        annotations: { readOnlyHint: t.readOnly, destructiveHint: false, openWorldHint: false },
      },
      async (args: Record<string, unknown>) => {
        try {
          const out = await t.run(args as never, ctx);
          return json(t.forModel ? t.forModel(out as never) : out);
        } catch (err) {
          if (err instanceof ServiceError) return { ...json({ error: err.message, ...(err.issues && { issues: err.issues }) }), isError: true };
          throw err;
        }
      },
    );
  }
  return server;
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ctx = await toolContextFor(url.origin, url.searchParams);
  if (ctx instanceof Response) return ctx;
  const server = buildServer(ctx);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
