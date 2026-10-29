import { compilePrototype } from '@/lib/prototype';
import { getKit } from '@/lib/prototype/service';
import { handle, readJson, str } from '../shared';

/** Compile + validate without saving — powers the playground preview. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const source = str(body.source);
  if (!source) return Response.json({ error: '`source` (JSX string) is required' }, { status: 400 });
  const kitId = str(body.kit);
  return handle(async () => compilePrototype(source, kitId ? await getKit(kitId) : null));
}
