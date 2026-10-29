import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { UsageError } from './site.mjs';

/**
 * Finds the installed ds-ngr package from `cwd` upward. `DS_NGR_PKG` points at
 * a package folder directly (used by the tests and when working in the DS repo).
 * Returns null when it isn't installed.
 */
export function findPackage(cwd = process.cwd()) {
  if (process.env.DS_NGR_PKG) return path.resolve(process.env.DS_NGR_PKG);
  let dir = path.resolve(cwd);
  for (;;) {
    const candidate = path.join(dir, 'node_modules', 'ds-ngr');
    if (existsSync(path.join(candidate, 'ds-index.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function requirePackage(cwd) {
  const dir = findPackage(cwd);
  if (!dir) throw new UsageError('ds-ngr is not installed here. Run `npm install` in your project (or `ds-ngr create` to start one).');
  return dir;
}

export function readIndex(pkgDir) {
  return JSON.parse(readFileSync(path.join(pkgDir, 'ds-index.json'), 'utf8'));
}

export function packageVersion(pkgDir) {
  return JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version;
}
