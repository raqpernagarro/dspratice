import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const stylePath = join(ROOT, 'dist', 'style.css');
const RESET = '*,*::before,*::after{box-sizing:border-box;}\n';

if (!existsSync(stylePath)) {
  console.error('prepend-style-reset: dist/style.css not found — run vite build first');
  process.exit(1);
}

const existing = readFileSync(stylePath, 'utf8');
if (existing.startsWith(RESET.trim())) {
  console.log('prepend-style-reset: reset already present');
  process.exit(0);
}

writeFileSync(stylePath, RESET + existing, 'utf8');
console.log('prepend-style-reset: prepended box-sizing reset to dist/style.css');
