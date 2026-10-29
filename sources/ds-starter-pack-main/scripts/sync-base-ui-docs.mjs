import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '../stories/base-ui/docs');

const components = [
  'accordion',
  'alert-dialog',
  'autocomplete',
  'avatar',
  'button',
  'checkbox',
  'checkbox-group',
  'collapsible',
  'combobox',
  'context-menu',
  'dialog',
  'drawer',
  'field',
  'fieldset',
  'form',
  'input',
  'menu',
  'menubar',
  'meter',
  'navigation-menu',
  'number-field',
  'otp-field',
  'popover',
  'preview-card',
  'progress',
  'radio-group',
  'scroll-area',
  'select',
  'separator',
  'slider',
  'switch',
  'tabs',
  'toast',
  'toggle',
  'toggle-group',
  'toolbar',
  'tooltip',
];

const utilities = ['csp-provider', 'direction-provider', 'merge-props', 'use-render'];

await mkdir(docsDir, { recursive: true });

async function fetchDoc(slug, category = 'components') {
  const url = `https://base-ui.com/react/${category}/${slug}.md`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

for (const slug of components) {
  const markdown = await fetchDoc(slug);
  await writeFile(path.join(docsDir, `${slug}.md`), markdown, 'utf8');
  console.log(`Synced ${slug}.md`);
}

for (const slug of utilities) {
  const markdown = await fetchDoc(slug, 'utils');
  await writeFile(path.join(docsDir, `${slug}.md`), markdown, 'utf8');
  console.log(`Synced ${slug}.md`);
}

console.log('Done syncing Base UI documentation.');
