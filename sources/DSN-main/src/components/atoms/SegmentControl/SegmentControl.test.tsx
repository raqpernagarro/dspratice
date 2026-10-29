import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentControl } from './SegmentControl';

const options = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'board', label: 'Board', disabled: true },
] as const;

describe('SegmentControl', () => {
  it('renders as a radiogroup with one active option', () => {
    render(<SegmentControl options={options} defaultValue="list" aria-label="View mode" />);

    expect(screen.getByRole('radiogroup', { name: 'View mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'false');
  });

  it('changes selection with click and arrow keys', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentControl options={options} defaultValue="list" onChange={onChange} />);

    const list = screen.getByRole('radio', { name: 'List' });
    const grid = screen.getByRole('radio', { name: 'Grid' });

    await user.click(grid);
    expect(onChange).toHaveBeenCalledWith('grid');

    await user.click(list);
    await user.keyboard('{ArrowRight}');
    expect(grid).toHaveFocus();
  });
});
