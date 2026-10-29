import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NumberInput } from './NumberInput';

// ─── Label ────────────────────────────────────────────────────────────────────

describe('NumberInput', () => {
  describe('label', () => {
    it('renders a visible label', () => {
      render(<NumberInput label="Quantity" />);
      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });

    it('associates label with the input via htmlFor / id', () => {
      render(<NumberInput label="Quantity" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Quantity').closest('label');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('does not render an optional suffix when optional is false', () => {
      render(<NumberInput label="Seats" />);
      expect(screen.queryByText('(optional)')).not.toBeInTheDocument();
    });

    it('renders an optional suffix when optional=true', () => {
      render(<NumberInput label="Team size" optional />);
      expect(screen.getByText('(optional)')).toBeInTheDocument();
    });
  });

  // ─── Keyboard (Arrow Up/Down) ───────────────────────────────────────────────

  describe('keyboard accessibility', () => {
    it('Arrow Up increments value like Increase button', async () => {
      render(<NumberInput label="Qty" defaultValue={5} step={1} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowUp}');
      expect(input).toHaveValue('6');
    });

    it('Arrow Down decrements value like Decrease button', async () => {
      render(<NumberInput label="Qty" defaultValue={5} step={1} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowDown}');
      expect(input).toHaveValue('4');
    });

    it('Arrow Up respects step', async () => {
      render(<NumberInput label="Qty" defaultValue={0} step={5} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowUp}');
      expect(input).toHaveValue('5');
    });

    it('Arrow Down does not go below min', async () => {
      render(<NumberInput label="Qty" defaultValue={1} min={0} max={10} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      expect(input).toHaveValue('0');
    });

    it('Arrow Up does not exceed max', async () => {
      render(<NumberInput label="Qty" defaultValue={9} min={0} max={10} />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{ArrowUp}');
      expect(input).toHaveValue('10');
    });

    it('Arrow Up/Down do nothing when disabled', async () => {
      render(<NumberInput label="Qty" defaultValue={5} disabled />);
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowUp}');
      expect(input).toHaveValue('5');
      await userEvent.keyboard('{ArrowDown}');
      expect(input).toHaveValue('5');
    });
  });

  // ─── Stepper buttons ────────────────────────────────────────────────────────

  describe('stepper buttons', () => {
    it('renders a Decrease value button', () => {
      render(<NumberInput label="Qty" />);
      expect(screen.getByRole('button', { name: 'Decrease value' })).toBeInTheDocument();
    });

    it('renders an Increase value button', () => {
      render(<NumberInput label="Qty" />);
      expect(screen.getByRole('button', { name: 'Increase value' })).toBeInTheDocument();
    });

    it('stepper group has role="group" and accessible label', () => {
      render(<NumberInput label="Qty" />);
      expect(screen.getByRole('group', { name: 'Adjust value' })).toBeInTheDocument();
    });

    it('increment button increments uncontrolled value by step', async () => {
      render(<NumberInput label="Qty" defaultValue={5} step={1} />);
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(screen.getByRole('textbox')).toHaveValue('6');
    });

    it('decrement button decrements uncontrolled value by step', async () => {
      render(<NumberInput label="Qty" defaultValue={5} step={1} />);
      await userEvent.click(screen.getByRole('button', { name: 'Decrease value' }));
      expect(screen.getByRole('textbox')).toHaveValue('4');
    });

    it('respects custom step', async () => {
      render(<NumberInput label="Qty" defaultValue={0} step={5} />);
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(screen.getByRole('textbox')).toHaveValue('5');
    });
  });

  // ─── Min / max ──────────────────────────────────────────────────────────────

  describe('min / max boundaries', () => {
    it('disables decrement when value equals min', () => {
      render(<NumberInput label="Qty" defaultValue={1} min={1} />);
      expect(screen.getByRole('button', { name: 'Decrease value' })).toBeDisabled();
    });

    it('disables increment when value equals max', () => {
      render(<NumberInput label="Qty" defaultValue={10} max={10} />);
      expect(screen.getByRole('button', { name: 'Increase value' })).toBeDisabled();
    });

    it('does not exceed max on repeated increments', async () => {
      render(<NumberInput label="Qty" defaultValue={9} min={0} max={10} />);
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(screen.getByRole('textbox')).toHaveValue('10');
    });

    it('does not go below min on repeated decrements', async () => {
      render(<NumberInput label="Qty" defaultValue={1} min={0} max={10} />);
      await userEvent.click(screen.getByRole('button', { name: 'Decrease value' }));
      await userEvent.click(screen.getByRole('button', { name: 'Decrease value' }));
      expect(screen.getByRole('textbox')).toHaveValue('0');
    });
  });

  // ─── onChange ───────────────────────────────────────────────────────────────

  describe('onChange', () => {
    it('calls onChange with a number when stepper increments', async () => {
      const handleChange = vi.fn();
      render(<NumberInput label="Qty" defaultValue={3} onChange={handleChange} />);
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('calls onChange with null when field is cleared', async () => {
      const handleChange = vi.fn();
      render(<NumberInput label="Qty" defaultValue={5} onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      await userEvent.tripleClick(input);
      await userEvent.keyboard('{Backspace}');
      expect(handleChange).toHaveBeenCalledWith(null);
    });

    it('calls onChange with parsed number when user types', async () => {
      const handleChange = vi.fn();
      render(<NumberInput label="Qty" onChange={handleChange} />);
      await userEvent.type(screen.getByRole('textbox'), '42');
      // The last call should be onChange(42)
      const lastCall = handleChange.mock.calls.at(-1)?.[0];
      expect(lastCall).toBe(42);
    });
  });

  // ─── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('sets aria-invalid when error=true', () => {
      render(<NumberInput label="Qty" error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when error=false', () => {
      render(<NumberInput label="Qty" />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    it('shows errorMessage when error=true', () => {
      render(
        <NumberInput
          label="Qty"
          error
          errorMessage="Quantity cannot exceed 100."
        />,
      );
      expect(screen.getByText('Quantity cannot exceed 100.')).toBeInTheDocument();
    });

    it('shows helperText instead of errorMessage when error=false', () => {
      render(
        <NumberInput
          label="Qty"
          helperText="Between 1 and 100."
          errorMessage="Too large."
          error={false}
        />,
      );
      expect(screen.getByText('Between 1 and 100.')).toBeInTheDocument();
      expect(screen.queryByText('Too large.')).not.toBeInTheDocument();
    });

    it('sets data-error attribute when error=true', () => {
      render(<NumberInput label="Qty" error />);
      expect(document.querySelector('.dsn-number-input')).toHaveAttribute('data-error');
    });
  });

  // ─── Mandatory / optional ───────────────────────────────────────────────────

  describe('mandatory / optional', () => {
    it('sets aria-required="true" by default', () => {
      render(<NumberInput label="Seats" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('does not set aria-required when optional=true', () => {
      render(<NumberInput label="Team size" optional />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
    });
  });

  // ─── Disabled ───────────────────────────────────────────────────────────────

  describe('disabled', () => {
    it('disables the input when disabled=true', () => {
      render(<NumberInput label="Qty" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables both stepper buttons when disabled=true', () => {
      render(<NumberInput label="Qty" disabled />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });

    it('sets data-disabled attribute when disabled=true', () => {
      render(<NumberInput label="Qty" disabled />);
      expect(document.querySelector('.dsn-number-input')).toHaveAttribute('data-disabled');
    });
  });

  // ─── ID wiring ──────────────────────────────────────────────────────────────

  describe('id wiring', () => {
    it('uses the provided id on the input', () => {
      render(<NumberInput id="my-qty" label="Qty" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-qty');
    });

    it('auto-generates an id when none is provided', () => {
      render(<NumberInput label="Qty" />);
      expect(screen.getByRole('textbox').id).toMatch(/^dsn-number-input-/);
    });
  });

  // ─── Helper text / aria-describedby ─────────────────────────────────────────

  describe('helper text', () => {
    it('renders helper text', () => {
      render(<NumberInput label="Qty" helperText="Between 1 and 100." />);
      expect(screen.getByText('Between 1 and 100.')).toBeInTheDocument();
    });

    it('wires aria-describedby when helper text is present', () => {
      render(<NumberInput label="Qty" helperText="Between 1 and 100." />);
      const input = screen.getByRole('textbox');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).not.toBeNull();
      expect(document.getElementById(helperId!)).toHaveTextContent('Between 1 and 100.');
    });

    it('renders helper icon when provided', () => {
      const TestIcon = () => <svg data-testid="help-icon" />;
      render(<NumberInput label="Qty" helperText="Info" helperIcon={<TestIcon />} />);
      expect(screen.getByTestId('help-icon')).toBeInTheDocument();
    });
  });

  // ─── Controlled mode ────────────────────────────────────────────────────────

  describe('controlled mode', () => {
    it('renders with controlled value', () => {
      render(<NumberInput label="Qty" value={7} onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('7');
    });

    it('calls onChange with new value on increment in controlled mode', async () => {
      const handleChange = vi.fn();
      render(<NumberInput label="Qty" value={5} onChange={handleChange} />);
      await userEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(handleChange).toHaveBeenCalledWith(6);
    });
  });

  // ─── Placeholder ─────────────────────────────────────────────────────────────

  describe('placeholder', () => {
    it('passes placeholder to the native input', () => {
      render(<NumberInput label="Qty" placeholder="0" />);
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
    });
  });
});

describe('NumberInput — leading icon (Code Connect)', () => {
  it('renders a leading icon', () => {
    render(<NumberInput label="Quantity" leadingIcon={<svg data-testid="hash" />} />);
    expect(screen.getByTestId('hash')).toBeInTheDocument();
  });
});
