import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Avatar } from './Avatar';
import spec from './Avatar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// =============================================================================
// Avatar stories
// =============================================================================

const meta: Meta<typeof Avatar> = {
  title: 'Data Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    size: 'sm',
    variant: 'profile',
    fill: 'initials',
    initials: 'AC',
    name: 'Ana Costa',
    src: 'https://i.pravatar.cc/80?img=47',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xxs', 'xs', 'sm', 'lg', 'xl', 'xxl'],
      description: 'Visual size of the avatar.',
    },
    variant: {
      control: 'select',
      options: ['profile', 'organization'],
      description: 'Shape: circle (profile) or rounded square (organization).',
    },
    fill: {
      control: 'select',
      options: ['picture', 'initials', 'icon'],
      description: 'Content type rendered inside the avatar.',
    },
    src: {
      control: 'text',
      description: 'Image URL — used when fill="picture".',
    },
    initials: {
      control: 'text',
      description: 'Text shown when fill="initials". Max 2 chars, auto-uppercased.',
    },
    name: {
      control: 'text',
      description: 'Entity name — used for aria-label.',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image when fill="picture". Defaults to name.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

const SIZES = ['xxs', 'xs', 'sm', 'lg', 'xl', 'xxl'] as const;
const FILLS = ['picture', 'initials', 'icon'] as const;
const row = { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' } as const;
const stack = { display: 'flex', flexDirection: 'column', gap: 16 } as const;

export const Playground: Story = {};

/** `profile` (circle) for people and `organization` (rounded square) for companies, in each fill. */
export const Variants: Story = {
  render: (args) => (
    <div style={stack}>
      {(['profile', 'organization'] as const).map((variant) => (
        <div key={variant} style={row}>
          {FILLS.map((fill) => <Avatar key={fill} {...args} variant={variant} fill={fill} />)}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={stack}>
      {(['profile', 'organization'] as const).map((variant) => (
        <div key={variant} style={row}>
          {SIZES.map((size) => <Avatar key={size} {...args} variant={variant} size={size} />)}
        </div>
      ))}
    </div>
  ),
};

