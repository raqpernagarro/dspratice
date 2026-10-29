import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PhoneInput } from './PhoneInput';

describe('PhoneInput', () => {
  it('renders label and associates it to the input', () => {
    render(<PhoneInput label="Phone number" />);
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Phone number').closest('label');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders country code selector with default +1', () => {
    render(<PhoneInput label="Phone number" />);
    expect(screen.getByRole('button', { name: 'Country code' })).toHaveTextContent('+1');
  });

  it('changes country code and calls onCountryCodeChange', async () => {
    const onCountryCodeChange = vi.fn();
    render(
      <PhoneInput label="Phone number" onCountryCodeChange={onCountryCodeChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Country code' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Portugal (+351)' }));
    expect(onCountryCodeChange).toHaveBeenCalledWith('+351');
  });

  it('sets aria-invalid when error is true and shows error message', () => {
    render(
      <PhoneInput
        label="Phone number"
        error
        errorMessage="Enter a valid phone number for the selected country."
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Enter a valid phone number for the selected country.'),
    ).toBeInTheDocument();
  });

  it('disables both selector and input when disabled is true', () => {
    render(<PhoneInput label="Phone number" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Country code' })).toBeDisabled();
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    render(<PhoneInput label="Phone number" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), '1234');
    expect(onChange).toHaveBeenCalled();
  });

  it('parses pasted full international number and updates code + local value', () => {
    render(<PhoneInput label="Phone number" />);
    const input = screen.getByRole('textbox');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '+351912345678',
      },
    });
    expect(screen.getByRole('button', { name: 'Country code' })).toHaveTextContent('+351');
    expect(input).toHaveValue('912345678');
  });

  it('tabs from country selector directly to the phone input', async () => {
    const user = userEvent.setup();
    render(<PhoneInput label="Phone number" />);

    const countrySelector = screen.getByRole('button', { name: 'Country code' });
    const input = screen.getByRole('textbox');

    await user.tab();
    expect(countrySelector).toHaveFocus();

    await user.tab();
    expect(input).toHaveFocus();
  });

  it('opens the country selector on Enter key', () => {
    render(<PhoneInput label="Phone number" />);
    const countrySelector = screen.getByRole('button', { name: 'Country code' });

    fireEvent.keyDown(countrySelector, { key: 'Enter' });
    expect(screen.getByRole('menu', { name: 'Country code options' })).toBeInTheDocument();
  });

  it('supports keyboard navigation in the country code menu', async () => {
    const user = userEvent.setup();
    const onCountryCodeChange = vi.fn();
    render(<PhoneInput label="Phone number" onCountryCodeChange={onCountryCodeChange} />);

    const countrySelector = screen.getByRole('button', { name: 'Country code' });
    countrySelector.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('menuitem', { name: 'United States (+1)' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Portugal (+351)' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onCountryCodeChange).toHaveBeenCalledWith('+351');
    expect(countrySelector).toHaveFocus();
  });

  it('closes menu with Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(<PhoneInput label="Phone number" />);
    const countrySelector = screen.getByRole('button', { name: 'Country code' });

    countrySelector.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu', { name: 'Country code options' })).not.toBeInTheDocument();
    expect(countrySelector).toHaveFocus();
  });
});
