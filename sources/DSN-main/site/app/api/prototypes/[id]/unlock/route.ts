import { unlock, unlockCookie } from '@/lib/prototype/share';
import { ServiceError } from '@/lib/prototype/service';
import { readJson, str } from '../../shared';

type Params = { params: Promise<{ id: string }> };

/** `{ password }` → sets the viewer cookie for a private prototype. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(req);
  if (body instanceof Response) return body;
  try {
    const { unlock: value } = await unlock(id, str(body.password) ?? '');
    const res = Response.json({ ok: true });
    if (value) res.headers.append('Set-Cookie', unlockCookie(id, value, new URL(req.url).protocol === 'https:'));
    return res;
  } catch (err) {
    if (err instanceof ServiceError) {
      // Slow down guessing a little.
      if (err.status === 401) await new Promise((r) => setTimeout(r, 400));
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
