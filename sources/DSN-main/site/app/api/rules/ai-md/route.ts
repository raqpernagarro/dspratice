import fs from 'node:fs/promises';
import path from 'node:path';
import { getComponentNames, getTokenNames, invalidateCoreRules, REPO_ROOT } from '@/lib/ds-knowledge';
import { ConflictError, deleteBlock, outline, replaceBlock } from '@/lib/rules/document';
import { lintRule, normalizeRule } from '@/lib/rules/lint';
import { insertRuleIntoAiMd, parseRule } from '@/lib/rules/markdown';
import { canWriteRepo } from '@/lib/spec/server';
import { readJson, str } from '../../prototypes/shared';

const FILE = () => path.join(REPO_ROOT, 'AI.md');
const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Edit AI.md from the docs site. Local dev server only. Body is one of:
 * `{ op: 'replace', key, original, text }` — one block, heading line included;
 * `{ op: 'delete', key, original }`;
 * `{ op: 'add', rule }` — a new numbered rule at the end of its section.
 * `original` is the block as the editor loaded it; if AI.md changed since, the edit is refused (409).
 */
export async function POST(req: Request) {
  if (!canWriteRepo()) return fail(403, 'Editing AI.md only works on a local dev server.');
  const body = await readJson(req);
  if (body instanceof Response) return body;
  const md = await fs.readFile(FILE(), 'utf8');
  const op = str(body.op);
  try {
    let next: string;
    let note: string | undefined;
    if (op === 'add') {
      const input = body.rule && typeof body.rule === 'object' ? (body.rule as Record<string, unknown>) : null;
      if (!input) return fail(400, 'Send { op: "add", rule }.');
      const rule = normalizeRule({ ...input, id: 'NEW-01' });
      const errors = lintRule(rule, { components: getComponentNames(), tokens: getTokenNames() }).filter((i) => i.severity === 'error');
      if (errors.length) return fail(422, errors.map((e) => e.message).join(' '));
      const result = insertRuleIntoAiMd(md, rule);
      next = result.md;
      note = `Added ${result.rule.id}.`;
    } else if (op === 'replace' || op === 'delete') {
      const key = str(body.key) ?? '';
      const original = str(body.original) ?? '';
      if (op === 'delete') {
        next = deleteBlock(md, key, original);
      } else {
        const text = str(body.text) ?? '';
        if (!text.trim()) return fail(400, 'The new text is empty — use delete to remove a block.');
        // Conflicts first: a stale editor gets 409 whatever it sends.
        next = replaceBlock(md, key, original, text);
        const problem = structureProblem(md, key, text);
        if (problem) return fail(422, problem);
      }
    } else {
      return fail(400, 'Unknown op.');
    }
    // Write exactly what the edit produced — the file's own ending (AI.md has no final newline) is kept.
    if (next !== md) await fs.writeFile(FILE(), next);
    invalidateCoreRules();
    return Response.json({ ok: true, changed: next !== md, note });
  } catch (err) {
    if (err instanceof ConflictError) return fail(409, err.message);
    throw err;
  }
}

/** An edit must stay one block: its own heading first, no new headings at or above that level, numbered rules still parse. */
function structureProblem(md: string, key: string, text: string): string | null {
  const block = outline(md).find((b) => b.key === key);
  if (!block?.heading) return null;
  const hashes = '#'.repeat(block.level);
  if (!text.trimStart().startsWith(`${hashes} `)) return `Keep the ${hashes} heading on the first line.`;
  const inner = outline(text.trim()).filter((b) => b.heading).slice(1);
  if (inner.some((b) => b.level <= block.level)) return 'Add new sections as their own blocks, not inside this one.';
  if (block.rule && /^### [A-Z]{2,4}-\d/.test(text.trimStart()) && !parseRule(text.trim().split(/\n(?=### )/)[0])) {
    return 'The rule heading must read “### ID: Title”.';
  }
  return null;
}
