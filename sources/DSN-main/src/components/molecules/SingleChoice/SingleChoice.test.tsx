import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SingleChoice } from './SingleChoice';

const options = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

describe('SingleChoice', () => {
  it('renders label, options, and helper text', () => {
    render(<SingleChoice label="Priority" helperText="Choose one" options={options} />);

    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Choose one')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('calls onValueChange when a new option is selected', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(<SingleChoice label="Priority" options={options} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: 'Beta' }));

    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('respects controlled value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SingleChoice label="Priority" options={options} value="a" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: 'Gamma' }));

    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('c');
  });

  it('shows error message instead of helper text', () => {
    render(
      <SingleChoice
        label="Priority"
        helperText="Choose one"
        error
        errorMessage="Selection required"
        options={options}
      />,
    );

    expect(screen.getByText('Selection required')).toBeInTheDocument();
    expect(screen.queryByText('Choose one')).not.toBeInTheDocument();
  });

  it('prevents interaction when disabled', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(<SingleChoice label="Priority" options={options} disabled onValueChange={onValueChange} />);

    const radio = screen.getByRole('radio', { name: 'Alpha' });
    expect(radio).toHaveAttribute('aria-disabled', 'true');

    await user.click(radio);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
