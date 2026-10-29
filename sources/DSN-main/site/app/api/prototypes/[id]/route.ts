import { pollPrototype, updatePrototype } from '@/lib/prototype/service';
import { assertCanView } from '@/lib/prototype/share';
import { handle, originOf, readJson, str } from '../shared';

type Params = { params: Promise<{ id: string }> };

/**
 * Read a prototype. `?since=<version>&kitSince=<kitVersion>` returns
 * `{ changed: false }` when neither it nor its team kit moved — for live polling.
 * Private prototypes need the viewer cookie or `x-edit-token`.
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  return handle(async () => {
    await assertCanView(id, req);
    return pollPrototype(id, Number(sp.get('since')) || 0, Number(sp.get('kitSince')) || 0);
  });
}

/** Update source, title, theme or kit. Requires the `x-edit-token` returned at creation. */
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const has = (k: string) => k in body;
  return handle(() =>
    updatePrototype(
      id,
      req.headers.get('x-edit-token'),
      {
        source: str(body.source),
        title: str(body.title),
        ...(has('theme') && { theme: str(body.theme) ?? '' }),
        ...(has('brand') && { brand: str(body.brand) ?? null }),
        ...(has('kit') && { kitId: str(body.kit) ?? null }),
      },
      originOf(req),
    ),
  );
}
