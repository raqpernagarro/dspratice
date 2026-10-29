#!/usr/bin/env node
/**
 * Packs the ds-ngr CLI (cli/) for the docs site:
 *
 *   site/public/cli/ds-ngr-cli.tgz   served for `npx <site>/cli/ds-ngr-cli.tgz create`
 *                                    and vendored into every starter pack
 *
 * Bakes the site origin into cli/lib/config.json first, so the CLI knows where
 * /api/starter and /api/mcp live: DS_NGR_SITE_URL, else the Vercel production
 * URL, else http://localhost:3100 with --dev (site predev).
 * Never fails the caller (site predev/prebuild): on error the starter download
 * reports itself unavailable.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliDir = path.join(root, 'cli');
const outDir = path.join(root, 'site', 'public', 'cli');

const site =
  process.env.DS_NGR_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.argv.includes('--dev') ? 'http://localhost:3100' : '');

try {
  writeFileSync(path.join(cliDir, 'lib', 'config.json'), `${JSON.stringify({ site }, null, 2)}\n`);
  mkdirSync(outDir, { recursive: true });
  const packed = execSync(`npm pack --ignore-scripts --silent --pack-destination "${outDir}"`, { cwd: cliDir, encoding: 'utf8' }).trim().split('\n').pop();
  const target = path.join(outDir, 'ds-ngr-cli.tgz');
  rmSync(target, { force: true });
  renameSync(path.join(outDir, packed), target);
  console.log(`[cli] packed ds-ngr-cli.tgz (${(statSync(target).size / 1024).toFixed(1)} kB) for ${site || 'no default site — users pass --site'}`);
} catch (err) {
  console.warn(`[cli] skipped — the CLI download and starter packs will be unavailable: ${err.message}`);
}
