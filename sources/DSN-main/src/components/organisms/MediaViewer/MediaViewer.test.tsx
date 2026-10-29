import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Download } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { MediaViewer, getFileTypeLabel } from './MediaViewer';
import type { MediaViewerItem } from './MediaViewer';

const ITEMS: MediaViewerItem[] = [
  {
    id: 'a',
    type: 'image',
    src: 'a.jpg',
    title: 'site-plan.jpg',
    alt: 'Site plan of the new office',
    mimeType: 'image/jpeg',
    size: '1.2 MB',
    owner: { name: 'Ana Costa' },
    createdAt: '12 Mar 2026',
  },
  { id: 'b', type: 'pdf', src: 'b.pdf', title: 'contract.pdf', mimeType: 'application/pdf' },
  { id: 'c', type: 'video', src: 'c.mp4', title: 'walkthrough.mp4' },
  { id: 'd', type: 'file', src: 'd.zip', title: 'assets.zip' },
];

function Harness(props: Partial<React.ComponentProps<typeof MediaViewer>>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open viewer</button>
      <MediaViewer label="Project files" items={ITEMS} open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}

describe('MediaViewer', () => {
  beforeAll(() => {
    // react-zoom-pan-pinch observes the stage size; jsdom has no ResizeObserver.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'pdfViewerEnabled', { value: undefined, configurable: true });
  });

  it('renders nothing when closed', () => {
    render(<MediaViewer label="Project files" items={ITEMS} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a modal dialog named by label with metadata', () => {
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen />);
    const dialog = screen.getByRole('dialog', { name: 'Project files' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'site-plan.jpg' })).toBeInTheDocument();
    expect(screen.getByText('JPG')).toBeInTheDocument();
    expect(screen.getByText('1.2 MB')).toBeInTheDocument();
    expect(screen.getByText('Ana Costa · 12 Mar 2026')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Site plan of the new office' })).toBeInTheDocument();
  });

  it('hides owner, date, type and size when showMetadata is false', () => {
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen showMetadata={false} />);
    expect(screen.getByRole('heading', { name: 'site-plan.jpg' })).toBeInTheDocument();
    expect(screen.queryByText('JPG')).not.toBeInTheDocument();
    expect(screen.queryByText('Ana Costa · 12 Mar 2026')).not.toBeInTheDocument();
  });

  it('moves focus to close on open and returns it to the trigger on close', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open viewer' });
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Close viewer' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Close viewer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<MediaViewer label="Project files" items={ITEMS} open onOpenChange={onOpenChange} />);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('navigates with arrows, keys and announces the new item', async () => {
    const user = userEvent.setup();
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen />);
    expect(screen.queryByRole('button', { name: 'Previous file' })).not.toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next file' }));
    expect(screen.getByTitle('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('contract.pdf, 2 of 4', { selector: '.dsn-media-viewer-live' })).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(screen.getByRole('heading', { name: 'assets.zip' })).toBeInTheDocument();
    // Next arrow is removed on the last item; focus moves to Previous.
    expect(screen.queryByRole('button', { name: 'Next file' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous file' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('heading', { name: 'site-plan.jpg' })).toBeInTheDocument();
  });

  it('renders the item actions for the current item in a group', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(
      <MediaViewer
        label="Project files"
        items={ITEMS}
        defaultOpen
        actions={(item) => (
          <Button
            variant="ghost"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<Download size={16} />}
            aria-label={`Download ${item.title}`}
            onClick={() => onDownload(item.id)}
          />
        )}
      />,
    );
    expect(screen.getByRole('group', { name: 'File actions' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Download site-plan.jpg' }));
    expect(onDownload).toHaveBeenCalledWith('a');
  });

  it('shows zoom controls only for images', async () => {
    const user = userEvent.setup();
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen />);
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Reset zoom, currently 100%/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Next file' }));
    expect(screen.queryByRole('group', { name: 'Zoom' })).not.toBeInTheDocument();
  });

  it('offers single-pointer pan controls and arrow-key panning while zoomed', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen onIndexChange={onIndexChange} />);
    expect(screen.queryByRole('group', { name: 'Move image' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    const pan = await screen.findByRole('group', { name: 'Move image' });
    for (const name of ['Move left', 'Move up', 'Move down', 'Move right']) {
      expect(within(pan).getByRole('button', { name })).toBeEnabled();
    }

    await user.click(within(pan).getByRole('button', { name: 'Move left' }));
    await user.keyboard('{ArrowRight}');
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('renders a native video with controls', () => {
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen defaultIndex={2} />);
    const video = document.querySelector('video');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('aria-label', 'walkthrough.mp4');
  });

  it('shows the no-preview card for unsupported files and when the browser cannot show PDFs', () => {
    const { unmount } = render(
      <MediaViewer label="Project files" items={ITEMS} defaultOpen defaultIndex={3} />,
    );
    expect(screen.getByText("There's no preview for this file type.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', 'd.zip');
    unmount();

    Object.defineProperty(navigator, 'pdfViewerEnabled', { value: false, configurable: true });
    render(<MediaViewer label="Project files" items={ITEMS} defaultOpen defaultIndex={1} />);
    expect(screen.queryByTitle('contract.pdf')).not.toBeInTheDocument();
    expect(screen.getByText("This browser can't show PDFs here.")).toBeInTheDocument();
  });

  it('jumps to an item from the thumbnail strip', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(
      <MediaViewer
        label="Project files"
        items={ITEMS}
        defaultOpen
        showThumbnails
        onIndexChange={onIndexChange}
      />,
    );
    const thumb = screen.getByRole('button', { name: 'Show walkthrough.mp4' });
    await user.click(thumb);
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(thumb).toHaveAttribute('aria-current', 'true');
  });

  it('keeps Tab focus inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open viewer' }));
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('derives short file-type labels', () => {
    expect(getFileTypeLabel({ title: 'x', mimeType: 'application/pdf' })).toBe('PDF');
    expect(getFileTypeLabel({ title: 'x', mimeType: 'video/quicktime' })).toBe('MOV');
    expect(getFileTypeLabel({ title: 'photo.jpeg' })).toBe('JPG');
    expect(getFileTypeLabel({ title: 'README' })).toBeUndefined();
  });
});
