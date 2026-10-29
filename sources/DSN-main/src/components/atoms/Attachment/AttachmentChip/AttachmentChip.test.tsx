import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentChip } from './AttachmentChip';

describe('AttachmentChip', () => {
  it('renders filename and size', () => {
    render(<AttachmentChip fileName="Budget.csv" fileSize="2 MB" />);
    expect(screen.getByText('Budget.csv')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
  });

  it('renders remove action and triggers callback', () => {
    const onRemove = vi.fn();
    render(<AttachmentChip fileName="Budget.csv" fileSize="2 MB" action="remove" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Budget.csv' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('opens more options menu and selects item', () => {
    const onMenuSelect = vi.fn();
    render(
      <AttachmentChip
        fileName="Budget.csv"
        fileSize="2 MB"
        action="more"
        menuOptions={[{ id: 'download', label: 'Download' }]}
        onMenuSelect={onMenuSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More options for Budget.csv' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Download' }));

    expect(onMenuSelect).toHaveBeenCalledWith('download');
  });

  it('opens anchored menu via click, selects an option, and dismisses on outside click', async () => {
    const user = userEvent.setup();
    const onMenuSelect = vi.fn();

    render(
      <AttachmentChip
        fileName="Budget.csv"
        fileSize="2 MB"
        action="more"
        menuOptions={[
          { id: 'download', label: 'Download' },
          { id: 'remove', label: 'Remove' },
        ]}
        onMenuSelect={onMenuSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'More options for Budget.csv' }));
    expect(screen.getByRole('menu', { name: 'Attachment options' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Download' }));
    expect(onMenuSelect).toHaveBeenCalledWith('download');
    expect(screen.queryByRole('menu', { name: 'Attachment options' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More options for Budget.csv' }));
    expect(screen.getByRole('menu', { name: 'Attachment options' })).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole('menu', { name: 'Attachment options' })).not.toBeInTheDocument();
  });

  it('renders preview image variant', () => {
    render(
      <AttachmentChip
        fileName="photo.jpg"
        fileSize="1 MB"
        previewVariant="image"
        previewSrc="https://example.com/photo.jpg"
      />,
    );

    expect(screen.getByLabelText('image preview')).toBeInTheDocument();
  });

  it('falls back to the file icon for an image preview without a source', () => {
    const { container } = render(
      <AttachmentChip fileName="photo.jpg" fileSize="1 MB" previewVariant="image" />,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getByLabelText('image preview')).toHaveAttribute('data-variant', 'file');
  });
});
