import { runAssist, type AssistRequest } from '@/lib/assist/mock';
import { readJson } from '../prototypes/shared';

const TARGETS = new Set(['rule', 'section', 'spec', 'markdown']);

/**
 * AI assist for the rule, AI.md and spec editors. Mocked: answers come from
 * lib/assist/mock.ts after a short delay. To use a real model, call it here and
 * return the same `{ value, note, changes }` shape — the editors don't change.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body;
  if (!TARGETS.has(body.target as string)) return Response.json({ error: 'Unknown assist target.' }, { status: 400 });
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
  try {
    return Response.json({ ...runAssist({ action: '', instruction: '', ...body } as AssistRequest), mock: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: `Couldn’t build a suggestion: ${(err as Error).message}` }, { status: 400 });
  }
}
