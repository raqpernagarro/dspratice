import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../../atoms/Button';
import { TextInput } from '../../atoms/TextInput';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders as dialog when open', () => {
    render(
      <Modal open title="Delete project">
        <p>Body</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Delete project' })).toBeInTheDocument();
    expect(screen.getAllByText('Delete project').length).toBeGreaterThan(0);
  });

  it('closes via Escape key', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="Dialog" onOpenChange={onOpenChange}>
        <p>Body</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes via overlay click', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="Dialog" onOpenChange={onOpenChange}>
        <p>Body</p>
      </Modal>,
    );

    const overlay = document.querySelector('.dsn-modal-overlay') as HTMLElement;
    await user.click(overlay);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes via header close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="Dialog" onOpenChange={onOpenChange}>
        <p>Body</p>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('focuses the first field in the content area when opened', () => {
    render(
      <Modal open title="New project">
        <TextInput label="Project name" placeholder="e.g. Q3 brand refresh" />
      </Modal>,
    );

    expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveFocus();
  });

  it('returns focus to the trigger element when closed', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            Open modal
          </Button>
          <Modal open={open} onOpenChange={setOpen} title="Dialog">
            <p>Body</p>
          </Modal>
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open modal' });

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});
