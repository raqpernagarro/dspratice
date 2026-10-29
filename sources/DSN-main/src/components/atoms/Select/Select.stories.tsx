import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe, Info } from 'lucide-react';
import { Select } from './Select';
import spec from './Select.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Select> = {
  title: 'Inputs & Controls/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    label: { control: 'text', description: 'Optional. Omit for control-only (set aria-label for a11y).' },
    helperText: { control: 'text', description: 'Optional help text below the control.' },
    helperIcon: { control: false, description: 'Optional icon next to help text.' },
    icon: { control: 'boolean', description: 'When true, show leading icon (pass leadingIcon, contextual to label).' },
    leadingIcon: { control: false, description: 'Icon at start of control when icon is true. Contextual with label.' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const options = [
  { value: 'one', label: 'Placeholder A' },
  { value: 'two', label: 'Placeholder B' },
  { value: 'three', label: 'Placeholder C' },
  { value: 'four', label: 'Placeholder D' },
];

export const Playground: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
  },
};

export const ControlOnly: Story = {
  args: {
    placeholder: 'Choose…',
    options,
    'aria-label': 'Country',
  },
};

export const WithLeadingIcon: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select country',
    options,
    icon: true,
    leadingIcon: <Globe size={16} aria-hidden="true" />,
  },
};

export const WithOptionalHelpText: Story = {
  args: {
    label: 'Status',
    placeholder: 'Select status',
    options,
    helperText: 'Choose the current status.',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Status',
    placeholder: 'Select status',
    options,
    helperText: 'Choose the current status.',
    helperIcon: <Info size={16} aria-hidden="true" />,
  },
};

export const Optional: Story = {
  args: {
    label: 'Status',
    placeholder: 'Select status',
    optional: true,
    options,
  },
};

export const WithoutHelpText: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    options,
  },
};

export const ActiveWithPopover: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    defaultOpen: true,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    disabled: true,
  },
  parameters: {
    // Intentional static disabled preview; keyboard interaction is covered by active stories/tests.
    a11y: { disable: true },
  },
};
