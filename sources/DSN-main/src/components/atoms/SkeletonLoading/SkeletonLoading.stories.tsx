import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkeletonLoading } from './SkeletonLoading';
import spec from './SkeletonLoading.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof SkeletonLoading> = {
  title: 'Feedback/Skeleton Loading',
  component: SkeletonLoading,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['avatar', 'pill', 'image', 'card'],
      description: 'Skeleton shape type.',
    },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof SkeletonLoading>;

export const Playground: Story = {
  args: {
    type: 'avatar',
  },
};

export const Pill: Story = {
  args: {
    type: 'pill',
  },
};

export const Image: Story = {
  args: {
    type: 'image',
  },
};

export const Card: Story = {
  args: {
    type: 'card',
  },
};

export const LoadingSkeletonComposition: Story = {
  name: 'Loading / Skeleton loading',
  render: () => (
    <div
      style={{
        width: 322,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <SkeletonLoading type="avatar" />
      <SkeletonLoading type="pill" />
      <SkeletonLoading type="image" />
      <SkeletonLoading type="card" />
    </div>
  ),
};
