import { createKit } from '@/lib/prototype/service';
import { handle, originOf, readJson, str } from '../prototypes/shared';

/** Create a team kit: `{ name, theme?, brand? }`. Returns read and edit MCP links. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body;
  return handle(() => createKit({ name: str(body.name) ?? 'Team kit', theme: str(body.theme), brand: str(body.brand) }, originOf(req)), 201);
}
