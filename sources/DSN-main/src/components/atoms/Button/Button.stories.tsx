import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './Button.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Button> = {
  title: 'Actions/Button/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Save changes',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'plain'],
      description:
        'Visual hierarchy variant. `plain` is available in `sm` size only.',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
      description: '`md` = 32 px (default). `sm` = 24 px for dense layouts.',
      table: { defaultValue: { summary: 'md' } },
    },
    destructive: {
      control: 'boolean',
      description: 'Danger colour treatment for irreversible actions (delete, remove, discard). Works with every variant.',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Prevents all interaction.',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description:
        'Processing state. Shows a spinner, disables interaction, sets `aria-busy="true"`.',
      table: { defaultValue: { summary: 'false' } },
    },
    showLeadingIcon: {
      control: 'boolean',
      description: 'Show the leading icon slot. Provide `leadingIcon` too.',
      table: { defaultValue: { summary: 'false' } },
    },
    showLabel: {
      control: 'boolean',
      description:
        'Show the label. Set `false` for icon-only buttons — always add `aria-label`.',
      table: { defaultValue: { summary: 'true' } },
    },
    showTrailingIcon: {
      control: 'boolean',
      description: 'Show the trailing icon slot. Provide `trailingIcon` too.',
      table: { defaultValue: { summary: 'false' } },
    },
    shortcut: {
      control: 'boolean',
      description:
        'Show an inline keyboard shortcut badge. Also set `shortcutAriaLabel`.',
      table: { defaultValue: { summary: 'false' } },
    },
    shortcutLabel: {
      control: 'text',
      description: 'Shortcut key string displayed in the badge.',
      table: { defaultValue: { summary: '⌘K' } },
    },
    shortcutAriaLabel: {
      control: 'text',
      description:
        'Plain-English screen-reader label for the shortcut (required when `shortcut` is true).',
    },
    children: {
      control: 'text',
      description: 'Button label text.',
    },
    'aria-label': {
      control: 'text',
      description:
        'Accessible label for icon-only buttons (required when `showLabel={false}`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

const VARIANTS = ['primary', 'secondary', 'ghost', 'plain'] as const;
const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;
const stack = { display: 'flex', flexDirection: 'column', gap: 16 } as const;

/** Every prop on one button — the docs site embeds this story with its controls. */
export const Playground: Story = {};

/**
 * `primary` once per view, `secondary` beside it, `ghost` for utility actions,
 * `plain` (sm only) for the lowest weight. The second row adds `destructive`.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={stack}>
      {[false, true].map((destructive) => (
        <div key={String(destructive)} style={row}>
          {VARIANTS.map((v) => (
            <Button key={v} {...args} variant={v} size={v === 'plain' ? 'sm' : args.size} destructive={destructive}>
              {destructive ? 'Delete' : v[0].toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** `md` (32 px) is the default; `sm` (24 px) for dense layouts, tables and inline actions. */
export const Sizes: Story = {
  render: (args) => (
    <div style={stack}>
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} style={row}>
          {VARIANTS.filter((v) => v !== 'plain' || size === 'sm').map((v) => (
            <Button key={v} {...args} variant={v} size={size}>{size}</Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** Default, disabled and loading, for each variant. Loading shows a spinner and sets `aria-busy`. */
export const States: Story = {
  render: (args) => (
    <div style={stack}>
      {([
        ['Default', {}],
        ['Disabled', { disabled: true }],
        ['Loading', { loading: true }],
        ['Destructive disabled', { destructive: true, disabled: true }],
        ['Destructive loading', { destructive: true, loading: true }],
      ] as const).map(([label, state]) => (
        <div key={label} style={row}>
          {VARIANTS.map((v) => (
            <Button key={v} {...args} {...state} variant={v} size={v === 'plain' ? 'sm' : args.size}>{label}</Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

/**
 * Leading, trailing, both, and icon-only. Icon-only buttons hide the label,
 * so they always need an `aria-label`.
 */
export const WithIcons: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} showLeadingIcon leadingIcon={<PlaceholderIcon />}>Create project</Button>
      <Button {...args} showTrailingIcon trailingIcon={<PlaceholderIcon />}>Export</Button>
      <Button {...args} showLeadingIcon leadingIcon={<PlaceholderIcon />} showTrailingIcon trailingIcon={<PlaceholderIcon />}>Transfer</Button>
      <Button {...args} variant="ghost" showLabel={false} showLeadingIcon leadingIcon={<PlaceholderIcon />} aria-label="More options" />
      <Button {...args} variant="ghost" showLabel={false} loading aria-label="Saving" />
    </div>
  ),
};

/**
 * Inline keyboard shortcut badge. It uses the inverted colours on a filled `primary`
 * surface. Always set `shortcutAriaLabel`.
 */
export const WithShortcut: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} shortcut shortcutLabel="⌘ S" shortcutAriaLabel="Command S">Save</Button>
      <Button {...args} variant="secondary" shortcut shortcutLabel="⌘ ⇧ P" shortcutAriaLabel="Command Shift P">Open palette</Button>
    </div>
  ),
};

/** Dismissive action on the left, primary on the right. */
export const ExampleConfirmation: Story = {
  name: 'Example: confirmation',
  render: () => (
    <div style={stack}>
      <div style={row}>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </div>
      <div style={row}>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary" destructive>Delete account</Button>
      </div>
    </div>
  ),
};
