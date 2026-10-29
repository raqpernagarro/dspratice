import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTableHeaderCell } from './DataTableHeaderCell';

describe('DataTableHeaderCell', () => {
  it('renders title header with sortable aria attributes', () => {
    render(<DataTableHeaderCell variant="title" label="Name" sortable sortDirection="asc" />);

    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('toggles sort direction on click and keyboard', async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTableHeaderCell
        variant="title"
        label="Amount"
        sortable
        sortDirection="none"
        onSortChange={onSortChange}
      />,
    );

    const header = screen.getByRole('columnheader');
    await user.click(header);
    expect(onSortChange).toHaveBeenCalledWith('desc');

    header.focus();
    await user.keyboard('{Enter}');
    expect(onSortChange).toHaveBeenLastCalledWith('desc');
  });

  it('calls onReorderCommand from column options menu click', async () => {
    const onReorderCommand = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTableHeaderCell
        variant="title"
        label="Amount"
        reorderable
        canMoveReorderRight
        onReorderCommand={onReorderCommand}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Column options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Move right' }));
    expect(onReorderCommand).toHaveBeenCalledWith('right');
    expect(screen.queryByRole('button', { name: 'Reorder column' })).not.toBeInTheDocument();
  });

  it('calls onReorderCommand with Control+Arrow keys', async () => {
    const onReorderCommand = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTableHeaderCell
        variant="title"
        label="Amount"
        reorderable
        onReorderCommand={onReorderCommand}
      />,
    );

    const header = screen.getByRole('columnheader');
    header.focus();
    await user.keyboard('{Control>}{ArrowLeft}{/Control}');
    expect(onReorderCommand).toHaveBeenCalledWith('left');

    await user.keyboard('{Control>}{ArrowRight}{/Control}');
    expect(onReorderCommand).toHaveBeenLastCalledWith('right');
    expect(screen.queryByRole('button', { name: 'Reorder column' })).not.toBeInTheDocument();
  });

  it('marks reorderable title headers as draggable', () => {
    render(
      <DataTableHeaderCell
        variant="title"
        label="Status"
        sortable
        reorderable
      />,
    );

    expect(screen.getByRole('columnheader')).toHaveAttribute('draggable', 'true');
    expect(screen.queryByRole('button', { name: 'Reorder column' })).not.toBeInTheDocument();
  });

  it('renders checkbox header variant', () => {
    render(<DataTableHeaderCell variant="checkbox" aria-label="Select all rows" checkboxChecked />);

    expect(screen.getByRole('columnheader')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
  });
});
