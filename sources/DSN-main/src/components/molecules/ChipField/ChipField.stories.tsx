import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../../atoms/_dev/PlaceholderIcon';
import { ChipField } from './ChipField';
import spec from './ChipField.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof ChipField> = {
  title: 'Inputs & Controls/Chip Field',
  component: ChipField,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof ChipField>;

const baseOptions = [
  { id: 'a', label: 'Label' },
  { id: 'b', label: 'Label' },
  { id: 'c', label: 'Label' },
  { id: 'd', label: 'Label' },
  { id: 'e', label: 'Label' },
  { id: 'f', label: 'Label' },
  { id: 'g', label: 'Label' },
  { id: 'h', label: 'Label' },
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
    label: 'Interests',
    optional: true,
    helperText: 'Select any that apply.',
    options: baseOptions,
  },
};

export const WithSelection: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
    defaultValue: ['b', 'd', 'g'],
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
    const [value, setValue] = useState<string[]>(['a', 'f']);
    return <ChipField {...args} value={value} onValueChange={setValue} />;
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
    errorMessage: 'Choose at least one option',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions,
    defaultValue: ['c', 'd'],
    disabled: true,
  },
};
