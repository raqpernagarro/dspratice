import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mail, Trash2, UserPlus, Download, Archive, Tag } from 'lucide-react';
import { BulkActionBar } from './BulkActionBar';
import spec from './BulkActionBar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof BulkActionBar> = {
  title: 'Inputs & Controls/Bulk Action Bar',
  component: BulkActionBar,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  argTypes: {
    selectedCount: { control: { type: 'number', min: 1 } },
  },
};
export default meta;
type Story = StoryObj<typeof BulkActionBar>;

export const Playground: Story = {
  args: {
    selectedCount: 4,
    onCountClick: () => {},
    onDismiss: () => {},
    actions: [
      {
        label: 'Email',
        icon: <Mail size={16} strokeWidth={1.5} />,
        onClick: () => {},
      },
      {
        label: 'Add to team',
        icon: <UserPlus size={16} strokeWidth={1.5} />,
        onClick: () => {},
        hasDropdown: true,
      },
      {
        label: 'Delete 4',
        icon: <Trash2 size={16} strokeWidth={1.5} />,
        onClick: () => {},
        destructive: true,
      },
    ],
  },
};

export const SingleItem: Story = {
  name: 'Single item selected',
  args: {
    selectedCount: 1,
    onCountClick: () => {},
    onDismiss: () => {},
    actions: [
      {
        label: 'Email',
        icon: <Mail size={16} strokeWidth={1.5} />,
        onClick: () => {},
      },
      {
        label: 'Add to team',
        icon: <UserPlus size={16} strokeWidth={1.5} />,
        onClick: () => {},
        hasDropdown: true,
      },
      {
        label: 'Delete 1',
        icon: <Trash2 size={16} strokeWidth={1.5} />,
        onClick: () => {},
        destructive: true,
      },
    ],
  },
};

export const ManyActions: Story = {
  name: 'Many actions',
  args: {
    selectedCount: 12,
    onCountClick: () => {},
    onDismiss: () => {},
    actions: [
      {
        label: 'Email',
        icon: <Mail size={16} strokeWidth={1.5} />,
        onClick: () => {},
      },
      {
        label: 'Tag',
        icon: <Tag size={16} strokeWidth={1.5} />,
        onClick: () => {},
        hasDropdown: true,
      },
      {
        label: 'Download',
        icon: <Download size={16} strokeWidth={1.5} />,
        onClick: () => {},
      },
      {
        label: 'Archive',
        icon: <Archive size={16} strokeWidth={1.5} />,
        onClick: () => {},
      },
      {
        label: 'Delete 12',
        icon: <Trash2 size={16} strokeWidth={1.5} />,
        onClick: () => {},
        destructive: true,
      },
    ],
  },
};

export const WithDisabledAction: Story = {
  name: 'With disabled action',
  args: {
    selectedCount: 3,
    onCountClick: () => {},
    onDismiss: () => {},
    actions: [
      {
        label: 'Email',
        icon: <Mail size={16} strokeWidth={1.5} />,
        onClick: () => {},
      },
      {
        label: 'Add to team',
        icon: <UserPlus size={16} strokeWidth={1.5} />,
        onClick: () => {},
        hasDropdown: true,
        disabled: true,
      },
      {
        label: 'Delete 3',
        icon: <Trash2 size={16} strokeWidth={1.5} />,
        onClick: () => {},
        destructive: true,
      },
    ],
  },
};
