import fs from 'node:fs/promises';
import path from 'node:path';
import { getComponentNames, getCoreRules, getTokenNames, invalidateCoreRules, REPO_ROOT } from '@/lib/ds-knowledge';
import { lintRule, normalizeRule } from '@/lib/rules/lint';
import { insertRuleIntoAiMd, renderRule, shortRuleLine } from '@/lib/rules/markdown';
import { canWriteRepo } from '@/lib/spec/server';
import { readJson } from '../../prototypes/shared';

/**
 * Write a rule into AI.md at the end of its section, with the next free id.
 * Local dev server only — on a hosted site, proposals are copied and sent to
 * the DS-Ngr maintainers instead. Body `{ rule }`. AI-short.md is not touched;
 * the response carries the one-liner to add there by hand.
 */
export async function POST(req: Request) {
  if (!canWriteRepo()) return Response.json({ error: 'Applying to AI.md only works on a local dev server.' }, { status: 403 });
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const input = body.rule && typeof body.rule === 'object' ? (body.rule as Record<string, unknown>) : null;
  if (!input) return Response.json({ error: 'Send { rule }.' }, { status: 400 });
  const rule = normalizeRule({ ...input, id: 'NEW-01' });
  const errors = lintRule(rule, { components: getComponentNames(), tokens: getTokenNames() }).filter((i) => i.severity === 'error');
  if (errors.length) return Response.json({ error: errors.map((e) => e.message).join(' ') }, { status: 422 });

  const file = path.join(REPO_ROOT, 'AI.md');
  const result = insertRuleIntoAiMd(await fs.readFile(file, 'utf8'), rule);
  await fs.writeFile(file, result.md);
  invalidateCoreRules();
  return Response.json({ id: result.rule.id, markdown: renderRule(result.rule, { meta: false }), shortLine: shortRuleLine(result.rule), total: getCoreRules().length });
}
