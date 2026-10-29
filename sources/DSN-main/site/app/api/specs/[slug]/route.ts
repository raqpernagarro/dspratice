import { getComponent } from '@/lib/ds-knowledge';
import { writeSpec } from '@/lib/spec/server';
import { readJson, str } from '../../prototypes/shared';

type Params = { params: Promise<{ slug: string }> };

/** Save a component's spec into the repo. Local dev server only; body `{ markdown }`. */
export async function PUT(req: Request, { params }: Params) {
  const component = getComponent((await params).slug);
  if (!component) return Response.json({ error: 'No such component.' }, { status: 404 });
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const markdown = str(body.markdown);
  if (!markdown?.trim()) return Response.json({ error: 'Send the spec as { markdown }.' }, { status: 400 });
  try {
    return Response.json(await writeSpec(component, markdown));
  } catch (err) {
    const e = err as Error & { status?: number };
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
