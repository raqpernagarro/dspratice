import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

const BOX_SIZING_PATTERN = /box-sizing\s*:\s*border-box/;

function assertFileContains(label, filePath, pattern) {
  if (!existsSync(filePath)) {
    console.error(`assert-shipped-css: missing ${label} at ${filePath}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf8');
  if (!pattern.test(content)) {
    console.error(`assert-shipped-css: ${label} does not contain box-sizing: border-box`);
    process.exit(1);
  }
}

assertFileContains('dist/global.css', join(DIST, 'global.css'), BOX_SIZING_PATTERN);
assertFileContains('dist/style.css', join(DIST, 'style.css'), BOX_SIZING_PATTERN);

const styleCss = readFileSync(join(DIST, 'style.css'), 'utf8');
if (!/\.dsn-section-header\s*\{[^}]*box-sizing\s*:\s*border-box/.test(styleCss)) {
  console.error('assert-shipped-css: .dsn-section-header missing box-sizing: border-box in dist/style.css');
  process.exit(1);
}

console.log(
  'assert-shipped-css: dist/global.css and dist/style.css include box-sizing reset; SectionHeader hardened',
);
