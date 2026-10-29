import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Tag } from './Tag';
import spec from './Tag.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Tag> = {
  title: 'Data Display/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['highlight', 'warning', 'error', 'success', 'neutral'],
    },
    label: { control: 'text' },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof Tag>;

// ─── Individual variant stories ───────────────────────────────────────────────

export const Playground: Story = {
  args: { variant: 'highlight', label: 'Label' },
};

const row = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } as const;

export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      {(['highlight', 'warning', 'error', 'success', 'neutral'] as const).map((v) => (
        <Tag key={v} {...args} variant={v} label={v[0].toUpperCase() + v.slice(1)} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(['sm', 'md'] as const).map((size) => <Tag key={size} {...args} size={size} label={size} />)}
    </div>
  ),
};

/** Any Lucide icon, leading, trailing, or both. */
export const WithIcons: Story = {
  render: (args) => (
    <div style={row}>
      <Tag {...args} variant="highlight" label="Featured" leadingIcon={Star} />
      <Tag {...args} variant="neutral" label="Details" trailingIcon={Info} />
      <Tag {...args} variant="warning" label="Overdue" leadingIcon={AlertTriangle} trailingIcon={CheckCircle} />
      <Tag {...args} variant="success" label="Approved" leadingIcon={CheckCircle} />
    </div>
  ),
};

// ─── Semantic label examples ──────────────────────────────────────────────────

export const StatusLabels: Story = {
  name: 'Semantic status labels (no icons by default)',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Tag variant="success"   label="Active" />
      <Tag variant="neutral"   label="Draft" />
      <Tag variant="warning"   label="Pending" />
      <Tag variant="error"     label="Blocked" />
      <Tag variant="highlight" label="In review" />
    </div>
  ),
};

export const MultipleTagsOnItem: Story = {
  name: 'Multiple tags (severity order)',
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag variant="error"   label="Critical" />
      <Tag variant="warning" label="High" />
      <Tag variant="neutral" label="Design" />
    </div>
  ),
};
