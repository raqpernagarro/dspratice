import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storiesDir = path.join(__dirname, '../stories/base-ui');

const components = [
  { slug: 'accordion', title: 'Accordion', section: 'Components', layout: 'padded' },
  { slug: 'alert-dialog', title: 'Alert Dialog', section: 'Components', layout: 'centered' },
  { slug: 'autocomplete', title: 'Autocomplete', section: 'Components', layout: 'padded' },
  { slug: 'avatar', title: 'Avatar', section: 'Components', layout: 'centered' },
  { slug: 'button', title: 'Button', section: 'Components', layout: 'centered' },
  { slug: 'checkbox', title: 'Checkbox', section: 'Components', layout: 'centered' },
  { slug: 'checkbox-group', title: 'Checkbox Group', section: 'Components', layout: 'padded' },
  { slug: 'collapsible', title: 'Collapsible', section: 'Components', layout: 'padded' },
  { slug: 'combobox', title: 'Combobox', section: 'Components', layout: 'padded' },
  { slug: 'context-menu', title: 'Context Menu', section: 'Components', layout: 'centered' },
  { slug: 'dialog', title: 'Dialog', section: 'Components', layout: 'centered' },
  { slug: 'drawer', title: 'Drawer', section: 'Components', layout: 'centered' },
  { slug: 'field', title: 'Field', section: 'Components', layout: 'padded' },
  { slug: 'fieldset', title: 'Fieldset', section: 'Components', layout: 'padded' },
  { slug: 'form', title: 'Form', section: 'Components', layout: 'padded' },
  { slug: 'input', title: 'Input', section: 'Components', layout: 'padded' },
  { slug: 'menu', title: 'Menu', section: 'Components', layout: 'centered' },
  { slug: 'menubar', title: 'Menubar', section: 'Components', layout: 'padded' },
  { slug: 'meter', title: 'Meter', section: 'Components', layout: 'padded' },
  { slug: 'navigation-menu', title: 'Navigation Menu', section: 'Components', layout: 'padded' },
  { slug: 'number-field', title: 'Number Field', section: 'Components', layout: 'centered' },
  { slug: 'otp-field', title: 'OTP Field', section: 'Components', layout: 'centered' },
  { slug: 'popover', title: 'Popover', section: 'Components', layout: 'centered' },
  { slug: 'preview-card', title: 'Preview Card', section: 'Components', layout: 'centered' },
  { slug: 'progress', title: 'Progress', section: 'Components', layout: 'padded' },
  { slug: 'radio-group', title: 'Radio Group', section: 'Components', layout: 'padded' },
  { slug: 'scroll-area', title: 'Scroll Area', section: 'Components', layout: 'padded' },
  { slug: 'select', title: 'Select', section: 'Components', layout: 'padded' },
  { slug: 'separator', title: 'Separator', section: 'Components', layout: 'centered' },
  { slug: 'slider', title: 'Slider', section: 'Components', layout: 'padded' },
  { slug: 'switch', title: 'Switch', section: 'Components', layout: 'centered' },
  { slug: 'tabs', title: 'Tabs', section: 'Components', layout: 'padded' },
  { slug: 'toast', title: 'Toast', section: 'Components', layout: 'centered' },
  { slug: 'toggle', title: 'Toggle', section: 'Components', layout: 'centered' },
  { slug: 'toggle-group', title: 'Toggle Group', section: 'Components', layout: 'centered' },
  { slug: 'toolbar', title: 'Toolbar', section: 'Components', layout: 'padded' },
  { slug: 'tooltip', title: 'Tooltip', section: 'Components', layout: 'centered' },
  { slug: 'csp-provider', title: 'CSP Provider', section: 'Utils', layout: 'padded' },
  { slug: 'direction-provider', title: 'Direction Provider', section: 'Utils', layout: 'padded' },
  { slug: 'merge-props', title: 'mergeProps', section: 'Utils', layout: 'padded' },
  { slug: 'use-render', title: 'useRender', section: 'Utils', layout: 'padded' },
];

function toDemoName(slug) {
  return `${slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}Demo`;
}

function toFileName(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function docCategory(slug, section) {
  return section === 'Utils' ? 'utils' : 'components';
}

function sourceUrl(slug, section) {
  const category = docCategory(slug, section);
  return `https://base-ui.com/react/${category}/${slug}`;
}

await mkdir(storiesDir, { recursive: true });

/** Components built from a spec own their stories and docs; never regenerate them. */
const hasSpec = (slug) => existsSync(path.join(storiesDir, 'components', slug, `${slug}.spec.ts`));

for (const component of components) {
  const fileName = toFileName(component.slug);
  if (hasSpec(component.slug)) {
    console.log(`Skipped ${fileName} (spec-driven)`);
    continue;
  }
  const demoName = toDemoName(component.slug);
  const category = docCategory(component.slug, component.section);
  const url = sourceUrl(component.slug, component.section);

  const stories = `import type { Meta, StoryObj } from '@storybook/react-vite';
import { ${demoName} } from './demos';

const meta = {
  title: 'Base UI/${component.section}/${component.title}',
  component: ${demoName},
  parameters: {
    layout: '${component.layout}',
  },
} satisfies Meta<typeof ${demoName}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;

  const mdx = `import { Meta, Canvas, Controls } from '@storybook/addon-docs/blocks';
import * as Stories from './${fileName}.stories';
import docs from './docs/${component.slug}.md?raw';
import { BaseUiMarkdown } from './shared/BaseUiMarkdown';

<Meta of={Stories} />

## Live example

<Canvas of={Stories.Default} />
<Controls of={Stories.Default} />

## Documentation

<BaseUiMarkdown content={docs} sourceUrl="${url}" />
`;

  await writeFile(path.join(storiesDir, `${fileName}.stories.tsx`), stories, 'utf8');
  await writeFile(path.join(storiesDir, `${fileName}.mdx`), mdx, 'utf8');
  console.log(`Generated ${fileName}`);
}

console.log('Done generating Base UI stories.');
