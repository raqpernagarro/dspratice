import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';
import { PageSelector } from './PageSelector';

// ─── PageSelector ─────────────────────────────────────────────────────────────

describe('PageSelector', () => {
  it('renders the page number', () => {
    render(<PageSelector page={5} />);
    expect(screen.getByRole('button')).toHaveTextContent('5');
  });

  it('adds aria-current="page" when selected', () => {
    render(<PageSelector page={3} selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'page');
  });

  it('omits aria-current when not selected', () => {
    render(<PageSelector page={3} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('is disabled when disabled prop is true', () => {
    render(<PageSelector page={4} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<PageSelector page={7} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<PageSelector page={7} disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('Pagination', () => {
  it('renders a <nav> with aria-label="Pagination"', () => {
    render(<Pagination page={1} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('always shows first and last page buttons', () => {
    render(<Pagination page={5} totalPages={20} onPageChange={() => {}} />);
    // page 1 and page 20 must always be present
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current="page"', () => {
    render(<Pagination page={3} totalPages={10} onPageChange={() => {}} />);
    const currentButton = screen.getByRole('button', { name: '3' });
    expect(currentButton).toHaveAttribute('aria-current', 'page');
  });

  it('disables the previous button on the first page', () => {
    render(<Pagination page={1} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(<Pagination page={10} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  it('enables both arrow buttons on a middle page', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go to next page' })).not.toBeDisabled();
  });

  it('calls onPageChange with previous page when previous button is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} totalPages={10} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with next page when next button is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} totalPages={10} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('calls onPageChange when a page number button is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={10} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows an ellipsis for large datasets', () => {
    render(<Pagination page={5} totalPages={99} onPageChange={() => {}} />);
    expect(screen.getAllByRole('button', { name: 'More pages' }).length).toBeGreaterThan(0);
  });

  it('shows both ellipsis regions when current page is in the middle', () => {
    render(<Pagination page={50} totalPages={99} onPageChange={() => {}} />);
    expect(screen.getAllByRole('button', { name: 'More pages' })).toHaveLength(2);
  });

  it('renders the record count summary when totalRecords and pageSize are provided', () => {
    render(
      <Pagination
        page={2}
        totalPages={25}
        onPageChange={() => {}}
        totalRecords={1240}
        pageSize={50}
      />,
    );
    expect(screen.getByText('51–100 of 1240')).toBeInTheDocument();
  });

  it('renders the rows-per-page button when rowsPerPage is provided', () => {
    render(
      <Pagination
        page={1}
        totalPages={10}
        onPageChange={() => {}}
        rowsPerPage={50}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Rows per page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rows per page' })).toHaveTextContent('50');
  });

  it('shows page neighbours (±1) around the current page', () => {
    render(<Pagination page={10} totalPages={20} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '11' })).toBeInTheDocument();
  });

  it('fills a single-page gap instead of showing an ellipsis', () => {
    // page=3, total=7 → shown={1,2,3,4,7}. Gap between 1 and 2 is 1 so no fill.
    // Between 4 and 7 gap is 3 so ellipsis. Pages 5 and 6 are NOT shown.
    // But between 1 and 2: gap is 1 → adjacent, no ellipsis
    // Let's use page=4, total=10. shown={1,3,4,5,10}. Gap 1→3 = 2 → show 2. Gap 5→10 = 5 → ellipsis.
    render(<Pagination page={4} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('opens rows-per-page menu via click, selects an option, and dismisses on outside click', async () => {
    const user = userEvent.setup();
    const onRowsPerPageChange = vi.fn();

    render(
      <Pagination
        page={1}
        totalPages={10}
        onPageChange={() => {}}
        rowsPerPage={50}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onRowsPerPageChange={onRowsPerPageChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Rows per page' }));
    expect(screen.getByRole('menu', { name: 'Rows per page options' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: '25' }));
    expect(onRowsPerPageChange).toHaveBeenCalledWith(25);
    expect(screen.queryByRole('menu', { name: 'Rows per page options' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rows per page' }));
    expect(screen.getByRole('menu', { name: 'Rows per page options' })).toBeInTheDocument();
    await user.click(screen.getByRole('navigation', { name: 'Pagination' }));
    expect(screen.queryByRole('menu', { name: 'Rows per page options' })).not.toBeInTheDocument();
  });
});
