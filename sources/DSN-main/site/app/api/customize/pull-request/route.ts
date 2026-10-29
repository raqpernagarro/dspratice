import { createCustomizationPullRequest } from '@/lib/customize/pull-request';
import { canWriteRepo } from '@/lib/spec/server';
import { readJson, str } from '../../prototypes/shared';

/** Open a GitHub PR with token changes from the customize workspace. Local dev only. */
export async function POST(req: Request) {
  if (!canWriteRepo()) {
    return Response.json({ error: 'Creating a pull request only works on a local dev server.' }, { status: 403 });
  }
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const component = str(body.component);
  const optionName = str(body.optionName);
  if (!component || !optionName) return Response.json({ error: 'Send { component, optionName, tokens, defaults }.' }, { status: 400 });

  const tokens = body.tokens && typeof body.tokens === 'object' && !Array.isArray(body.tokens) ? (body.tokens as Record<string, string>) : {};
  const defaults =
    body.defaults && typeof body.defaults === 'object' && !Array.isArray(body.defaults)
      ? (body.defaults as Record<string, string | number | boolean>)
      : {};

  try {
    return Response.json(
      await createCustomizationPullRequest({
        component,
        optionName,
        summary: str(body.summary),
        tokens,
        defaults,
      }),
    );
  } catch (err) {
    const e = err as Error & { status?: number; issues?: unknown };
    return Response.json({ error: e.message, ...(e.issues && { issues: e.issues }) }, { status: e.status ?? 500 });
  }
}
