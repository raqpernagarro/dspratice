import 'server-only';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPO_ROOT } from '@/lib/ds-knowledge';
import { validateOverride, type OverrideInput } from '@/lib/prototype/customize';

const exec = promisify(execFile);

/** Replace component-token values in tokens.css. Values must be `var(--…)` references. */
export function patchTokensCss(source: string, tokens: Record<string, string>): { next: string; changed: string[] } {
  let next = source;
  const changed: string[] = [];
  for (const [token, raw] of Object.entries(tokens)) {
    const value = raw.trim().match(/^var\((--[a-z0-9-]+)\)$/)?.[0] ?? raw.trim();
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped}\\s*:\\s*)[^;\\n]+`, 'm');
    if (!re.test(next)) throw Object.assign(new Error(`${token} was not found in tokens.css.`), { status: 422 });
    const before = next;
    next = next.replace(re, `$1${value}`);
    if (next !== before) changed.push(token);
  }
  return { next, changed };
}

const branchSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

/**
 * Applies a validated customization to tokens.css, commits on a new branch, pushes,
 * and opens a pull request with gh. Local dev only — hosted sites use kit save.
 */
export async function createCustomizationPullRequest(input: OverrideInput & { optionName: string; summary?: string }) {
  const v = validateOverride(input);
  const errors = v.issues.filter((i) => i.severity === 'error');
  if (errors.length) throw Object.assign(new Error(errors.map((e) => e.message).join(' ')), { status: 422, issues: v.issues });

  const tokensPath = path.join(REPO_ROOT, 'tokens.css');
  const tokensCss = await fs.readFile(tokensPath, 'utf8');
  const { next, changed } = patchTokensCss(tokensCss, input.tokens);
  if (!changed.length && !Object.keys(input.defaults).length) {
    throw Object.assign(new Error('Nothing to commit — this option does not change any tokens in tokens.css.'), { status: 422 });
  }

  if (changed.length) await fs.writeFile(tokensPath, next);

  const branch = `customize/${branchSlug(input.component)}-${branchSlug(input.optionName)}-${Date.now().toString(36)}`.slice(0, 72);
  const title = `Customize ${input.component}: ${input.optionName}`;
  const defaultLines = Object.entries(input.defaults).map(([k, val]) => `- \`${k}\` → ${JSON.stringify(val)} (update Playground defaults in ${input.component}.stories.tsx if you want this upstream)`);
  const body = [
    input.summary?.trim(),
    '',
    '## Token changes',
    ...v.changes.filter((c) => c.kind === 'token').map((c) => `- \`${c.key}\`: ${c.from ?? '(unset)'} → ${c.to}`),
    defaultLines.length ? '\n## Default props (not applied automatically)\n' + defaultLines.join('\n') : '',
    v.affects.length ? `\n## Also used by\n${v.affects.map((n) => `- ${n}`).join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const commitMessage = `Update ${input.component} tokens for ${input.optionName}.\n\nProposed from the customize workspace so DS-Ngr can adopt the layer upstream.`;

  await exec('git', ['checkout', '-b', branch], { cwd: REPO_ROOT });
  await exec('git', ['add', 'tokens.css'], { cwd: REPO_ROOT });
  await exec('git', ['commit', '-m', commitMessage], { cwd: REPO_ROOT });
  await exec('git', ['push', '-u', 'origin', branch], { cwd: REPO_ROOT });
  const { stdout } = await exec('gh', ['pr', 'create', '--title', title, '--body', body], { cwd: REPO_ROOT });

  const url = stdout.trim().split('\n').find((line) => line.startsWith('http')) ?? stdout.trim();
  return { url, branch, changed };
}
