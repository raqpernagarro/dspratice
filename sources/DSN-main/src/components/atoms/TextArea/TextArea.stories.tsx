import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './TextArea.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof TextArea> = {
  title: 'Inputs & Controls/Text Area',
  component: TextArea,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    error: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    optional: {
      control: 'boolean',
      description: 'Appends "(optional)" to the label and suppresses aria-required.',
      table: { defaultValue: { summary: 'false' } },
    },
    minRows: { control: 'number', table: { defaultValue: { summary: '3' } } },
    maxLength: { control: 'number' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Playground: Story = {
  args: {
    label: 'Description',
    placeholder: 'Placeholder',
    minRows: 3,
  },
};

export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    label: 'Description',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    minRows: 3,
  },
};

export const WithIcons: Story = {
  name: 'With icons',
  args: {
    label: 'Description',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    helperIcon: <PlaceholderIcon />,
    leadingIcon: <PlaceholderIcon />,
    minRows: 3,
  },
};

export const WithCharacterCount: Story = {
  name: 'With character count',
  args: {
    label: 'Description',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    maxLength: 100,
    minRows: 3,
  },
};

export const Optional: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Add context for reviewers',
    optional: true,
    minRows: 3,
  },
};

export const Filled: Story = {
  args: {
    label: 'Description',
    defaultValue: 'User typed content',
    helperText: 'Help text',
    maxLength: 100,
    minRows: 3,
  },
};

export const Error: Story = {
  args: {
    label: 'Description',
    defaultValue: 'User typed content',
    error: true,
    errorMessage: 'Description must be at least 20 characters.',
    maxLength: 100,
    minRows: 3,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Description',
    placeholder: 'Placeholder',
    disabled: true,
    helperText: 'Help text',
    maxLength: 100,
    leadingIcon: <PlaceholderIcon />,
    minRows: 3,
  },
};

export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState('');
    return (
      <TextArea
        label="Description"
        value={val}
        maxLength={120}
        helperText="Help text"
        onChange={(e) => setVal(e.target.value)}
      />
    );
  },
};
