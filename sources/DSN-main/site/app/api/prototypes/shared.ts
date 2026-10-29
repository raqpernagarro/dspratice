import 'server-only';
import { ServiceError } from '@/lib/prototype/service';

const MAX_BODY = 250_000;

/** Reads a JSON object body, or returns a ready error response. */
export async function readJson(req: Request): Promise<Record<string, unknown> | Response> {
  const text = await req.text();
  if (text.length > MAX_BODY) return Response.json({ error: 'Body too large' }, { status: 413 });
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  return Response.json({ error: 'Expected a JSON object body' }, { status: 400 });
}

export const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** Maps service errors to JSON responses; rethrows anything unexpected. */
export async function handle(fn: () => Promise<unknown>, status = 200): Promise<Response> {
  try {
    return Response.json(await fn(), { status, headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message, ...(err.issues && { issues: err.issues }) }, { status: err.status });
    throw err;
  }
}

export const originOf = (req: Request) => new URL(req.url).origin;
