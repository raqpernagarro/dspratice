import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChipField } from './ChipField';

const options = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
];

describe('ChipField', () => {
  it('renders label, chips, and helper text', () => {
    render(<ChipField label="Technologies" helperText="Choose multiple" options={options} />);

    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByText('Choose multiple')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('calls onValueChange with next selected values', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(<ChipField label="Technologies" options={options} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Beta' }));
    expect(onValueChange).toHaveBeenCalledWith(['b']);
  });

  it('respects controlled values', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ChipField label="Technologies" options={options} value={['a']} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Gamma' }));

    expect(screen.getByRole('checkbox', { name: 'Alpha' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Gamma' })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith(['a', 'c']);
  });

  it('shows error message instead of helper text', () => {
    render(
      <ChipField
        label="Technologies"
        helperText="Choose multiple"
        error
        errorMessage="Choose at least one option"
        options={options}
      />,
    );

    expect(screen.getByText('Choose at least one option')).toBeInTheDocument();
    expect(screen.queryByText('Choose multiple')).not.toBeInTheDocument();
  });

  it('prevents interaction when disabled', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(<ChipField label="Technologies" options={options} disabled onValueChange={onValueChange} />);

    const chip = screen.getByRole('checkbox', { name: 'Alpha' });
    expect(chip).toHaveAttribute('aria-disabled', 'true');

    await user.click(chip);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
