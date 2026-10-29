import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { Chip } from './Chip';
import spec from './Chip.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Chip> = {
  title: 'Inputs & Controls/Chip',
  component: Chip,
  tags: ['autodocs'],
  args: {
    showLeadingIcon:  false,
    showTrailingIcon: false,
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['md', 'sm'],
    },
    label:           { control: 'text' },
    selected:        { control: 'boolean' },
    disabled:        { control: 'boolean' },
    showLeadingIcon: { control: 'boolean' },
    showTrailingIcon: { control: 'boolean' },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof Chip>;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { label: 'Label' },
};

const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(['sm', 'md'] as const).map((size) => <Chip key={size} {...args} size={size} label={size} />)}
    </div>
  ),
};

/** Default, selected, disabled, and disabled while selected. */
export const States: Story = {
  render: (args) => (
    <div style={row}>
      <Chip {...args} label="Default" />
      <Chip {...args} label="Selected" selected />
      <Chip {...args} label="Disabled" disabled />
      <Chip {...args} label="Disabled + selected" disabled selected />
    </div>
  ),
};

/** Any Lucide icon can replace the leading or trailing placeholder. */
export const WithIcons: Story = {
  render: (args) => (
    <div style={row}>
      <Chip {...args} label="Featured" leadingIcon={Star} showLeadingIcon />
      <Chip {...args} label="Overdue" trailingIcon={AlertTriangle} showTrailingIcon />
      <Chip {...args} label="Priority" leadingIcon={Star} trailingIcon={CheckCircle} showLeadingIcon showTrailingIcon />
      <Chip {...args} label="Featured" leadingIcon={Star} showLeadingIcon selected />
    </div>
  ),
};

/** `onDismiss` adds a remove button. It is disabled together with the chip. */
export const WithDismiss: Story = {
  render: (args) => (
    <div style={row}>
      <Chip {...args} label="TypeScript" onDismiss={() => {}} />
      <Chip {...args} label="TypeScript" onDismiss={() => {}} disabled />
    </div>
  ),
};

// ─── Interactive (controlled) ─────────────────────────────────────────────────

export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = useState(false);
    return (
      <Chip
        label={selected ? 'Selected' : 'Click me'}
        selected={selected}
        onClick={() => setSelected((s) => !s)}
        showLeadingIcon={false}
        showTrailingIcon={false}
      />
    );
  },
};
