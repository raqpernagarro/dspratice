#!/usr/bin/env node
/**
 * Copy `storybook-static/` into `site/public/storybook/` when the root build is newer
 * than the bundled copy (so component previews work without a live Storybook on localhost).
 */
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'storybook-static');
const dest = path.join(root, 'site/public/storybook');
const srcIndex = path.join(src, 'index.json');
const destIndex = path.join(dest, 'index.json');

if (!existsSync(srcIndex)) process.exit(0);

const srcMtime = statSync(srcIndex).mtimeMs;
const destMtime = existsSync(destIndex) ? statSync(destIndex).mtimeMs : 0;
if (srcMtime <= destMtime) process.exit(0);

mkdirSync(path.dirname(dest), { recursive: true });
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
