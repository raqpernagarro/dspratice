import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { packageVersion, requirePackage } from './pkg.mjs';

const BLOCK = /<!-- ds-ngr:start[^>]*-->[\s\S]*?<!-- ds-ngr:end -->/;

/** Same markers as starter/template/scripts/ds-agents.mjs and site/lib/starter/build-starter.ts. */
export function dsBlock(rules, version) {
  return `<!-- ds-ngr:start v${version} — managed by DS-Ngr; \`npx ds-ngr agents\` replaces this block. Put your own rules under "Project rules". -->\n${rules.trim()}\n<!-- ds-ngr:end -->`;
}

/** Returns the new AGENTS.md text: the block replaced, or appended when the file has none. */
export function updateAgents(current, block) {
  if (BLOCK.test(current)) return current.replace(BLOCK, block);
  const base = current.trimEnd();
  return `${base ? `${base}\n\n` : ''}${block}\n`;
}

/** `ds-ngr agents` — writes the installed DS-Ngr rules into ./AGENTS.md. */
export function agents() {
  const pkg = requirePackage();
  const rules = readFileSync(path.join(pkg, 'agents', 'AGENTS.ds.md'), 'utf8');
  const version = packageVersion(pkg);
  const file = path.resolve('AGENTS.md');
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const next = updateAgents(current, dsBlock(rules, version));

  if (next === current) {
    console.log(`AGENTS.md already has the DS-Ngr ${version} rules.`);
    return;
  }
  writeFileSync(file, next);
  console.log(`AGENTS.md: DS-Ngr ${version} rules ${BLOCK.test(current) ? 'updated' : 'added'}.`);
  if (!existsSync(path.resolve('CLAUDE.md'))) console.log('Tip: Claude Code reads CLAUDE.md — add one that says "Read AGENTS.md".');
}
