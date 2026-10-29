import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar } from './SearchBar';
import spec from './SearchBar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof SearchBar> = {
  title: 'Inputs & Controls/Search Bar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Playground: Story = {
  args: {
    variant: 'default',
    label: 'Label',
    placeholder: 'Search',
    helperText: 'Help text',
    maxLength: 0,
  },
};

export const Optional: Story = {
  args: {
    variant: 'default',
    label: 'Tags',
    placeholder: 'Search tags',
    optional: true,
    helperText: 'Narrow results by tag.',
  },
};

export const Filled: Story = {
  args: {
    variant: 'default',
    label: 'Label',
    value: 'Search',
    helperText: 'Help text',
    maxLength: 100,
  },
};

export const Error: Story = {
  args: {
    variant: 'default',
    label: 'Label',
    value: 'Search',
    error: true,
    errorMessage: 'Help text',
    maxLength: 0,
  },
};

export const Disabled: Story = {
  args: {
    variant: 'default',
    label: 'Label',
    placeholder: 'Search',
    disabled: true,
    helperText: 'Help text',
    maxLength: 0,
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Search',
  },
};

export const GhostFilled: Story = {
  args: {
    variant: 'ghost',
    value: 'Search',
  },
};
