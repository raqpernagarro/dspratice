import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput } from './TextInput';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './TextInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof TextInput> = {
  title: 'Inputs & Controls/Text Input',
  component: TextInput,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables the input and dims all elements.',
      table: { defaultValue: { summary: 'false' } },
    },
    error: {
      control: 'boolean',
      description: 'Activates error visual state (red border, label, and helper text).',
      table: { defaultValue: { summary: 'false' } },
    },
    optional: {
      control: 'boolean',
      description: 'Appends "(optional)" to the label and suppresses aria-required.',
      table: { defaultValue: { summary: 'false' } },
    },
    label: {
      control: 'text',
      description: 'Visible label rendered above the control.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the input is empty.',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below the control.',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message displayed below the control when `error=true`.',
    },
    maxLength: {
      control: 'number',
      description: 'Enables the character counter `N/maxLength` in the helper row.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextInput>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default empty text input — medium size, label, and placeholder.
 */
export const Playground: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder text',
  },
};

/**
 * Helper text visible below the control in the secondary style.
 */
export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    helperText: "We'll never share your email with anyone.",
  },
};

/**
 * Optional icon beside helper text — omit `helperIcon` when not needed.
 */
export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    helperText: "We'll never share your email with anyone.",
    helperIcon: <PlaceholderIcon />,
  },
};

/**
 * Leading icon slot — icon sits inside the left edge of the control.
 */
export const WithLeadingIcon: Story = {
  name: 'With leading icon',
  args: {
    label: 'Search',
    placeholder: 'Search…',
    leadingIcon: <PlaceholderIcon />,
  },
};

/**
 * Trailing icon slot — icon sits inside the right edge of the control.
 * Not rendered when `maxLength` is set.
 */
export const WithTrailingIcon: Story = {
  name: 'With trailing icon',
  args: {
    label: 'Website',
    placeholder: 'https://example.com',
    trailingIcon: <PlaceholderIcon />,
  },
};

/**
 * Character counter — displays `N/maxLength` in the bottom-right of the helper row.
 * The trailing icon is hidden when this is active.
 */
export const WithCharacterCount: Story = {
  name: 'With character count',
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself…',
    maxLength: 100,
  },
};

/**
 * Optional field — "(optional)" suffix on the label; aria-required is suppressed.
 */
export const Optional: Story = {
  args: {
    label: 'Team',
    placeholder: 'e.g. Design',
    optional: true,
  },
};

/**
 * Error state — red border, red label, red error message below.
 */
export const Error: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    error: true,
    errorMessage: 'Please enter a valid email address.',
  },
};

/**
 * Error state with helper icon in the helper row.
 */
export const ErrorWithHelperIcon: Story = {
  name: 'Error with helper icon',
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    error: true,
    errorMessage: 'Please enter a valid email address.',
    helperIcon: <PlaceholderIcon />,
  },
};

/**
 * Disabled — non-interactive, all elements dimmed.
 */
export const Disabled: Story = {
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    disabled: true,
    helperText: 'This field is currently locked.',
  },
};

/**
 * All 7 Figma states side by side for visual regression reference.
 * Matches the Empty → Hover → Active → Filled → Focused → Error → Disabled sequence.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      {/* Empty */}
      <TextInput label="Empty" placeholder="Placeholder text" />

      {/* Filled (uncontrolled with defaultValue) */}
      <TextInput label="Filled" defaultValue="User typed value" />

      {/* With leading icon */}
      <TextInput
        label="With leading icon"
        placeholder="Placeholder text"
        leadingIcon={<PlaceholderIcon />}
      />

      {/* With helper text */}
      <TextInput
        label="With helper text"
        placeholder="Placeholder text"
        helperText="Helper text goes here"
      />

      {/* Character count */}
      <TextInput
        label="With character count"
        placeholder="Placeholder text"
        maxLength={100}
      />

      {/* Error */}
      <TextInput
        label="Error"
        placeholder="Placeholder text"
        error
        errorMessage="This field is required."
      />

      {/* Disabled */}
      <TextInput
        label="Disabled"
        placeholder="Placeholder text"
        disabled
      />
    </div>
  ),
};
