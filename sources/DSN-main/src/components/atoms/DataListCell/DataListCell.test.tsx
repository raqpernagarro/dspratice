import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataListCell } from './DataListCell';

describe('DataListCell', () => {
  it('renders title and description in inline with-title variant', () => {
    render(<DataListCell alignment="inline" variant="with-title" title="Task" description="Description value" />);

    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Description value')).toBeInTheDocument();
  });

  it('hides title for inline just-icon variant', () => {
    render(<DataListCell alignment="inline" variant="just-icon" title="Hidden title" description="Description" />);

    expect(screen.queryByText('Hidden title')).not.toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('shows action button only in hover state', () => {
    const { rerender } = render(<DataListCell state="default" actionAriaLabel="Copy description" />);
    expect(screen.queryByRole('button', { name: 'Copy description' })).not.toBeInTheDocument();

    rerender(<DataListCell state="hover" actionAriaLabel="Copy description" />);
    expect(screen.getByRole('button', { name: 'Copy description' })).toBeInTheDocument();
  });

  it('renders interactive content instead of description text', () => {
    render(
      <DataListCell
        title="Priority"
        description="Default description"
        content={<button type="button">Edit priority</button>}
        showActions={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit priority' })).toBeInTheDocument();
    expect(screen.queryByText('Default description')).not.toBeInTheDocument();
  });

  it('calls onActionClick when hover action is activated', async () => {
    const onActionClick = vi.fn();
    const user = userEvent.setup();

    render(
      <DataListCell state="hover" actionAriaLabel="Copy row description" onActionClick={onActionClick} />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy row description' }));
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it('supports vertical anatomy with hover action', () => {
    render(
      <DataListCell
        alignment="vertical"
        state="hover"
        title="Title"
        description="Description"
        actionAriaLabel="Copy description"
      />,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy description' })).toBeInTheDocument();
  });

  it('supports interactive content in vertical layout', () => {
    render(
      <DataListCell
        alignment="vertical"
        title="Status"
        content={<button type="button">Update status</button>}
        showActions={false}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update status' })).toBeInTheDocument();
  });
});
