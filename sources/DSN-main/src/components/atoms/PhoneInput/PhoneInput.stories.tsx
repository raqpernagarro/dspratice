import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneInput } from './PhoneInput';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './PhoneInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof PhoneInput> = {
  title: 'Inputs & Controls/Phone Input',
  component: PhoneInput,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    error: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
    countryCode: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof PhoneInput>;

export const Playground: Story = {
  args: {
    label: 'Phone number',
    placeholder: '1234567890',
  },
};

export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    label: 'Phone number',
    helperText: 'Use the number linked to your account.',
  },
};

export const Optional: Story = {
  args: {
    label: 'Backup phone',
    placeholder: '1234567890',
    optional: true,
    helperText: 'Used only if we cannot reach your primary number.',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Phone number',
    helperText: 'Use the number linked to your account.',
    helperIcon: <PlaceholderIcon />,
  },
};

export const Filled: Story = {
  args: {
    label: 'Phone number',
    defaultValue: '1234567890',
  },
};

export const Error: Story = {
  args: {
    label: 'Phone number',
    defaultValue: '1234567890',
    error: true,
    errorMessage: 'Enter a valid phone number for the selected country.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Phone number',
    defaultValue: '1234567890',
    disabled: true,
    helperText: 'This field is currently locked.',
  },
  parameters: {
    // Intentional static disabled preview; keyboard interaction is covered by active stories/tests.
    a11y: { disable: true },
  },
};

export const Controlled: Story = {
  render: () => {
    const [code, setCode] = useState('+351');
    const [number, setNumber] = useState('');
    return (
      <PhoneInput
        label="Phone number"
        countryCode={code}
        value={number}
        helperText={`Current value: ${code} ${number || '(empty)'}`}
        onCountryCodeChange={setCode}
        onChange={(e) => setNumber(e.target.value)}
      />
    );
  },
};
