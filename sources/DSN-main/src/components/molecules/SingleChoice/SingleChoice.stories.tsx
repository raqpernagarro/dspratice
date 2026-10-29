import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../../atoms/_dev/PlaceholderIcon';
import { SingleChoice } from './SingleChoice';
import spec from './SingleChoice.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof SingleChoice> = {
  title: 'Inputs & Controls/Single Choice',
  component: SingleChoice,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof SingleChoice>;

const baseOptions = [
  { id: 'a', label: 'Label' },
  { id: 'b', label: 'Label' },
  { id: 'c', label: 'Label' },
  { id: 'd', label: 'Label' },
];

export const Playground: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
  },
};

export const Optional: Story = {
  args: {
    label: 'Priority',
    optional: true,
    helperText: 'Defaults to medium when omitted.',
    options: baseOptions,
  },
};

export const WithSelection: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
    defaultValue: 'b',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Label',
    helperText: 'Help text',
    helperIcon: <PlaceholderIcon />,
    options: baseOptions,
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('a');
    return <SingleChoice {...args} value={value} onValueChange={setValue} />;
  },
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
    error: true,
    errorMessage: 'Select one option',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
    defaultValue: 'c',
    disabled: true,
  },
};
