import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OTPInput } from './OTPInput';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import spec from './OTPInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof OTPInput> = {
  title: 'Inputs & Controls/OTP Input',
  component: OTPInput,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  argTypes: {
    length: {
      control: { type: 'number', min: 4, max: 8 },
      table: { defaultValue: { summary: '6' } },
    },
    status: {
      control: 'select',
      options: ['idle', 'verifying', 'correct', 'error'],
      table: { defaultValue: { summary: 'idle' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    label: { control: 'text' },
    helperText: { control: 'text' },
    errorMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof OTPInput>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    label: 'Verification code',
    helperText: 'We sent a 6-digit code to your email.',
  },
};

export const WithHelperText: Story = {
  name: 'With helper text',
  args: {
    label: 'Enter the code we sent to +351 9•• ••• 789',
    helperText: 'It expires in 10 minutes.',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Verification code',
    helperText: 'Check your SMS messages.',
    helperIcon: <PlaceholderIcon />,
  },
};

export const FourDigit: Story = {
  name: '4-digit PIN',
  args: {
    length: 4,
    label: 'Enter PIN',
    helperText: 'Your 4-digit account PIN.',
  },
};

/**
 * `status="verifying"` — cells are non-interactive while the server checks the code.
 * The live region announces "Verifying code…" to screen readers.
 */
export const Verifying: Story = {
  args: {
    label: 'Verification code',
    value: '285347',
    status: 'verifying',
    helperText: 'Checking your code…',
  },
};

/**
 * `status="correct"` — green treatment confirms the code was accepted.
 */
export const Correct: Story = {
  args: {
    label: 'Verification code',
    value: '285347',
    status: 'correct',
  },
};

/**
 * `status="error"` — red label, error message, and an optional "Try again" action.
 * Pair with a resend link in `labelAction` for expiry scenarios.
 */
export const Error: Story = {
  args: {
    label: 'Verification code',
    value: '285000',
    status: 'error',
    errorMessage: 'Incorrect code — please try again.',
    labelAction: (
      <a
        href="#resend"
        style={{
          fontSize: 'var(--font-size-micro)',
          color: 'var(--color-foreground-interactive-primary-default)',
          textDecoration: 'none',
        }}
      >
        Try again
      </a>
    ),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Verification code',
    defaultValue: '28',
    disabled: true,
    helperText: 'Verification is currently unavailable.',
  },
};

/**
 * Controlled — parent owns the value and receives every change via `onChange`.
 * Demonstrates `onComplete` for auto-submit when all 6 digits are filled.
 */
export const Controlled: Story = {
  render: () => {
    const [val, setVal] = useState('');
    const [submitted, setSubmitted] = useState(false);

    function handleComplete(code: string) {
      setSubmitted(true);
      console.log('OTP complete:', code);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        <OTPInput
          label="Verification code"
          value={val}
          onChange={setVal}
          onComplete={handleComplete}
          helperText={submitted ? 'Code received — verifying…' : 'Enter the 6-digit code from your SMS.'}
          status={submitted ? 'verifying' : 'idle'}
        />
        {val && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-foreground-neutral-secondary)' }}>
            Current value: <code>{val}</code>
          </p>
        )}
      </div>
    );
  },
};

/**
 * All 6 Figma states stacked for visual regression reference.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 380 }}>
      <OTPInput
        label="Empty"
        helperText="We sent a 6-digit code to your email."
      />
      <OTPInput
        label="Partially filled"
        defaultValue="285"
        helperText="3 of 6 digits entered."
      />
      <OTPInput
        label="Verifying"
        value="285347"
        status="verifying"
        helperText="Checking your code…"
      />
      <OTPInput
        label="Correct"
        value="285347"
        status="correct"
      />
      <OTPInput
        label="Error"
        value="285000"
        status="error"
        errorMessage="Incorrect code — please try again."
        labelAction={
          <a
            href="#resend"
            style={{
              fontSize: 'var(--font-size-micro)',
              color: 'var(--color-foreground-interactive-primary-default)',
              textDecoration: 'none',
            }}
          >
            Try again
          </a>
        }
      />
      <OTPInput
        label="Disabled"
        defaultValue="28"
        disabled
        helperText="Verification is currently unavailable."
      />
    </div>
  ),
};
