import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

describe('Combobox', () => {
  it('renders label, helper text, and combobox input', () => {
    render(<Combobox label="Label" helperText="Help text" options={[{ value: 'a', label: 'Alpha' }]} />);

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Label' })).toBeInTheDocument();
  });

  it('opens listbox on focus', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Label" options={[{ value: 'a', label: 'Alpha' }]} />);

    await user.click(screen.getByRole('combobox', { name: 'Label' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('filters options from typed query', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Label' });
    await user.click(input);
    await user.type(input, 'Be');

    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();
  });

  it('shows all options when opening with a selected value', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Hour"
        showClearButton={false}
        defaultValue="07:00"
        options={[
          { value: '07:00', label: '07:00' },
          { value: '08:00', label: '08:00' },
          { value: '09:00', label: '09:00' },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Hour' }));

    expect(screen.getByRole('option', { name: '07:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '08:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '09:00' })).toBeInTheDocument();
  });

  it('selects an option and emits onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Combobox
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Label' }));
    await user.click(screen.getByRole('option', { name: 'Beta' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b', { value: 'b', label: 'Beta' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Label' })).toHaveValue('Beta');
  });

  it('preserves typed query in controlled mode when value is partial', async () => {
    const user = userEvent.setup();

    function TestHarness() {
      const [value, setValue] = useState('07:00');
      return (
        <Combobox
          label="Hour"
          value={value}
          options={[
            { value: '07:00', label: '07:00' },
            { value: '08:00', label: '08:00' },
          ]}
          onInputChange={setValue}
          onChange={(nextValue) => setValue(nextValue)}
        />
      );
    }

    render(<TestHarness />);

    const input = screen.getByRole('combobox', { name: 'Hour' });
    await user.click(input);
    await user.clear(input);
    await user.type(input, '08');

    expect(input).toHaveValue('08');
  });

  it('calls onEnter with the current query', async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();

    render(
      <Combobox
        label="Hour"
        defaultValue="07:00"
        options={[
          { value: '07:00', label: '07:00' },
          { value: '08:00', label: '08:00' },
        ]}
        onEnter={onEnter}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Hour' });
    await user.click(input);
    await user.keyboard('{Enter}');

    expect(onEnter).toHaveBeenCalledWith('07:00');
  });

  it('supports keyboard navigation and escape close', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Gamma' },
        ]}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Label' });
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('Beta');

    await user.click(input);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('multi-select option toggles add/remove chips immediately', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        selectionMode="multi"
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Label' }));
    const listbox = screen.getByRole('listbox', { name: 'Label options' });
    await user.click(within(listbox).getByRole('option', { name: 'Beta' }));

    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();

    await user.click(within(listbox).getByRole('option', { name: 'Beta' }));
    expect(screen.queryByLabelText('Remove Beta')).not.toBeInTheDocument();
  });

  it('Enter from input adds focused option as chip in multi-select', async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <Combobox
        selectionMode="multi"
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        onValuesChange={onValuesChange}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Label' }));
    await user.keyboard('{Enter}');

    expect(onValuesChange).toHaveBeenCalledWith(['a'], [{ value: 'a', label: 'Alpha' }]);
    expect(screen.getByLabelText('Remove Alpha')).toBeInTheDocument();
  });

  it('Backspace with empty input removes the last chip in multi-select', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        selectionMode="multi"
        label="Label"
        defaultValues={['a', 'b']}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Label' });
    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();

    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(screen.queryByLabelText('Remove Beta')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Remove Alpha')).toBeInTheDocument();
  });

  it('multi-select popover closes on blur without changing selection', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Combobox
          selectionMode="multi"
          label="Label"
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
        <button type="button">Outside</button>
      </>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Label' }));
    const listbox = screen.getByRole('listbox', { name: 'Label options' });
    await user.click(within(listbox).getByRole('option', { name: 'Beta' }));
    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('multi-select popover closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        selectionMode="multi"
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Label' });
    await user.click(input);
    const listbox = screen.getByRole('listbox', { name: 'Label options' });
    await user.click(within(listbox).getByRole('option', { name: 'Beta' }));
    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.getByLabelText('Remove Beta')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('removing a chip updates option selection while popover is open', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        selectionMode="multi"
        label="Label"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        defaultValues={['a', 'b']}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Label' }));
    await user.click(screen.getByLabelText('Remove Beta'));

    expect(screen.queryByLabelText('Remove Beta')).not.toBeInTheDocument();
    const listbox = screen.getByRole('listbox', { name: 'Label options' });
    expect(within(listbox).getByRole('option', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
