import { existsSync } from 'node:fs';
import path from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { decodeSettings } from '@/lib/theme/theme';
import { buildStarterFiles, buildStarterZip, type StarterOptions } from './build-starter';

// Needs the packed tarballs (site predev/prebuild); skipped on a fresh checkout.
const packed = existsSync(path.join(process.cwd(), '.starter', 'manifest.json')) && existsSync(path.join(process.cwd(), 'public', 'cli', 'ds-ngr-cli.tgz'));

const opts: StarterOptions = {
  name: 'demo-app',
  page: 'dashboard',
  shareUrl: 'https://ds.example/brands',
  theme: { kind: 'single', settings: decodeSettings('') },
};

describe.skipIf(!packed)('starter pack', () => {
  it('fills every placeholder and vendors the library and the CLI', async () => {
    const files = await buildStarterFiles(opts);
    const text = (rel: string) => strFromU8(files[rel]);

    for (const [rel, data] of Object.entries(files)) {
      if (!rel.endsWith('.tgz')) expect(strFromU8(data), rel).not.toMatch(/\{\{\w+\}\}/);
    }
    const pkg = JSON.parse(text('package.json'));
    expect(pkg.devDependencies['ds-ngr-cli']).toBe('file:./vendor/ds-ngr-cli.tgz');
    expect(pkg.scripts['ds:agents']).toBe('ds-ngr agents');
    expect(files['vendor/ds-ngr-cli.tgz']).toBeDefined();
    expect(text('src/pages/Home.tsx')).toContain('export default function Home');
    expect(text('AGENTS.md')).toContain('`npx ds-ngr agents` replaces this block');
  });

  it('zips the same files under one <name>/ folder', async () => {
    const files = await buildStarterFiles(opts);
    const zip = unzipSync(await buildStarterZip(opts));
    expect(Object.keys(zip).sort()).toEqual(Object.keys(files).map((rel) => `demo-app/${rel}`).sort());
    expect(zip['demo-app/package.json']).toEqual(files['package.json']);
  });
});
