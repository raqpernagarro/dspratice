import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPO_ROOT } from '@/lib/ds-knowledge';
import { canWriteRepo } from '@/lib/spec/server';
import { readJson, str } from '../../prototypes/shared';

type Params = { params: Promise<{ slug: string }> };

const fail = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Save a skill's SKILL.md. Local dev server only. Body `{ original, markdown }`:
 * `original` is the file as the editor loaded it; if it changed since, the save is refused (409).
 * Re-runs sync-skills so .claude/commands picks up the change.
 */
export async function PUT(req: Request, { params }: Params) {
  if (!canWriteRepo()) return fail(403, 'Editing skills only works on a local dev server.');
  const slug = (await params).slug;
  if (!/^[\w-]+$/.test(slug)) return fail(404, 'No such skill.');
  const rel = `skills/${slug}/SKILL.md`;
  const file = path.join(REPO_ROOT, rel);
  const current = await fs.readFile(file, 'utf8').catch(() => null);
  if (current === null) return fail(404, 'No such skill.');

  const body = await readJson(req);
  if (body instanceof Response) return body;
  const markdown = str(body.markdown);
  if (!markdown?.trim()) return fail(400, 'Send the skill as { original, markdown }.');
  if (str(body.original) !== current) return fail(409, `${rel} changed since you opened it. Reload to get the latest version, then redo your edit.`);

  const fm = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1];
  if (!fm) return fail(422, 'Keep the frontmatter block (--- name / description ---) at the top.');
  for (const key of ['name', 'description']) {
    if (!new RegExp(`^${key}:\\s*\\S`, 'm').test(fm)) return fail(422, `The frontmatter needs a ${key}.`);
  }

  if (markdown !== current) await fs.writeFile(file, markdown);
  await promisify(execFile)('node', ['scripts/sync-skills.mjs'], { cwd: REPO_ROOT });
  return Response.json({ ok: true, changed: markdown !== current, path: rel });
}
