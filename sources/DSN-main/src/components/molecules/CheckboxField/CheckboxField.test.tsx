import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CheckboxField } from './CheckboxField';

describe('CheckboxField', () => {
  it('renders field label, checkbox and helper text', () => {
    render(
      <CheckboxField
        label="Notification consent"
        checkboxLabel="Allow email notifications"
        helperText="Help text"
      />,
    );

    expect(screen.getByText('Notification consent')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('calls onCheckedChange when toggled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<CheckboxField checkboxLabel="Allow email notifications" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('replaces helper text with error message', () => {
    render(
      <CheckboxField
        helperText="Help text"
        error
        errorMessage="Please check this option"
      />,
    );

    expect(screen.getByText('Please check this option')).toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <CheckboxField
        disabled
        checkboxLabel="Allow email notifications"
        onCheckedChange={onCheckedChange}
      />,
    );

    await user.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
