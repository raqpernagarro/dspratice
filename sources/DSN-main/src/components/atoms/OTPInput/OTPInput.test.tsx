import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OTPInput } from './OTPInput';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns all OTP cell inputs in DOM order. */
function getCells() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('.dsn-otp-cell'),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OTPInput', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders 6 cells by default', () => {
      render(<OTPInput />);
      expect(getCells()).toHaveLength(6);
    });

    it('renders the correct number of cells when length prop is set', () => {
      render(<OTPInput length={4} />);
      expect(getCells()).toHaveLength(4);
    });

    it('renders the label text', () => {
      render(<OTPInput label="Verification code" />);
      expect(screen.getByText('Verification code')).toBeInTheDocument();
    });

    it('renders helper text below the cells', () => {
      render(<OTPInput helperText="Check your SMS." />);
      expect(screen.getByText('Check your SMS.')).toBeInTheDocument();
    });

    it('renders error message instead of helper text when status="error"', () => {
      render(
        <OTPInput
          helperText="Check your SMS."
          errorMessage="Incorrect code."
          status="error"
        />,
      );
      // Error message appears in both the visible helper <p> AND the SR live region
      expect(document.querySelector('.dsn-otp-helper')).toHaveTextContent('Incorrect code.');
      // Helper text is not rendered (error message replaces it)
      expect(document.querySelector('.dsn-otp-helper')).not.toHaveTextContent('Check your SMS.');
    });

    it('renders a labelAction element when provided', () => {
      render(
        <OTPInput
          label="Code"
          labelAction={<button type="button">Try again</button>}
        />,
      );
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('renders helper icon with aria-hidden when provided', () => {
      render(
        <OTPInput
          helperText="Help"
          helperIcon={<span data-testid="icon" />}
        />,
      );
      const iconWrapper = screen.getByTestId('icon').parentElement;
      expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('populates cells from defaultValue', () => {
      render(<OTPInput defaultValue="123" />);
      const cells = getCells();
      expect(cells[0]).toHaveValue('1');
      expect(cells[1]).toHaveValue('2');
      expect(cells[2]).toHaveValue('3');
      expect(cells[3]).toHaveValue('');
    });

    it('populates cells from controlled value', () => {
      render(<OTPInput value="456789" />);
      const cells = getCells();
      expect(cells[0]).toHaveValue('4');
      expect(cells[5]).toHaveValue('9');
    });

    it('forwards className to root element', () => {
      const { container } = render(<OTPInput className="custom" />);
      expect(container.querySelector('.dsn-otp')).toHaveClass('custom');
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has role="group" on the cells container', () => {
      render(<OTPInput />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('group has default aria-label when none is provided', () => {
      render(<OTPInput length={6} />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Enter 6-digit verification code',
      );
    });

    it('group uses custom aria-label when provided', () => {
      render(<OTPInput aria-label="Enter PIN" />);
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Enter PIN',
      );
    });

    it('each cell has an aria-label indicating its position', () => {
      render(<OTPInput length={6} />);
      const cells = getCells();
      expect(cells[0]).toHaveAttribute('aria-label', 'Digit 1 of 6');
      expect(cells[5]).toHaveAttribute('aria-label', 'Digit 6 of 6');
    });

    it('has a live region with role="status"', () => {
      render(<OTPInput />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('live region contains verifying text when status="verifying"', () => {
      render(<OTPInput status="verifying" />);
      expect(screen.getByRole('status')).toHaveTextContent('Verifying code');
    });

    it('live region contains success text when status="correct"', () => {
      render(<OTPInput status="correct" />);
      expect(screen.getByRole('status')).toHaveTextContent(
        'Verification successful',
      );
    });

    it('live region contains error message when status="error"', () => {
      render(<OTPInput status="error" errorMessage="Wrong code." />);
      expect(screen.getByRole('status')).toHaveTextContent('Wrong code.');
    });

    it('first cell has autoComplete="one-time-code"', () => {
      render(<OTPInput />);
      expect(getCells()[0]).toHaveAttribute('autocomplete', 'one-time-code');
    });
  });

  // ── States ─────────────────────────────────────────────────────────────────

  describe('states', () => {
    it('sets data-status="error" on root when status="error"', () => {
      const { container } = render(<OTPInput status="error" />);
      expect(container.querySelector('.dsn-otp')).toHaveAttribute(
        'data-status',
        'error',
      );
    });

    it('sets data-status="correct" on root when status="correct"', () => {
      const { container } = render(<OTPInput status="correct" />);
      expect(container.querySelector('.dsn-otp')).toHaveAttribute(
        'data-status',
        'correct',
      );
    });

    it('sets data-status="verifying" on root when status="verifying"', () => {
      const { container } = render(<OTPInput status="verifying" />);
      expect(container.querySelector('.dsn-otp')).toHaveAttribute(
        'data-status',
        'verifying',
      );
    });

    it('does not set data-status when status="idle"', () => {
      const { container } = render(<OTPInput status="idle" />);
      expect(container.querySelector('.dsn-otp')).not.toHaveAttribute(
        'data-status',
      );
    });

    it('cells are disabled when disabled=true', () => {
      render(<OTPInput disabled />);
      getCells().forEach(cell => expect(cell).toBeDisabled());
    });

    it('cells are disabled when status="verifying"', () => {
      render(<OTPInput status="verifying" />);
      getCells().forEach(cell => expect(cell).toBeDisabled());
    });

    it('cells are disabled when status="correct"', () => {
      render(<OTPInput status="correct" />);
      getCells().forEach(cell => expect(cell).toBeDisabled());
    });

    it('cells are not disabled in idle status', () => {
      render(<OTPInput />);
      getCells().forEach(cell => expect(cell).not.toBeDisabled());
    });

    it('sets data-disabled on root when disabled=true', () => {
      const { container } = render(<OTPInput disabled />);
      expect(container.querySelector('.dsn-otp')).toHaveAttribute(
        'data-disabled',
      );
    });
  });

  // ── Interaction ────────────────────────────────────────────────────────────

  describe('interaction', () => {
    it('calls onChange with updated value when a digit is typed', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<OTPInput onChange={onChange} />);
      await user.click(getCells()[0]);
      await user.keyboard('5');
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('5'));
    });

    it('auto-advances focus to the next cell after a digit is typed', async () => {
      const user = userEvent.setup();
      render(<OTPInput />);
      const cells = getCells();
      await user.click(cells[0]);
      await user.keyboard('3');
      expect(document.activeElement).toBe(cells[1]);
    });

    it('calls onComplete when all cells are filled', async () => {
      const onComplete = vi.fn();
      const user = userEvent.setup();
      render(<OTPInput length={4} onComplete={onComplete} />);
      const cells = getCells();
      await user.click(cells[0]);
      for (const digit of ['1', '2', '3', '4']) {
        await user.keyboard(digit);
      }
      expect(onComplete).toHaveBeenCalledWith('1234');
    });

    it('backspace clears current cell when it has a value', async () => {
      const user = userEvent.setup();
      render(<OTPInput defaultValue="1" />);
      const cells = getCells();
      await user.click(cells[0]);
      await user.keyboard('{Backspace}');
      expect(cells[0]).toHaveValue('');
    });

    it('backspace on empty cell moves focus to previous cell', async () => {
      const user = userEvent.setup();
      render(<OTPInput defaultValue="12" />);
      const cells = getCells();
      // Focus cell 1 (index 1) which has value "2"
      await user.click(cells[1]);
      await user.keyboard('{Backspace}'); // clears "2"
      await user.keyboard('{Backspace}'); // moves to cell 0, clears "1"
      expect(document.activeElement).toBe(cells[0]);
    });

    it('ArrowLeft moves focus to the previous cell', async () => {
      const user = userEvent.setup();
      render(<OTPInput />);
      const cells = getCells();
      await user.click(cells[2]);
      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(cells[1]);
    });

    it('ArrowRight moves focus to the next cell', async () => {
      const user = userEvent.setup();
      render(<OTPInput />);
      const cells = getCells();
      await user.click(cells[1]);
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(cells[2]);
    });

    it('handles paste and distributes digits across cells', () => {
      const onChange = vi.fn();
      render(<OTPInput onChange={onChange} />);
      const cells = getCells();

      fireEvent.paste(cells[0], {
        clipboardData: { getData: () => '123456' },
      });

      expect(cells[0]).toHaveValue('1');
      expect(cells[1]).toHaveValue('2');
      expect(cells[5]).toHaveValue('6');
    });

    it('paste strips non-digit characters', () => {
      render(<OTPInput />);
      const cells = getCells();

      fireEvent.paste(cells[0], {
        clipboardData: { getData: () => '1-2-3-4-5-6' },
      });

      expect(cells[0]).toHaveValue('1');
      expect(cells[1]).toHaveValue('2');
      expect(cells[5]).toHaveValue('6');
    });

    it('controlled value updates cells when value prop changes', () => {
      const { rerender } = render(<OTPInput value="123" />);
      expect(getCells()[0]).toHaveValue('1');
      rerender(<OTPInput value="456" />);
      expect(getCells()[0]).toHaveValue('4');
    });
  });
});
