import 'server-only';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPO_ROOT, readSpec, type ComponentEntry } from '@/lib/ds-knowledge';
import { parseSpec } from './markdown';

/**
 * Where a component's spec lives and what it says now. A 1:1 spec sits next
 * to the component (`<path>/<Name>.spec.md`); a few components still point at
 * a shared spec in specs/, which the form leaves alone and starts a
 * co-located one beside.
 */
export function specTarget(c: Pick<ComponentEntry, 'name' | 'path' | 'spec'>) {
  const target = `${c.path}/${c.name}.spec.md`;
  const own = c.spec === target;
  return { target, existing: own ? readSpec(target) : null, shared: !own && c.spec ? c.spec : null };
}

/** Saving to the repo is a local-development convenience only; hosted sites copy or download. */
export const canWriteRepo = () => process.env.NODE_ENV === 'development';

/** Writes the spec next to the component and, for a new file, regenerates ds-index.json so the site picks it up. */
export async function writeSpec(c: ComponentEntry, markdown: string) {
  if (!canWriteRepo()) throw Object.assign(new Error('Saving to the repo only works on a local dev server.'), { status: 403 });
  const spec = parseSpec(markdown);
  if (spec.name !== c.name) throw Object.assign(new Error(`The spec is titled “${spec.name}”, not ${c.name}.`), { status: 422 });
  const { target } = specTarget(c);
  const abs = path.join(REPO_ROOT, target);
  const isNew = !(await fs.stat(abs).catch(() => null));
  await fs.writeFile(abs, markdown.endsWith('\n') ? markdown : `${markdown}\n`);
  if (isNew) await promisify(execFile)('node', ['scripts/generate-index.mjs'], { cwd: REPO_ROOT });
  return { path: target, created: isNew };
}
