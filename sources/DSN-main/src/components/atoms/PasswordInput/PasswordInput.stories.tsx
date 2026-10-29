import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordInput } from './PasswordInput';
import { PasswordRequirement } from './PasswordRequirement';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './PasswordInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof PasswordInput> = {
  title: 'Inputs & Controls/Password Input',
  component: PasswordInput,
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
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    label: 'Password',
  },
};

export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    label: 'Password',
    helperText: 'Must be at least 8 characters and include a number.',
  },
};

export const Optional: Story = {
  args: {
    label: 'Recovery code',
    optional: true,
    helperText: 'Only needed when resetting from backup.',
  },
};

export const Error: Story = {
  args: {
    label: 'Password',
    error: true,
    errorMessage: 'Password must include at least one uppercase letter.',
    defaultValue: 'mypassword',
  },
};

export const ErrorWithHelperIcon: Story = {
  name: 'Error with helper icon',
  args: {
    label: 'Password',
    error: true,
    errorMessage: 'Incorrect password.',
    helperIcon: <PlaceholderIcon />,
    defaultValue: 'wrongpassword',
  },
};

/**
 * Provides a "Forgot password?" action link to the right of the label.
 */
export const WithLabelAction: Story = {
  name: 'With label action',
  args: {
    label: 'Password',
    labelAction: (
      <a
        href="#forgot"
        style={{
          fontSize: 'var(--font-size-micro)',
          color: 'var(--color-foreground-interactive-primary-default)',
          textDecoration: 'none',
        }}
      >
        Forgot password?
      </a>
    ),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Password',
    defaultValue: 'disabledvalue',
    disabled: true,
    helperText: 'This field is currently locked.',
  },
};

/**
 * Controlled — parent owns the value; demonstrates the full login form pattern.
 */
export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState('');
    return (
      <PasswordInput
        label="Password"
        value={val}
        autoComplete="current-password"
        helperText={val.length > 0 ? `${val.length} characters entered` : 'Enter your password.'}
        onChange={(e) => setVal(e.target.value)}
      />
    );
  },
};

/**
 * `trailingIcon` renders a 16 × 16 icon between the text field and the eye toggle.
 * Matches Figma's `rhIconWrapper` slot.
 */
export const WithTrailingIcon: Story = {
  name: 'With trailing icon',
  args: {
    label: 'Password',
    trailingIcon: <PlaceholderIcon />,
  },
};

/**
 * Live registration form — requirements list reacts to the typed value.
 * Demonstrates `PasswordRequirement` used alongside `PasswordInput`.
 */
export const WithRequirements: Story = {
  name: 'With requirements (registration)',
  render: () => {
    const [val, setVal] = useState('');
    const reqs = [
      { label: '8+ characters', met: val.length >= 8 },
      { label: '1 uppercase letter', met: /[A-Z]/.test(val) },
      { label: '1 lowercase letter', met: /[a-z]/.test(val) },
      { label: '1 number', met: /[0-9]/.test(val) },
      { label: '1 special character', met: /[^A-Za-z0-9]/.test(val) },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reqs.map((r) => (
            <PasswordRequirement key={r.label} label={r.label} met={r.met} />
          ))}
        </div>
      </div>
    );
  },
};

/**
 * All 8 Figma states for visual regression reference.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <PasswordInput label="Empty" />
      <PasswordInput label="With placeholder" placeholder="Enter password" />
      <PasswordInput label="Filled" defaultValue="MyPassword1" />
      <PasswordInput
        label="With helper text"
        helperText="Must be at least 8 characters."
      />
      <PasswordInput
        label="With helper icon"
        helperText="Must be at least 8 characters."
        helperIcon={<PlaceholderIcon />}
      />
      <PasswordInput
        label="Error"
        error
        errorMessage="Password must include at least one uppercase letter."
        defaultValue="mypassword"
      />
      <PasswordInput label="Disabled" defaultValue="disabledvalue" disabled />
    </div>
  ),
};
