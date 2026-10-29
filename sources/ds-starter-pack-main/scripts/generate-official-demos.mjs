import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '../stories/base-ui/docs');
const outputDir = path.join(__dirname, '../stories/base-ui/demos/official');
const componentsDir = path.join(__dirname, '../stories/base-ui/components');

/** Components built from a spec own their demo, stories and docs; never regenerate them. */
const hasSpec = (slug) => existsSync(path.join(componentsDir, slug, `${slug}.spec.ts`));

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
  'csp-provider',
  'direction-provider',
  'merge-props',
  'use-render',
];

function toFileName(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toDemoName(slug) {
  return `${toFileName(slug)}Demo`;
}

function extractDemoSection(markdown) {
  const start = markdown.search(/^## Demo\b/m);
  if (start === -1) {
    return null;
  }

  const rest = markdown.slice(start + '## Demo'.length);
  const nextSection = rest.search(/^## [A-Za-z]/m);
  const body = nextSection === -1 ? rest : rest.slice(0, nextSection);

  return `## Demo${body}`;
}

function extractCssModulesDemo(section) {
  const cssModulesPart = section.split('### CSS Modules')[1]?.split(/^### /m)[0];
  if (!cssModulesPart) {
    return null;
  }

  const cssMatch = cssModulesPart.match(/```css\n([\s\S]*?)```/);
  const tsxMatch = cssModulesPart.match(/```tsx\n([\s\S]*?)```/);

  if (!cssMatch || !tsxMatch) {
    return null;
  }

  return {
    css: cssMatch[1].replace(/^\/\* index\.module\.css \*\/\n?/, ''),
    tsx: tsxMatch[1],
  };
}

function transformTsx(tsx, slug) {
  const demoName = toDemoName(slug);
  let result = tsx
    .replace(/^\/\* index\.tsx \*\/\n?/gm, '')
    .replace(/^'use client';\n?/gm, '')
    .replace(/^"use client";\n?/gm, '')
    .replace(
      /import styles from ['"]\.\/[^'"]+\.module\.css['"];/,
      `import styles from './${slug}.module.css';`,
    )
    .replace(/export default function Example\w+\(\)/, `export function ${demoName}()`)
    .replace(/export default function \w+\(\)/, `export function ${demoName}()`);

  if (!result.includes(`export function ${demoName}`)) {
    throw new Error(`Could not find export for ${demoName}`);
  }

  return result;
}

const fallbacks = {
  'csp-provider': `import { Button } from '@base-ui/react/button';
import { CSPProvider } from '@base-ui/react/csp-provider';
import styles from './button.module.css';

export function CspProviderDemo() {
  return (
    <CSPProvider nonce="demo-nonce">
      <Button className={styles.Button}>Button inside CSPProvider</Button>
    </CSPProvider>
  );
}
`,
};

await mkdir(outputDir, { recursive: true });
const previousIndex = existsSync(path.join(outputDir, 'index.ts')) ? await readFile(path.join(outputDir, 'index.ts'), 'utf8') : '';

const exports = [];
const failures = [];

for (const slug of components) {
  const demoName = toDemoName(slug);
  if (hasSpec(slug)) {
    console.log(`Skipped ${demoName} (spec-driven: components/${slug}/${slug}.spec.ts)`);
    continue;
  }
  const markdown = await readFile(path.join(docsDir, `${slug}.md`), 'utf8');
  const demoSection = extractDemoSection(markdown);
  const extracted = demoSection ? extractCssModulesDemo(demoSection) : null;

  if (extracted) {
    await writeFile(path.join(outputDir, `${slug}.module.css`), extracted.css, 'utf8');
    await writeFile(path.join(outputDir, `${demoName}.tsx`), transformTsx(extracted.tsx, slug), 'utf8');
    console.log(`Generated ${demoName} from CSS Modules demo`);
  } else if (fallbacks[slug]) {
    await writeFile(path.join(outputDir, `${demoName}.tsx`), fallbacks[slug], 'utf8');
    console.log(`Generated ${demoName} from fallback`);
  } else {
    failures.push(slug);
    continue;
  }

  exports.push(`export { ${demoName} } from './${demoName}';`);
}

// Keep exports of hand-written demos (spec-driven components, Icon Button, …).
const generated = new Set(exports.map((line) => line.match(/from '\.\/(\w+)'/)[1]));
const kept = previousIndex.split('\n').filter((line) => {
  const m = line.match(/from '\.\/(\w+)'/);
  return m && !generated.has(m[1]);
});
await writeFile(path.join(outputDir, 'index.ts'), `${[...exports, ...kept].sort().join('\n')}\n`, 'utf8');

await writeFile(
  path.join(outputDir, 'css-modules.d.ts'),
  `declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
`,
  'utf8',
);

if (failures.length) {
  console.warn('No CSS Modules demo found for:', failures.join(', '));
}

console.log('Done generating official Base UI demos.');
