import { readTemplate } from '@/lib/ds-knowledge';
import { createPrototype } from '@/lib/prototype/service';
import { handle, originOf, readJson, str } from './shared';

/**
 * Create a prototype: `{ source, title?, theme?, brand?, kit? }`, or `{ template }`
 * (a page template slug) in place of `source` to start from that template. Responds with
 * its share URL and an `editToken` — the only credential that can update it
 * later (send as `x-edit-token`).
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const template = str(body.template);
  const source = template ? readTemplate(template) : str(body.source);
  if (template && !source) return Response.json({ error: `No template named "${template}"` }, { status: 404 });
  if (!source?.trim()) return Response.json({ error: '`source` (JSX string) or `template` is required' }, { status: 400 });
  return handle(
    () => createPrototype({ source, title: str(body.title), theme: str(body.theme), brand: str(body.brand), kitId: str(body.kit) }, originOf(req)),
    201,
  );
}
