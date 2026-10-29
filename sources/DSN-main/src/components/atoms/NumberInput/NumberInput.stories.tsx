import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberInput } from './NumberInput';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './NumberInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof NumberInput> = {
  title: 'Inputs & Controls/Number Input',
  component: NumberInput,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    optional: {
      control: 'boolean',
      description: 'Appends "(optional)" to the label and suppresses aria-required.',
      table: { defaultValue: { summary: 'false' } },
    },
    step: {
      control: 'number',
      table: { defaultValue: { summary: '1' } },
    },
    min: { control: 'number' },
    max: { control: 'number' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    label: 'Quantity',
    placeholder: '0',
  },
};

export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    label: 'Duration',
    placeholder: '0',
    helperText: 'Enter a value between 1 and 100.',
  },
};

export const WithRange: Story = {
  name: 'With min / max',
  args: {
    label: 'Quantity',
    defaultValue: 5,
    min: 1,
    max: 10,
    helperText: 'Between 1 and 10.',
  },
};

export const WithStep: Story = {
  name: 'With step',
  args: {
    label: 'Duration (days)',
    defaultValue: 5,
    step: 5,
    min: 0,
    max: 30,
    helperText: 'Steps of 5.',
  },
};

export const Optional: Story = {
  args: {
    label: 'Team size',
    placeholder: '0',
    optional: true,
    helperText: 'Leave blank to use the default.',
  },
};

export const Error: Story = {
  args: {
    label: 'Quantity',
    defaultValue: 150,
    error: true,
    errorMessage: 'Quantity cannot exceed 100.',
    max: 100,
  },
};

export const ErrorWithHelperIcon: Story = {
  name: 'Error with helper icon',
  args: {
    label: 'Quantity',
    defaultValue: 150,
    error: true,
    errorMessage: 'Quantity cannot exceed 100.',
    helperIcon: <PlaceholderIcon />,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Quantity',
    defaultValue: 5,
    disabled: true,
    helperText: 'This field is currently locked.',
  },
};

/**
 * Controlled — parent owns the value; demonstrates clamping at min/max via state.
 */
export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState<number | null>(5);
    return (
      <NumberInput
        label="Controlled quantity"
        value={val ?? undefined}
        min={0}
        max={20}
        helperText={`Current value: ${val ?? 'empty'}`}
        onChange={(v) => setVal(v)}
      />
    );
  },
};

/**
 * All 7 Figma states for visual regression reference.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <NumberInput label="Empty" placeholder="0" />
      <NumberInput label="Filled" defaultValue={42} />
      <NumberInput label="With helper text" placeholder="0" helperText="Between 1 and 100." />
      <NumberInput
        label="With helper icon"
        placeholder="0"
        helperText="Between 1 and 100."
        helperIcon={<PlaceholderIcon />}
      />
      <NumberInput label="With range" defaultValue={3} min={1} max={10} />
      <NumberInput
        label="Error"
        defaultValue={150}
        error
        errorMessage="Quantity cannot exceed 100."
      />
      <NumberInput label="Disabled" defaultValue={5} disabled />
    </div>
  ),
};
