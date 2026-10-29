import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PasswordInput } from './PasswordInput';

// ─── Label ────────────────────────────────────────────────────────────────────

describe('PasswordInput', () => {
  describe('label', () => {
    it('renders a visible label', () => {
      render(<PasswordInput label="Password" />);
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('associates label with the input via htmlFor / id', () => {
      render(<PasswordInput label="Password" />);
      const input = document.querySelector('input')!;
      const labelEl = document.querySelector('label');
      expect(labelEl).toHaveAttribute('for', input.id);
    });

    it('associates label htmlFor with the input id', () => {
      render(<PasswordInput label="Password" />);
      const label = screen.getByText('Password').closest('label');
      const input = document.getElementById(label!.htmlFor);
      expect(input).not.toBeNull();
      expect(input!.tagName).toBe('INPUT');
    });

    it('does not render an optional suffix when optional is false', () => {
      render(<PasswordInput label="Password" />);
      expect(screen.queryByText('(optional)')).not.toBeInTheDocument();
    });

    it('renders an optional suffix when optional=true', () => {
      render(<PasswordInput label="Recovery code" optional />);
      expect(screen.getByText('(optional)')).toBeInTheDocument();
    });

    it('renders labelAction to the right of the label', () => {
      render(
        <PasswordInput
          label="Password"
          labelAction={<a href="#forgot">Forgot password?</a>}
        />,
      );
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });
  });

  // ─── Input type ─────────────────────────────────────────────────────────────

  describe('input type', () => {
    it('has type="password" by default', () => {
      render(<PasswordInput label="Password" />);
      // The input is not a textbox role when type=password
      const input = document.querySelector('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('toggle button has aria-label "Show password" initially', () => {
      render(<PasswordInput label="Password" />);
      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    });

    it('toggle button has aria-pressed=false initially', () => {
      render(<PasswordInput label="Password" />);
      expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('clicking toggle changes input type to "text"', async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
      expect(document.querySelector('input')).toHaveAttribute('type', 'text');
    });

    it('clicking toggle again restores type to "password"', async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
      await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(document.querySelector('input')).toHaveAttribute('type', 'password');
    });

    it('toggle aria-label changes to "Hide password" when revealed', async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
    });

    it('toggle button has aria-pressed=true when revealed', async () => {
      render(<PasswordInput label="Password" />);
      await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
      expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  // ─── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('sets aria-invalid when error=true', () => {
      render(<PasswordInput label="Password" error />);
      expect(document.querySelector('input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when error=false', () => {
      render(<PasswordInput label="Password" />);
      expect(document.querySelector('input')).not.toHaveAttribute('aria-invalid');
    });

    it('shows errorMessage when error=true', () => {
      render(
        <PasswordInput
          label="Password"
          error
          errorMessage="Incorrect password."
        />,
      );
      expect(screen.getByText('Incorrect password.')).toBeInTheDocument();
    });

    it('shows helperText instead of errorMessage when error=false', () => {
      render(
        <PasswordInput
          label="Password"
          helperText="At least 8 characters."
          errorMessage="Too short."
          error={false}
        />,
      );
      expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
      expect(screen.queryByText('Too short.')).not.toBeInTheDocument();
    });

    it('sets data-error attribute on root when error=true', () => {
      render(<PasswordInput label="Password" error />);
      expect(document.querySelector('.dsn-password-input')).toHaveAttribute('data-error');
    });
  });

  // ─── Mandatory / optional ───────────────────────────────────────────────────

  describe('mandatory / optional', () => {
    it('sets aria-required="true" by default', () => {
      render(<PasswordInput label="Password" />);
      expect(document.querySelector('input')).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required when optional=true', () => {
      render(<PasswordInput label="Recovery code" optional />);
      expect(document.querySelector('input')).not.toHaveAttribute('aria-required');
    });
  });

  // ─── Disabled ───────────────────────────────────────────────────────────────

  describe('disabled', () => {
    it('disables the input when disabled=true', () => {
      render(<PasswordInput label="Password" disabled />);
      expect(document.querySelector('input')).toBeDisabled();
    });

    it('disables the toggle button when disabled=true', () => {
      render(<PasswordInput label="Password" disabled />);
      expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
    });

    it('sets data-disabled attribute on root when disabled=true', () => {
      render(<PasswordInput label="Password" disabled />);
      expect(document.querySelector('.dsn-password-input')).toHaveAttribute('data-disabled');
    });
  });

  // ─── onChange ───────────────────────────────────────────────────────────────

  describe('onChange', () => {
    it('calls onChange when user types', async () => {
      const handleChange = vi.fn();
      render(<PasswordInput label="Password" onChange={handleChange} />);
      await userEvent.type(document.querySelector('input')!, 'abc');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  // ─── ID wiring ──────────────────────────────────────────────────────────────

  describe('id wiring', () => {
    it('uses the provided id on the input', () => {
      render(<PasswordInput id="my-pw" label="Password" />);
      expect(document.querySelector('input')).toHaveAttribute('id', 'my-pw');
    });

    it('auto-generates an id when none is provided', () => {
      render(<PasswordInput label="Password" />);
      expect(document.querySelector('input')!.id).toMatch(/^dsn-password-input-/);
    });
  });

  // ─── Helper text / aria-describedby ─────────────────────────────────────────

  describe('helper text', () => {
    it('renders helper text', () => {
      render(<PasswordInput label="Password" helperText="At least 8 characters." />);
      expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
    });

    it('wires aria-describedby when helper text is present', () => {
      render(<PasswordInput label="Password" helperText="At least 8 characters." />);
      const input = document.querySelector('input')!;
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).not.toBeNull();
      expect(document.getElementById(helperId!)).toHaveTextContent('At least 8 characters.');
    });

    it('does not set aria-describedby when no helper content', () => {
      render(<PasswordInput label="Password" />);
      expect(document.querySelector('input')).not.toHaveAttribute('aria-describedby');
    });

    it('renders helper icon when provided', () => {
      const TestIcon = () => <svg data-testid="help-icon" />;
      render(
        <PasswordInput label="Password" helperText="Info" helperIcon={<TestIcon />} />,
      );
      expect(screen.getByTestId('help-icon')).toBeInTheDocument();
    });
  });

  // ─── autoComplete ────────────────────────────────────────────────────────────

  describe('autoComplete', () => {
    it('defaults to "current-password"', () => {
      render(<PasswordInput label="Password" />);
      expect(document.querySelector('input')).toHaveAttribute(
        'autocomplete',
        'current-password',
      );
    });

    it('accepts a custom autoComplete value', () => {
      render(<PasswordInput label="New password" autoComplete="new-password" />);
      expect(document.querySelector('input')).toHaveAttribute(
        'autocomplete',
        'new-password',
      );
    });
  });

  // ─── Controlled mode ────────────────────────────────────────────────────────

  describe('controlled mode', () => {
    it('renders with controlled value (masked)', () => {
      render(<PasswordInput label="Password" value="secret" onChange={() => {}} />);
      const input = document.querySelector('input')!;
      expect(input).toHaveValue('secret');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('calls onChange on user interaction in controlled mode', async () => {
      const handleChange = vi.fn();
      render(<PasswordInput label="Password" value="abc" onChange={handleChange} />);
      await userEvent.type(document.querySelector('input')!, 'd');
      expect(handleChange).toHaveBeenCalled();
    });
  });
});

describe('PasswordInput — leading icon (Code Connect)', () => {
  it('renders a custom leading icon', () => {
    render(<PasswordInput label="Password" leadingIcon={<svg data-testid="key" />} />);
    expect(screen.getByTestId('key')).toBeInTheDocument();
  });

  it('can hide the leading icon', () => {
    const { container } = render(<PasswordInput label="Password" showLeadingIcon={false} />);
    expect(container.querySelector('.dsn-password-input-lock')).toBeNull();
  });
});
