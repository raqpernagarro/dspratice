import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateTimePicker, buildDefaultPresets } from './DateTimePicker';

describe('DateTimePicker', () => {
  it('opens dialog when input is focused', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker label="Date picker" />);

    await user.click(screen.getByRole('combobox', { name: 'Date picker' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toHaveAttribute(
      'data-placement',
      'bottom',
    );
  });

  it('selects single date and emits onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker label="Date picker" onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Date picker' }));
    await user.click(screen.getAllByRole('gridcell')[10]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it('supports range mode selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker label="Select a date range" selectionMode="range" onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Start date' }));
    const days = screen.getAllByRole('gridcell');
    await user.click(days[10]);
    await user.click(days[13]);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      }),
    );
  });

  it('calls onPresetSelect for preset chips', async () => {
    const user = userEvent.setup();
    const onPresetSelect = vi.fn();
    render(
      <DateTimePicker
        label="Date picker"
        presets={[{ id: 'today', label: 'Today', value: new Date() }]}
        onPresetSelect={onPresetSelect}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Date picker' }));
    await user.click(screen.getByRole('checkbox', { name: 'Today' }));

    expect(onPresetSelect).toHaveBeenCalledWith('today');
  });

  it('marks clicked preset chip as selected in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker label="Date picker" presets={[{ id: 'today', label: 'Today', value: new Date() }]} />);

    await user.click(screen.getByRole('combobox', { name: 'Date picker' }));
    const presetChip = screen.getByRole('checkbox', { name: 'Today' });
    await user.click(presetChip);

    expect(presetChip).toHaveAttribute('aria-checked', 'true');
  });

  it('renders time controls when withTime is enabled', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker label="Date and time" withTime />);

    await user.click(screen.getByRole('combobox', { name: 'Date and time' }));
    expect(screen.getByLabelText('Select time')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Select meridiem' })).toBeInTheDocument();
  });

  it('keeps a single tabbable day in the calendar grid', async () => {
    const user = userEvent.setup();
    render(<DateTimePicker label="Date picker" />);

    await user.click(screen.getByRole('combobox', { name: 'Date picker' }));
    const gridCells = screen.getAllByRole('gridcell');
    const tabbableGridCells = gridCells.filter((cell) => cell.getAttribute('tabindex') === '0');

    expect(tabbableGridCells).toHaveLength(1);
  });

  it('closes popover and calls onConfirm when Enter commits a valid date', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DateTimePicker label="Date picker" showActions onConfirm={onConfirm} />);

    await user.click(screen.getByRole('combobox', { name: 'Date picker' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();

    const input = screen.getByRole('combobox', { name: 'Date picker' });
    await user.clear(input);
    await user.type(input, '07242026');
    await user.keyboard('{Enter}');

    expect(onConfirm).toHaveBeenCalledWith(expect.any(Date));
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).not.toBeInTheDocument();
  });

  describe('built-in presets', () => {
    const byId = (presets: ReturnType<typeof buildDefaultPresets>, id: string) =>
      presets.find((preset) => preset.id === id)?.value;

    it('resolves "Last Friday" to the most recent Friday before today', () => {
      // Sunday 11 Oct 2026 → Friday 9 Oct
      expect(byId(buildDefaultPresets(new Date(2026, 9, 11), false), 'last-friday')).toEqual(
        new Date(2026, 9, 9),
      );
      // Wednesday 14 Oct 2026 → Friday 9 Oct
      expect(byId(buildDefaultPresets(new Date(2026, 9, 14), false), 'last-friday')).toEqual(
        new Date(2026, 9, 9),
      );
      // On a Friday, last Friday is a week ago
      expect(byId(buildDefaultPresets(new Date(2026, 9, 16, 15, 30), false), 'last-friday')).toEqual(
        new Date(2026, 9, 9),
      );
    });

    it('resolves range presets to previous calendar week, month and year', () => {
      const presets = buildDefaultPresets(new Date(2026, 9, 14), true);
      expect(byId(presets, 'last-week')).toEqual({
        start: new Date(2026, 9, 4),
        end: new Date(2026, 9, 10),
      });
      expect(byId(presets, 'last-month')).toEqual({
        start: new Date(2026, 8, 1),
        end: new Date(2026, 8, 30),
      });
      expect(byId(presets, 'last-year')).toEqual({
        start: new Date(2025, 0, 1),
        end: new Date(2025, 11, 31),
      });
    });

    it('handles month and year boundaries', () => {
      const presets = buildDefaultPresets(new Date(2027, 0, 2), true);
      expect(byId(presets, 'last-week')).toEqual({
        start: new Date(2026, 11, 20),
        end: new Date(2026, 11, 26),
      });
      expect(byId(presets, 'last-month')).toEqual({
        start: new Date(2026, 11, 1),
        end: new Date(2026, 11, 31),
      });
    });
  });
});
