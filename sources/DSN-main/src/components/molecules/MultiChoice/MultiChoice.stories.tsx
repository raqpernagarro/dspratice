import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../../atoms/_dev/PlaceholderIcon';
import { MultiChoice } from './MultiChoice';
import spec from './MultiChoice.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof MultiChoice> = {
  title: 'Inputs & Controls/Multi Choice',
  component: MultiChoice,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof MultiChoice>;

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
    label: 'Notification channels',
    optional: true,
    helperText: 'Choose any channels you want to monitor.',
    options: baseOptions,
  },
};

export const WithSelection: Story = {
  render: (args) => {
    const [options, setOptions] = useState(
      args.options ?? [
        { id: 'a', label: 'Label', checked: true },
        { id: 'b', label: 'Label', checked: false },
        { id: 'c', label: 'Label', checked: true },
      ],
    );

    return (
      <MultiChoice
        {...args}
        options={options}
        onOptionChange={(id, checked) =>
          setOptions((prev) =>
            prev.map((option) => (option.id === id ? { ...option, checked } : option)),
          )
        }
      />
    );
  },
  args: {
    label: 'Label',
    helperText: 'Help text',
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

export const Error: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    error: true,
    errorMessage: 'Select at least one option',
    options: baseOptions,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    options: baseOptions.map((option, index) => ({ ...option, checked: index < 2 })),
    disabled: true,
  },
};
