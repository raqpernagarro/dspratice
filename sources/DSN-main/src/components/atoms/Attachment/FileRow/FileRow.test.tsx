import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileRow } from './FileRow';

describe('FileRow', () => {
  it('renders file metadata in default state', () => {
    render(<FileRow fileName="Project brief" fileType="PDF" fileSize="12 Mb" />);

    expect(screen.getByText('Project brief')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('12 Mb')).toBeInTheDocument();
  });

  it('renders hover actions in hover state', async () => {
    const onCopyLink = vi.fn();
    const onDownload = vi.fn();
    const user = userEvent.setup();

    render(
      <FileRow
        fileName="Roadmap"
        state="hover"
        onCopyLink={onCopyLink}
        onDownload={onDownload}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy link for Roadmap' }));
    await user.click(screen.getByRole('button', { name: 'Download Roadmap' }));

    expect(onCopyLink).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('shows normalized tooltips for hover actions', async () => {
    const user = userEvent.setup();

    render(<FileRow fileName="Roadmap" state="hover" onCopyLink={vi.fn()} onDownload={vi.fn()} />);

    await user.hover(screen.getByRole('button', { name: 'Copy link for Roadmap' }));
    expect(await screen.findByRole('tooltip', { name: 'Copy link' })).toBeInTheDocument();

    await user.unhover(screen.getByRole('button', { name: 'Copy link for Roadmap' }));
    await user.hover(screen.getByRole('button', { name: 'Download Roadmap' }));
    expect(await screen.findByRole('tooltip', { name: 'Download' })).toBeInTheDocument();
  });

  it('defaults to the file preview', () => {
    render(<FileRow fileName="Roadmap" />);
    expect(screen.getByRole('img', { name: 'file preview' })).toHaveAttribute('data-variant', 'file');
  });

  it('renders no actions when no handlers are provided', () => {
    const { container } = render(<FileRow fileName="Roadmap" fileType="PDF" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('.dsn-file-row')).not.toHaveAttribute('data-has-actions');
  });

  it('renders only the actions whose handlers are provided', () => {
    render(<FileRow fileName="Roadmap" state="hover" onDownload={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Download Roadmap' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy link for Roadmap' })).not.toBeInTheDocument();
  });

  it('renders no placeholder metadata when type and size are omitted', () => {
    const { container } = render(<FileRow fileName="Roadmap" />);
    expect(container.querySelector('.dsn-file-row-meta')).not.toBeInTheDocument();
  });

  it('renders progress and cancel action in uploading state', async () => {
    const onCancelUpload = vi.fn();
    const user = userEvent.setup();

    render(
      <FileRow
        fileName="Design export"
        state="uploading"
        uploadProgress={55}
        onCancelUpload={onCancelUpload}
      />,
    );

    expect(screen.getByRole('progressbar', { name: 'Uploading Design export' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel upload for Design export' }));
    expect(onCancelUpload).toHaveBeenCalledTimes(1);
  });
});
