import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders a slider handle with expected aria values', () => {
    render(<Slider min={0} max={200} defaultValue={50} aria-label="Price" />);

    const handle = screen.getByRole('slider', { name: 'Price' });
    expect(handle).toHaveAttribute('aria-valuemin', '0');
    expect(handle).toHaveAttribute('aria-valuemax', '200');
    expect(handle).toHaveAttribute('aria-valuenow', '50');
  });

  it('supports keyboard interactions and respects boundaries', () => {
    render(<Slider min={0} max={10} defaultValue={5} step={1} aria-label="Volume" />);
    const handle = screen.getByRole('slider', { name: 'Volume' });

    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(handle).toHaveAttribute('aria-valuenow', '6');

    fireEvent.keyDown(handle, { key: 'Home' });
    expect(handle).toHaveAttribute('aria-valuenow', '0');

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '0');

    fireEvent.keyDown(handle, { key: 'End' });
    expect(handle).toHaveAttribute('aria-valuenow', '10');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '10');
  });

  it('calls onValueChange and keeps controlled value unchanged until parent updates', () => {
    const onValueChange = vi.fn();
    render(<Slider min={0} max={100} value={30} onValueChange={onValueChange} aria-label="Controlled" />);
    const handle = screen.getByRole('slider', { name: 'Controlled' });

    fireEvent.keyDown(handle, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith(31);
    expect(handle).toHaveAttribute('aria-valuenow', '30');
  });

  it('updates in uncontrolled mode and emits changes', () => {
    const onValueChange = vi.fn();
    render(
      <Slider min={0} max={100} defaultValue={0} step={10} onValueChange={onValueChange} aria-label="Pointer" />,
    );

    const handle = screen.getByRole('slider', { name: 'Pointer' });
    fireEvent.keyDown(handle, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledWith(10);
    expect(handle).toHaveAttribute('aria-valuenow', '10');
  });

  it('is non-interactive when disabled', () => {
    const onValueChange = vi.fn();
    render(<Slider min={0} max={100} defaultValue={40} disabled onValueChange={onValueChange} aria-label="Disabled" />);
    const handle = screen.getByRole('slider', { name: 'Disabled' });

    expect(handle).toHaveAttribute('aria-disabled', 'true');
    expect(handle).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '40');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('renders two handles in range mode with distinct labels', () => {
    render(
      <Slider
        mode="range"
        min={0}
        max={100}
        defaultRangeValue={[20, 80]}
        minHandleAriaLabel="Minimum price"
        maxHandleAriaLabel="Maximum price"
      />,
    );

    expect(screen.getByRole('slider', { name: 'Minimum price' })).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByRole('slider', { name: 'Maximum price' })).toHaveAttribute('aria-valuenow', '80');
  });

  it('prevents range handles from crossing', () => {
    const onRangeChange = vi.fn();
    render(
      <Slider
        mode="range"
        min={0}
        max={100}
        rangeValue={[30, 60]}
        onRangeChange={onRangeChange}
        minHandleAriaLabel="Minimum"
        maxHandleAriaLabel="Maximum"
      />,
    );

    const minHandle = screen.getByRole('slider', { name: 'Minimum' });
    fireEvent.keyDown(minHandle, { key: 'End' });

    expect(onRangeChange).toHaveBeenCalledWith([60, 60]);
  });

  it('syncs vertical single set input with slider value', () => {
    render(<Slider mode="single" stack="vertical" showInput min={0} max={100} defaultValue={20} step={5} />);

    const input = screen.getByRole('textbox', { name: 'Slider value' });
    fireEvent.change(input, { target: { value: '80' } });

    const handle = screen.getByRole('slider', { name: 'Slider value' });
    expect(handle).toHaveAttribute('aria-valuenow', '80');
  });

  it('syncs horizontal range set inputs with handles', () => {
    render(
      <Slider
        mode="range"
        stack="horizontal"
        showInput
        min={0}
        max={100}
        defaultRangeValue={[10, 90]}
        minHandleAriaLabel="Minimum"
        maxHandleAriaLabel="Maximum"
      />,
    );

    const [minInput, maxInput] = screen.getAllByRole('textbox');
    fireEvent.change(minInput, { target: { value: '40' } });
    fireEvent.change(maxInput, { target: { value: '70' } });

    expect(screen.getByRole('slider', { name: 'Minimum' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByRole('slider', { name: 'Maximum' })).toHaveAttribute('aria-valuenow', '70');
  });

  it('uses two inputs for range set and does not show combined text value', () => {
    render(
      <Slider
        mode="range"
        stack="horizontal"
        showInput
        showValue
        min={0}
        max={100}
        defaultRangeValue={[12, 20]}
        minHandleAriaLabel="Minimum"
        maxHandleAriaLabel="Maximum"
      />,
    );

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.queryByText('12 - 20')).not.toBeInTheDocument();
  });

  it('moves focus to second range input on Enter from first input', () => {
    render(
      <Slider
        mode="range"
        stack="horizontal"
        showInput
        min={0}
        max={100}
        defaultRangeValue={[15, 40]}
        minHandleAriaLabel="Minimum"
        maxHandleAriaLabel="Maximum"
      />,
    );

    const [firstInput, secondInput] = screen.getAllByRole('textbox');
    firstInput.focus();
    fireEvent.keyDown(firstInput, { key: 'Enter' });
    expect(secondInput).toHaveFocus();
  });

  it('preserves native Tab behavior between range inputs', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        mode="range"
        stack="horizontal"
        showInput
        min={0}
        max={100}
        defaultRangeValue={[15, 40]}
        minHandleAriaLabel="Minimum"
        maxHandleAriaLabel="Maximum"
      />,
    );

    const [firstInput] = screen.getAllByRole('textbox');
    firstInput.focus();
    await user.tab();

    expect(firstInput).not.toHaveFocus();
    expect(document.activeElement?.tagName.toLowerCase()).toBe('button');
  });

  it('uses hug width for horizontal input based on value length', () => {
    const { rerender } = render(
      <Slider mode="single" stack="horizontal" showInput value={1} min={0} max={1000000} aria-label="Hug width" />,
    );

    const shortInput = screen.getByRole('textbox', { name: 'Hug width' });
    const shortWrap = shortInput.closest('.dsn-number-input')?.parentElement as HTMLDivElement;
    const shortWidth = Number.parseFloat(shortWrap.style.width);

    rerender(
      <Slider
        mode="single"
        stack="horizontal"
        showInput
        value={1000000}
        min={0}
        max={1000000}
        aria-label="Hug width"
      />,
    );

    const longInput = screen.getByRole('textbox', { name: 'Hug width' });
    const longWrap = longInput.closest('.dsn-number-input')?.parentElement as HTMLDivElement;
    const longWidth = Number.parseFloat(longWrap.style.width);

    expect(longWidth).toBeGreaterThan(shortWidth);
  });
});
