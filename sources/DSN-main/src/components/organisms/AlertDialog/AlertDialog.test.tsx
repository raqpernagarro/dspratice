import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog } from './AlertDialog';

describe('AlertDialog', () => {
  it('renders as alertdialog when open', () => {
    render(<AlertDialog open title="Delete project" message="This action cannot be undone." />);
    expect(screen.getByRole('alertdialog', { name: 'Delete project' })).toBeInTheDocument();
    expect(screen.getByText('Delete project')).toBeInTheDocument();
  });

  it('closes via Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<AlertDialog open title="Title" message="Message" onOpenChange={onOpenChange} />);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps destructive confirm disabled until checkbox is checked', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog
        open
        variant="danger"
        title="Delete"
        message="Double check"
        requireAcknowledgement
        acknowledgementLabel="Confirm"
        confirmLabel="Delete"
      />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Confirm' }));
    expect(deleteButton).not.toBeDisabled();
  });
});
