import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders role radio with label', () => {
    render(<Radio label="Option A" />);
    expect(screen.getByRole('radio')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('maps checked state to aria-checked', () => {
    render(<Radio checked />);
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onCheckedChange on click when unchecked', async () => {
    const onCheckedChange = vi.fn();
    render(<Radio checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('radio'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not call onCheckedChange when already checked', async () => {
    const onCheckedChange = vi.fn();
    render(<Radio checked onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('radio'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('selects on space key', async () => {
    const onCheckedChange = vi.fn();
    render(<Radio checked={false} onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole('radio');
    el.focus();
    await userEvent.keyboard(' ');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('supports indicator-only mode', () => {
    const { container } = render(<Radio showContent={false} aria-label="Select option" />);
    expect(screen.getByRole('radio', { name: 'Select option' })).toBeInTheDocument();
    expect(container.querySelector('.dsn-radio-content')).toBeNull();
  });

  it('does not select when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Radio disabled checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('radio'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('is removed from tab order when disabled', () => {
    render(<Radio disabled label="Option A" />);
    expect(screen.getByRole('radio')).toHaveAttribute('tabindex', '-1');
  });

  it('does not bubble nested action button clicks to row selection', async () => {
    const onCheckedChange = vi.fn();
    const onActionClick = vi.fn();
    render(
      <Radio
        label="Option A"
        showButtons
        checked={false}
        onCheckedChange={onCheckedChange}
        onActionClick={onActionClick}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open actions' }));
    expect(onActionClick).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
