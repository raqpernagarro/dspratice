import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TextInput } from './TextInput';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TestIcon = () => <svg data-testid="test-icon" aria-hidden="true" />;

// ─── Label ────────────────────────────────────────────────────────────────────

describe('TextInput', () => {
  describe('label', () => {
    it('renders a visible label when label prop is provided', () => {
      render(<TextInput label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('associates label with input via htmlFor / id', () => {
      render(<TextInput label="Email" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email');
      // The label's htmlFor must match the input's id
      expect(label.closest('label')).toHaveAttribute('for', input.id);
    });

    it('does not render a <label> when label prop is omitted', () => {
      render(<TextInput aria-label="Search" />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
      // No label element at all
      expect(document.querySelector('label')).toBeNull();
    });

    it('does not render an optional suffix when optional is false', () => {
      render(<TextInput label="Name" />);
      expect(screen.queryByText('(optional)')).not.toBeInTheDocument();
    });

    it('renders an optional suffix when optional=true', () => {
      render(<TextInput label="Team" optional />);
      expect(screen.getByText('(optional)')).toBeInTheDocument();
    });
  });

  // ─── ID wiring ──────────────────────────────────────────────────────────────

  describe('id wiring', () => {
    it('uses the provided id on the input', () => {
      render(<TextInput id="my-input" label="Label" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input');
    });

    it('auto-generates an id when none is provided', () => {
      render(<TextInput label="Label" />);
      const input = screen.getByRole('textbox');
      expect(input.id).toMatch(/^dsn-text-input-/);
    });
  });

  // ─── Helper text ────────────────────────────────────────────────────────────

  describe('helper text', () => {
    it('renders helper text when helperText prop is provided', () => {
      render(<TextInput label="Email" helperText="Enter your work email." />);
      expect(screen.getByText('Enter your work email.')).toBeInTheDocument();
    });

    it('wires aria-describedby on the input to the helper element', () => {
      render(<TextInput label="Email" helperText="Enter your work email." />);
      const input = screen.getByRole('textbox');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).not.toBeNull();
      expect(document.getElementById(helperId!)).toHaveTextContent('Enter your work email.');
    });

    it('does not set aria-describedby when neither helperText nor errorMessage is present', () => {
      render(<TextInput label="Name" />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });

    it('does not render the helper row when no helper content or maxLength', () => {
      render(<TextInput label="Name" />);
      expect(document.querySelector('.dsn-text-input-meta')).toBeNull();
    });
  });

  // ─── Error state ─────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('sets aria-invalid="true" when error=true', () => {
      render(<TextInput label="Email" error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when error=false', () => {
      render(<TextInput label="Email" />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    it('shows errorMessage instead of helperText when error=true', () => {
      render(
        <TextInput
          label="Email"
          helperText="Enter your work email."
          errorMessage="This field is required."
          error
        />,
      );
      expect(screen.getByText('This field is required.')).toBeInTheDocument();
      expect(screen.queryByText('Enter your work email.')).not.toBeInTheDocument();
    });

    it('shows helperText when error=false even if errorMessage is provided', () => {
      render(
        <TextInput
          label="Email"
          helperText="Enter your work email."
          errorMessage="This field is required."
          error={false}
        />,
      );
      expect(screen.getByText('Enter your work email.')).toBeInTheDocument();
      expect(screen.queryByText('This field is required.')).not.toBeInTheDocument();
    });

    it('sets data-error attribute on root when error=true', () => {
      render(<TextInput label="Email" error />);
      expect(document.querySelector('.dsn-text-input')).toHaveAttribute('data-error');
    });
  });

  // ─── Mandatory / optional ───────────────────────────────────────────────────

  describe('mandatory / optional', () => {
    it('sets aria-required="true" by default', () => {
      render(<TextInput label="Name" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required when optional=true', () => {
      render(<TextInput label="Team" optional />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
    });
  });

  // ─── Disabled ───────────────────────────────────────────────────────────────

  describe('disabled', () => {
    it('sets the disabled attribute on the input when disabled=true', () => {
      render(<TextInput label="Name" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('sets data-disabled attribute on root when disabled=true', () => {
      render(<TextInput label="Name" disabled />);
      expect(document.querySelector('.dsn-text-input')).toHaveAttribute('data-disabled');
    });
  });

  // ─── Events ─────────────────────────────────────────────────────────────────

  describe('events', () => {
    it('calls onChange when user types', async () => {
      const handleChange = vi.fn();
      render(<TextInput label="Name" onChange={handleChange} />);
      await userEvent.type(screen.getByRole('textbox'), 'Hello');
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus when input receives focus', async () => {
      const handleFocus = vi.fn();
      render(<TextInput label="Name" onFocus={handleFocus} />);
      await userEvent.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalled();
    });

    it('calls onBlur when input loses focus', async () => {
      const handleBlur = vi.fn();
      render(<TextInput label="Name" onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  // ─── Character count ─────────────────────────────────────────────────────────

  describe('character count', () => {
    it('renders "0/N" counter when maxLength is set and input is empty', () => {
      render(<TextInput label="Bio" maxLength={100} />);
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('updates the counter as the user types (uncontrolled)', async () => {
      render(<TextInput label="Bio" maxLength={50} />);
      await userEvent.type(screen.getByRole('textbox'), 'Hello');
      expect(screen.getByText('5/50')).toBeInTheDocument();
    });

    it('shows the correct count for a controlled input', () => {
      render(<TextInput label="Bio" value="Hi" maxLength={20} onChange={() => {}} />);
      expect(screen.getByText('2/20')).toBeInTheDocument();
    });

    it('hides the trailing icon when maxLength is set', () => {
      render(
        <TextInput
          label="Bio"
          maxLength={100}
          trailingIcon={<TestIcon />}
        />,
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  // ─── Icons ──────────────────────────────────────────────────────────────────

  describe('icons', () => {
    it('renders leading icon with aria-hidden', () => {
      render(<TextInput label="Search" leadingIcon={<TestIcon />} />);
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.closest('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders trailing icon with aria-hidden when maxLength is not set', () => {
      render(<TextInput label="URL" trailingIcon={<TestIcon />} />);
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.closest('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders helper icon in the helper row', () => {
      render(
        <TextInput
          label="Email"
          helperText="Some helper"
          helperIcon={<TestIcon />}
        />,
      );
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  // ─── Placeholder ────────────────────────────────────────────────────────────

  describe('placeholder', () => {
    it('passes placeholder to the native input', () => {
      render(<TextInput label="Name" placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });
  });

  // ─── Uncontrolled / Controlled ───────────────────────────────────────────────

  describe('controlled / uncontrolled', () => {
    it('renders with defaultValue in uncontrolled mode', () => {
      render(<TextInput label="Name" defaultValue="John" />);
      expect(screen.getByRole('textbox')).toHaveValue('John');
    });

    it('renders with value in controlled mode', () => {
      render(<TextInput label="Name" value="Jane" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('Jane');
    });
  });
});
