import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderOpen, Search, WifiOff } from 'lucide-react';
import { EmptyState } from './EmptyState';
import spec from './EmptyState.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/Empty State',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'small'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/** Figma placeholder instance — swap `icon` to match the empty-state context. */
export const Playground: Story = {
  args: {
    size: 'default',
    hasIcon: true,
    icon: Search,
    title: 'No data yet',
    subtitle: 'Add your first item to get started.',
    mainCtaLabel: 'Create item',
    secondaryOptionLabel: 'Import CSV',
    tertiaryOptionLabel: 'Open template',
    linkLabel: 'Learn more',
    helpText: 'You can always edit this later.',
  },
};

export const FirstUse: Story = {
  args: {
    size: 'default',
    hasIcon: true,
    icon: FolderOpen,
    title: 'No projects yet',
    subtitle: 'Create your first project to get started.',
    showSecondaryOption: false,
    showTertiaryOption: false,
    showLink: false,
    mainCtaLabel: 'Create project',
    showHelpText: false,
  },
};

export const NoResults: Story = {
  args: {
    size: 'small',
    hasIcon: true,
    icon: Search,
    title: 'No results',
    subtitle: 'Try removing filters or adjusting your search.',
    mainCtaLabel: 'Clear filters',
    secondaryOptionLabel: 'Edit filters',
    showTertiaryOption: false,
    showLink: false,
    showHelpText: false,
  },
};

export const LoadError: Story = {
  args: {
    size: 'default',
    hasIcon: true,
    icon: WifiOff,
    title: 'We could not load content',
    subtitle: 'Please check your connection and try again.',
    showSecondaryOption: false,
    showTertiaryOption: false,
    showLink: false,
    mainCtaLabel: 'Try again',
    helpText: 'If this keeps happening, contact support.',
  },
};

export const MinimalNoIcon: Story = {
  args: {
    size: 'small',
    hasIcon: false,
    hasActions: false,
    title: 'Nothing to show',
    subtitle: 'There is no content for this view yet.',
  },
};
