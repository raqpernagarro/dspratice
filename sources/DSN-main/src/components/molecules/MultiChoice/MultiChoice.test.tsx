import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultiChoice } from './MultiChoice';

describe('MultiChoice', () => {
  it('renders label, options and helper text', () => {
    render(
      <MultiChoice
        label="Notification preferences"
        helperText="Help text"
        options={[
          { id: 'email', label: 'Email' },
          { id: 'sms', label: 'SMS' },
        ]}
      />,
    );

    expect(screen.getByText('Notification preferences')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('calls onOptionChange when an option is toggled', async () => {
    const onOptionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MultiChoice
        options={[
          { id: 'email', label: 'Email', checked: false },
          { id: 'sms', label: 'SMS', checked: false },
        ]}
        onOptionChange={onOptionChange}
      />,
    );

    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(onOptionChange).toHaveBeenCalledTimes(1);
    expect(onOptionChange).toHaveBeenCalledWith('email', true);
  });

  it('replaces helper text with error message when in error state', () => {
    render(
      <MultiChoice
        helperText="Help text"
        error
        errorMessage="Select at least one option"
        options={[{ id: 'email', label: 'Email' }]}
      />,
    );

    expect(screen.getByText('Select at least one option')).toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
  });

  it('prevents toggling when disabled', async () => {
    const onOptionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MultiChoice
        disabled
        options={[{ id: 'email', label: 'Email', checked: false }]}
        onOptionChange={onOptionChange}
      />,
    );

    await user.click(screen.getByRole('checkbox'));

    expect(onOptionChange).not.toHaveBeenCalled();
  });
});
