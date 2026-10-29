import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, ArrowUpRight } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { Card } from './Card';
import spec from './Card.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Card> = {
  title: 'Data Display/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  argTypes: {
    headerSize: {
      control: 'select',
      options: ['large', 'medium', 'small', 'xsmall'],
    },
    bottomBarSize: {
      control: 'select',
      options: ['lg', 'md', 'sm'],
    },
    loading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

const contentSlot = (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 96,
      color: 'var(--color-foreground-neutral-tertiary)',
      fontSize: 'var(--font-size-body-md)',
      lineHeight: 'var(--font-line-height-body-md)',
    }}
  >
    Content slot
  </div>
);

/** Card with medium section header and large bottom toolbar. Content has inset-medium on all sides (padding-inline and padding-block). */
export const Playground: Story = {
  args: {
    title: 'Title',
    description: 'Description',
    showHeader: true,
    showBottomBar: true,
    headerSize: 'medium',
    bottomBarSize: 'lg',
    headerTrailingControl: (
      <Button variant="ghost" size="md" showLabel={false} aria-label="More options">
        <MoreVertical size={20} />
      </Button>
    ),
    bottomBarRightActions: (
      <Button variant="secondary" size="md" showTrailingIcon trailingIcon={<ArrowUpRight size={16} />}>
        More details
      </Button>
    ),
    children: contentSlot,
  },
};

/** Card with only the medium section header. Content has inset-medium except on top. */
export const JustHeader: Story = {
  name: 'Just header',
  args: {
    title: 'Title',
    description: 'Description',
    showHeader: true,
    showBottomBar: false,
    headerSize: 'medium',
    headerTrailingControl: (
      <Button variant="ghost" size="md" showLabel={false} aria-label="More options">
        <MoreVertical size={20} />
      </Button>
    ),
    children: contentSlot,
  },
};

/** Card with only the large bottom toolbar. Content has inset-medium except at the bottom. */
export const JustBottomBar: Story = {
  name: 'Just bottom bar',
  args: {
    showHeader: false,
    showBottomBar: true,
    bottomBarSize: 'lg',
    bottomBarLeftActions: (
      <Button variant="ghost" size="md">
        Cancel
      </Button>
    ),
    bottomBarRightActions: (
      <Button variant="primary" size="md">
        Confirm
      </Button>
    ),
    children: contentSlot,
  },
};

/** Card with no header and no bottom bar. Content has inset-medium on all edges. */
export const JustContent: Story = {
  name: 'Just content',
  args: {
    showHeader: false,
    showBottomBar: false,
    children: contentSlot,
  },
};

/** Loading state uses `SkeletonLoading` with `type="card"` inside the card chrome. */
export const Loading: Story = {
  args: {
    loading: true,
    title: 'Title',
    description: 'Description',
    showHeader: true,
    showBottomBar: true,
    children: contentSlot,
  },
};
