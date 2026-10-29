#!/usr/bin/env node
/**
 * Packs ds-ngr into site/.starter/ so the /customize "starter pack" download can
 * ship the library inside the zip (it is not published to npm).
 *
 *   site/.starter/ds-ngr-<version>.tgz
 *   site/.starter/manifest.json   { version, tgz }
 *
 * Rebuilds dist/ first when it is missing or older than src/ or tokens.css.
 * Repacks when the tarball is older than dist/ or any shipped doc (AI.md, specs/,
 * component *.spec.md, templates/, ds-index.json — see "files" in package.json).
 * Then checks that every token a generated theme sets exists in the packed
 * tokens.css (scripts/check-theme-tokens.mjs); on a miss it removes the tarball.
 * Never fails the caller (site predev/prebuild): on error the download route
 * reports the starter pack as unavailable.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { missingThemeTokens } from './check-theme-tokens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'site', '.starter');
const distEntry = path.join(root, 'dist', 'ds-ngr.es.js');

function newestMtime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestMtime(p));
    else if (!/\.(stories|test)\.tsx?$|\.mdx?$/.test(entry.name)) newest = Math.max(newest, statSync(p).mtimeMs);
  }
  return newest;
}

function newestDocMtime() {
  const files = ['AI.md', 'AI-short.md', 'README.md', 'ds-index.json', 'package.json'].map((f) => path.join(root, f));
  let newest = Math.max(...files.filter(existsSync).map((f) => statSync(f).mtimeMs));
  const walk = (dir, match) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p, match);
      else if (match(entry.name)) newest = Math.max(newest, statSync(p).mtimeMs);
    }
  };
  walk(path.join(root, 'specs'), (n) => n.endsWith('.md'));
  walk(path.join(root, 'templates'), () => true);
  walk(path.join(root, 'src', 'components'), (n) => n.endsWith('.spec.md'));
  return newest;
}

function distIsStale() {
  if (!existsSync(distEntry)) return true;
  const built = statSync(distEntry).mtimeMs;
  return Math.max(newestMtime(path.join(root, 'src')), statSync(path.join(root, 'tokens.css')).mtimeMs) > built;
}

/** Removes the tarball when a theme would set tokens its tokens.css doesn't declare. */
async function assertThemeTokens(tgzPath) {
  const tokensCss = execSync(`tar -xOzf "${tgzPath}" package/dist/tokens.css`, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const missing = await missingThemeTokens(tokensCss);
  if (!missing.length) return;
  rmSync(outDir, { recursive: true, force: true });
  throw new Error(
    `generated themes set ${missing.length} token(s) the packed tokens.css doesn't declare (${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}). ` +
      'Rebuild dist/ (npm run build) or update site/lib/theme/ to the current token names.',
  );
}

try {
  const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const tgz = `ds-ngr-${version}.tgz`;
  const manifestPath = path.join(outDir, 'manifest.json');
  const stale = distIsStale();

  const tgzPath = path.join(outDir, tgz);
  if (!stale && existsSync(tgzPath) && statSync(tgzPath).mtimeMs >= Math.max(statSync(distEntry).mtimeMs, newestDocMtime())) {
    await assertThemeTokens(tgzPath);
    console.log(`[starter] ${tgz} is up to date`);
    process.exit(0);
  }

  if (stale) {
    console.log('[starter] dist/ is missing or stale — building ds-ngr…');
    execSync('npm run build', { cwd: root, stdio: 'inherit' });
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  // --ignore-scripts: dist is already built; don't let pack lifecycle hooks rebuild it.
  execSync(`npm pack --ignore-scripts --pack-destination "${outDir}"`, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  if (!existsSync(path.join(outDir, tgz))) throw new Error(`npm pack did not produce ${tgz}`);
  await assertThemeTokens(tgzPath);
  writeFileSync(manifestPath, `${JSON.stringify({ version, tgz }, null, 2)}\n`);
  console.log(`[starter] packed ${tgz} (${(statSync(path.join(outDir, tgz)).size / 1024 / 1024).toFixed(1)} MB)`);
} catch (err) {
  console.warn(`[starter] skipped — starter pack downloads will be unavailable: ${err.message}`);
}
