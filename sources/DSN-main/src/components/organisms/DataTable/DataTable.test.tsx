import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import type { DataTableColumnDef, DataTableRow } from '../../../types/common';

const columns: DataTableColumnDef[] = [
  {
    id: 'select',
    header: '',
    fieldType: 'checkbox',
    headerVariant: 'checkbox',
    widthMode: 'fixed',
    width: 40,
    frozen: true,
    reorderable: false,
    sortable: false,
    align: 'center',
  },
  {
    id: 'name',
    header: 'Name',
    fieldType: 'string',
    widthMode: 'fixed',
    width: 160,
    sortable: true,
    reorderable: true,
  },
  {
    id: 'amount',
    header: 'Amount',
    fieldType: 'number',
    widthMode: 'fixed',
    width: 120,
    sortable: true,
    reorderable: true,
    align: 'right',
  },
  {
    id: 'status',
    header: 'Status',
    fieldType: 'tag',
    widthMode: 'fixed',
    width: 120,
    reorderable: true,
  },
];

const rows: DataTableRow[] = [
  { id: '1', cells: { name: 'Label', amount: 10, status: 'Active' } },
  { id: '2', cells: { name: 'Other', amount: 20, status: 'Closed' } },
];

function createDataTransfer() {
  return {
    dropEffect: 'move',
    effectAllowed: 'move',
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: [],
    clearData: () => {},
    getData: () => '',
    setData: () => {},
    setDragImage: () => {},
  } as unknown as DataTransfer;
}

function getReorderStatus() {
  return screen.getByLabelText('Column reorder status');
}

function getHeaderCell(label: string) {
  const header = screen.getByText(label).closest('th');
  expect(header).toBeTruthy();
  const cell = header!.querySelector('.dsn-data-table-header-cell');
  expect(cell).toBeTruthy();
  return cell as HTMLElement;
}

describe('DataTable', () => {
  it('renders with table semantics', () => {
    render(<DataTable columns={columns} rows={rows} aria-label="Data table test" />);

    expect(screen.getByRole('table', { name: 'Data table test' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('calls sort callback when sortable header is activated', async () => {
    const onSortStateChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        sortState={null}
        onSortStateChange={onSortStateChange}
      />,
    );

    await user.click(screen.getByText('Name'));
    expect(onSortStateChange).toHaveBeenCalledWith({ columnId: 'name', direction: 'desc' });
  });

  it('calls selection callback from header checkbox', async () => {
    const onSelectedRowIdsChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        selectedRowIds={[]}
        onSelectedRowIdsChange={onSelectedRowIdsChange}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('names row checkboxes by row, not by state', async () => {
    const onSelectedRowIdsChange = vi.fn();
    const { rerender } = render(
      <DataTable columns={columns} rows={rows} selectedRowIds={[rows[0].id]} onSelectedRowIdsChange={onSelectedRowIdsChange} />,
    );
    const first = screen.getByRole('checkbox', { name: `Select row ${rows[0].id}` });
    expect(first).toBeChecked();
    expect(screen.getByRole('checkbox', { name: `Select row ${rows[1].id}` })).not.toBeChecked();

    rerender(
      <DataTable
        columns={columns}
        rows={rows}
        rowLabel={(row) => `Select ${String(row.cells.name)}`}
        onSelectedRowIdsChange={onSelectedRowIdsChange}
      />,
    );
    expect(screen.getByRole('checkbox', { name: `Select ${String(rows[0].cells.name)}` })).not.toBeChecked();
  });

  it('renders one full-width empty-state row when there are no rows', () => {
    const { rerender } = render(<DataTable columns={columns} rows={[]} />);
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveAttribute('colspan', String(screen.getAllByRole('columnheader').length));
    expect(cells[0]).toHaveTextContent('No results');

    rerender(<DataTable columns={columns} rows={[]} emptyState={<p>Nothing here yet</p>} />);
    expect(screen.getByRole('cell')).toHaveTextContent('Nothing here yet');
  });

  it('does not mark the locked first data column as draggable', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        columnOrder={['select', 'name', 'amount']}
      />,
    );

    expect(getHeaderCell('Name')).not.toHaveAttribute('draggable');
    expect(getHeaderCell('Amount')).toHaveAttribute('draggable', 'true');
  });

  it('enters and exits pointer resize mode from header resizer handle', async () => {
    render(<DataTable columns={columns} rows={rows} />);

    const resizeHandles = screen.getAllByRole('button', { name: 'Resize column' });
    const tableRoot = screen.getByRole('table').parentElement;
    fireEvent.pointerDown(resizeHandles[0], { pointerId: 1, clientX: 100 });
    await waitFor(() => {
      expect(tableRoot).toHaveAttribute('data-resizing');
    });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 132 });
    await waitFor(() => {
      expect(tableRoot).not.toHaveAttribute('data-resizing');
    });
  });

  it('moves a reorderable column with Control+ArrowRight and announces position', async () => {
    const onColumnOrderChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        columnOrder={['select', 'name', 'amount', 'status']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    const amountHeader = getHeaderCell('Amount');
    amountHeader.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');

    expect(onColumnOrderChange).toHaveBeenCalledWith(['select', 'name', 'status', 'amount']);
    expect(getReorderStatus()).toHaveTextContent('Amount moved to position 3 of 3');
  });

  it('moves a reorderable column via column options menu click', async () => {
    const onColumnOrderChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        columnOrder={['select', 'name', 'amount', 'status']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    const optionsButtons = screen.getAllByRole('button', { name: 'Column options' });
    await user.click(optionsButtons[1]);
    await user.click(screen.getByRole('menuitem', { name: 'Move right' }));

    expect(onColumnOrderChange).toHaveBeenCalledWith(['select', 'name', 'status', 'amount']);
    expect(getReorderStatus()).toHaveTextContent('Amount moved to position 3 of 3');
  });

  it('does not reorder the locked first data column via keyboard', async () => {
    const onColumnOrderChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        columnOrder={['select', 'name', 'amount']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    const nameHeader = getHeaderCell('Name');
    nameHeader.focus();
    await user.keyboard('{Control>}{ArrowRight}{/Control}');

    expect(onColumnOrderChange).not.toHaveBeenCalled();
    expect(getReorderStatus()).toHaveTextContent('');
  });

  it('keeps locked first data column from reordering on drag', () => {
    const onColumnOrderChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        rows={rows}
        columnOrder={['select', 'name', 'amount']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    const amountHeaderCell = getHeaderCell('Amount');
    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader).toBeTruthy();

    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(amountHeaderCell, { dataTransfer });
    fireEvent.dragOver(nameHeader as HTMLElement, { dataTransfer });
    fireEvent.drop(nameHeader as HTMLElement, { dataTransfer });
    fireEvent.dragEnd(amountHeaderCell, { dataTransfer });

    expect(onColumnOrderChange).not.toHaveBeenCalled();
  });

  it('sizes hug columns to their widest content when a stretch column is present', () => {
    const hugColumns: DataTableColumnDef[] = [
      { id: 'name', header: 'Name', fieldType: 'string', widthMode: 'stretch' },
      { id: 'owner', header: 'Owner', fieldType: 'string', widthMode: 'hug' },
      { id: 'status', header: 'Status', fieldType: 'string', widthMode: 'hug' },
      { id: 'budget', header: 'Budget', fieldType: 'number' },
    ];
    const hugRows: DataTableRow[] = [
      { id: '1', cells: { name: 'Website redesign', owner: 'Ana', status: 'Active', budget: 100 } },
      { id: '2', cells: { name: 'Billing', owner: 'Platform', status: 'Done', budget: 200 } },
    ];
    // jsdom has no layout: report a max-content width per cell from its text length.
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const width = this.style.width === 'max-content' ? (this.textContent?.length ?? 0) * 10 : 0;
        return { width, height: 40, top: 0, left: 0, right: width, bottom: 40, x: 0, y: 0, toJSON: () => ({}) };
      });

    try {
      const { container } = render(<DataTable columns={hugColumns} rows={hugRows} />);
      const cols = Array.from(container.querySelectorAll('col'));

      expect(cols[0].style.width).toBe('');
      // Owner: widest is "Platform" (8 chars); Status: widest is "Active"/"Status" (6 chars).
      expect(cols[1].style.width).toBe('80px');
      expect(cols[2].style.width).toBe('60px');
      container.querySelectorAll<HTMLElement>('[data-column-id="owner"] > *').forEach((content) => {
        expect(content.style.width).toBe('');
      });
    } finally {
      rectSpy.mockRestore();
    }
  });
});
