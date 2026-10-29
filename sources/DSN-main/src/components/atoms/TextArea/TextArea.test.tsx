import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TextArea } from './TextArea';

const TestIcon = () => <svg data-testid="test-icon" aria-hidden="true" />;

describe('TextArea', () => {
  it('renders label and associates it with textarea id', () => {
    render(<TextArea label="Description" />);
    const field = screen.getByRole('textbox');
    const label = screen.getByText('Description').closest('label');
    expect(label).toHaveAttribute('for', field.id);
  });

  it('renders optional suffix when optional=true', () => {
    render(<TextArea label="Notes" optional />);
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('sets aria-required="true" by default', () => {
    render(<TextArea label="Description" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('does not set aria-required when optional=true', () => {
    render(<TextArea label="Notes" optional />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
  });

  it('shows helper text and wires aria-describedby', () => {
    render(<TextArea label="Description" helperText="Help text" />);
    const field = screen.getByRole('textbox');
    const helperId = field.getAttribute('aria-describedby');
    expect(helperId).not.toBeNull();
    expect(document.getElementById(helperId!)).toHaveTextContent('Help text');
  });

  it('shows error message instead of helper text when error=true', () => {
    render(
      <TextArea
        label="Description"
        helperText="Help text"
        error
        errorMessage="Description must be at least 20 characters."
      />,
    );
    expect(
      screen.getByText('Description must be at least 20 characters.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders leading and helper icons', () => {
    render(
      <TextArea
        label="Description"
        helperText="Help text"
        leadingIcon={<TestIcon />}
        helperIcon={<TestIcon />}
      />,
    );
    expect(screen.getAllByTestId('test-icon')).toHaveLength(2);
  });

  it('renders and updates character count in uncontrolled mode', async () => {
    render(<TextArea label="Description" maxLength={100} />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'hello');
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('respects disabled state', () => {
    render(<TextArea label="Description" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(document.querySelector('.dsn-text-area')).toHaveAttribute('data-disabled');
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    render(<TextArea label="Description" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).toHaveBeenCalled();
  });

  it('exposes a keyboard-operable resize separator', async () => {
    const rect = vi
      .spyOn(HTMLTextAreaElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLTextAreaElement) {
        return { height: parseFloat(this.style.height) || 72 } as DOMRect;
      });
    const user = userEvent.setup();
    render(<TextArea label="Description" />);
    const handle = screen.getByRole('separator', { name: 'Resize text area' });

    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    expect(handle).toHaveAttribute('aria-valuenow', '72');
    expect(handle).toHaveAttribute('aria-valuemin', '72');

    await user.tab();
    await user.tab();
    expect(handle).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(handle).toHaveAttribute('aria-valuenow', '88');
    expect(screen.getByRole('textbox').style.height).toBe('88px');

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(handle).toHaveAttribute('aria-valuenow', '72');
    rect.mockRestore();
  });

  it('removes the resize separator from the tab order when disabled', () => {
    render(<TextArea label="Description" disabled />);
    expect(screen.getByRole('separator', { name: 'Resize text area' })).toHaveAttribute('tabindex', '-1');
  });
});

describe('TextArea — trailing icon (Code Connect)', () => {
  it('renders a trailing icon', () => {
    render(<TextArea label="Notes" trailingIcon={<svg data-testid="info" />} />);
    expect(screen.getByTestId('info')).toBeInTheDocument();
  });
});
