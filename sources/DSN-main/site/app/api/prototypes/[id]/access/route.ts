import { getAccess, setAccess, unlockCookie } from '@/lib/prototype/share';
import { ServiceError } from '@/lib/prototype/service';
import { handle, readJson, str } from '../../shared';

type Params = { params: Promise<{ id: string }> };

/** Share settings, for the creator: `x-edit-token` required. */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  return handle(() => getAccess(id, req.headers.get('x-edit-token')));
}

/**
 * `{ visibility: "public" | "private", password? }`. Making it private also
 * unlocks it in the creator's browser, so their own canvas keeps rendering.
 */
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const visibility = str(body.visibility);
  if (visibility !== 'public' && visibility !== 'private') return Response.json({ error: '`visibility` must be "public" or "private".' }, { status: 400 });
  try {
    const { unlock, ...result } = await setAccess(id, req.headers.get('x-edit-token'), { visibility, password: str(body.password) });
    const res = Response.json(result);
    if (unlock) res.headers.append('Set-Cookie', unlockCookie(id, unlock, new URL(req.url).protocol === 'https:'));
    return res;
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
